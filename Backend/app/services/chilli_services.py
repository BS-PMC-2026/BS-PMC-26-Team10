# from app.db import get_connection
from app.db2 import supabase, delete_image
from typing import Optional

_FIELDS = (
    "id, name, description, image_url, shu_min, shu_max, "
    "origin, color, is_available, stock_quantity, season, full_description"
)


def _to_tuple(r):
    return (
        r["id"], r["name"], r["description"], r["image_url"],
        r["shu_min"], r["shu_max"], r["origin"], r["color"],
        r["is_available"], r["stock_quantity"], r["season"],
        r["full_description"], r.get("price"),
    )


def _price_col_missing(e):
    s = str(e)
    return "42703" in s or "does not exist" in s.lower()


def create_chilli(chilli, is_available, stock_quantity):
    try:
        row = {
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
        }
        if chilli.price is not None:
            row["price"] = chilli.price
        supabase.table("chilli").insert(row).execute()
        return "Chilli has been created!"
    except Exception as e:
        print("Error while trying to create a chilli:\n", e)
        return "Chilli has not been created = ERROR!"


def get_chilli_by_id(chilli_id):
    for with_price in (True, False):
        try:
            fields = _FIELDS + (", price" if with_price else "")
            response = (
                supabase.table("chilli")
                .select(fields)
                .eq("id", chilli_id)
                .limit(1)
                .execute()
            )
            if not response.data:
                return None
            return _to_tuple(response.data[0])
        except Exception as e:
            if with_price and _price_col_missing(e):
                continue
            print("Error while trying to fetch chilli by id:\n", e)
            return None
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
    for with_price in (True, False):
        try:
            fields = _FIELDS + (", price" if with_price else "")
            response = supabase.table("chilli").select(fields).order("name").execute()
            return [_to_tuple(r) for r in response.data]
        except Exception as e:
            if with_price and _price_col_missing(e):
                continue
            print("Error while trying to fetch chillies:\n", e)
            return []
    return []


def filter_chillies(
    min_shu: Optional[int] = None,
    max_shu: Optional[int] = None,
    origin: Optional[str] = None,
):
    for with_price in (True, False):
        try:
            fields = _FIELDS + (", price" if with_price else "")
            query = supabase.table("chilli").select(fields)
            if min_shu is not None:
                query = query.gte("shu_max", min_shu)
            if max_shu is not None:
                query = query.lte("shu_min", max_shu)
            if origin:
                query = query.ilike("origin", f"%{origin}%")
            response = query.order("name").execute()
            return [_to_tuple(r) for r in response.data]
        except Exception as e:
            if with_price and _price_col_missing(e):
                continue
            print("Error while trying to filter chillies:\n", e)
            return []
    return []


def search_chillies(query_string: str):
    for with_price in (True, False):
        try:
            fields = _FIELDS + (", price" if with_price else "")
            response = (
                supabase.table("chilli")
                .select(fields)
                .or_(f"name.ilike.%{query_string}%,description.ilike.%{query_string}%")
                .order("name")
                .execute()
            )
            return [_to_tuple(r) for r in response.data]
        except Exception as e:
            if with_price and _price_col_missing(e):
                continue
            print("Error while trying to search chillies:\n", e)
            return []
    return []
