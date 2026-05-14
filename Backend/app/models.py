from typing import Optional
from pydantic import BaseModel

class Chilli(BaseModel):
    name : str
    description : str
    image_url : str = ''
    origin : str
    color : str
    shuMin : int
    shuMax : int
    season : str
    full_description : str = ''
class Product(BaseModel):
    name : str
    description : str
    quantity : int
    restock_date : str
    price : float
    image_url : str
    ingredients : str = ''
    ingredients_image_url : str = ''

class Tour(BaseModel):
    title: str
    kind: str = "field-tasting"
    description: str = ""
    date: str
    time: str
    duration: str = "90 min"
    capacity: int
    price: float = 0
    meeting_point: str = ""
    includes: str = ""
    accessibility: str = "mostly-yes"
    visibility: str = "draft"
    confirmation_message: str = (
        "Your tour reservation was successful. Please keep this email and your booking "
        "reference for future changes or cancellation."
    )

class BookingCreate(BaseModel):
    tour_id: int
    email: str
    full_name: str
    phone: str
    participants_count: int
    payment_status: str = "free"
    paypal_order_id: Optional[str] = None
