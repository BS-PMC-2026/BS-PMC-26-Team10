from app.db import get_connection

def create_order(order):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO orders (customer_email, customer_name,
        customer_phone, order_date, status,
        total_amount, payment_method, payment_status,
        shipping_address, delivery_status)
        VALUES(%s, %s, %s ,%s ,%s, %s, %s, %s, %s, %s)
        RETURNING order_id
        """
        cursor.execute(query, (
            order.customer_email,
            order.customer_name,
            order.customer_phone,
            order.order_date,
            order.status,
            order.total_amount,
            order.payment_method,
            order.payment_status,
            order.shipping_address,
            order.delivery_status
        ))
        order_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        return order_id
    except Exception as e:
        print('Error while trying to create new order in db\n', e)
        return None
    
def create_order_item(order_item):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        INSERT INTO order_items (order_id,
        order_item_name, quantity, unit_price,
        total_price)
        VALUES(%s, %s, %s ,%s ,%s)
        """
        cursor.execute(query, (
            order_item.order_id,
            order_item.order_item_name,
            order_item.quantity,
            order_item.unit_price,
            order_item.total_price
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return 'Order item has been created!'
    except Exception as e:
        print('Error while trying to create new order item in db\n', e)
        return 'Order item has not been created to db'


def get_all_orders():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            order_id,
            customer_email,
            customer_name,
            customer_phone,
            order_date,
            status,
            total_amount,
            payment_method,
            payment_status,
            shipping_address,
            delivery_status
        FROM orders
        ORDER BY order_id ASC
        """
        cursor.execute(query)
        orders = cursor.fetchall()
        cursor.close()
        conn.close()
        return orders
    except Exception as e:
        print('Error while trying to fetch orders from db\n', e)
        return []


def get_order_by_id(order_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            order_id,
            customer_email,
            customer_name,
            customer_phone,
            order_date,
            status,
            total_amount,
            payment_method,
            payment_status,
            shipping_address,
            delivery_status
        FROM orders
        WHERE order_id = %s
        """
        cursor.execute(query, (order_id,))
        order = cursor.fetchone()
        cursor.close()
        conn.close()
        return order
    except Exception as e:
        print('Error while trying to fetch order by id from db\n', e)
        return None


def get_all_order_items():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            order_item_id,
            order_id,
            order_item_name,
            quantity,
            unit_price,
            total_price
        FROM order_items
        ORDER BY order_item_id ASC
        """
        cursor.execute(query)
        order_items = cursor.fetchall()
        cursor.close()
        conn.close()
        return order_items
    except Exception as e:
        print('Error while trying to fetch order items from db\n', e)
        return []


def get_order_item_by_id(order_item_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        query = """
        SELECT
            order_item_id,
            order_id,
            order_item_name,
            quantity,
            unit_price,
            total_price
        FROM order_items
        WHERE order_item_id = %s
        """
        cursor.execute(query, (order_item_id,))
        order_item = cursor.fetchone()
        cursor.close()
        conn.close()
        return order_item
    except Exception as e:
        print('Error while trying to fetch order item by id from db\n', e)
        return None
