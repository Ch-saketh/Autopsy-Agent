# ufed_context.py
from pathlib import Path
from typing import Dict, List
from .tagged_file import TaggedFile
from .account_manager import AccountManager


class UFEDFileContext:
    def __init__(self, unzipped_dir: Path):
        self.unzipped_ufdr_directory = Path(unzipped_dir)
        self.account_manager = AccountManager()
        self.files: List[TaggedFile] = []
        self._id_file_map: Dict[str, TaggedFile] = {}
        self._path_file_map: Dict[Path, TaggedFile] = {}

    def add_file(self, tagged_file: TaggedFile):
        if not tagged_file.local_path.is_absolute():
            tagged_file.local_path = self.unzipped_ufdr_directory.joinpath(tagged_file.local_path)
        if tagged_file.size <= 0 and tagged_file.local_path and tagged_file.local_path.exists():
            tagged_file.size = tagged_file.local_path.stat().st_size
        if tagged_file.id and tagged_file.id in self._id_file_map:
            # duplicate id
            return
        if tagged_file.id:
            self._id_file_map[tagged_file.id] = tagged_file
        if tagged_file.mobile_path:
            self._path_file_map[tagged_file.mobile_path] = tagged_file
        self.files.append(tagged_file)

    def get_file_by_id(self, id_: str):
        return self._id_file_map.get(id_)

    def get_file_by_path(self, path: Path):
        return self._path_file_map.get(path)
