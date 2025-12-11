# app/services/parser/contact_handler.py
from typing import Dict, Any
from .account import Account

class ContactHandler:
    """
    Port of Java ContactHandler.
    Expects model as a dict-like object with:
      - model['type'] == "Contact"
      - model['fields'] -> dict of fields, where 'Entries' (if present) is a list of entry-models
    Each entry-model is a dict with keys: 'type', 'fields' (dict), 'attributes' (dict)
    """
    def __init__(self, context, logger):
        self.context = context
        self.logger = logger

    def new_model(self, model: Dict[str, Any]):
        if model.get("type") != "Contact":
            return
        self._new_contact(model)

    def _new_contact(self, model: Dict[str, Any]):
        name = model.get("fields", {}).get("Name")
        source = model.get("fields", {}).get("Source")

        accounts = []
        entries = model.get("fields", {}).get("Entries") or []
        for entry in entries:
            etype = entry.get("type")
            value = entry.get("fields", {}).get("Value")
            cat = entry.get("fields", {}).get("Category")
            domain = entry.get("fields", {}).get("Domain")

            acct_type = Account.Type.from_ufed_contact(etype or "", cat, domain)
            if acct_type == Account.Type.UNKNOWN:
                continue
            # Build account object
            acct = Account(acct_type, value)
            if acct.identifier is None:
                if self.logger:
                    self.logger.warning(f"Invalid account for contact {name}: {etype}/{value}/{cat}/{domain}")
                continue
            accounts.append(acct)

        if accounts:
            # add contact to account manager
            self.context.account_manager.add_contact_from_name_accounts(name, accounts)
        else:
            # if no accounts, still add a contact with just the name
            self.context.account_manager.add_contact_from_name_accounts(name, [])
