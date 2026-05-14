import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.models import BookingCreate
from app.services.booking_services import create_booking


class BookingConfirmationEmailTests(unittest.TestCase):
    def _booking(self):
        return BookingCreate(
            tour_id=1,
            email="visitor@example.com",
            full_name="Jane Smith",
            phone="0549164691",
            participants_count=2,
        )

    def _tour_response(self):
        return SimpleNamespace(data=[{
            "id": 1,
            "capacity": 12,
            "date": "2026-12-31",
            "time": "10:00",
            "title": "Field Walk",
            "meeting_point": "Main gate",
            "confirmation_message": "Bring your booking reference with you.",
        }])

    def _supabase_mock(self):
        bookings_query = MagicMock()
        bookings_query.select.return_value.eq.return_value.eq.return_value.execute.return_value = SimpleNamespace(data=[])
        bookings_query.insert.return_value.execute.return_value = SimpleNamespace(data=[{}])

        supabase = MagicMock()
        supabase.table.return_value = bookings_query
        return supabase

    def test_successful_booking_sends_tour_confirmation_email(self):
        with patch("app.services.booking_services._get_tour_for_booking", return_value=self._tour_response()), \
             patch("app.services.booking_services.supabase", self._supabase_mock()), \
             patch("app.services.booking_services.send_tour_booking_confirmation", return_value=True) as send_email:

            result = create_booking(self._booking())

        self.assertTrue(result["success"])
        self.assertTrue(result["email_sent"])
        self.assertEqual(result["confirmation_channel"], "email")
        self.assertEqual(result["confirmation_message"], "Bring your booking reference with you.")
        send_email.assert_called_once()

    def test_booking_stays_successful_when_confirmation_email_fails(self):
        with patch("app.services.booking_services._get_tour_for_booking", return_value=self._tour_response()), \
             patch("app.services.booking_services.supabase", self._supabase_mock()), \
             patch("app.services.booking_services.send_tour_booking_confirmation", return_value=False):

            result = create_booking(self._booking())

        self.assertTrue(result["success"])
        self.assertFalse(result["email_sent"])


if __name__ == "__main__":
    unittest.main()
