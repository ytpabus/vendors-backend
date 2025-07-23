from utils.supabase_client import supabase
from collections import defaultdict

# ⚙️ Group suppliers into "Хамза" and "Сергили"
def fetch_grouped_suppliers():
    suppliers_response = supabase.table("suppliers").select("*").execute()
    vendors_response = supabase.table("vendors").select("*").execute()

    if not suppliers_response.data or not vendors_response.data:
        return {"Хамза": [], "Сергили": []}

    suppliers = suppliers_response.data
    vendors = vendors_response.data

    # Attach vendors to suppliers
    supplier_map = {s["id"]: s for s in suppliers}
    for v in vendors:
        supplier_id = v.get("x_studio_supplier_order")
        if supplier_id in supplier_map:
            supplier_map[supplier_id].setdefault("vendors", []).append(v)

    # Split by tab name (use station name or station ID fallback)
    grouped = defaultdict(list)
    for supplier in supplier_map.values():
        station_name = supplier.get("x_studio_name_station_to")
        station_id = supplier.get("x_studio_station_to")

        if station_name in ["Хамза", "Сергили"]:
            grouped[station_name].append(supplier)
        elif station_id == 2:
            grouped["Хамза"].append(supplier)
        elif station_id == 1:
            grouped["Сергили"].append(supplier)
        # else: do nothing — skip unassignable

    return grouped


# ✅ Add or update supplier
def add_or_update_supplier(record):
    existing = supabase.table("suppliers").select("id").eq("id", record["id"]).execute()
    if existing.data:
        supabase.table("suppliers").update(record).eq("id", record["id"]).execute()
    else:
        supabase.table("suppliers").insert(record).execute()


# ✅ Add or update vendor
def add_or_update_vendor(record):
    existing = supabase.table("vendors").select("id").eq("id", record["id"]).execute()
    if existing.data:
        supabase.table("vendors").update(record).eq("id", record["id"]).execute()
    else:
        supabase.table("vendors").insert(record).execute()


# ✅ Delete vendor
def delete_vendor(vendor_id):
    result = supabase.table("vendors").delete().eq("id", vendor_id).execute()
    return result.data


# ✅ Delete supplier and all related vendors
def delete_supplier_and_vendors(supplier_id):
    # Delete all vendors first
    supabase.table("vendors").delete().eq("x_studio_supplier_order", supplier_id).execute()
    # Then delete the supplier
    result = supabase.table("suppliers").delete().eq("id", supplier_id).execute()
    return result.data
