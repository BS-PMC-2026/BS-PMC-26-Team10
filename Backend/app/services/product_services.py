from app.db import get_connection


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
        return 'Product has been created!'
    except Exception as e:
        print('Error while trying to create new product in db\n', e)
        return 'Product has not been created to db'


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
        print('Error while trying to fetch products from db\n', e)
        return []
