from typing import Optional

from fastapi import APIRouter, Header, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.db2 import upload_image
from app.services.admin_auth_services import get_admin_from_token
from app.services.review_services import (
    create_review,
    get_reviews,
    reply_to_review,
    verify_booking_for_review,
)

router = APIRouter()

class ReplyBody(BaseModel):
    reply: str


_ERROR_STATUS = {
    "not_found": 404,
    "booking_not_found": 404,
    "booking_cancelled": 400,
    "tour_not_found": 404,
    "tour_not_past": 400,
    "already_reviewed": 409,
    "server_error": 500,
}


@router.post("/reviews/verify")
def verify_review(
    booking_reference: str = Form(...),
    email: str = Form(...),
):
    result = verify_booking_for_review(booking_reference, email)
    if "error" in result:
        raise HTTPException(
            status_code=_ERROR_STATUS.get(result["error"], 400),
            detail=result["message"],
        )
    return result


@router.post("/reviews")
async def submit_review(
    booking_reference: str = Form(...),
    email: str = Form(...),
    rating: int = Form(...),
    comment: str = Form(""),
    photo: Optional[UploadFile] = File(None),
):
    verify_result = verify_booking_for_review(booking_reference, email)
    if "error" in verify_result:
        raise HTTPException(
            status_code=_ERROR_STATUS.get(verify_result["error"], 400),
            detail=verify_result["message"],
        )

    if not (1 <= rating <= 5):
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5.")

    photo_url = ""
    if photo and photo.filename:
        try:
            photo_url = await upload_image(photo, "tour-reviews-images")
        except Exception as e:
            print("Review photo upload failed (continuing without photo):", repr(e))

    result = create_review(
        tour_id=verify_result["tour_id"],
        tour_title=verify_result["tour_title"],
        booking_reference=booking_reference.strip().upper(),
        reviewer_name=verify_result["reviewer_name"],
        rating=rating,
        comment=comment.strip(),
        photo_url=photo_url,
    )

    if "error" in result:
        raise HTTPException(
            status_code=_ERROR_STATUS.get(result["error"], 400),
            detail=result["message"],
        )

    return result


@router.get("/reviews")
def list_reviews(tour_id: Optional[int] = None):
    return get_reviews(tour_id)


@router.patch("/reviews/{review_id}/reply")
def owner_reply(
    review_id: int,
    body: ReplyBody,
    authorization: Optional[str] = Header(None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    if not get_admin_from_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired session.")

    if not body.reply.strip():
        raise HTTPException(status_code=422, detail="Reply text cannot be empty.")

    result = reply_to_review(review_id, body.reply)
    if "error" in result:
        raise HTTPException(
            status_code=_ERROR_STATUS.get(result["error"], 400),
            detail=result["message"],
        )
    return result
