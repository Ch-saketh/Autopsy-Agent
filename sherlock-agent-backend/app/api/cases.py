from flask import Blueprint, jsonify, send_file, abort, request
from pathlib import Path
import json

cases_bp = Blueprint("cases_bp", __name__)

CASES_ROOT = Path("data/cases")

def _case_dir(case_id: str) -> Path:
    return CASES_ROOT / case_id

def _load_parsed(case_id: str):
    p = _case_dir(case_id) / "parsed.json"
    if not p.exists():
        return None, f"parsed.json not found for case {case_id}"
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f), None
    except Exception as e:
        return None, f"failed to load parsed.json: {e}"

@cases_bp.route("/cases", methods=["GET"])
def list_cases():
    """List case directories (brief summary)."""
    out = []
    if not CASES_ROOT.exists():
        return jsonify(out)
    for d in sorted(CASES_ROOT.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if not d.is_dir():
            continue
        case_id = d.name
        summary_path = d / "summary.json"
        if summary_path.exists():
            try:
                with open(summary_path, "r", encoding="utf-8") as f:
                    s = json.load(f)
            except Exception:
                s = {}
        else:
            s = {}
        out.append({
            "case_id": case_id,
            "summary": s
        })
    return jsonify(out)


@cases_bp.route("/cases/<case_id>/parsed", methods=["GET"])
def get_parsed(case_id):
    """Return full parsed.json"""
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404
    return jsonify(parsed)


@cases_bp.route("/cases/<case_id>/summary", methods=["GET"])
def get_summary(case_id):
    """Return summary.json (or compute quick summary from parsed.json)"""
    d = _case_dir(case_id)
    summary_path = d / "summary.json"
    if summary_path.exists():
        try:
            with open(summary_path, "r", encoding="utf-8") as f:
                s = json.load(f)
            return jsonify(s)
        except Exception as e:
            return jsonify({"error": f"failed to load summary.json: {e}"}), 500

    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    summary = {
        "case_id": case_id,
        "total_contacts": len(parsed.get("contacts", [])),
        "total_messages": sum(len(t.get("messages", [])) for t in parsed.get("chat_threads", [])),
        "total_files": len(parsed.get("files", []))
    }
    return jsonify(summary)


@cases_bp.route("/cases/<case_id>/contacts", methods=["GET"])
def get_contacts(case_id):
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    # optional search / pagination
    q = request.args.get("q", "").lower().strip()
    items = parsed.get("contacts", [])
    if q:
        items = [c for c in items if q in json.dumps(c).lower()]
    return jsonify({"items": items, "total": len(items)})


@cases_bp.route("/cases/<case_id>/messages", methods=["GET"])
def get_messages(case_id):
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    # flatten threads -> messages list
    messages = []
    for thread in parsed.get("chat_threads", []):
        for m in thread.get("messages", []):
            msg = dict(m)  # copy
            msg["_thread_id"] = thread.get("id")
            messages.append(msg)

    # optional filters: thread_id, q, paging
    thread_id = request.args.get("thread_id")
    q = request.args.get("q", "").lower().strip()
    if thread_id:
        messages = [m for m in messages if m.get("_thread_id") == thread_id]
    if q:
        messages = [m for m in messages if q in (m.get("body") or "").lower() or q in (m.get("subject") or "").lower()]

    # paging
    try:
        limit = int(request.args.get("limit", 100))
        offset = int(request.args.get("offset", 0))
    except Exception:
        limit = 100
        offset = 0

    total = len(messages)
    paged = messages[offset: offset + limit]
    return jsonify({"items": paged, "total": total})


@cases_bp.route("/cases/<case_id>/timeline", methods=["GET"])
def get_timeline(case_id):
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    events = parsed.get("events", [])
    # allow time window / limit
    try:
        limit = int(request.args.get("limit", 200))
    except Exception:
        limit = 200
    return jsonify({"items": events[:limit], "total": len(events)})


@cases_bp.route("/cases/<case_id>/files", methods=["GET"])
def list_files(case_id):
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404
    files = parsed.get("files", [])
    return jsonify({"items": files, "total": len(files)})


@cases_bp.route("/cases/<case_id>/files/<file_id>", methods=["GET"])
def get_file(case_id, file_id):
    """
    Try to resolve and stream a file. The parsed.json file entries should
    include local_path or mobile_path (absolute or relative). We try both.
    """
    parsed, err = _load_parsed(case_id)
    if parsed is None:
        return jsonify({"error": err}), 404

    files = parsed.get("files", [])
    target = None
    for f in files:
        if f.get("id") == file_id:
            # check saved local_path first, then mobile_path
            lp = f.get("local_path") or f.get("mobile_path")
            if lp:
                p = Path(lp)
                if not p.is_absolute():
                    p = _case_dir(case_id) / lp
                if p.exists():
                    target = p
                    break
    if not target:
        return jsonify({"error": f"file {file_id} not found"}), 404

    # stream file
    try:
        return send_file(str(target))
    except Exception as e:
        return jsonify({"error": f"failed to send file: {e}"}), 500
