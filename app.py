from flask import Flask, request, jsonify, send_file
from utils.supabase_helpers import fetch_all_grouped, upsert_supplier, upsert_vendor, delete_supplier, delete_vendor, upload_file_to_supabase, delete_file_from_supabase, get_all_files_for_vendor
from utils.supabase_client import supabase
from utils.helpers import CONFIG_PATH, save_field_config
import json
import os
from flask_cors import CORS
import requests
from io import BytesIO

app = Flask(__name__)
CORS(app)

log_insert_counter = 0
def log_event(label, data):
    with open("webhook.log", "a", encoding="utf-8") as f:
        f.write(f"\n🔔 {label}:\n{json.dumps(data, indent=2, ensure_ascii=False)}\n")

def log_action(user, action, ip="", user_agent=""):
    global log_insert_counter
    if user == "admin":
        return
    try:
        # Insert new log
        supabase.table("logs").insert({
            "username": user,
            "action": action,
            "ip": ip,
            "user_agent": user_agent
        }).execute()

        # Increment counter
        log_insert_counter += 1

        # Only check every 200 inserts
        if log_insert_counter % 200 == 0:
            count_res = supabase.table("logs").select("id", count="exact").execute()
            total_logs = count_res.count if hasattr(count_res, "count") else None

            if total_logs and total_logs > 2000:
                # Calculate how many need to go
                to_delete = total_logs - 1500

                # Fetch that many oldest logs
                oldest = supabase.table("logs").select("id, ts") \
                    .order("ts", asc=True).limit(to_delete).execute().data

                if oldest:
                    ids_to_delete = [row["id"] for row in oldest]
                    supabase.table("logs").delete().in_("id", ids_to_delete).execute()
                    print(f"🗑️ Cleanup triggered: deleted {len(ids_to_delete)} oldest logs")
    except Exception as e:
        print("⚠️ Log insert failed:", e)


@app.route("/log-event", methods=["POST"])
def log_event_api():
    data = request.get_json() or {}
    user = data.get("user")
    action = data.get("action", "visit")
    ip = request.remote_addr
    ua = request.headers.get("User-Agent", "")

    log_action(user, action, ip, ua)
    return jsonify({"status": "logged"}), 200


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

@app.route("/vendor-files", methods=["GET"])
def get_vendor_files():
    vendor_id = request.args.get("vendor_id")
    if not vendor_id:
        return jsonify({"error": "vendor_id required"}), 400
    files = get_all_files_for_vendor(vendor_id)
    return jsonify({"files": files})

@app.route("/upload", methods=["POST"])
def upload_file():
    vendor_id = request.form.get("vendor_id")
    file = request.files.get("file")

    print(">>> Received vendor_id:", vendor_id)
    print(">>> Received file:", file)
    if file:
        print(">>> File name:", file.filename)
        print(">>> File content length:", len(file.read()))
        file.seek(0)  # Reset after read
    else:
        print(">>> No file received")

    if not vendor_id or not file:
        return jsonify({"error": "Missing vendor_id or file"}), 400

    try:
        url = upload_file_to_supabase(vendor_id, file)
        user = request.headers.get("X-User", "unknown")
        ip = request.remote_addr
        ua = request.headers.get("User-Agent", "")
        log_action(user, "upload_file", ip, ua)

        return jsonify({"url": url}), 200
    except Exception as e:
        print(">>> Upload error:", str(e))  # 👈 this is key
        return jsonify({"error": str(e)}), 500
    
@app.route('/download')
def download_file():
    file_url = request.args.get('url')
    filename = file_url.split("/")[-1]

    # Download file content from Supabase
    response = requests.get(file_url)
    if response.status_code != 200:
        return "Failed to download file", 500

    # Serve with download headers
    return send_file(
        BytesIO(response.content),
        as_attachment=True,
        download_name=filename,
        mimetype=response.headers.get("Content-Type", "application/octet-stream")
    )

@app.route("/delete-file", methods=["POST"])
def delete_file():
    data = request.get_json()
    vendor_id = data.get("vendor_id")
    file_url = data.get("file_url")
    if not vendor_id or not file_url:
        return jsonify({"error": "Missing vendor_id or file_url"}), 400

    try:
        delete_file_from_supabase(vendor_id, file_url)
        return jsonify({"status": "deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    mode = request.args.get("archived", "0")  # '0' active-only, 'all' active+archived
    include_archived = (mode == "all")
    return jsonify(fetch_all_grouped(include_archived=include_archived))


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
def get_logs():
    try:
        logs = supabase.table("logs") \
            .select("*") \
            .order("ts", desc=True) \
            .limit(1000) \
            .execute().data
        return jsonify(logs)
    except Exception as e:
        print("⚠️ /logs error:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
