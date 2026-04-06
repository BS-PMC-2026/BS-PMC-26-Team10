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
    