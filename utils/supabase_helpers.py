import mimetypes
from utils.supabase_client import supabase

BUCKET = "vendor-files"


def fetch_all_grouped(include_archived=False):
    # suppliers
    q_sup = supabase.table("suppliers").select("*")
    if not include_archived:
        q_sup = q_sup.eq("archived", False)
    suppliers = q_sup.execute().data

    supplier_ids = [s["id"] for s in suppliers] or ["__none__"]

    # vendors (only for the selected suppliers)
    q_vend = supabase.table("vendors").select("*").in_("supplier_id", supplier_ids)
    if not include_archived:
        q_vend = q_vend.eq("archived", False)
    vendors = q_vend.execute().data

    grouped = {"Хамза": [], "Сергили": []}
    vend_by_sup = {}
    for v in vendors:
        vend_by_sup.setdefault(v["supplier_id"], []).append(
            {**v["data"], "id": v["id"], "file": v["data"].get("file", []), "file_count": len(v["data"].get("file", []))}
        )

    for sup in suppliers:
        sup_data = sup["data"]; sup_data["id"] = sup["id"]
        sup_data["vendors"] = vend_by_sup.get(sup["id"], [])
        tab = sup.get("tab") or "Хамза"
        grouped.setdefault(tab, []).append(sup_data)

    return grouped

def upsert_supplier(record):
    sup_id = record.get("id")
    tab = record.get("x_studio_name_station_to")

    if tab == "Сергили":
        tab_key = "Сергили"
    elif tab == "Хамза":
        tab_key = "Хамза"
    else:
        print("⚠️ Skipping supplier: station_to is not Хамза or Сергили")
        return
    
    # NEW: preserve archived/status from existing row (column or JSON)
    try:
        _rows = supabase.table("suppliers").select("archived,data").eq("id", sup_id).limit(1).execute().data
        if _rows:
            _row = _rows[0]
            _data = _row.get("data") or {}
            _arch = bool(_row.get("archived") or _data.get("archived") or _data.get("Archived"))
            if _arch:
                record["archived"] = True
                record["Archived"] = True
                if not record.get("x_status"):
                    record["x_status"] = _data.get("x_status") or "Завершено"
    except Exception:
        pass

    # Remove vendor list if present
    record.pop("vendors", None)

    # UPSERT by ID
    supabase.table("suppliers").upsert({
        "id": sup_id,
        "tab": tab_key,
        "data": record
    }).execute()

    # NEW: keep top-level 'archived' column in sync if set in JSON
    if record.get("archived") or record.get("Archived"):
        try:
            supabase.table("suppliers").update({"archived": True}).eq("id", sup_id).execute()
        except Exception:
            pass

def upsert_vendor(record):
    vendor_id = record.get("id")
    supplier_id = record.get("x_studio_supplier_order")
    record["x_studio_gtd"] = float(record.get("x_studio_gtd", 0) or 0)

    # Safe fetch
    existing = supabase.table("vendors").select("*").eq("id", vendor_id).limit(1).execute().data
    existing_data = existing[0]["data"] if existing else {}

    # NEW: preserve archived flag from existing row (column or JSON)
    preserved_archived = bool(
        (existing and existing[0].get("archived")) or
        existing_data.get("archived") or
        existing_data.get("Archived")
    )

    preserved_file = existing_data.get("file", [])
    merged_data = {**record, "file": preserved_file}

    # NEW: keep JSON archived flags if previously archived
    if preserved_archived:
        merged_data["archived"] = True
        merged_data["Archived"] = True

    supabase.table("vendors").upsert({
        "id": vendor_id,
        "supplier_id": supplier_id,
        "data": merged_data
    }).execute()

    # NEW: keep top-level 'archived' column in sync if needed
    if preserved_archived:
        try:
            supabase.table("vendors").update({"archived": True}).eq("id", vendor_id).execute()
        except Exception:
            pass

    vendor_list = supabase.table("vendors").select("*").eq("supplier_id", supplier_id).execute().data
    gtd_sum = sum(float(v["data"].get("x_studio_gtd", 0) or 0) for v in vendor_list)

    # ✅ Fetch the supplier record to preserve other fields
    supplier = supabase.table("suppliers").select("*").eq("id", supplier_id).single().execute().data
    if supplier:
        updated_supplier_data = {**supplier["data"], "x_studio_gtd": gtd_sum}
        supabase.table("suppliers").update({
            "data": updated_supplier_data
        }).eq("id", supplier_id).execute()

def delete_supplier(supplier_id):
    supabase.table("vendors").delete().eq("supplier_id", supplier_id).execute()
    supabase.table("suppliers").delete().eq("id", supplier_id).execute()
    
def delete_vendor(vendor_id):
    res = supabase.table("vendors").select("*").eq("id", vendor_id).single().execute()
    vendor = res.data
    if not vendor:
        return None
    
    supplier_id = vendor.get("supplier_id")
    supabase.table("vendors").delete().eq("id", vendor_id).execute()

    vendor_list = supabase.table("vendors").select("*").eq("supplier_id", supplier_id).execute().data
    gtd_sum = sum(float(v["data"].get("x_studio_gtd", 0) or 0) for v in vendor_list)

    supplier = supabase.table("suppliers").select("*").eq("id", supplier_id).single().execute().data
    if supplier:
        updated_supplier_data = {**supplier["data"], "x_studio_gtd": gtd_sum}
        supabase.table("suppliers").update({
            "data": updated_supplier_data
        }).eq("id", supplier_id).execute()

    return True

def upload_file_to_supabase(vendor_id, file_storage):
    from io import BytesIO
    import mimetypes

    filename = file_storage.filename
    path = f"{vendor_id}/{filename}"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    file_bytes = file_storage.read()

    # Upload to Supabase Storage
    res = supabase.storage.from_("vendor-files").upload(
        path,
        file_bytes,
        {
            "content-type": content_type,
            "x-upsert": "true",
            "cacheControl": "3600"
        }
    )

    # ✅ Error check — correct way
    if hasattr(res, "error") and res.error:
        raise Exception(f"Upload failed: {res.error}")

    # Generate public URL
    public_url = f"https://qwtcqnaqhfsjwdnlqyds.supabase.co/storage/v1/object/public/vendor-files/{path}"

    # Update vendor record
    vendor = supabase.table("vendors").select("*").eq("id", vendor_id).single().execute().data
    current_files = vendor["data"].get("file", [])

    if public_url not in current_files:
        current_files.append(public_url)

    supabase.table("vendors").update({
        "data": {**vendor["data"], "file": current_files}
    }).eq("id", vendor_id).execute()

    return public_url


def delete_file_from_supabase(vendor_id, file_url):
    filename = file_url.split("/")[-1]
    path = f"{vendor_id}/{filename}"
    supabase.storage.from_(BUCKET).remove([path])

    # Remove from vendor file list
    vendor = supabase.table("vendors").select("*").eq("id", vendor_id).single().execute().data
    current_files = vendor["data"].get("file", [])
    updated_files = [f for f in current_files if f != file_url]

    supabase.table("vendors").update({
        "data": {**vendor["data"], "file": updated_files}
    }).eq("id", vendor_id).execute()

def get_all_files_for_vendor(vendor_id):
    response = supabase.storage.from_(BUCKET).list(path=vendor_id)
    if not response:
        return []

    return [
        f"https://qwtcqnaqhfsjwdnlqyds.supabase.co/storage/v1/object/public/{BUCKET}/{vendor_id}/{f['name']}"
        for f in response
    ]