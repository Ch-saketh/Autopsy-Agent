# clean_nulls.py
from pathlib import Path
root = Path('.')
for p in root.rglob('*.py'):
    b = p.read_bytes()
    if b.find(b'\x00') != -1:
        bak = p.with_suffix(p.suffix + '.bak')
        print("Backing up", p, "->", bak)
        bak.write_bytes(b)
        cleaned = b.replace(b'\x00', b'')
        p.write_bytes(cleaned)
        print("Cleaned:", p)
print("Done.")
