from fastapi import APIRouter, Request
from app.models import Chilli
from app.services.chilli_services import create_chilli, get_all_chillies, search_chillies



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

@router.post('/chillies')
def add_chilli(chilli : Chilli):
    chilli.shuMin = int(chilli.shuMin)
    chilli.shuMax = int(chilli.shuMax)
    chilli.image_url = normalize_image_url(chilli.image_url)
    is_available = True
    stock_quantity = 20

    response = create_chilli(chilli, is_available, stock_quantity)

    return {
        'message' : response
    }


@router.get('/chillies')
def list_chillies(request: Request):
    chillies = get_all_chillies()

    return [
        {
            'name': chilli[0],
            'description': chilli[1],
            'image_url': build_public_image_url(request, chilli[2] or ''),
            'shu_min': chilli[3],
            'shu_max': chilli[4],
            'origin': chilli[5],
            'color': chilli[6],
            'is_available': chilli[7],
            'stock_quantity': chilli[8],
            'season': chilli[9],
        }
        for chilli in chillies
    ]


@router.get('/chillies/search')
def search(q: str, request: Request):
    """
    Search for peppers by name or description.
    Query parameter: q (the search string)
    Example: /chillies/search?q=habanero
    """
    if not q or len(q.strip()) == 0:
        return []
    
    chillies = search_chillies(q)

    return [
        {
            'name': chilli[0],
            'description': chilli[1],
            'image_url': build_public_image_url(request, chilli[2] or ''),
            'shu_min': chilli[3],
            'shu_max': chilli[4],
            'origin': chilli[5],
            'color': chilli[6],
            'is_available': chilli[7],
            'stock_quantity': chilli[8],
            'season': chilli[9],
        }
        for chilli in chillies
    ]