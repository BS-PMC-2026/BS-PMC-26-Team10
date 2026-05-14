import uuid
from datetime import date, datetime, time

# import psycopg2
# import psycopg2.errors

# from app.db import get_connection
from app.db2 import supabase
from app.services.email_service import send_tour_booking_confirmation


DEFAULT_TOUR_CONFIRMATION_MESSAGE = (
    "Your tour reservation was successful. Please keep this email and your booking "
    "reference for future changes or cancellation."
)


def _tour_has_started(tour_date, tour_time=None):
    parsed_date = date.fromisoformat(str(tour_date))
    if not tour_time:
        return parsed_date < date.today()

    parsed_time = time.fromisoformat(str(tour_time))
    return datetime.combine(parsed_date, parsed_time) <= datetime.now()


def _get_tour_for_booking(tour_id):
    try:
        return supabase.table("tours").select(
            "id, capacity, date, time, title, meeting_point, confirmation_message"
        ).eq("id", tour_id).limit(1).execute()
    except Exception as e:
        print("Could not fetch tour confirmation message, retrying without it:", repr(e))
        return supabase.table("tours").select(
            "id, capacity, date, time, title, meeting_point"
        ).eq("id", tour_id).limit(1).execute()


def create_booking(booking):
    try:
        tour_resp = _get_tour_for_booking(booking.tour_id)

        if not tour_resp.data:
            return {"error": "tour_not_found", "message": "Tour not found."}

        tour = tour_resp.data[0]

        if _tour_has_started(tour["date"]):
            return {"error": "past_tour", "message": "Cannot book a tour that has already passed."}

        bookings_resp = supabase.table("bookings").select(
            "participants_count"
        ).eq("tour_id", tour["id"]).eq("status", "confirmed").execute()

        booked = sum(b["participants_count"] for b in bookings_resp.data)
        remaining = tour["capacity"] - booked

        if booking.participants_count > remaining:
            if remaining <= 0:
                return {"error": "tour_full", "message": "Tour is full."}
            return {
                "error": "not_enough_spots",
                "message": f"Not enough spots available. Only {remaining} spot(s) remaining.",
            }

        booking_reference = uuid.uuid4().hex[:8].upper()

        supabase.table("bookings").insert({
            "tour_id": tour["id"],
            "email": booking.email.lower().strip(),
            "full_name": booking.full_name.strip(),
            "phone": booking.phone.strip(),
            "participants_count": booking.participants_count,
            "status": "confirmed",
            "booking_reference": booking_reference,
        }).execute()

        confirmation_message = tour.get("confirmation_message") or DEFAULT_TOUR_CONFIRMATION_MESSAGE
        email_sent = send_tour_booking_confirmation(
            booking_reference=booking_reference,
            visitor_name=booking.full_name.strip(),
            visitor_email=booking.email.lower().strip(),
            tour_title=tour.get("title", "ChiliLand tour"),
            tour_date=str(tour["date"]),
            tour_time=str(tour.get("time", "")),
            participants_count=booking.participants_count,
            meeting_point=tour.get("meeting_point", ""),
            confirmation_message=confirmation_message,
        )

        return {
            "success": True,
            "booking_reference": booking_reference,
            "message": "Booking confirmed.",
            "email_sent": email_sent,
            "confirmation_channel": "email",
            "confirmation_message": confirmation_message,
        }

    except Exception as e:
        error_str = str(e)
        if "duplicate" in error_str.lower() or "23505" in error_str:
            return {"error": "duplicate_booking", "message": "You have already booked this tour."}
        print("Error while creating booking:", repr(e))
        return {"error": "server_error", "message": "An unexpected error occurred. Please try again."}

    # OLD POSTGRESQL CODE
    # conn = None
    # cursor = None
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     cursor.execute("SELECT id, capacity, date FROM tours WHERE id = %s FOR UPDATE", (booking.tour_id,))
    #     tour = cursor.fetchone()
    #     if not tour:
    #         return {"error": "tour_not_found", "message": "Tour not found."}
    #     tour_id, capacity, tour_date = tour
    #     if tour_date < date.today():
    #         return {"error": "past_tour", "message": "Cannot book a tour that has already passed."}
    #     cursor.execute("""
    #         SELECT COALESCE(SUM(participants_count), 0) FROM bookings
    #         WHERE tour_id = %s AND status = 'confirmed'
    #     """, (tour_id,))
    #     booked = int(cursor.fetchone()[0])
    #     remaining = capacity - booked
    #     if booking.participants_count > remaining:
    #         if remaining <= 0:
    #             return {"error": "tour_full", "message": "Tour is full."}
    #         return {"error": "not_enough_spots",
    #                 "message": f"Not enough spots available. Only {remaining} spot(s) remaining."}
    #     booking_reference = uuid.uuid4().hex[:8].upper()
    #     cursor.execute("""
    #         INSERT INTO bookings (tour_id, email, full_name, phone, participants_count, status, booking_reference)
    #         VALUES (%s, %s, %s, %s, %s, 'confirmed', %s)
    #     """, (tour_id, booking.email.lower().strip(), booking.full_name.strip(),
    #           booking.phone.strip(), booking.participants_count, booking_reference))
    #     conn.commit()
    #     return {"success": True, "booking_reference": booking_reference, "message": "Booking confirmed."}
    # except psycopg2.errors.UniqueViolation:
    #     if conn:
    #         conn.rollback()
    #     return {"error": "duplicate_booking", "message": "You have already booked this tour."}
    # except Exception as e:
    #     print("Error while creating booking:", repr(e))
    #     if conn:
    #         conn.rollback()
    #     return {"error": "server_error", "message": "An unexpected error occurred. Please try again."}
    # finally:
    #     if cursor:
    #         cursor.close()
    #     if conn:
    #         conn.close()


