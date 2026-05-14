# from app.db import get_connection
from app.db2 import supabase


def _tour_payload(tour, include_confirmation=True):
    payload = {
        "title": tour.title,
        "kind": tour.kind,
        "description": tour.description,
        "date": str(tour.date),
        "time": str(tour.time),
        "duration": tour.duration,
        "capacity": tour.capacity,
        "price": tour.price,
        "meeting_point": tour.meeting_point,
        "includes": tour.includes,
        "accessibility": tour.accessibility,
        "visibility": tour.visibility,
    }
    if include_confirmation:
        payload["confirmation_message"] = tour.confirmation_message
    return payload


def create_tour(tour):
    try:
        try:
            supabase.table("tours").insert(_tour_payload(tour)).execute()
        except Exception as e:
            print("Could not save tour confirmation message, retrying without it:\n", e)
            supabase.table("tours").insert(_tour_payload(tour, include_confirmation=False)).execute()
        return "Tour has been created!"
    except Exception as e:
        print("Error while trying to create new tour in db\n", e)
        return "Tour has not been created"

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     INSERT INTO tours (title, kind, description, date, time, duration,
    #                        capacity, price, meeting_point, includes, accessibility, visibility)
    #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    #     """
    #     cursor.execute(query, (
    #         tour.title, tour.kind, tour.description, tour.date, tour.time,
    #         tour.duration, tour.capacity, tour.price, tour.meeting_point,
    #         tour.includes, tour.accessibility, tour.visibility,
    #     ))
    #     conn.commit()
    #     cursor.close()
    #     conn.close()
    #     return "Tour has been created!"
    # except Exception as e:
    #     print("Error while trying to create new tour in db\n", e)
    #     return "Tour has not been created"


def get_all_tours():
    try:
        tours_resp = supabase.table("tours").select(
            "id, title, kind, description, date, time, duration, capacity, price, "
            "meeting_point, includes, accessibility, visibility, created_at, confirmation_message"
        ).order("date").order("time").execute()

        bookings_resp = supabase.table("bookings").select(
            "tour_id, participants_count"
        ).eq("status", "confirmed").execute()

        booked_map = {}
        for b in bookings_resp.data:
            tid = b["tour_id"]
            booked_map[tid] = booked_map.get(tid, 0) + b["participants_count"]

        return [
            (t["id"], t["title"], t["kind"], t["description"], t["date"], t["time"],
             t["duration"], t["capacity"], t["price"], t["meeting_point"],
             t["includes"], t["accessibility"], t["visibility"], t["created_at"],
             booked_map.get(t["id"], 0), t.get("confirmation_message", ""))
            for t in tours_resp.data
        ]
    except Exception as e:
        print("Error while trying to fetch tours from db\n", e)
        return []

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     SELECT t.id, t.title, t.kind, t.description, t.date, t.time, t.duration,
    #            t.capacity, t.price, t.meeting_point, t.includes, t.accessibility,
    #            t.visibility, t.created_at,
    #            COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.participants_count ELSE 0 END), 0) AS booked_count
    #     FROM tours t
    #     LEFT JOIN bookings b ON b.tour_id = t.id
    #     GROUP BY t.id
    #     ORDER BY t.date ASC, t.time ASC
    #     """
    #     cursor.execute(query)
    #     tours = cursor.fetchall()
    #     cursor.close()
    #     conn.close()
    #     return tours
    # except Exception as e:
    #     print("Error while trying to fetch tours from db\n", e)
    #     return []


def delete_tour(tour_id):
    try:
        response = supabase.table("tours").delete().eq("id", tour_id).execute()
        return None if not response.data else "Tour deleted successfully!"
    except Exception as e:
        print("Error while trying to delete tour from db\n", e)
        return False

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     cursor.execute("DELETE FROM tours WHERE id = %s", (tour_id,))
    #     conn.commit()
    #     deleted_rows = cursor.rowcount
    #     cursor.close()
    #     conn.close()
    #     return None if deleted_rows == 0 else "Tour deleted successfully!"
    # except Exception as e:
    #     print("Error while trying to delete tour from db\n", e)
    #     return False


def update_tour(tour_id, tour):
    try:
        try:
            response = supabase.table("tours").update(_tour_payload(tour)).eq("id", tour_id).execute()
        except Exception as e:
            print("Could not update tour confirmation message, retrying without it:\n", e)
            response = supabase.table("tours").update(
                _tour_payload(tour, include_confirmation=False)
            ).eq("id", tour_id).execute()
        return None if not response.data else "Tour updated successfully!"
    except Exception as e:
        print("Error while trying to update tour in db\n", e)
        return False

    # OLD POSTGRESQL CODE
    # try:
    #     conn = get_connection()
    #     cursor = conn.cursor()
    #     query = """
    #     UPDATE tours
    #     SET title=%s, kind=%s, description=%s, date=%s, time=%s, duration=%s,
    #         capacity=%s, price=%s, meeting_point=%s, includes=%s, accessibility=%s, visibility=%s
    #     WHERE id=%s
    #     """
    #     cursor.execute(query, (
    #         tour.title, tour.kind, tour.description, tour.date, tour.time,
    #         tour.duration, tour.capacity, tour.price, tour.meeting_point,
    #         tour.includes, tour.accessibility, tour.visibility, tour_id,
    #     ))
    #     conn.commit()
    #     updated_rows = cursor.rowcount
    #     cursor.close()
    #     conn.close()
    #     return None if updated_rows == 0 else "Tour updated successfully!"
    # except Exception as e:
    #     print("Error while trying to update tour in db\n", e)
    #     return False
