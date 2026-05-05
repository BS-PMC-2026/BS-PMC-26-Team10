# from app.db import get_connection
from app.db2 import supabase


def get_product_by_id(product_id):
    try:
        response = supabase.table("inventory").select(
            "id, name, description, quantity, last_updated, restock_date, price, image_url"
        ).eq("id", product_id).limit(1).execute()
        if not response.data:
            return None
        r = response.data[0]
        return (r["id"], r["name"], r["description"], r["quantity"],
                r["last_updated"], r["restock_date"], r["price"], r["image_url"])
    except Exception as e:
        print("Error fetching product by id\n", e)
        return None

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     cursor.execute("""
    #         SELECT id, name, description, quantity, last_updated, restock_date, price, image_url
    #         FROM inventory WHERE id = %s
    #     """, (product_id,))
    #     product = cursor.fetchone()
    #     cursor.close()
    #     conn.close()
    #     return product
    # except Exception as e:
    #     print("Error fetching product by id\n", e)
    #     return None


def create_product(product):
    try:
        supabase.table("inventory").insert({
            "name": product.name,
            "description": product.description,
            "quantity": product.quantity,
            "restock_date": str(product.restock_date) if product.restock_date else None,
            "price": product.price,
            "image_url": product.image_url,
        }).execute()
        return "Product has been created!"
    except Exception as e:
        print("Error while trying to create new product in db\n", e)
        return "Product has not been created to db"

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     INSERT INTO inventory (name, description, quantity, restock_date, price, image_url)
    #     VALUES(%s, %s, %s, %s, %s, %s)
    #     """
    #     cursor.execute(query, (product.name, product.description, product.quantity,
    #                            product.restock_date, product.price, product.image_url))
    #     conn.commit()
    #     cursor.close()
    #     conn.close()
    #     return "Product has been created!"
    # except Exception as e:
    #     print("Error while trying to create new product in db\n", e)
    #     return "Product has not been created to db"


def delete_product(product_id):
    try:
        response = supabase.table("inventory").delete().eq("id", product_id).execute()
        if not response.data:
            return None
        return "Product deleted successfully!"
    except Exception as e:
        print("Error while trying to delete product from db\n", e)
        return False

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     cursor.execute("DELETE FROM inventory WHERE id = %s", (product_id,))
    #     conn.commit()
    #     deleted_rows = cursor.rowcount
    #     cursor.close()
    #     conn.close()
    #     if deleted_rows == 0:
    #         return None
    #     return "Product deleted successfully!"
    # except Exception as e:
    #     print("Error while trying to delete product from db\n", e)
    #     return False


def update_product(product_id, product):
    try:
        response = supabase.table("inventory").update({
            "name": product.name,
            "description": product.description,
            "quantity": product.quantity,
            "restock_date": str(product.restock_date) if product.restock_date else None,
            "price": product.price,
            "image_url": product.image_url,
        }).eq("id", product_id).execute()
        if not response.data:
            return None
        return "Product updated successfully!"
    except Exception as e:
        print("Error while trying to update product in db\n", e)
        return False

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     UPDATE inventory
    #     SET name = %s, description = %s, quantity = %s, restock_date = %s, price = %s, image_url = %s
    #     WHERE id = %s
    #     """
    #     cursor.execute(query, (product.name, product.description, product.quantity,
    #                            product.restock_date, product.price, product.image_url, product_id))
    #     conn.commit()
    #     updated_rows = cursor.rowcount
    #     cursor.close()
    #     conn.close()
    #     if updated_rows == 0:
    #         return None
    #     return "Product updated successfully!"
    # except Exception as e:
    #     print("Error while trying to update product in db\n", e)
    #     return False


def get_all_products():
    try:
        response = supabase.table("inventory").select(
            "id, name, description, quantity, last_updated, restock_date, price, image_url"
        ).order("name").execute()
        return [
            (r["id"], r["name"], r["description"], r["quantity"],
             r["last_updated"], r["restock_date"], r["price"], r["image_url"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to fetch products from db\n", e)
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     SELECT id, name, description, quantity, last_updated, restock_date, price, image_url
    #     FROM inventory ORDER BY name ASC
    #     """
    #     cursor.execute(query)
    #     products = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return products
    # except Exception as e:
    #     print("Error while trying to fetch products from db\n", e)
    #     return []