def get_bookings_for_tour(tour_id):
    try:
        response = supabase.table("bookings").select(
            "full_name, phone, email, participants_count, booking_reference, created_at"
        ).eq("tour_id", tour_id).eq("status", "confirmed").order("created_at").execute()
        return [
            {
                "full_name": r["full_name"],
                "phone": r["phone"],
                "email": r["email"],
                "participants_count": r["participants_count"],
                "booking_reference": r["booking_reference"],
                "created_at": str(r["created_at"]),
            }
            for r in response.data
        ]
    except Exception as e:
        print("Error fetching bookings for tour:", repr(e))
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     cursor.execute("""
    #         SELECT full_name, phone, email, participants_count, booking_reference, created_at
    #         FROM bookings WHERE tour_id = %s AND status = 'confirmed' ORDER BY created_at ASC
    #     """, (tour_id,))
    #     rows = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return [{"full_name": r[0], "phone": r[1], "email": r[2],
    #              "participants_count": r[3], "booking_reference": r[4], "created_at": str(r[5])}
    #             for r in rows]
    # except Exception as e:
    #     print("Error fetching bookings for tour:", repr(e))
    #     return []


def cancel_booking(booking_reference, email):
    try:
        clean_reference = booking_reference.strip().upper()
        clean_email = email.lower().strip()

        booking_resp = supabase.table("bookings").select(
            "id, tour_id, email, status, participants_count, booking_reference"
        ).eq("booking_reference", clean_reference).eq("email", clean_email).limit(1).execute()

        if not booking_resp.data:
            return {"error": "booking_not_found", "message": "Booking not found."}

        booking = booking_resp.data[0]

        if booking["status"] == "cancelled":
            return {"error": "already_cancelled", "message": "This booking has already been cancelled."}

        tour_resp = supabase.table("tours").select(
            "id, date, time, title"
        ).eq("id", booking["tour_id"]).limit(1).execute()

        if not tour_resp.data:
            return {"error": "tour_not_found", "message": "Tour not found."}

        tour = tour_resp.data[0]
        if _tour_has_started(tour["date"], tour.get("time")):
            return {"error": "tour_started", "message": "Cannot cancel a booking after the tour has started."}

        supabase.table("bookings").update({
            "status": "cancelled",
        }).eq("id", booking["id"]).execute()

        return {
            "success": True,
            "message": "Booking cancelled successfully.",
            "booking_reference": clean_reference,
            "released_spots": booking["participants_count"],
            "tour_id": booking["tour_id"],
        }

    except Exception as e:
        print("Error while cancelling booking:", repr(e))
        return {"error": "server_error", "message": "An unexpected error occurred. Please try again."}
