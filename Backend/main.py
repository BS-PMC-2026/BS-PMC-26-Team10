from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# from app.db import get_connection
# from db.scripts.load_peppers import main as load_data
# from db.scripts.create_bookings_table import main as create_bookings_table
from app.routes import chilli, product, order, tour, booking, promo, faq, admin_auth

app = FastAPI()

# Check later to remove.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
CHILLI_IMAGES_DIR = PROJECT_ROOT / "chilli_images"
PRODUCT_IMAGES_DIR = PROJECT_ROOT / "product_images"
SEED_SQL_PATH = BACKEND_DIR / "seed_descriptions.sql"


# def run_seed_descriptions() -> None:
#     if not SEED_SQL_PATH.exists():
#         print(f"seed file not found: {SEED_SQL_PATH}")
#         return
#     sql_text = SEED_SQL_PATH.read_text(encoding="utf-8")
#     conn = get_connection()
#     try:
#         with conn:
#             with conn.cursor() as cursor:
#                 cursor.execute(sql_text)
#         print("seed_descriptions.sql executed successfully.")
#     except Exception as e:
#         print("Error while running seed_descriptions.sql:\n", e)
#     finally:
#         conn.close()

# load_data()
# run_seed_descriptions()
# create_bookings_table()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chilli.router, tags=["chilli"])
app.include_router(product.router, tags=["product"])
app.include_router(order.router, tags=["order"])
app.include_router(tour.router, tags=["tour"])
app.include_router(booking.router, tags=["booking"])
app.include_router(promo.router, tags=["promo"])
app.include_router(faq.router, tags=["faq"])
app.include_router(admin_auth.router, tags=["admin-auth"])

app.mount(
    "/chilli_images",
    StaticFiles(directory=str(CHILLI_IMAGES_DIR)),
    name="chilli-images"
)

app.mount(
    "/product_images",
    StaticFiles(directory=str(PRODUCT_IMAGES_DIR)),
    name="product-images"
)
