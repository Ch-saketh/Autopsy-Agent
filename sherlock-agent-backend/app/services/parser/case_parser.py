# app/services/parser/case_parser.py
"""
Case parser: supports both demo JSON files and real UFDR archives / XML.
- For UFDR (.zip/.ufdr/.xml) it calls parse_ufdr_archive(...) which streams
  the XML and calls the handlers to populate the UFEDFileContext (ctx).
- For JSON it converts to toy models and reuses the same handlers.
Finally it serializes handler outputs to data/cases/<case_id>/parsed.json.
"""
import json
import shutil
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List

# handler & context imports (these must exist in app/services/parser/)
from app.services.parser.ufed_context import UFEDFileContext
from app.services.parser.contact_handler import ContactHandler
from app.services.parser.chat_handler import ChatHandler
from app.services.parser.file_handler import FileHandler
from app.services.parser.ufed_sax_parser import parse_ufdr_archive


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _convert_demo_json_to_models(raw: dict) -> List[dict]:
    """Convert demo JSON (contacts/messages/media) into a list of model dicts."""
    models: List[dict] = []

    # Contacts
    for c in raw.get("contacts", []):
        m = {
            "id": c.get("id"),
            "type": "Contact",
            "fields": {
                "Name": c.get("name"),
                "Source": raw.get("meta", {}).get("source"),
                "Entries": [
                    {
                        "type": "PhoneNumber",
                        "fields": {"Value": c.get("number"), "Category": "Phone", "Domain": None},
                        "attributes": {}
                    }
                ]
            },
            "attributes": {}
        }
        models.append(m)

    # Messages -> chat threads grouped by sender|recipient
    threads: Dict[str, dict] = {}
    for msg in raw.get("messages", []):
        sender = msg.get("sender")
        recip = msg.get("recipient")
        if sender is None and recip is None:
            continue
        chat_key = f"{sender}|{recip}"
        if chat_key not in threads:
            threads[chat_key] = {
                "id": chat_key,
                "type": "Chat",
                "fields": {"Source": raw.get("meta", {}).get("source", "demo"),
                           "Participants": [], "Messages": []},
                "attributes": {}
            }
            threads[chat_key]["fields"]["Participants"].append(
                {"id": sender, "fields": {"Identifier": sender, "Name": None, "IsPhoneOwner": "false"}}
            )
            threads[chat_key]["fields"]["Participants"].append(
                {"id": recip, "fields": {"Identifier": recip, "Name": None, "IsPhoneOwner": "false"}}
            )

        msg_model = {
            "id": msg.get("id"),
            "type": "Message",
            "fields": {
                "From": [{"id": msg.get("sender"), "fields": {"Identifier": msg.get("sender")}}],
                "Subject": None,
                "Body": msg.get("text"),
                "TimeStamp": msg.get("timestamp"),
                "Attachments": []
            },
            "attributes": {}
        }
        threads[chat_key]["fields"]["Messages"].append(msg_model)

    for t in threads.values():
        models.append(t)

    # Media -> models
    for md in raw.get("media", []):
        mm = {
            "id": md.get("id"),
            "type": "Media",
            "fields": {
                "Filename": md.get("filename") or md.get("id"),
                "path": md.get("path"),
                "mimetype": md.get("mimetype"),
                "TimeStamp": md.get("timestamp")
            },
            "attributes": {}
        }
        models.append(mm)

    return models


def _acct_to_primitive(a: Any) -> Any:
    """Convert account-like objects to JSON-serializable primitives/dicts."""
    if a is None:
        return None
    if isinstance(a, (dict, list, str, int, float, bool, type(None))):
        return a
    # account-like: read common attributes safely
    return {
        "type": getattr(a, "type", None),
        "identifier": getattr(a, "identifier", None),
        "platform": getattr(a, "platform", None),
        "contact_id": getattr(a, "contact_id", None)
    }


