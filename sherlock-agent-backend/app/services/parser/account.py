# app/services/parser/account.py
from dataclasses import dataclass
from typing import Optional
from . import account_tools

@dataclass(eq=True, frozen=True)
class Account:
    """
    Account object similar to the Java port.
    Usage:
      Account(Account.Type.PHONE, "+12345")
      Account.from_ufed_chat(source, id, name)
    """

    class Type:
        WHATSAPP = "WHATSAPP"
        PHONE = "PHONE"
        SMS = "SMS"
        IMESSAGE = "IMESSAGE"
        EMAIL = "EMAIL"
        DEVICE = "DEVICE"
        UNKNOWN = "UNKNOWN"

        @staticmethod
        def from_ufed_contact(type_str: Optional[str], category: Optional[str], domain: Optional[str]):
            if not type_str:
                return Account.Type.UNKNOWN
            t = type_str.lower()
            if t == "phonenumber":
                return Account.Type.PHONE
            if t == "emailaddress":
                return Account.Type.EMAIL
            if t == "userid":
                if category:
                    c = category.lower()
                    if c == "sms":
                        return Account.Type.SMS
                    if c == "imessage":
                        return Account.Type.IMESSAGE
                    if c == "whatsapp":
                        return Account.Type.WHATSAPP
                # fallback unknown
            return Account.Type.UNKNOWN

    type: str
    identifier: Optional[str]

    def __post_init__(self):
        # dataclass frozen True prevents attribute mutation; nothing else needed
        pass

    # ---- helper constructors ----
    @staticmethod
    def from_ufed_chat(source: Optional[str], id_value: Optional[str], name: Optional[str]):
        """
        Decide account type from chat source + id + name (mimics Java's logic).
        """
        if not source:
            return Account(Account.Type.UNKNOWN, id_value)
        s = source.lower()
        if "whatsapp" in s:
            # WhatsApp id normalization
            ident = id_value or name or ""
            return Account(Account.Type.WHATSAPP, account_tools.normalize_whatsapp_id(ident))
        if "imessage" in s:
            ident = id_value or name or ""
            norm = account_tools.normalize_account_identifier(ident)
            return Account(Account.Type.IMESSAGE, norm or ident)
        # try phone
        if id_value and account_tools.is_valid_phone_number(id_value):
            return Account(Account.Type.PHONE, account_tools.normalize_phone_number(id_value))
        # try email
        if id_value and account_tools.is_valid_email_address(id_value):
            return Account(Account.Type.EMAIL, account_tools.normalize_email_address(id_value))
        # fallback: name could be email
        if name and account_tools.is_valid_email_address(name):
            return Account(Account.Type.EMAIL, account_tools.normalize_email_address(name))
        return Account(Account.Type.UNKNOWN, id_value)

    # ---- instance helpers ----
    def is_type_valid(self) -> bool:
        if self.identifier is None:
            return False
        if self.type == Account.Type.WHATSAPP:
            return account_tools.is_valid_whatsapp_id(self.identifier) if hasattr(account_tools, "is_valid_whatsapp_id") else True
        if self.type in {Account.Type.PHONE, Account.Type.SMS, Account.Type.IMESSAGE}:
            return account_tools.is_valid_phone_number(self.identifier)
        if self.type == Account.Type.EMAIL:
            return account_tools.is_valid_email_address(self.identifier)
        return True

    def base_identifier(self) -> Optional[str]:
        if self.type in {Account.Type.PHONE, Account.Type.SMS, Account.Type.IMESSAGE, Account.Type.WHATSAPP}:
            # prefer phone when possible
            if account_tools.is_valid_phone_number(self.identifier):
                return account_tools.normalize_phone_number(self.identifier)
            if self.type == Account.Type.WHATSAPP and isinstance(self.identifier, str):
                if "@" in self.identifier:
                    number = self.identifier.split("@")[0]
                    if not number.startswith("+"):
                        number = "+" + number
                    return number
        if self.type == Account.Type.EMAIL:
            return account_tools.normalize_email_address(self.identifier)
        return self.identifier

    def phone_number(self) -> Optional[str]:
        if self.identifier and account_tools.is_valid_phone_number(self.identifier):
            return account_tools.normalize_phone_number(self.identifier)
        if self.type == Account.Type.WHATSAPP and isinstance(self.identifier, str):
            if "@" in self.identifier:
                candidate = self.identifier.split("@")[0]
                if not candidate.startswith("+"):
                    candidate = "+" + candidate
                return candidate
        return None

    def email(self) -> Optional[str]:
        if self.identifier and account_tools.is_valid_email_address(self.identifier):
            return account_tools.normalize_email_address(self.identifier)
        return None

    def __str__(self):
        return f"[{self.type}] {self.identifier}"
