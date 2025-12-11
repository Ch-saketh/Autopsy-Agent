# chat_handler.py
from typing import Dict, Any, List
from .account import Account
from .contact import Contact

class ChatHandler:
    """
    Port of Java ChatHandler.
    Accepts model dicts for types "Chat" and "Email".
    For Chat: expects fields 'Participants' (list of participant-models) and 'Messages' (list).
    For Email: handled similarly to Java newEMail.
    Adds ChatThread-like structures into context.account_manager.add_chat_thread
    """

    def __init__(self, context, logger):
        self.context = context
        self.logger = logger

    def new_model(self, model: Dict[str, Any]):
        mtype = model.get("type")
        if mtype == "Chat":
            self._new_chat(model)
        elif mtype == "Email":
            self._new_email(model)

    def _new_email(self, model: Dict[str, Any]):
        # Build a simple thread dict
        thread = {"id": model.get("id"), "participants": [], "messages": []}
        # From
        from_field = (model.get("fields") or {}).get("From") or []
        # Add participants from From/To/Cc/Bcc
        def add_email_participants(field):
            for pm in (field or []):
                identifier = (pm.get("fields") or {}).get("Identifier")
                name = (pm.get("fields") or {}).get("Name")
                acct = None
                if identifier:
                    acct = Account(Account.Type.EMAIL, identifier)
                else:
                    if name:
                        if self._is_valid_email(name):
                            acct = Account(Account.Type.EMAIL, name)
                        else:
                            acct = Account(Account.Type.UNKNOWN, name)
                if acct:
                    thread["participants"].append(acct)
                    # add to account manager
                    self.context.account_manager.add_contact_from_name_accounts(name, [acct])

        add_email_participants(from_field)
        for k in ("To", "Cc", "Bcc"):
            add_email_participants((model.get("fields") or {}).get(k) or [])

        # Message object
        ts_str = (model.get("fields") or {}).get("TimeStamp")
        try:
            ts = int(ts_str) if ts_str and ts_str.isdigit() else None
        except Exception:
            ts = None
        msg = {
            "from": thread["participants"][0] if thread["participants"] else None,
            "subject": (model.get("fields") or {}).get("Subject"),
            "body": (model.get("fields") or {}).get("Body"),
            "timestamp": ts or 0,
            "attachments": []
        }
        # attachments
        attachments = (model.get("fields") or {}).get("Attachments") or []
        for att in attachments:
            msg["attachments"].append(att.get("attributes", {}).get("file_id"))
            msg["attachments"].append(att.get("attributes", {}).get("URL"))
        thread["messages"].append(msg)
        # hand over to account manager
        self.context.account_manager.add_chat_thread(thread)

    def _new_chat(self, model: Dict[str, Any]):
        source = (model.get("fields") or {}).get("Source") or ""
        participants = (model.get("fields") or {}).get("Participants") or []
        id_account_map = {}
        thread = {"id": model.get("id") or model.get("fields", {}).get("id"), "participants": [], "messages": []}

        for p in participants:
            is_phone_owner = p.get("fields", {}).get("IsPhoneOwner", "false").lower() == "true"
            identifier = p.get("fields", {}).get("Identifier")
            name = p.get("fields", {}).get("Name")
            acct = Account.from_ufed_chat(source, identifier, name)
            if acct:
                thread["participants"].append(acct)
                id_account_map[identifier] = acct
                self.context.account_manager.add_contact_from_name_accounts(name, [acct])

        # messages
        messages = (model.get("fields") or {}).get("Messages") or []
        for message_model in messages:
            from_id = None
            from_field = (message_model.get("fields") or {}).get("From") or []
            if from_field:
                fm = from_field[0]
                from_id = (fm.get("fields") or {}).get("Identifier")
            ts_str = (message_model.get("fields") or {}).get("TimeStamp")
            try:
                ts = int(ts_str) if ts_str and ts_str.isdigit() else None
            except Exception:
                ts = None
            msg = {
                "from": id_account_map.get(from_id),
                "subject": (message_model.get("fields") or {}).get("Subject"),
                "body": (message_model.get("fields") or {}).get("Body"),
                "timestamp": ts or 0,
                "attachments": []
            }
            # attachments under "Attachments" or "Attachment"
            atts = (message_model.get("fields") or {}).get("Attachments") or []
            for att in atts:
                file_id = (att.get("attributes") or {}).get("file_id")
                if not file_id and (att.get("fields") or {}).get("attachment_extracted_path"):
                    file_id = "attachment_" + str(att.get("id") or "")
                if file_id:
                    msg["attachments"].append(file_id)
                url = (att.get("attributes") or {}).get("URL")
                if url:
                    msg["attachments"].append(url)
            atts2 = (message_model.get("fields") or {}).get("Attachment") or []
            for att in atts2:
                file_id = (att.get("attributes") or {}).get("file_id")
                if not file_id and (att.get("fields") or {}).get("attachment_extracted_path"):
                    file_id = "attachment_" + str(att.get("id") or "")
                if file_id:
                    msg["attachments"].append(file_id)
                url = (att.get("attributes") or {}).get("URL")
                if url:
                    msg["attachments"].append(url)
            thread["messages"].append(msg)

        self.context.account_manager.add_chat_thread(thread)

    def _is_valid_email(self, s: str) -> bool:
        try:
            return "@" in s and "." in s
        except Exception:
            return False
