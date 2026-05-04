from app.db import get_connection

def get_product_by_id(product_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, description, quantity,
                   last_updated, restock_date, price, image_url
            FROM inventory
            WHERE id = %s
        """, (product_id,))
        product = cursor.fetchone()
        cursor.close()
        conn.close()
        return product
    except Exception as e:
        print("Error fetching product by id\n", e)
        return None
        
def create_product(product):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO inventory (name, description, quantity,
        restock_date, price, image_url)
        VALUES(%s, %s, %s ,%s ,%s, %s)
        """
        cursor.execute(query, (
            product.name,
            product.description,
            product.quantity,
            product.restock_date,
            product.price,
            product.image_url
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return "Product has been created!"
    except Exception as e:
        print("Error while trying to create new product in db\n", e)
        return "Product has not been created to db"


def delete_product(product_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        DELETE FROM inventory
        WHERE id = %s
        """
        cursor.execute(query, (product_id,))
        conn.commit()

        deleted_rows = cursor.rowcount

        cursor.close()
        conn.close()

        if deleted_rows == 0:
            return None

        return "Product deleted successfully!"
    except Exception as e:
        print("Error while trying to delete product from db\n", e)
        return False


def update_product(product_id, product):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        UPDATE inventory
        SET
            name = %s,
            description = %s,
            quantity = %s,
            restock_date = %s,
            price = %s,
            image_url = %s
        WHERE id = %s
        """
        cursor.execute(
            query,
            (
                product.name,
                product.description,
                product.quantity,
                product.restock_date,
                product.price,
                product.image_url,
                product_id,
            ),
        )
        conn.commit()

        updated_rows = cursor.rowcount

        cursor.close()
        conn.close()

        if updated_rows == 0:
            return None

        return "Product updated successfully!"
    except Exception as e:
        print("Error while trying to update product in db\n", e)
        return False


def get_all_products():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            id,
            name,
            description,
            quantity,
            last_updated,
            restock_date,
            price,
            image_url
        FROM inventory
        ORDER BY name ASC
        """
        cursor.execute(query)
        products = cursor.fetchall()
        cursor.close()
        conn.close()

        return products
    except Exception as e:
        print("Error while trying to fetch products from db\n", e)
        return []