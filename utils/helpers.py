import json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / 'storage.json'
CONFIG_PATH = Path(__file__).resolve().parent.parent / 'config' / 'fields_config.json'

def load_field_config():
    if not CONFIG_PATH.exists():
        return []
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_field_config(config):
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def load_data():
    if not DB_PATH.exists():
        return {"Хамза": [], "Сергили": []}
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        print("💾 Current saved storage:", json.dumps(data, indent=2, ensure_ascii=False))

def update_supplier(data, record):
    station_id = record.get("x_studio_station_to")

    station_map = {
        1: "Сергили",
        2: "Хамза"
    }

    tab = station_map.get(station_id)
    if not tab:
        return False  # Skip unknown station

    if tab not in data:
        data[tab] = []

    updated = False
    for i, r in enumerate(data[tab]):
        if r["id"] == record["id"]:
            preserved_vendors = r.get("vendors", [])

            total_gtd = sum(float(v.get("x_studio_gtd", 0) or 0) for v in preserved_vendors)
            tons = float(record.get("x_studio_tons", 0) or 0)
            refused = float(record.get("x_studio_refused", 0) or 0)
            remains = tons - total_gtd - refused

            record["x_studio_gtd"] = total_gtd
            record["x_studio_remains"] = remains

            data[tab][i] = {**record, "vendors": preserved_vendors}
            updated = True
            break

    if not updated:
        record["x_studio_gtd"] = 0
        record["x_studio_remains"] = float(record.get("x_studio_tons", 0) or 0)
        record["vendors"] = []
        data[tab].append(record)

    return updated


def update_vendor(data, record):
    supplier_id = record.get("x_studio_supplier_order")
    if supplier_id is None:
        return

    # Ensure vendor GTD is a float
    record["x_studio_gtd"] = float(record.get("x_studio_gtd", 0) or 0)

    for tab in ["Хамза", "Сергили"]:
        for supplier in data[tab]:
            if supplier["id"] == supplier_id:
                if "vendors" not in supplier:
                    supplier["vendors"] = []

                for i, v in enumerate(supplier["vendors"]):
                    if v["id"] == record["id"]:
                        supplier["vendors"][i] = record
                        break
                else:
                    supplier["vendors"].append(record)

                # Recalculate GTD and Remains with type safety
                total_gtd = sum(float(v.get("x_studio_gtd", 0) or 0) for v in supplier["vendors"])
                tons = float(supplier.get("x_studio_tons", 0) or 0)
                refused = float(supplier.get("x_studio_refused", 0) or 0)

                supplier["x_studio_gtd"] = total_gtd
                supplier["x_studio_remains"] = tons - total_gtd - refused
                return

def delete_supplier(data, supplier_id):
    for tab in ["Хамза", "Сергили"]:
        before = len(data[tab])
        data[tab] = [s for s in data[tab] if s["id"] != supplier_id]
        after = len(data[tab])
        return before != after
