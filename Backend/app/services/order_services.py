from app.db2 import supabase
from app.services.email_service import send_order_confirmation
from app.services.promo_services import validate_promo_code, increment_promo_usage


def get_all_orders():
    try:
        response = supabase.table("orders").select(
            "order_id, customer_email, customer_name, customer_phone, order_date, "
            "status, total_amount, payment_method, payment_status, shipping_address, delivery_status"
        ).order("order_date", desc=True).execute()
        return [
            (r["order_id"], r["customer_email"], r["customer_name"], r["customer_phone"],
             r["order_date"], r["status"], r["total_amount"], r["payment_method"],
             r["payment_status"], r["shipping_address"], r["delivery_status"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to fetch orders from db\n", e)
        return []


def get_recent_orders(limit=5):
    try:
        response = supabase.table("orders").select(
            "order_id, customer_email, customer_name, customer_phone, order_date, "
            "status, total_amount, payment_method, payment_status, shipping_address, delivery_status"
        ).order("order_date", desc=True).limit(limit).execute()
        return [
            (r["order_id"], r["customer_email"], r["customer_name"], r["customer_phone"],
             r["order_date"], r["status"], r["total_amount"], r["payment_method"],
             r["payment_status"], r["shipping_address"], r["delivery_status"])
            for r in response.data
        ]
    except Exception as e:
        print("Error while trying to fetch recent orders from db\n", e)
        return []


def create_order(order_data):
    try:
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

            resp = supabase.table("inventory").select(
                "id, name, quantity, price"
            ).eq("id", product_id).limit(1).execute()

            print("Product from inventory:", resp.data)

            if not resp.data:
                print("Order failed: product not found")
                return False

            product = resp.data[0]
            current_stock = int(product["quantity"])
            unit_price = float(product["price"])

            if current_stock < quantity:
                print("Order failed: not enough stock")
                return False

            total_price = unit_price * quantity
            total_amount += total_price

            # product is a dict now (Supabase), use product["name"] not product[1]
            checked_items.append({
                "product_id": product_id,
                "name": product["name"],
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": total_price
            })

        print("Total amount:", total_amount)

        promo_code = order_data.get("promo_code", "").strip() if order_data.get("promo_code") else ""
        final_amount = total_amount
        if promo_code:
            promo_result = validate_promo_code(promo_code, total_amount)
            if promo_result.get("valid"):
                final_amount = round(total_amount - promo_result["discount_amount"], 2)
                print(f"Promo '{promo_code}' applied: -{promo_result['discount_amount']}, final={final_amount}")
            else:
                print(f"Promo '{promo_code}' rejected at order time: {promo_result.get('message')}")
                promo_code = ""

        order_resp = supabase.table("orders").insert({
            "customer_email": order_data["customer_email"],
            "customer_name": order_data["customer_name"],
            "customer_phone": order_data["customer_phone"],
            "status": order_data["status"],
            "total_amount": final_amount,
            "payment_method": order_data["payment_method"],
            "payment_status": order_data["payment_status"],
            "shipping_address": order_data["shipping_address"],
            "delivery_status": order_data["delivery_status"],
            "paypal_order_id": order_data.get("paypal_order_id"),
        }).execute()

        order_id = order_resp.data[0]["order_id"]
        print("Created order id:", order_id)

        for item in checked_items:
            supabase.table("order_items").insert({
                "order_id": order_id,
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
                "total_price": item["total_price"],
            }).execute()

            inv_resp = supabase.table("inventory").select("quantity").eq(
                "id", item["product_id"]
            ).limit(1).execute()
            new_qty = int(inv_resp.data[0]["quantity"]) - item["quantity"]
            supabase.table("inventory").update({"quantity": new_qty}).eq(
                "id", item["product_id"]
            ).execute()

        print("About to send confirmation email")
        send_order_confirmation(
            order_id=order_id,
            customer_name=order_data["customer_name"],
            customer_email=order_data["customer_email"],
            items=checked_items,
            total_amount=total_amount
        )
        if promo_code:
            increment_promo_usage(promo_code)

        return {"message": "Order created successfully!", "order_id": order_id}

    except Exception as e:
        print("Error while trying to create order in db:")
        print(repr(e))
        return False