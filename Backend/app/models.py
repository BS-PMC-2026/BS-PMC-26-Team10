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