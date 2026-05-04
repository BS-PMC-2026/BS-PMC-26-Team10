from app.db import get_connection


def create_tour(tour):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
        INSERT INTO tours (title, kind, description, date, time, duration,
                           capacity, price, meeting_point, includes, accessibility, visibility)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            tour.title, tour.kind, tour.description, tour.date, tour.time,
            tour.duration, tour.capacity, tour.price, tour.meeting_point,
            tour.includes, tour.accessibility, tour.visibility,
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return "Tour has been created!"
    except Exception as e:
        print("Error while trying to create new tour in db\n", e)
        return "Tour has not been created"


def get_all_tours():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
        SELECT t.id, t.title, t.kind, t.description, t.date, t.time, t.duration,
               t.capacity, t.price, t.meeting_point, t.includes, t.accessibility,
               t.visibility, t.created_at,
               COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.participants_count ELSE 0 END), 0) AS booked_count
        FROM tours t
        LEFT JOIN bookings b ON b.tour_id = t.id
        GROUP BY t.id
        ORDER BY t.date ASC, t.time ASC
        """
        cursor.execute(query)
        tours = cursor.fetchall()
        cursor.close()
        conn.close()
        return tours
    except Exception as e:
        print("Error while trying to fetch tours from db\n", e)
        return []


def delete_tour(tour_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM tours WHERE id = %s", (tour_id,))
        conn.commit()
        deleted_rows = cursor.rowcount
        cursor.close()
        conn.close()
        return None if deleted_rows == 0 else "Tour deleted successfully!"
    except Exception as e:
        print("Error while trying to delete tour from db\n", e)
        return False


def update_tour(tour_id, tour):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
        UPDATE tours
        SET title=%s, kind=%s, description=%s, date=%s, time=%s, duration=%s,
            capacity=%s, price=%s, meeting_point=%s, includes=%s, accessibility=%s, visibility=%s
        WHERE id=%s
        """
        cursor.execute(query, (
            tour.title, tour.kind, tour.description, tour.date, tour.time,
            tour.duration, tour.capacity, tour.price, tour.meeting_point,
            tour.includes, tour.accessibility, tour.visibility, tour_id,
        ))
        conn.commit()
        updated_rows = cursor.rowcount
        cursor.close()
        conn.close()
        return None if updated_rows == 0 else "Tour updated successfully!"
    except Exception as e:
        print("Error while trying to update tour in db\n", e)
        return False
