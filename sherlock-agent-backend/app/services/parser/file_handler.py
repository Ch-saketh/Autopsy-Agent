# file_handler.py
from typing import Dict, Any
from .tagged_file import TaggedFile
from pathlib import Path

class FileHandler:
    """
    Port of Java FileHandler.
    Responsible for adding TaggedFile objects to context when attachments are discovered.
    """

    def __init__(self, context, logger):
        self.context = context
        self.logger = logger

    def new_file(self, tagged_file: TaggedFile):
        # context.add_file will handle path normalization and dedup
        try:
            self.context.add_file(tagged_file)
        except Exception as e:
            self.logger and self.logger.error(f"Error adding tagged file: {e}")

    def new_model(self, model: Dict[str, Any]):
        # Java version created attachment objects when processing Email models.
        if model.get("type") == "Email":
            self._new_email(model)

    def _get_or_create_attachment(self, attachment_model: Dict[str, Any]):
        # attachment_model: dict with fields and attributes similar to DecodedDataModel
        file_id = (attachment_model.get("attributes") or {}).get("file_id")
        if not file_id:
            file_id = "attachment_" + str(attachment_model.get("id") or "")

        # try find existing by id in context
        existing = self.context.get_file_by_id(file_id)
        if existing:
            return existing

        # fallback: check for extracted path
        attachment_extracted_path = (attachment_model.get("fields") or {}).get("attachment_extracted_path")
        if attachment_extracted_path:
            tf = TaggedFile()
            tf.id = file_id
            tf.fs = "extracted"
            tf.local_path = Path(attachment_extracted_path.replace("\\", "/"))
            tf.mobile_path = tf.local_path
            # size will be computed by context.add_file if missing
            return tf

        return None

    def _new_email(self, model: Dict[str, Any]):
        attachments = (model.get("fields") or {}).get("Attachments") or []
        for att in attachments:
            tf = self._get_or_create_attachment(att)
            if tf:
                self.context.add_file(tf)
            else:
                self.logger and self.logger.error("Error creating attachment file: %s" % (att,))
        # also check singular 'Attachment' key
        attachments2 = (model.get("fields") or {}).get("Attachment") or []
        for att in attachments2:
            tf = self._get_or_create_attachment(att)
            if tf:
                self.context.add_file(tf)
            else:
                self.logger and self.logger.error("Error creating attachment file: %s" % (att,))
