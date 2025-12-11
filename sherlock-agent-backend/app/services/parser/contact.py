# app/services/parser/contact.py
from dataclasses import dataclass, field
from typing import List
from .account import Account
from .account_tools import name_share_score

@dataclass
class Contact:
    names: List[str] = field(default_factory=list)
    accounts: List[Account] = field(default_factory=list)
    base_identifiers: List[str] = field(default_factory=list)
    device_owner: bool = False

    def add_name(self, name: str):
        if not name:
            return
        # merging logic: replace subset names
        for i, old in enumerate(self.names):
            if name_share_score(name, old) == 1.0:
                return
            if name_share_score(old, name) == 1.0:
                self.names[i] = name
                return
        if name not in self.names:
            self.names.append(name)

    def add_account(self, account: Account):
        if account not in self.accounts:
            self.accounts.append(account)
            bi = account.base_identifier()
            if bi and bi not in self.base_identifiers:
                self.base_identifiers.append(bi)

    def merge(self, other: "Contact"):
        for n in other.names:
            self.add_name(n)
        for a in other.accounts:
            self.add_account(a)
        if other.device_owner:
            self.device_owner = True

    def can_be_merged(self, other: "Contact") -> bool:
        if not self.accounts:
            return False
        best = -1.0
        for n in self.names:
            for m in other.names:
                s = name_share_score(n, m)
                if s > best:
                    best = s
        common = set(self.base_identifiers).intersection(set(other.base_identifiers))
        if common:
            if best > 0.5 and set(self.base_identifiers).issuperset(common) and set(other.base_identifiers).issuperset(common):
                return True
            if (not self.names or best > 0.5) and set(self.base_identifiers).issuperset(common):
                return True
            if (not other.names or best > 0.5) and set(other.base_identifiers).issuperset(common):
                return True
        return False
