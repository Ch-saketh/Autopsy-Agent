# run_parser_test.py
"""
Robust test harness for parser (supports both legacy and enhanced parser outputs).
Run from project root:
    python run_parser_test.py
"""
import os
import json
import uuid
from pathlib import Path

# adjust import path if necessary
try:
    from app.services.parser.case_parser import parse_uploaded_file
except Exception as e:
    raise SystemExit("Failed to import parse_uploaded_file from app.services.parser.case_parser: " + str(e))

ROOT = Path.cwd()
DEMO_PATH = ROOT / "demo_data" / "sample_case_1.json"

if not DEMO_PATH.exists():
    raise SystemExit(f"Demo file not found: {DEMO_PATH}\nMake sure demo_data/sample_case_1.json exists.")

case_id = "test_case_" + uuid.uuid4().hex[:8]
print(f"[TEST HARNESS] Parsing demo file: {DEMO_PATH}")
print(f"[TEST HARNESS] Using case_id: {case_id}")

# call the parser
normalized = parse_uploaded_file(str(DEMO_PATH), case_id=case_id)

# support both legacy keys and enhanced keys
contacts = normalized.get("contacts", []) or normalized.get("contacts_out", [])
messages = normalized.get("messages", [])  # legacy
# enhanced parser stores chat threads; flatten messages from them as fallback
if not messages:
    chat_threads = normalized.get("chat_threads", normalized.get("chat_threads", []))
    messages = []
    for t in chat_threads or []:
        for m in t.get("messages", []):
            messages.append(m)

media = normalized.get("media", []) or normalized.get("files", [])
events = normalized.get("events", []) or []  # parser may or may not provide

case_dir = ROOT / "data" / "cases" / case_id
parsed_json_path = case_dir / "parsed.json"

print("\n--- PARSE SUMMARY ---")
print(f"Parsed file saved to: {parsed_json_path}")
print(f"Total contacts : {len(contacts)}")
print(f"Total messages : {len(messages)}")
print(f"Total media    : {len(media)}")
print(f"Total events   : {len(events)}")
print(f"Parse warnings : {len(normalized.get('parse_warnings', []))}")

def dump_sample(label, items):
    print(f"\n{label} (first 3):")
    for i, it in enumerate(items[:3]):
        try:
            print(f"  [{i+1}] {json.dumps(it, ensure_ascii=False)}" if isinstance(it, dict) else f"  [{i+1}] {str(it)}")
        except Exception:
            print(f"  [{i+1}] (unprintable item)")

dump_sample("CONTACTS", contacts)
dump_sample("MESSAGES", messages)
dump_sample("MEDIA", media)

# quick verify parsed.json exists and is valid JSON
if parsed_json_path.exists():
    try:
        with open(parsed_json_path, "r", encoding="utf-8") as f:
            _ = json.load(f)
        print("\n[OK] parsed.json is present and valid JSON.")
    except Exception as e:
        print("\n[WARN] parsed.json exists but could not be loaded:", e)
else:
    print("\n[ERROR] parsed.json not found at expected location.")

print("\nTest harness finished.")
