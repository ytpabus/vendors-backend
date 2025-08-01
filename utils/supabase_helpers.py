from supabase import create_client, Client
import mimetypes
from utils.supabase_client import supabase

SUPABASE_URL = "https://qwtcqnaqhfsjwdnlqyds.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dGNxbmFxaGZzandkbmxxeWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTAzNTIsImV4cCI6MjA2ODc2NjM1Mn0.yXF1vpaZmUcZWToOw-GccrNYCWuHh2Wa-zieeuk6kUY"
BUCKET = "vendor-files"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_all_grouped():
    suppliers = supabase.table("suppliers").select("*").execute().data
    vendors = supabase.table("vendors").select("*").execute().data

    # Build { tab: [suppliers...] }, each supplier gets its vendor sublist
    grouped = {"Хамза": [], "Сергили": []}
    for sup in suppliers:
        sup_data = sup["data"]
        sup_data["id"] = sup["id"]
        sup_data["vendors"] = [
            {**v["data"], "id": v["id"]}
            for v in vendors if v["supplier_id"] == sup["id"]
        ]
        tab = sup.get("tab") or "Хамза"
        grouped.setdefault(tab, []).append(sup_data)

    return grouped

def upsert_supplier(record):
    sup_id = record.get("id")
    tab = record.get("x_studio_name_station_to")  # Or however you determine tab
    if tab == "Сергили":
        tab_key = "Сергили"
    else:
        tab_key = "Хамза"

    # Remove vendor list if present
    record.pop("vendors", None)

    # UPSERT by ID
    supabase.table("suppliers").upsert({
        "id": sup_id,
        "tab": tab_key,
        "data": record
    }).execute()

def upsert_vendor(record):
    vendor_id = record.get("id")
    supplier_id = record.get("x_studio_supplier_order")

    # Make sure GTD is float
    record["x_studio_gtd"] = float(record.get("x_studio_gtd", 0) or 0)

    supabase.table("vendors").upsert({
        "id": vendor_id,
        "supplier_id": supplier_id,
        "data": record
    }).execute()

def delete_supplier(supplier_id):
    supabase.table("vendors").delete().eq("supplier_id", supplier_id).execute()
    supabase.table("suppliers").delete().eq("id", supplier_id).execute()
    
def delete_vendor(vendor_id):
    res = supabase.table("vendors").delete().eq("id", vendor_id).execute()
    return res.data

def upload_file_to_supabase(vendor_id, file_storage):
    filename = file_storage.filename
    path = f"{vendor_id}/{filename}"
    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    # Read file content
    file_bytes = file_storage.read()

    # Upload to Supabase
    res = supabase.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": content_type, "cacheControl": "3600", "upsert": True})
    if not res:
        raise Exception("Upload failed")

    public_url = f"https://qwtcqnaqhfsjwdnlqyds.supabase.co/storage/v1/object/public/{BUCKET}/{path}"

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

