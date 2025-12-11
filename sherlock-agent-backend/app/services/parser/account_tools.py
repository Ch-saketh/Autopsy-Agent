# account_tools.py
import re
from email.utils import parseaddr
from typing import List
try:
    # google libphonenumber is recommended, but optional for demo
    import phonenumbers
except Exception:
    phonenumbers = None

_email_validator = None
try:
    from validate_email import validate_email
    _email_validator = validate_email
except Exception:
    _email_validator = None

_tokens_to_ignore = {"ing", "dr", "dipl", "fh", "techn"}


def is_valid_phone_number(value: str, default_region: str = "AT") -> bool:
    if not value:
        return False
    if phonenumbers:
        try:
            phonenumbers.parse(value, default_region)
            return True
        except Exception:
            return False
    # fallback: digits length check
    digits = re.sub(r"\D", "", value)
    return 6 <= len(digits) <= 15


def normalize_phone_number(value: str, default_region: str = "AT") -> str:
    if not value:
        return value
    if phonenumbers:
        try:
            n = phonenumbers.parse(value, default_region)
            return phonenumbers.format_number(n, phonenumbers.PhoneNumberFormat.E164)
        except Exception:
            return value
    digits = re.sub(r"\D", "", value)
    if not digits:
        return value
    return "+" + digits if not value.startswith("+") else value


def is_valid_email_address(value: str) -> bool:
    if not value:
        return False
    if _email_validator:
        try:
            return _email_validator(value)
        except Exception:
            pass
    # fallback simple check
    name, addr = parseaddr(value)
    return "@" in addr and "." in addr


def normalize_email_address(value: str) -> str:
    if not value:
        return value
    return value.strip().lower()


def normalize_whatsapp_id(value: str) -> str:
    if not value:
        return value
    cleaned = re.sub(r"[^0-9@\.+A-Za-z]", "", value).lower()
    return cleaned


def normalize_account_identifier(identifier: str) -> str:
    if not identifier:
        return None
    if is_valid_phone_number(identifier):
        return normalize_phone_number(identifier)
    if is_valid_email_address(identifier):
        return normalize_email_address(identifier)
    return None


def get_name_tokens(name: str) -> List[str]:
    if not name:
        return []
    # split on space/slash and normalize common umlauts
    s = name.lower()
    s = s.replace("ö", "oe").replace("ä", "ae").replace("ü", "ue").replace("ß", "sz")
    tokens = re.split(r"[ \\/]+", s)
    cleaned = []
    for t in tokens:
        t2 = re.sub(r"[^\w]", "", t)
        if t2 and t2 not in _tokens_to_ignore:
            cleaned.append(t2)
    return cleaned


def name_share_score(name1: str, name2: str) -> float:
    t1 = get_name_tokens(name1)
    t2 = get_name_tokens(name2)
    if not t1 or not t2:
        return 0.0
    len1 = sum(len(x) for x in t1)
    len2 = sum(len(x) for x in t2)
    shared = sum(len(x) for x in t1 if x in t2)
    if (len1 + len2) == 2 * shared:
        return 1.0
    return max(shared / max(1, len1), shared / max(1, len2))
