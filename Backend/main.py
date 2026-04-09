from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routes import chilli
from app.db import get_connection
from load_peppers import main as load_data

app = FastAPI()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent
IMAGES_DIR = PROJECT_ROOT / "chilli_images"
SEED_SQL_PATH = BACKEND_DIR / "seed_descriptions.sql"


def run_seed_descriptions() -> None:
    if not SEED_SQL_PATH.exists():
        print(f"seed file not found: {SEED_SQL_PATH}")
        return

    sql_text = SEED_SQL_PATH.read_text(encoding="utf-8")

    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cursor:
                cursor.execute(sql_text)
        print("seed_descriptions.sql executed successfully.")
    except Exception as e:
        print("Error while running seed_descriptions.sql:\n", e)
    finally:
        conn.close()


load_data()
run_seed_descriptions()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chilli.router, tags=["chilli"])
app.mount("/chilli_images", StaticFiles(directory=str(IMAGES_DIR)), name="chilli-images")