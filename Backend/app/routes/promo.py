from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.promo_services import validate_promo_code, create_promo_code, get_all_promo_codes, update_promo_code, delete_promo_code

router = APIRouter(prefix="/promo")


class ValidatePromoRequest(BaseModel):
    code: str
    order_amount: float


class CreatePromoRequest(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_order_amount: Optional[float] = None
    max_uses: Optional[int] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    is_active: bool = True


@router.post("/validate")
def validate_promo(req: ValidatePromoRequest):
    return validate_promo_code(req.code, req.order_amount)


@router.post("/codes")
def create_code(req: CreatePromoRequest):
    result = create_promo_code(req.model_dump())
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to create promo code.")
    return {"message": result}


@router.get("/codes")
def list_codes():
    return get_all_promo_codes()


@router.put("/codes/{code_id}")
def update_code(code_id: int, req: CreatePromoRequest):
    result = update_promo_code(code_id, req.model_dump())
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to update promo code.")
    return {"message": result}


@router.delete("/codes/{code_id}")
def delete_code(code_id: int):
    success = delete_promo_code(code_id)
    if not success:
        raise HTTPException(status_code=404, detail="Promo code not found.")
    return {"message": "Promo code deleted."}
