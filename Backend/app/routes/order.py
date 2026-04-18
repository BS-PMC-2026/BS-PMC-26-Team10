from fastapi import APIRouter, HTTPException

from app.services.order_services import (
    get_all_orders,
    get_recent_orders,
    create_order
)

router = APIRouter()


def serialize_orders(orders):
    return [
        {
            "order_id": order[0],
            "customer_email": order[1],
            "customer_name": order[2],
            "customer_phone": order[3],
            "order_date": order[4],
            "status": order[5],
            "total_amount": float(order[6]) if order[6] is not None else None,
            "payment_method": order[7],
            "payment_status": order[8],
            "shipping_address": order[9],
            "delivery_status": order[10],
        }
        for order in orders
    ]


@router.get("/orders")
def list_orders():
    orders = get_all_orders()
    return serialize_orders(orders)


@router.get("/orders/recent")
def list_recent_orders(limit: int = 5):
    orders = get_recent_orders(limit)
    return serialize_orders(orders)


@router.post("/orders")
def add_order(order_data: dict):
    response = create_order(order_data)

    if response is None:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")

    if response is False:
        raise HTTPException(status_code=400, detail="Failed to create order.")

    return response