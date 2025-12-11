from flask import Blueprint, request, jsonify
from pathlib import Path
import uuid
import shutil

from app.utils.validators import validate_upload, is_allowed_file
from app.services.parser.case_parser import parse_uploaded_file

upload_bp = Blueprint("upload_bp", __name__)

@upload_bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "missing file field (use name 'file')" }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "empty filename"}), 400

    if not is_allowed_file(file.filename):
        return jsonify({"error": "invalid file type"}), 400

    # Save upload to server
    upload_id = uuid.uuid4().hex[:8]
    uploads_dir = Path("data/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)

    saved_path = uploads_dir / f"{upload_id}_{file.filename}"
    file.save(saved_path)

    # --- VALIDATE FILE ---
    ok, err = validate_upload(saved_path)
    if not ok:
        saved_path.unlink(missing_ok=True)
        return jsonify({"error": err}), 400

    # --- PARSE FILE ---
    case_id = f"case_{uuid.uuid4().hex[:8]}"
    parsed = parse_uploaded_file(str(saved_path), case_id)

    summary = {
        "total_contacts": len(parsed.get("contacts", [])),
        "total_messages": sum(len(t.get("messages", [])) for t in parsed.get("chat_threads", [])),
        "total_files": len(parsed.get("files", [])),
    }

    return jsonify({
        "case_id": case_id,
        "ok": True,
        "summary": summary
    }), 200
