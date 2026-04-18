from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional
from app.models import Chilli
from app.services.chilli_services import create_chilli, filter_chillies, get_all_chillies, search_chillies

router = APIRouter()

DEFAULT_IMAGE_URL = "../chilli_images/default.jpg"
IMAGE_URL_PREFIX = "../chilli_images/"


def normalize_image_url(image_url: str) -> str:
    cleaned = image_url.strip()
    if not cleaned:
        return DEFAULT_IMAGE_URL
    if "://" in cleaned or cleaned.startswith("../") or cleaned.startswith("/"):
        return cleaned
    return f"{IMAGE_URL_PREFIX}{cleaned}"


def build_public_image_url(request: Request, image_url: str) -> str:
    normalized = normalize_image_url(image_url)
    if "://" in normalized:
        return normalized

    public_path = normalized.removeprefix("../")
    return str(request.base_url).rstrip("/") + f"/{public_path}"


def serialize_chillies(chillies, request: Request):
    return [
        {
            "id": chilli[0],
            "name": chilli[1],
            "description": chilli[2],
            "image_url": build_public_image_url(request, chilli[3] or ""),
            "shu_min": chilli[4],
            "shu_max": chilli[5],
            "origin": chilli[6],
            "color": chilli[7],
            "is_available": chilli[8],
            "stock_quantity": chilli[9],
            "season": chilli[10],
            "full_description": chilli[11],
        }
        for chilli in chillies
    ]


@router.post("/chillies")
def add_chilli(chilli: Chilli):
    chilli.shuMin = int(chilli.shuMin)
    chilli.shuMax = int(chilli.shuMax)
    chilli.image_url = normalize_image_url(chilli.image_url)
    is_available = True
    stock_quantity = 20

    response = create_chilli(chilli, is_available, stock_quantity)

    return {
        "message": response
    }


@router.get("/chillies")
def list_chillies(
    request: Request,
    shu_min: Optional[int] = Query(default=None, ge=0),
    shu_max: Optional[int] = Query(default=None, ge=0),
    origin: Optional[str] = Query(default=None)
):
    if shu_min is not None and shu_max is not None and shu_min > shu_max:
        raise HTTPException(status_code=400, detail="shu_min cannot be greater than shu_max")

    if shu_min is None and shu_max is None and not origin:
        chillies = get_all_chillies()
    else:
        chillies = filter_chillies(shu_min, shu_max, origin.strip() if origin else None)

    return serialize_chillies(chillies, request)


@router.get("/chillies/search")
def search(q: str, request: Request):
    if not q or len(q.strip()) == 0:
        return []

    chillies = search_chillies(q)

    return serialize_chillies(chillies, request)