from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routes import chilli

app = FastAPI()
PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = PROJECT_ROOT / 'chilli_images'

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chilli.router, prefix="/chilli", tags=["chilli"])
app.mount('/chilli_images', StaticFiles(directory=str(IMAGES_DIR)), name='chilli-images')