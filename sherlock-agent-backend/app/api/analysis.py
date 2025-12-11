# app/api/analysis.py
from flask import Blueprint, jsonify, request
from pathlib import Path
import json, uuid
from subprocess import Popen, PIPE
from datetime import datetime

analysis_bp = Blueprint("analysis_bp", __name__)
CASES_ROOT = Path("data/cases")

def _case_parsed_path(case_id):
    p = CASES_ROOT / case_id / "parsed.json"
    return p if p.exists() else None

def _write_model_results(case_id, model_name, results):
    out_dir = CASES_ROOT / case_id / "models"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = out_dir / f"{model_name}_results.json"
    payload = {"model": model_name, "generated_at": datetime.utcnow().isoformat() + "Z", "results": results}
    fname.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return fname

@analysis_bp.route("/cases/<case_id>/run-model", methods=["POST"])
def run_model(case_id):
    """
    Simple synchronous model runner stub.
    Body JSON: { "model": "text_threat" }  (optional)
    For demo we implement two simple stubs:
      - text_threat : flag messages containing dangerous keywords
      - nsfw_media  : stub that marks no files (placeholder)
    """
    parsed_p = _case_parsed_path(case_id)
    if parsed_p is None:
        return jsonify({"error": "case not found"}), 404

    data = request.get_json(silent=True) or {}
    model = (data.get("model") or "text_threat").strip()

    parsed = json.loads(parsed_p.read_text(encoding="utf-8"))
    results = []

    if model == "text_threat":
        # naive keyword detector (demo)
        keywords = ["bomb", "kill", "attack", "package", "threat"]
        for t in parsed.get("chat_threads", []):
            for m in t.get("messages", []):
                body = (m.get("body") or "").lower()
                found = [k for k in keywords if k in body]
                if found:
                    results.append({
                        "message_id": m.get("id"),
                        "_thread_id": t.get("id"),
                        "text": m.get("body"),
                        "keywords": found,
                        "score": float(len(found))
                    })

    elif model == "nsfw_media":
        # placeholder: mark zero for now
        for f in parsed.get("files", []):
            results.append({"file_id": f.get("id"), "nsfw_score": 0.0})

    else:
        return jsonify({"error": f"unknown model '{model}'"}), 400

    out_path = _write_model_results(case_id, model, results)
    return jsonify({"ok": True, "model": model, "results_path": str(out_path), "count": len(results)})

@analysis_bp.route("/cases/<case_id>/models/<model_name>/results", methods=["GET"])
def get_model_results(case_id, model_name):
    p = CASES_ROOT / case_id / "models" / f"{model_name}_results.json"
    if not p.exists():
        return jsonify({"error": "results not found"}), 404
    try:
        return jsonify(json.loads(p.read_text(encoding="utf-8")))
    except Exception as e:
        return jsonify({"error": f"failed to load results: {e}"}), 500
