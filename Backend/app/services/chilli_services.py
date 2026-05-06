# from app.db import get_connection
from app.db2 import supabase, delete_image
from typing import Optional


def create_chilli(chilli, is_available, stock_quantity):
    try:
        supabase.table("chilli").insert({
            "name": chilli.name,
            "description": chilli.description,
            "image_url": chilli.image_url,
            "shu_min": chilli.shuMin,
            "shu_max": chilli.shuMax,
            "origin": chilli.origin,
            "color": chilli.color,
            "is_available": is_available,
            "stock_quantity": stock_quantity,
            "season": chilli.season,
            "full_description": chilli.full_description,
        }).execute()
        return "Chilli has been created!"
    except Exception as e:
        print("Error while trying to create a chilli:\n", e)
        return "Chilli has not been created = ERROR!"

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     INSERT INTO chilli (
    #         name, description, image_url, shu_min, shu_max, origin, color,
    #         is_available, stock_quantity, season
    #     ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    #     """
    #     cursor.execute(query, (
    #         chilli.name, chilli.description, chilli.image_url, chilli.shuMin,
    #         chilli.shuMax, chilli.origin, chilli.color, is_available,
    #         stock_quantity, chilli.season,
    #     ))
    #     conn.commit()
    #     cursor.close()
    #     conn.close()
    #     return "Chilli has been created!"
    # except Exception as e:
    #     print("Error while trying to create a chilli:\n", e)
    #     return "Chilli has not been created = ERROR!"


def get_chilli_by_id(chilli_id):
    try:
        response = supabase.table("chilli").select(
            "id, name, description, image_url, shu_min, shu_max, origin, color, is_available, stock_quantity, season, full_description"
        ).eq("id", chilli_id).limit(1).execute()
        if not response.data:
            return None
        r = response.data[0]
        return (r["id"], r["name"], r["description"], r["image_url"], r["shu_min"],
                r["shu_max"], r["origin"], r["color"], r["is_available"],
                r["stock_quantity"], r["season"], r["full_description"])
    except Exception as e:
        print("Error while trying to fetch chilli by id:\n", e)
        return None


def delete_chilli(chilli_id):
    try:
        check = supabase.table("chilli").select("id, image_url").eq("id", chilli_id).limit(1).execute()
        if not check.data:
            return None
        image_url = check.data[0].get("image_url", "")
        supabase.table("chilli").delete().eq("id", chilli_id).execute()
        delete_image(image_url, "chilli-images")
        return "Chilli deleted successfully!"
    except Exception as e:
        print("Error while trying to delete chilli:\n", e)
        return False


def get_all_chillies():
    try:
        response = supabase.table("chilli").select(
            "id, name, description, image_url, shu_min, shu_max, origin, color, is_available, stock_quantity, season, full_description"
        ).order("name").execute()
        return [
            (r["id"], r["name"], r["description"], r["image_url"], r["shu_min"],
             r["shu_max"], r["origin"], r["color"], r["is_available"],
             r["stock_quantity"], r["season"], r["full_description"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to fetch chillies:\n", e)
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     SELECT id, name, description, image_url, shu_min, shu_max, origin, color,
    #            is_available, stock_quantity, season, full_description
    #     FROM chilli ORDER BY name ASC
    #     """
    #     cursor.execute(query)
    #     chillies = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return chillies
    # except Exception as e:
    #     print("Error while trying to fetch chillies:\n", e)
    #     return []


def filter_chillies(
    min_shu: Optional[int] = None,
    max_shu: Optional[int] = None,
    origin: Optional[str] = None,
):
    try:
        query = supabase.table("chilli").select(
            "id, name, description, image_url, shu_min, shu_max, origin, color, is_available, stock_quantity, season, full_description"
        )
        if min_shu is not None:
            query = query.gte("shu_max", min_shu)
        if max_shu is not None:
            query = query.lte("shu_min", max_shu)
        if origin:
            query = query.ilike("origin", f"%{origin}%")
        response = query.order("name").execute()
        return [
            (r["id"], r["name"], r["description"], r["image_url"], r["shu_min"],
             r["shu_max"], r["origin"], r["color"], r["is_available"],
             r["stock_quantity"], r["season"], r["full_description"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to filter chillies:\n", e)
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     SELECT id, name, description, image_url, shu_min, shu_max, origin, color,
    #            is_available, stock_quantity, season, full_description FROM chilli
    #     """
    #     conditions = []
    #     values = []
    #     if min_shu is not None:
    #         conditions.append("shu_max >= %s")
    #         values.append(min_shu)
    #     if max_shu is not None:
    #         conditions.append("shu_min <= %s")
    #         values.append(max_shu)
    #     if origin:
    #         conditions.append("origin ILIKE %s")
    #         values.append(origin)
    #     if conditions:
    #         query += " WHERE " + " AND ".join(conditions)
    #     query += " ORDER BY name ASC"
    #     cursor.execute(query, tuple(values))
    #     chillies = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return chillies
    # except Exception as e:
    #     print("Error while trying to filter chillies:\n", e)
    #     return []


def search_chillies(query_string: str):
    try:
        response = supabase.table("chilli").select(
            "id, name, description, image_url, shu_min, shu_max, origin, color, is_available, stock_quantity, season, full_description"
        ).or_(
            f"name.ilike.%{query_string}%,description.ilike.%{query_string}%"
        ).order("name").execute()
        return [
            (r["id"], r["name"], r["description"], r["image_url"], r["shu_min"],
             r["shu_max"], r["origin"], r["color"], r["is_available"],
             r["stock_quantity"], r["season"], r["full_description"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to search chillies:\n", e)
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     SELECT id, name, description, image_url, shu_min, shu_max, origin, color,
    #            is_available, stock_quantity, season, full_description
    #     FROM chilli WHERE name ILIKE %s OR description ILIKE %s ORDER BY name ASC
    #     """
    #     search_term = f"%{query_string}%"
    #     cursor.execute(query, (search_term, search_term))
    #     chillies = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return chillies
    # except Exception as e:
    #     print("Error while trying to search chillies:\n", e)
    #     return []
