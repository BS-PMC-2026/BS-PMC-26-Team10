from fastapi import APIRouter, HTTPException

from app.models import Tour
from app.services.tour_services import (
    create_tour, get_all_tours, delete_tour, update_tour,
)

router = APIRouter()


def serialize_tours(tours):
    result = []
    for t in tours:
        capacity = int(t[7])
        booked = int(t[14]) if len(t) > 14 else 0
        remaining = max(0, capacity - booked)
        result.append({
            "id": t[0],
            "title": t[1],
            "kind": t[2],
            "description": t[3],
            "date": str(t[4]),
            "time": str(t[5]),
            "duration": t[6],
            "capacity": capacity,
            "price": float(t[8]) if t[8] is not None else 0,
            "meeting_point": t[9],
            "includes": t[10],
            "accessibility": t[11],
            "visibility": t[12],
            "created_at": str(t[13]),
            "remaining_spots": remaining,
            "is_full": remaining == 0,
            "confirmation_message": t[15] if len(t) > 15 else "",
        })
    return result


@router.get("/tours")
def list_tours():
    return serialize_tours(get_all_tours())


@router.post("/tours")
def add_tour(tour: Tour):
    tour.capacity = int(tour.capacity)
    tour.price = float(tour.price)
    response = create_tour(tour)
    return {"message": response}


@router.put("/tours/{tour_id}")
def edit_tour(tour_id: int, tour: Tour):
    tour.capacity = int(tour.capacity)
    tour.price = float(tour.price)
    response = update_tour(tour_id, tour)
    if response is None:
        raise HTTPException(status_code=404, detail="Tour not found.")
    if response is False:
        raise HTTPException(status_code=500, detail="Failed to update tour.")
    return {"message": response}


@router.delete("/tours/{tour_id}")
def remove_tour(tour_id: int):
    response = delete_tour(tour_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Tour not found.")
    if response is False:
        raise HTTPException(status_code=500, detail="Failed to delete tour.")
    return {"message": response}
