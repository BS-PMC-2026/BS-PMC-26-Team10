from fastapi import APIRouter
from pydantic import BaseModel
from app.services.email_service import send_contact_inquiry

router = APIRouter()


class ContactRequest(BaseModel):
    name: str
    phone: str
    email: str
    message: str


@router.post("/contact")
def submit_contact(data: ContactRequest):
    send_contact_inquiry(
        name=data.name,
        phone=data.phone,
        email=data.email,
        message=data.message,
    )
    return {"success": True}
