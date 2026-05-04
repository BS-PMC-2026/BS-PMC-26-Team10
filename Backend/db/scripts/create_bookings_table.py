from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import get_connection


SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "create_bookings_table.sql"


def main() -> int:
    if not SQL_FILE.exists():
        print(f"SQL file not found: {SQL_FILE}")
        return 1

    query = SQL_FILE.read_text(encoding="utf-8")
    if not query.strip():
        print(f"SQL file is empty: {SQL_FILE}")
        return 1

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
    finally:
        conn.close()

    print("Bookings table created successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
