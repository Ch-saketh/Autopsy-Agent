# app/api/artifacts.py
from flask import Blueprint, jsonify, request
from pathlib import Path
import json

artifacts_bp = Blueprint("artifacts_bp", __name__)
CASES_ROOT = Path("data/cases")

def _case_parsed(case_id):
    p = CASES_ROOT / case_id / "parsed.json"
    if not p.exists():
        return None, f"case {case_id} not found"
    try:
        return json.loads(p.read_text(encoding="utf-8")), None
    except Exception as e:
        return None, f"failed to load parsed.json: {e}"

@artifacts_bp.route("/cases/<case_id>/contacts", methods=["GET"])
def contacts(case_id):
    parsed, err = _case_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404
    q = request.args.get("q", "").strip().lower()
    items = parsed.get("contacts", [])
    if q:
        items = [c for c in items if q in json.dumps(c).lower()]
    return jsonify({"items": items, "total": len(items)})

@artifacts_bp.route("/cases/<case_id>/messages", methods=["GET"])
def messages(case_id):
    parsed, err = _case_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    # flatten threads into messages
    messages = []
    for t in parsed.get("chat_threads", []):
        for m in t.get("messages", []):
            msg = dict(m)
            msg["_thread_id"] = t.get("id")
            messages.append(msg)

    # filters
    thread_id = request.args.get("thread_id")
    q = request.args.get("q", "").strip().lower()
    if thread_id:
        messages = [m for m in messages if m.get("_thread_id") == thread_id]
    if q:
        messages = [m for m in messages if q in (m.get("body") or "").lower() or q in (m.get("subject") or "").lower()]

    # paging
    try:
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))
    except Exception:
        limit, offset = 100, 0

    total = len(messages)
    return jsonify({"items": messages[offset: offset + limit], "total": total})

@artifacts_bp.route("/cases/<case_id>/media", methods=["GET"])
def media(case_id):
    parsed, err = _case_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404
    files = parsed.get("files", [])
    # optional filter by mimetype or filename q
    q = request.args.get("q", "").strip().lower()
    if q:
        files = [f for f in files if q in (f.get("mimetype") or "").lower() or q in (f.get("local_path") or "").lower() or q in (f.get("mobile_path") or "").lower()]
    return jsonify({"items": files, "total": len(files)})

@artifacts_bp.route("/cases/<case_id>/search", methods=["GET"])
def search(case_id):
    """
    Lightweight cross-type search: searches contacts + messages + filenames.
    Params:
      q (required)
      limit, offset optional
    """
    parsed, err = _case_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    q = request.args.get("q", "").strip().lower()
    if not q:
        return jsonify({"error": "missing query parameter 'q'"}), 400

    hits = []
    # contacts
    for c in parsed.get("contacts", []):
        if q in json.dumps(c).lower():
            hits.append({"type": "contact", "obj": c})

    # messages
    for t in parsed.get("chat_threads", []):
        for m in t.get("messages", []):
            text = ((m.get("subject") or "") + " " + (m.get("body") or "")).lower()
            if q in text:
                item = dict(m); item["_thread_id"] = t.get("id")
                hits.append({"type": "message", "obj": item})

    # files
    for f in parsed.get("files", []):
        if q in json.dumps(f).lower():
            hits.append({"type": "file", "obj": f})

    try:
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))
    except Exception:
        limit, offset = 100, 0

    total = len(hits)
    return jsonify({"hits": hits[offset:offset+limit], "total": total})
