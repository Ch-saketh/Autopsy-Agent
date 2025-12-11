# app/services/parser/ufed_sax_parser.py
import xml.etree.ElementTree as ET
from pathlib import Path
import zipfile
import tempfile
import shutil
import os
import logging
from typing import Iterable, Callable, Optional, Dict, Any

logger = logging.getLogger("ufed_sax_parser")

# Helpers --------------------------------------------------------------------
def _safe_text(elem: ET.Element) -> Optional[str]:
    if elem is None:
        return None
    text = (elem.text or "").strip()
    return text if text != "" else None

def _iter_find_first(elem: ET.Element, tag: str):
    # returns first subelement matching tag (no namespace handling here)
    for c in elem:
        if c.tag == tag:
            return c
    return None

# Model builder: converts a <model> element (UFED style) to python dict ------
def _build_model_from_element(model_elem: ET.Element) -> Dict[str, Any]:
    """
    Converts <model type="..." id="..."> ... </model> into:
    {
      "id": "...",
      "type": "...",
      "attributes": {...},         # element attribs
      "fields": { "FieldName": <value | list | models> }  # see below
    }
    The structure handles <field>, <multiField>, <modelField>, <multiModelField>.
    """
    m = {
        "id": model_elem.attrib.get("id"),
        "type": model_elem.attrib.get("type"),
        "attributes": dict(model_elem.attrib),
        "fields": {}
    }

    # iterate children and parse typical UFED structure
    # We assume direct children are <field>, <multiField>, <modelField>, <multiModelField>
    for child in model_elem:
        tag = child.tag
        if tag == "field":
            # single value: <field name="Name" type="..."><value>...</value></field>
            name = child.attrib.get("name")
            val_elem = _iter_find_first(child, "value")
            m["fields"][name] = _safe_text(val_elem)
        elif tag == "multiField":
            name = child.attrib.get("name")
            values = []
            for v in child.findall("value"):
                tv = _safe_text(v)
                if tv is not None:
                    values.append(tv)
            m["fields"][name] = values
        elif tag in ("modelField", "multiModelField"):
            name = child.attrib.get("name")
            models = []
            # child contains many <model> nodes in UFED format
            for submodel in child.findall("model"):
                models.append(_build_model_from_element(submodel))
            m["fields"][name] = models
        else:
            # unknown child, ignore or store raw text
            pass

    return m

# TaggedFile builder --------------------------------------------------------
def _build_tagged_file_from_element(file_elem: ET.Element, base_dir: Path) -> Dict[str, Any]:
    """
    Converts <file id="..." fs="..." path="..." size="...">...</file>
    into a dict that your FileHandler or UFEDFileContext.addFile can accept.
    We'll include local_path/mobile_path as best as we can.
    """
    tf = {}
    tf["id"] = file_elem.attrib.get("id")
    tf["fs"] = file_elem.attrib.get("fs")
    tf["fsid"] = file_elem.attrib.get("fsid")
    path_attr = file_elem.attrib.get("path")
    if path_attr:
        # create Path and try to normalize
        p = Path(path_attr)
        # if the path is relative, resolve against base_dir
        if not p.is_absolute():
            p = (base_dir / p).resolve()
        tf["mobile_path"] = str(p)
    # try to read metadata children (metadata/item name="Local Path">...</item>)
    for section in file_elem:
        if section.tag == "metadata":
            for item in section.findall("item"):
                name = item.attrib.get("name")
                val = _safe_text(item)
                if name and val:
                    if name == "Local Path":
                        tf["local_path"] = str((base_dir / Path(val)).resolve()) if not Path(val).is_absolute() else val
                    else:
                        # generic metadata store
                        tf.setdefault("metadata", {})[name] = val
        elif section.tag == "accessInfo":
            # timestamps
            for ts in section.findall("timestamp"):
                nm = ts.attrib.get("name")
                val = _safe_text(ts)
                if nm and val:
                    tf.setdefault("timestamps", {})[nm] = val

    # size and mimetype from attributes if present
    if "size" in file_elem.attrib:
        try:
            tf["size"] = int(file_elem.attrib.get("size"))
        except Exception:
            pass
    if "mimetype" in file_elem.attrib:
        tf["mimetype"] = file_elem.attrib.get("mimetype")

    return tf

