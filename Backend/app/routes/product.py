from datetime import date, datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from app.models import Product
from app.services.product_services import (
    create_product,
    get_all_products,
    delete_product,
    update_product
)

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PRODUCT_IMAGES_DIR = PROJECT_ROOT / "product_images"
PRODUCT_IMAGE_PREFIX = "../product_images/"
DEFAULT_PRODUCT_IMAGE_EXTENSION = ".jpg"


def parse_restock_date(value):
    if value in (None, ""):
        return None

    if isinstance(value, date):
        return value

    cleaned = str(value).strip()
    if not cleaned:
        return None

    try:
        return date.fromisoformat(cleaned)
    except ValueError:
        pass

    for date_format in ("%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%m-%d-%Y"):
        try:
            return datetime.strptime(cleaned, date_format).date()
        except ValueError:
            continue

    raise HTTPException(
        status_code=400,
        detail="Invalid restock_date. Use YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, or MM-DD-YYYY.",
    )


def normalize_product_image_url(image_name: str) -> str:
    cleaned_name = str(image_name).strip().lower()
    if not cleaned_name:
        raise HTTPException(status_code=400, detail="Product image name is required.")

    for extension in (".jpg", ".jpeg"):
        if (PRODUCT_IMAGES_DIR / f"{cleaned_name}{extension}").exists():
            return f"{PRODUCT_IMAGE_PREFIX}{cleaned_name}{extension}"

    return f"{PRODUCT_IMAGE_PREFIX}{cleaned_name}{DEFAULT_PRODUCT_IMAGE_EXTENSION}"


def build_public_product_image_url(request: Request, image_url: str) -> str:
    cleaned = (image_url or "").strip()
    if not cleaned:
        return ""
    if "://" in cleaned:
        return cleaned

    public_path = cleaned.removeprefix("../")
    return str(request.base_url).rstrip("/") + f"/{public_path}"


def serialize_products(products, request: Request):
    return [
        {
            "id": product[0],
            "name": product[1],
            "description": product[2],
            "quantity": product[3],
            "last_updated": product[4],
            "restock_date": product[5],
            "price": float(product[6]) if product[6] is not None else None,
            "image_url": build_public_product_image_url(request, product[7] or ""),
        }
        for product in products
    ]


@router.get("/inventory")
def list_inventory(request: Request):
    products = get_all_products()
    return serialize_products(products, request)
    
@router.get("/inventory/{product_id}")
def get_single_product(product_id: int, request: Request):
    from app.services.product_services import get_product_by_id
    product = get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    return serialize_products([product], request)[0]

@router.post("/inventory/add")
def add_product(product: Product):
    product.quantity = int(product.quantity)
    product.price = float(product.price)
    product.restock_date = parse_restock_date(product.restock_date)
    product.image_url = normalize_product_image_url(product.image_url or product.name)
    response = create_product(product)

    return {
        "message": response
    }


@router.put("/inventory/{product_id}")
def edit_product(product_id: int, product: Product):
    product.quantity = int(product.quantity)
    product.price = float(product.price)
    product.restock_date = parse_restock_date(product.restock_date)
    product.image_url = normalize_product_image_url(product.image_url or product.name)

    response = update_product(product_id, product)

    if response is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    if response is False:
        raise HTTPException(status_code=500, detail="Failed to update product.")

    return {
        "message": response
    }


@router.delete("/inventory/{product_id}")
def remove_product(product_id: int):
    response = delete_product(product_id)

    if response is None:
        raise HTTPException(status_code=404, detail="Product not found.")

    if response is False:
        raise HTTPException(status_code=500, detail="Failed to delete product.")

    return {
        "message": response
    }