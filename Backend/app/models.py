from pydantic import BaseModel

class Chilli(BaseModel):
    name : str
    description : str
    image_url : str = ''
    origin : str
    color : str
    shuMin : str
    shuMax : int
    season : str
class Product(BaseModel):
    name : str
    description : str
    quantity : int
    restock_date : str
    price : float
    image_url : str
class Order(BaseModel):
    customer_email : str
    customer_name : str
    customer_phone : int
    order_date : str
    status : str
    total_amount : int
    payment_method : str
    payment_status : str
    shipping_address : str
    delivery_status : str
class OrderItem(BaseModel):
    order_id : int | None = None
    order_item_name : str
    quantity : int
    unit_price : int
    total_price : int
class OrderRequest(BaseModel):
    order : Order
    order_item : OrderItem
