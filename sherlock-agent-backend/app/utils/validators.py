import json
from pathlib import Path

ALLOWED_EXTENSIONS = {"json", "zip"}

def is_allowed_file(filename: str) -> bool:
    """Check file extension."""
    if "." not in filename:
        return False
    return filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_json(path: Path):
    """Try loading JSON & return (ok, error_msg)."""
    try:
        with open(path, "r", encoding="utf-8-sig") as f:
            json.load(f)
        return True, None
    except Exception as e:
        return False, f"Invalid JSON: {e}"


def validate_zip(path: Path):
    """Minimal ZIP validation — not implemented for now."""
    # In future: test unzip, check UFDR structure, etc.
    return True, None


def validate_upload(path: Path):
    """
    Wrapper used by upload API.
    Returns: (ok: bool, error_msg: str | None)
    """
    if not path.exists():
        return False, "Uploaded file not found on server"

    ext = path.suffix.lower().replace(".", "")

    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported file type '.{ext}', allowed: {ALLOWED_EXTENSIONS}"

    # JSON
    if ext == "json":
        return validate_json(path)

    # ZIP
    if ext == "zip":
        return validate_zip(path)

    return False, "Unknown validation error"