def _finalize_output(ctx: UFEDFileContext, raw_meta: dict, case_id: str, case_dir: Path) -> dict:
    """
    Convert ctx (account_manager, files) into serializable dict, write parsed.json and summary.json.
    """
    # contacts_out
    contacts_out = []
    account_manager = ctx.account_manager
    for c in getattr(account_manager, "contacts", []):
        names = list(c.names) if hasattr(c, "names") else []
        base_identifiers = list(c.base_identifiers) if hasattr(c, "base_identifiers") else []
        device_owner = bool(c.device_owner) if hasattr(c, "device_owner") else False
        accounts_list = getattr(c, "accounts", [])
        accounts = [_acct_to_primitive(a) for a in accounts_list]
        contacts_out.append({
            "names": names,
            "base_identifiers": base_identifiers,
            "device_owner": device_owner,
            "accounts": accounts
        })

    # chat_threads
    chat_threads = []
    for t in getattr(account_manager, "chat_threads", []):
        if isinstance(t, dict):
            participants = t.get("participants", [])
            messages = t.get("messages", [])
            thread_id = t.get("id")
        else:
            participants = getattr(t, "participants", [])
            messages = getattr(t, "messages", [])
            thread_id = getattr(t, "id", None)

        participants_primitive = [_acct_to_primitive(p) for p in participants]

        messages_primitive = []
        for m in messages:
            if isinstance(m, dict):
                from_account = m.get("from")
                message_id = m.get("id")
                subject = m.get("subject")
                body = m.get("body")
                timestamp = m.get("timestamp")
                attachments = m.get("attachments", [])
            else:
                from_account = getattr(m, "from", None)
                message_id = getattr(m, "id", None)
                subject = getattr(m, "subject", None)
                body = getattr(m, "body", None)
                timestamp = getattr(m, "timestamp", None)
                attachments = getattr(m, "attachments", [])
            messages_primitive.append({
                "id": message_id,
                "from": _acct_to_primitive(from_account),
                "subject": subject,
                "body": body,
                "timestamp": timestamp,
                "attachments": list(attachments) if attachments else []
            })

        chat_threads.append({
            "id": thread_id,
            "participants": participants_primitive,
            "messages": messages_primitive
        })

    # files_out: convert TaggedFile-like objects
    files_out = []
    for f in getattr(ctx, "files", []):
        fid = getattr(f, "id", None)
        local_path = getattr(f, "local_path", None)
        mobile_path = getattr(f, "mobile_path", None)
        mimetype = getattr(f, "mimetype", None)
        size = getattr(f, "size", None)
        files_out.append({
            "id": fid,
            "local_path": str(local_path) if local_path else None,
            "mobile_path": str(mobile_path) if mobile_path else None,
            "mimetype": mimetype,
            "size": size
        })

    # build timeline events (messages + media)
    events: List[dict] = []
    for t in chat_threads:
        for m in t.get("messages", []):
            events.append({
                "id": m.get("id"),
                "type": "message",
                "timestamp": m.get("timestamp"),
                "brief": (m.get("body") or "")[:160],
                "ref": {"type": "message", "id": m.get("id")}
            })
    for f in files_out:
        events.append({
            "id": f.get("id"),
            "type": "media",
            "timestamp": None,
            "brief": f.get("local_path") or f.get("mobile_path") or f.get("id"),
            "ref": {"type": "media", "id": f.get("id")}
        })

    try:
        events_sorted = sorted(events, key=lambda e: (e.get("timestamp") or ""))
    except Exception:
        events_sorted = events

    normalized = {
        "case_id": case_id,
        "meta": raw_meta or {},
        "contacts": contacts_out,
        "chat_threads": chat_threads,
        "files": files_out,
        "events": events_sorted,
        "parse_warnings": []
    }

    # write parsed.json
    parsed_path = case_dir / "parsed.json"
    with open(parsed_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    # write summary.json
    summary = {
        "case_id": case_id,
        "total_contacts": len(contacts_out),
        "total_threads": len(chat_threads),
        "total_files": len(files_out),
        "parsed_at": _now_iso()
    }
    summary_path = case_dir / "summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    return normalized


def parse_uploaded_file(file_path: str, case_id: str) -> dict:
    """
    Main entry:
    - If file is UFDR archive (.zip/.ufdr) or XML folder -> parse with SAX parser.
    - Else assume demo JSON: load and convert to models then run handlers.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"upload not found: {file_path}")

    # prepare case directory & copy original
    case_dir = Path("data") / "cases" / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    try:
        shutil.copy(str(file_path), str(case_dir / file_path.name))
    except Exception:
        pass

    # create context and handlers (always create them)
    ctx = UFEDFileContext(unzipped_dir=case_dir)
    logger = None
    contact_handler = ContactHandler(ctx, logger)
    chat_handler = ChatHandler(ctx, logger)
    file_handler = FileHandler(ctx, logger)

    # If uploaded artifact is an archive/folder/XML -> use UFDR parser
    up = Path(file_path)
    suffix = up.suffix.lower()
    if suffix in (".zip", ".ufdr") or up.is_dir() or suffix == ".xml":
        # parse_ufdr_archive will extract (if needed) and call handlers directly
        parse_ufdr_archive(up, contact_handler, chat_handler, file_handler, case_dir)
        # finalize using whatever ctx has
        return _finalize_output(ctx, raw_meta={}, case_id=case_id, case_dir=case_dir)

    # Otherwise fallback to demo JSON flow
    # load raw JSON (BOM-safe)
    with open(file_path, "r", encoding="utf-8-sig") as f:
        raw = json.load(f)

    # build toy models and run handlers
    models = _convert_demo_json_to_models(raw)

    # run handlers in sensible order
    for m in models:
        contact_handler.new_model(m)
    for m in models:
        chat_handler.new_model(m)
    for m in models:
        file_handler.new_model(m)

    # finalize & return
    return _finalize_output(ctx, raw_meta=raw.get("meta", {}), case_id=case_id, case_dir=case_dir)
