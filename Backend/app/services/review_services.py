from datetime import date

from app.db2 import supabase


def verify_booking_for_review(booking_reference: str, email: str):
    clean_ref = booking_reference.strip().upper()
    clean_email = email.lower().strip()

    booking_resp = supabase.table("bookings").select(
        "booking_reference, tour_id, full_name, status"
    ).eq("booking_reference", clean_ref).eq("email", clean_email).limit(1).execute()

    if not booking_resp.data:
        return {"error": "booking_not_found", "message": "No booking found with this reference and email."}

    booking = booking_resp.data[0]

    if booking["status"] != "confirmed":
        return {"error": "booking_cancelled", "message": "This booking was cancelled and is not eligible for a review."}

    tour_resp = supabase.table("tours").select(
        "id, title, date"
    ).eq("id", booking["tour_id"]).limit(1).execute()

    if not tour_resp.data:
        return {"error": "tour_not_found", "message": "Tour not found."}

    tour = tour_resp.data[0]
    tour_date = date.fromisoformat(str(tour["date"]))

    if tour_date >= date.today():
        return {
            "error": "tour_not_past",
            "message": "The tour has not taken place yet. You can leave a review after the tour date.",
        }

    existing = supabase.table("tour_reviews").select("id").eq(
        "booking_reference", clean_ref
    ).limit(1).execute()

    if existing.data:
        return {"error": "already_reviewed", "message": "You have already submitted a review for this booking."}

    return {
        "success": True,
        "reviewer_name": booking["full_name"],
        "tour_id": tour["id"],
        "tour_title": tour["title"],
        "booking_reference": clean_ref,
    }


def create_review(
    tour_id: int,
    tour_title: str,
    booking_reference: str,
    reviewer_name: str,
    rating: int,
    comment: str = "",
    photo_url: str = "",
):
    try:
        supabase.table("tour_reviews").insert({
            "tour_id": tour_id,
            "tour_title": tour_title,
            "booking_reference": booking_reference.upper(),
            "reviewer_name": reviewer_name,
            "rating": rating,
            "comment": comment,
            "photo_url": photo_url,
        }).execute()
        return {"success": True, "message": "Review submitted successfully."}
    except Exception as e:
        err = str(e)
        if "duplicate" in err.lower() or "23505" in err:
            return {"error": "already_reviewed", "message": "A review has already been submitted for this booking."}
        print("Error creating review:", repr(e))
        return {"error": "server_error", "message": "An unexpected error occurred. Please try again."}


def get_reviews(tour_id: int = None):
    try:
        query = supabase.table("tour_reviews").select(
            "id, tour_id, tour_title, reviewer_name, rating, comment, photo_url, created_at"
        ).order("created_at", desc=True)
        if tour_id is not None:
            query = query.eq("tour_id", tour_id)
        resp = query.execute()
        return resp.data or []
    except Exception as e:
        print("Error fetching reviews:", repr(e))
        return []
