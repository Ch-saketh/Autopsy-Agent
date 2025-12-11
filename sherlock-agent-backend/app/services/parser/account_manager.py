# account_manager.py
from typing import List, Dict
from .contact import Contact
from .account import Account


class AccountManager:
    def __init__(self):
        self.contacts: List[Contact] = []
        self._account_contact_map = None
        self._base_identifier_contact_map = None
        self.chat_threads = []  # placeholder list for ChatThread objects

    def add_contact(self, contact: Contact):
        self.contacts.append(contact)
        self._invalidate_maps()
        return contact

    def add_contact_from_name_accounts(self, name: str, accounts):
        c = Contact()
        c.add_name(name)
        for a in accounts:
            c.add_account(a)
        return self.add_contact(c)

    def _invalidate_maps(self):
        self._account_contact_map = None
        self._base_identifier_contact_map = None

    def _build_maps(self):
        if self._account_contact_map is None:
            m = {}
            for contact in self.contacts:
                for acct in contact.accounts:
                    m.setdefault(acct, []).append(contact)
            self._account_contact_map = m
        if self._base_identifier_contact_map is None:
            m2 = {}
            for contact in self.contacts:
                for bi in contact.base_identifiers:
                    m2.setdefault(bi, []).append(contact)
            self._base_identifier_contact_map = m2

    def get_contacts_for_account(self, account: Account):
        self._build_maps()
        return self._account_contact_map.get(account, [])

    def get_contacts_for_base_identifier(self, base_identifier: str):
        self._build_maps()
        return self._base_identifier_contact_map.get(base_identifier, [])

    def merge_candidates(self):
        finished = False
        while not finished:
            finished = True
            i = 0
            while i < len(self.contacts):
                j = i + 1
                while j < len(self.contacts):
                    c1 = self.contacts[i]
                    c2 = self.contacts[j]
                    if c1.can_be_merged(c2):
                        c1.merge(c2)
                        self.contacts.pop(j)
                        finished = False
                    else:
                        j += 1
                i += 1
        self._invalidate_maps()

    def add_chat_thread(self, thread):
        # determine direction similarly to Java: uses device owner info
        for msg in getattr(thread, "messages", []):
            if getattr(msg, "direction", None) in (None, "UNKNOWN"):
                # if sender is device owner -> outgoing
                if any(c.device_owner for c in self.get_contacts_for_account(msg.get("from_account")) if c):
                    msg["direction"] = "OUTGOING"
                else:
                    for part in getattr(thread, "participants", []):
                        if self.is_account_of_device_owner(part):
                            msg["direction"] = "INCOMING"
                            break
        self.chat_threads.append(thread)

    def is_account_of_device_owner(self, account: Account):
        contacts = self.get_contacts_for_account(account)
        for c in contacts:
            if c.device_owner:
                return True
        return False
