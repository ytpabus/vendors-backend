from flask import Flask, request, jsonify
from utils.supabase_helpers import fetch_all_grouped, upsert_supplier, upsert_vendor, delete_supplier, delete_vendor
from utils.supabase_client import supabase
from utils.helpers import CONFIG_PATH, save_field_config
import json
import os
import uuid
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def log_event(label, data):
    with open("webhook.log", "a", encoding="utf-8") as f:
        f.write(f"\n🔔 {label}:\n{json.dumps(data, indent=2, ensure_ascii=False)}\n")


@app.route("/webhook/supplier", methods=["POST"])
def supplier_webhook():
    record = request.get_json()
    upsert_supplier(record)
    return "OK"

@app.route("/webhook/vendor", methods=["POST"])
def vendor_webhook():
    record = request.get_json()
    upsert_vendor(record)
    return "OK"

@app.route("/webhook/delete", methods=["POST"])
def delete_webhook():
    record = request.get_json()
    supplier_id = record.get("id")
    if supplier_id:
        delete_supplier(supplier_id)
    return "OK"

@app.route("//upload", methods=["POST"])
def upload_file():
    if 'file' not in request.files or 'vendor_id' not in request.form:
        return jsonify({"error": "Missing file or vendor_id"}), 400
    
    file = request.files['file']
    vendor_id = request.form['vendor_id']
    ext = file.filename.rsplit('.', 1)[-1].lower()
    unique_name = f"{vendor_id}_{uuid.uuid4().hex}.{ext}"

    res = supabase.storage.from_("vendor-files").upload(
        unique_name, file, {"content-type": file.mimetype}
    )

    if res.get("error"):
        return jsonify({"error": res["error"]["message"]}), 500
    
    public_url = f"https://qwtcqnaqhfsjwdnlqyds.supabase.co/storage/v1/object/public/vendor-files/{unique_name}"
    return jsonify({"url": public_url})
                                
    

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


@app.route("/data")
def get_data():
    grouped = fetch_all_grouped()
    return jsonify(grouped)


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
