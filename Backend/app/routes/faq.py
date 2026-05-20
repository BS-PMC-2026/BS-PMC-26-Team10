from fastapi import APIRouter

from app.services.faq_services import get_active_faq_items

router = APIRouter()


@router.get("/faq")
def list_faq_items():
    return get_active_faq_items()
