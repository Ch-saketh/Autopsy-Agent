# find_nulls.py
from pathlib import Path
root = Path('.')
found = []
for p in root.rglob('*.py'):
    try:
        b = p.read_bytes()
    except Exception as e:
        print("SKIP (read error):", p, e)
        continue
    if b.find(b'\x00') != -1:
        print("NULL BYTES ->", p)
        found.append(p)
if not found:
    print("No .py files with NUL bytes found.")
