from fastapi import APIRouter, HTTPException, Request
from app.models import OrderRequest, OrderItem, Order
from app.services.orders_service import (
    create_order,
    create_order_item,
    get_all_order_items,
    get_all_orders,
    get_order_by_id,
    get_order_item_by_id,
)

router = APIRouter()


def serialize_order(order):
    return {
        'order_id': order[0],
        'customer_email': order[1],
        'customer_name': order[2],
        'customer_phone': order[3],
        'order_date': order[4],
        'status': order[5],
        'total_amount': float(order[6]) if order[6] is not None else None,
        'payment_method': order[7],
        'payment_status': order[8],
        'shipping_address': order[9],
        'delivery_status': order[10],
    }


def serialize_order_item(order_item):
    return {
        'order_item_id': order_item[0],
        'order_id': order_item[1],
        'order_item_name': order_item[2],
        'quantity': order_item[3],
        'unit_price': float(order_item[4]) if order_item[4] is not None else None,
        'total_price': float(order_item[5]) if order_item[5] is not None else None,
    }


@router.get('/orders')
def list_orders():
    orders = get_all_orders()
    return [serialize_order(order) for order in orders]


@router.get('/orders/{order_id}')
def get_order(order_id: int):
    order = get_order_by_id(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail='Order not found')
    return serialize_order(order)


@router.get('/order-items')
def list_order_items():
    order_items = get_all_order_items()
    return [serialize_order_item(order_item) for order_item in order_items]


@router.get('/order-items/{order_item_id}')
def get_order_item(order_item_id: int):
    order_item = get_order_item_by_id(order_item_id)
    if order_item is None:
        raise HTTPException(status_code=404, detail='Order item not found')
    return serialize_order_item(order_item)

@router.post('/orders')
def add_order(_ : OrderRequest):
    output = {}
    order : Order = _.order
    order_item : OrderItem = _.order_item

    order.customer_phone = int(order.customer_phone)
    order.total_amount = int(order.total_amount)
    order_id = create_order(order)
    if order_id is None:
        raise HTTPException(status_code=500, detail='Order has not been created to db')
    output['message_1'] = 'Order has been created!'

    order_item.order_id = order_id
    order_item.quantity = int(order_item.quantity)
    order_item.unit_price = int(order_item.unit_price)
    order_item.total_price = int(order_item.total_price)
    response = create_order_item(order_item)
    output['message_2'] = response
    return output

    
