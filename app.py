from flask import Flask, request, jsonify
from utils.supabase_helpers import (
    fetch_grouped_suppliers,
    add_or_update_supplier,
    add_or_update_vendor,
    delete_supplier_and_vendors,
    delete_vendor
)
from utils.helpers import CONFIG_PATH, save_field_config
import json
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def log_event(label, data):
    with open("webhook.log", "a", encoding="utf-8") as f:
        f.write(f"\n🔔 {label}:\n{json.dumps(data, indent=2, ensure_ascii=False)}\n")


# ✅ Webhook: Supplier
@app.route('/webhook/supplier', methods=['POST'])
def supplier_webhook():
    record = request.json
    log_event("✅ Incoming supplier webhook", record)

    if not record or 'id' not in record:
        return jsonify({'error': 'Missing supplier ID'}), 400

    try:
        add_or_update_supplier(record)
        return jsonify({'status': 'supplier_saved'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ✅ Webhook: Vendor
@app.route('/webhook/vendor', methods=['POST'])
def vendor_webhook():
    record = request.json
    log_event("✅ Incoming vendor webhook", record)

    if not record or 'id' not in record or 'x_studio_supplier_order' not in record:
        return jsonify({'error': 'Missing vendor ID or supplier ID'}), 400

    try:
        add_or_update_vendor(record)
        return jsonify({'status': 'vendor_saved'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ✅ Webhook: Delete Supplier + Vendors
@app.route('/webhook/delete', methods=['POST'])
def delete_webhook():
    record = request.json
    log_event("🗑️ Incoming delete webhook", record)

    if not record or 'id' not in record:
        return jsonify({'error': 'Missing supplier ID'}), 400

    try:
        deleted = delete_supplier_and_vendors(record["id"])
        return jsonify({'status': 'supplier_deleted', 'deleted': deleted}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ✅ Webhook: Delete Vendor
@app.route('/webhook/delete-vendor', methods=['POST'])
def delete_vendor_webhook():
    record = request.json
    log_event("🗑️ Incoming vendor delete webhook", record)

    if not record or 'id' not in record:
        return jsonify({'error': 'Missing vendor ID'}), 400

    try:
        deleted = delete_vendor(record["id"])
        return jsonify({'status': 'vendor_deleted', 'deleted': deleted}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ✅ Fetch all data, grouped by tab
@app.route('/data', methods=['GET'])
def get_data():
    try:
        grouped = fetch_grouped_suppliers()
        return jsonify(grouped)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ✅ Field Editor config
@app.route("/fields-config", methods=["GET"])
def get_fields_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route('/fields-config', methods=['POST'])
def update_fields_config():
    config = request.json
    save_field_config(config)
    return jsonify({"status": "fields_config_updated"}), 200


# ✅ View logs (browser-accessible)
@app.route("/logs", methods=["GET"])
def view_logs():
    try:
        with open("webhook.log", "r", encoding="utf-8") as f:
            return f"<pre>{f.read()}</pre>"
    except:
        return "No logs yet."


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