# Main parser - top-level ---------------------------------------------------
def parse_ufdr(report_path: Path,
               contact_handler,
               chat_handler,
               file_handler,
               case_dir: Path):
    """
    Parse a UFDR XML report file (report_path) and call handlers.
    - contact_handler, chat_handler, file_handler must have new_model() / new_file() methods.
    - case_dir is used to resolve relative local paths referenced in taggedFiles.
    """

    # guard: ensure file exists
    if not report_path.exists():
        raise FileNotFoundError(f"report XML not found: {report_path}")

    # We'll stream-parse the XML for 'model' entries inside decodedData
    context_base = case_dir

    # Use iterparse to catch end events for model/file elements
    # We need to detect which section we are in: taggedFiles or decodedData
    events = ("start", "end")
    try:
        it = ET.iterparse(str(report_path), events=events)
    except Exception as e:
        logger.exception("iterparse failed: %s", e)
        raise

    current_section = None
    # buffer for minimal tree for a single model or file element
    for event, elem in it:
        tag = elem.tag

        # Keep tag local (strip namespace if present)
        if "}" in tag:
            tag = tag.split("}", 1)[1]

        if event == "start":
            # detect sections
            if tag == "taggedFiles":
                current_section = "taggedFiles"
            elif tag == "decodedData":
                current_section = "decodedData"
            elif tag == "modelType":
                # model type sub-section (optional)
                pass
            # continue
        elif event == "end":
            if tag == "file" and current_section == "taggedFiles":
                # Build a tagged file dict and call file_handler.new_file
                try:
                    tf = _build_tagged_file_from_element(elem, context_base)
                    # file_handler.new_file expects TaggedFile-like object; try to pass dict
                    file_handler.new_file(tf)
                except Exception as e:
                    logger.exception("error handling tagged file: %s", e)
                finally:
                    # clear element to free memory
                    elem.clear()
            elif tag == "model" and current_section == "decodedData":
                # this is a model element inside decodedData
                try:
                    model = _build_model_from_element(elem)
                    # dispatch to handlers by type. The model dict has "type"
                    mtype = (model.get("type") or "").lower()
                    # call both handlers (they will ignore types they don't handle)
                    try:
                        contact_handler.new_model(model)
                    except Exception:
                        logger.debug("contact_handler new_model threw; continuing", exc_info=True)
                    try:
                        chat_handler.new_model(model)
                    except Exception:
                        logger.debug("chat_handler new_model threw; continuing", exc_info=True)
                    try:
                        file_handler.new_model(model)
                    except Exception:
                        logger.debug("file_handler new_model threw; continuing", exc_info=True)
                except Exception as e:
                    logger.exception("error building model: %s", e)
                finally:
                    elem.clear()

            elif tag in ("taggedFiles", "decodedData") and event == "end":
                # leaving a section: reset section marker
                current_section = None
                elem.clear()
            else:
                # clear other end elements to keep memory low
                elem.clear()

    # finished parsing
    logger.info("ufdr parsing finished for %s", report_path)


# Utility to accept zip/ufdr path and find a report XML ----------------------
def parse_ufdr_archive(archive_path: Path,
                       contact_handler,
                       chat_handler,
                       file_handler,
                       case_dir: Path):
    """
    If archive_path is a zip (.ufdr or .zip) it will be unpacked to a temp dir and we will
    search for the primary XML report. If archive_path is a directory, it will try to find
    an XML inside. Finally it calls parse_ufdr(report_xml, ...).
    """
    archive_path = Path(archive_path)
    temp_dir = None
    try:
        if archive_path.is_dir():
            base = archive_path
        else:
            # assume zip file
            temp_dir = Path(tempfile.mkdtemp(prefix="ufdr_"))
            with zipfile.ZipFile(str(archive_path), "r") as zf:
                zf.extractall(str(temp_dir))
            base = temp_dir

        # heuristics to find likely report xml files
        candidates = list(base.rglob("*.xml"))
        # prefer files named 'report' or containing 'decoded' or 'ufdr' in name
        prioritized = sorted(candidates, key=lambda p: (0 if "report" in p.name.lower() or "decoded" in p.name.lower() else 1, p.name))
        if not prioritized:
            raise FileNotFoundError("No XML found inside UFDR archive")

        report = prioritized[0]
        logger.info("Using report XML: %s", report)
        parse_ufdr(report, contact_handler, chat_handler, file_handler, base)

    finally:
        # clean up temporary dir only if we created it
        if temp_dir is not None and temp_dir.exists():
            try:
                shutil.rmtree(str(temp_dir))
            except Exception:
                pass
