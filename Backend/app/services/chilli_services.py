from app.db import get_connection
from typing import Optional

def create_chilli(chilli, is_available,
                  stock_quantity):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO chilli (name, description, image_url, 
        shu_min, shu_max, origin, color, is_available,
        stock_quantity, season)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query,(
            chilli.name,
            chilli.description,
            chilli.image_url,
            chilli.shuMin,
            chilli.shuMax,
            chilli.origin,
            chilli.color,
            is_available,
            stock_quantity,
            chilli.season
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return "Chilli has been created!"
    except Exception as e:
        print("Error while trying to create a chilli:\n ",e)
        return "Chilli has not been created = ERROR!"


def get_all_chillies():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            id,
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
        FROM chilli
        ORDER BY name ASC
        """
        cursor.execute(query)
        chillies = cursor.fetchall()
        cursor.close()
        conn.close()

        return chillies
    except Exception as e:
        print("Error while trying to fetch chillies:\n ", e)
        return []


def filter_chillies(min_shu: Optional[int] = None,
                    max_shu: Optional[int] = None,
                    origin: Optional[str] = None):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            id,
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
        FROM chilli
        """
        conditions = []
        values = []

        if min_shu is not None:
            conditions.append("shu_max >= %s")
            values.append(min_shu)

        if max_shu is not None:
            conditions.append("shu_min <= %s")
            values.append(max_shu)

        if origin:
            conditions.append("origin ILIKE %s")
            values.append(origin)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY name ASC"

        cursor.execute(query, tuple(values))
        chillies = cursor.fetchall()
        cursor.close()
        conn.close()

        return chillies
    except Exception as e:
        print("Error while trying to filter chillies:\n ", e)
        return []


def search_chillies(query_string: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Search for peppers with ILIKE (case-insensitive) for partial matches
        query = """
        SELECT
            id,
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
        FROM chilli
        WHERE name ILIKE %s OR description ILIKE %s
        ORDER BY name ASC
        """
        search_term = f"%{query_string}%"
        cursor.execute(query, (search_term, search_term))
        chillies = cursor.fetchall()
        cursor.close()
        conn.close()

        return chillies
    except Exception as e:
        print("Error while trying to search chillies:\n ", e)
        return []
