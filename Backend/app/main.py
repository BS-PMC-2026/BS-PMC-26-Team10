from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db import get_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent.parent
IMAGES_DIR = BASE_DIR / "chilli_images"

app.mount("/chilli_images", StaticFiles(directory=str(IMAGES_DIR)), name="chilli_images")


@app.get("/peppers")
def get_peppers():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT name, description, image_url, shu_min, shu_max,
                       origin, color, is_available, stock_quantity, season
                FROM chilli
                ORDER BY name
            """)
            rows = cursor.fetchall()

            peppers = []
            for row in rows:
                image_url = row[2]

                if image_url.startswith("../chilli_images/"):
                    image_url = image_url.replace("../chilli_images/", "/chilli_images/")

                peppers.append({
                    "name": row[0],
                    "description": row[1],
                    "image_url": image_url,
                    "shu_min": row[3],
                    "shu_max": row[4],
                    "origin": row[5],
                    "color": row[6],
                    "is_available": row[7],
                    "stock_quantity": row[8],
                    "season": row[9],
                })

            return peppers
    finally:
        conn.close()