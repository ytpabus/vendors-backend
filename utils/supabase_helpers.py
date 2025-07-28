from supabase import create_client, Client

SUPABASE_URL = "https://qwtcqnaqhfsjwdnlqyds.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3dGNxbmFxaGZzandkbmxxeWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTAzNTIsImV4cCI6MjA2ODc2NjM1Mn0.yXF1vpaZmUcZWToOw-GccrNYCWuHh2Wa-zieeuk6kUY"

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
