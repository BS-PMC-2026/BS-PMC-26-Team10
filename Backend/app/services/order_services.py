from app.db import get_connection


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
        ORDER BY order_date DESC
        """

        cursor.execute(query)
        orders = cursor.fetchall()

        cursor.close()
        conn.close()

        return orders
    except Exception as e:
        print("Error while trying to fetch orders from db\n", e)
        return []


def get_recent_orders(limit=5):
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
        ORDER BY order_date DESC
        LIMIT %s
        """

        cursor.execute(query, (limit,))
        orders = cursor.fetchall()

        cursor.close()
        conn.close()

        return orders
    except Exception as e:
        print("Error while trying to fetch recent orders from db\n", e)
        return []


def create_order(order_data):
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        items = order_data.get("items", [])
        print("Incoming order data:", order_data)

        if not items:
            print("Order failed: no items")
            return None

        checked_items = []
        total_amount = 0

        for item in items:
            product_id = int(item["product_id"])
            quantity = int(item["quantity"])

            print("Checking item:", product_id, quantity)

            if quantity <= 0:
                print("Order failed: quantity must be greater than 0")
                return False

            query = """
            SELECT id, name, quantity, price
            FROM inventory
            WHERE id = %s
            """
            cursor.execute(query, (product_id,))
            product = cursor.fetchone()

            print("Product from inventory:", product)

            if not product:
                print("Order failed: product not found")
                return False

            current_stock = int(product[2])
            unit_price = float(product[3])

            if current_stock < quantity:
                print("Order failed: not enough stock")
                return False

            total_price = unit_price * quantity
            total_amount += total_price

            checked_items.append({
                "product_id": product_id,
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": total_price
            })

        print("Total amount:", total_amount)

        order_query = """
        INSERT INTO orders (
            customer_email,
            customer_name,
            customer_phone,
            status,
            total_amount,
            payment_method,
            payment_status,
            shipping_address,
            delivery_status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING order_id
        """

        cursor.execute(order_query, (
            order_data["customer_email"],
            order_data["customer_name"],
            order_data["customer_phone"],
            order_data["status"],
            total_amount,
            order_data["payment_method"],
            order_data["payment_status"],
            order_data["shipping_address"],
            order_data["delivery_status"]
        ))

        order_id = cursor.fetchone()[0]
        print("Created order id:", order_id)

        for item in checked_items:
            item_query = """
            INSERT INTO order_items (
                order_id,
                product_id,
                quantity,
                unit_price,
                total_price
            )
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(item_query, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["unit_price"],
                item["total_price"]
            ))

            update_query = """
            UPDATE inventory
            SET quantity = quantity - %s
            WHERE id = %s
            """
            cursor.execute(update_query, (
                item["quantity"],
                item["product_id"]
            ))

        print("About to commit order")
        conn.commit()

        return {
            "message": "Order created successfully!",
            "order_id": order_id
        }

    except Exception as e:
        print("Error while trying to create order in db:")
        print(repr(e))
        if conn:
            conn.rollback()
        return False

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()