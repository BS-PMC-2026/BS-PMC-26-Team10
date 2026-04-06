from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import get_connection


PROJECT_ROOT = BACKEND_DIR.parent
WORKBOOK_PATH = PROJECT_ROOT / "pepper_list.xlsx"

XLSX_NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

EXPECTED_HEADERS = {
    "name",
    "description",
    "image_url",
    "shu_min",
    "shu_max",
    "origin",
    "color",
    "is_available",
    "stock_quantity",
    "season",
}

HEADER_ALIASES = {
    "shuMin": "shu_min",
    "shuMax": "shu_max",
    "stockQuantity": "stock_quantity",
    "imageUrl": "image_url",
    "isAvailable": "is_available",
}

DEFAULT_IMAGE_URL = "../chilli_images/default.jpg"
IMAGE_URL_PREFIX = "../chilli_images/"


def contains_hebrew(text: str) -> bool:
    return any("\u0590" <= char <= "\u05FF" for char in text)


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall("main:si", XLSX_NS):
        strings.append("".join(node.text or "" for node in item.iterfind(".//main:t", XLSX_NS)))
    return strings


def get_first_sheet_target(archive: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relationships}

    first_sheet = workbook.find("main:sheets", XLSX_NS)[0]
    rel_id = first_sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
    return f"xl/{targets[rel_id]}"


def column_name(cell_ref: str) -> str:
    return "".join(char for char in cell_ref if char.isalpha())


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    value_node = cell.find("main:v", XLSX_NS)
    if value_node is None or value_node.text is None:
        inline_node = cell.find("main:is/main:t", XLSX_NS)
        return "" if inline_node is None or inline_node.text is None else inline_node.text.strip()

    value = value_node.text.strip()
    if cell.attrib.get("t") == "s":
        return shared_strings[int(value)]
    return value


def normalize_header(value: str) -> str:
    stripped = value.strip()
    return HEADER_ALIASES.get(stripped, stripped)


def parse_bool(value: str) -> bool:
    lowered = value.strip().lower()
    return lowered in {"1", "true", "yes", "y", "t"}


def parse_int(value: str) -> int:
    stripped = value.strip()
    if not stripped:
        return 0
    return int(float(stripped))


def build_image_url(image_url: str) -> str:
    cleaned = image_url.strip()
    if cleaned:
        if "://" in cleaned or cleaned.startswith("../") or cleaned.startswith("/"):
            return cleaned
        return f"{IMAGE_URL_PREFIX}{cleaned}"

    return DEFAULT_IMAGE_URL


def parse_workbook_rows(workbook_path: Path) -> list[dict[str, str]]:
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet_root = ET.fromstring(archive.read(get_first_sheet_target(archive)))
        sheet_data = sheet_root.find("main:sheetData", XLSX_NS)
        if sheet_data is None:
            return []

        rows = list(sheet_data)
        if not rows:
            return []

        header_map: dict[str, str] = {}
        for cell in rows[0]:
            header = normalize_header(cell_value(cell, shared_strings))
            if header:
                header_map[column_name(cell.attrib.get("r", ""))] = header

        missing_headers = EXPECTED_HEADERS - set(header_map.values())
        if missing_headers:
            missing = ", ".join(sorted(missing_headers))
            raise ValueError(f"Workbook is missing required headers: {missing}")

        parsed_rows: list[dict[str, str]] = []
        for row in rows[1:]:
            row_data = {header: "" for header in EXPECTED_HEADERS}
            has_any_value = False

            for cell in row:
                ref = cell.attrib.get("r", "")
                header = header_map.get(column_name(ref))
                if not header:
                    continue

                value = cell_value(cell, shared_strings).strip()
                if value:
                    has_any_value = True
                row_data[header] = value

            if not has_any_value:
                continue

            name = " ".join(row_data["name"].split())
            if not name or contains_hebrew(name):
                continue

            row_data["name"] = name
            parsed_rows.append(row_data)

        return parsed_rows


def create_chilli_table() -> None:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    DROP TABLE IF EXISTS chilli
                    """
                )
                cursor.execute(
                    """
                    CREATE TABLE chilli (
                        name TEXT NOT NULL,
                        description TEXT NOT NULL,
                        image_url TEXT NOT NULL,
                        shu_min INTEGER NOT NULL,
                        shu_max INTEGER NOT NULL,
                        origin TEXT NOT NULL,
                        color TEXT NOT NULL,
                        is_available BOOLEAN NOT NULL,
                        stock_quantity INTEGER NOT NULL,
                        season TEXT NOT NULL
                    )
                    """
                )
    finally:
        conn.close()


def insert_rows(rows: list[dict[str, str]]) -> tuple[int, int]:
    conn = get_connection()
    inserted = 0
    skipped = 0

    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT name FROM chilli")
                existing_names = {row[0] for row in cursor.fetchall()}

                query = """
                INSERT INTO chilli (
                    name,
                    description,
                    image_url,
                    shu_min,
                    shu_max,
                    origin,
                    color,
                    is_available,
                    stock_quantity,
                    season
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                for row in rows:
                    name = row["name"]
                    if name in existing_names:
                        skipped += 1
                        continue

                    cursor.execute(
                        query,
                        (
                            name,
                            row["description"],
                            build_image_url(row["image_url"]),
                            parse_int(row["shu_min"]),
                            parse_int(row["shu_max"]),
                            row["origin"],
                            row["color"],
                            parse_bool(row["is_available"]),
                            parse_int(row["stock_quantity"]),
                            row["season"],
                        ),
                    )
                    inserted += 1
                    existing_names.add(name)
    finally:
        conn.close()

    return inserted, skipped


def main() -> int:
    if not WORKBOOK_PATH.exists():
        print(f"Workbook not found: {WORKBOOK_PATH}")
        return 1

    try:
        rows = parse_workbook_rows(WORKBOOK_PATH)
    except ValueError as error:
        print(error)
        return 1

    if not rows:
        print("No valid pepper rows found in workbook.")
        return 1

    create_chilli_table()
    inserted, skipped = insert_rows(rows)

    print(f"Loaded {inserted} peppers into chilli.")
    print(f"Skipped {skipped} peppers already present in the table.")
    print("Expected Excel headers:")
    print(", ".join(sorted(EXPECTED_HEADERS)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
