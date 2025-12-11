# tagged_file.py
from dataclasses import dataclass
from pathlib import Path
from typing import Dict


@dataclass
class TaggedFile:
    id: str = None
    fs: str = None
    fsid: str = None
    local_path: Path = None
    mobile_path: Path = None
    mimetype: str = None
    size: int = 0
    crtime: int = 0
    mtime: int = 0
    metadata: Dict[str, str] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
