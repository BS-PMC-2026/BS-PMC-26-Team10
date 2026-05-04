import re

from fastapi import APIRouter, HTTPException

from app.models import BookingCreate
from app.services.booking_services import create_booking, get_bookings_for_tour

router = APIRouter()

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_PHONE_RE = re.compile(r'^\d{10}$')

_ERROR_STATUS = {
    "tour_not_found": 404,
    "past_tour": 400,
    "tour_full": 400,
    "not_enough_spots": 400,
    "duplicate_booking": 409,
    "server_error": 500,
}


@router.get("/tours/{tour_id}/bookings")
def list_tour_bookings(tour_id: int):
    return get_bookings_for_tour(tour_id)


@router.post("/bookings")
def book_tour(booking: BookingCreate):
    if not _EMAIL_RE.match(booking.email):
        raise HTTPException(status_code=422, detail="Invalid email format.")
    if not _PHONE_RE.match(booking.phone):
        raise HTTPException(status_code=422, detail="Phone number must be exactly 10 digits (e.g. 0549164691).")
    if booking.participants_count <= 0:
        raise HTTPException(status_code=422, detail="Number of participants must be greater than 0.")

    result = create_booking(booking)

    if "error" in result:
        raise HTTPException(
            status_code=_ERROR_STATUS.get(result["error"], 400),
            detail=result["message"],
        )

    return result
