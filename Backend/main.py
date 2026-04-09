from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routes import chilli, product

app = FastAPI()
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CHILLI_IMAGES_DIR = PROJECT_ROOT / 'chilli_images'
PRODUCT_IMAGES_DIR = PROJECT_ROOT / 'product_images'

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chilli.router, tags=["chilli"])
app.include_router(product.router, tags=["product"])
app.mount('/chilli_images', StaticFiles(directory=str(CHILLI_IMAGES_DIR)), name='chilli-images')
app.mount('/product_images', StaticFiles(directory=str(PRODUCT_IMAGES_DIR)), name='product-images')
