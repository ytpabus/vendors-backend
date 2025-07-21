from flask import Flask, request, jsonify
from utils.helpers import (
    load_data, save_data,
    update_supplier, update_vendor, delete_supplier,
    load_field_config, save_field_config
)
import json
import os

app = Flask(__name__)

def log_event(label, data):
    with open("webhook.log", "a", encoding="utf-8") as f:
        f.write(f"\n🔔 {label}:\n{json.dumps(data, indent=2, ensure_ascii=False)}\n")

@app.route('/webhook/supplier', methods=['POST'])
def supplier_webhook():
    record = request.json
    log_event("✅ Incoming supplier webhook", record)

    if not record or 'id' not in record:
        return jsonify({'error': 'Missing supplier ID'}), 400

    data = load_data()
    updated = update_supplier(data, record)
    save_data(data)
    log_event("💾 Updated storage after supplier save", data)
    return jsonify({'status': 'supplier_saved', 'updated': updated}), 200

@app.route('/webhook/vendor', methods=['POST'])
def vendor_webhook():
    record = request.json
    log_event("✅ Incoming vendor webhook", record)

    if not record or 'id' not in record or 'x_studio_supplier_order' not in record:
        return jsonify({'error': 'Missing vendor ID or supplier ID'}), 400

    data = load_data()
    update_vendor(data, record)
    save_data(data)
    log_event("💾 Updated storage after vendor save", data)
    return jsonify({'status': 'vendor_saved'}), 200

@app.route('/webhook/delete', methods=['POST'])
def delete_webhook():
    record = request.json
    log_event("🗑️ Incoming delete webhook", record)

    if not record or 'id' not in record:
        return jsonify({'error': 'Missing supplier ID'}), 400

    data = load_data()
    deleted = delete_supplier(data, record["id"])
    save_data(data)
    log_event("💾 Updated storage after delete", data)
    return jsonify({'status': 'supplier_deleted', 'deleted': deleted}), 200

@app.route('/data', methods=['GET'])
def get_data():
    return jsonify(load_data())

@app.route("/fields-config", methods=["GET"])
def get_fields_config():
    try:
        with open("fields_config.json", "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/fields-config', methods=['POST'])
def update_fields_config():
    config = request.json
    save_field_config(config)
    return jsonify({"status": "fields_config_updated"}), 200

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
