import uuid
from datetime import date

# import psycopg2
# import psycopg2.errors

# from app.db import get_connection
from app.db2 import supabase


def create_booking(booking):
    try:
        tour_resp = supabase.table("tours").select(
            "id, capacity, date"
        ).eq("id", booking.tour_id).limit(1).execute()

        if not tour_resp.data:
            return {"error": "tour_not_found", "message": "Tour not found."}

        tour = tour_resp.data[0]

        if date.fromisoformat(str(tour["date"])) < date.today():
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

        return {
            "success": True,
            "booking_reference": booking_reference,
            "message": "Booking confirmed.",
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
