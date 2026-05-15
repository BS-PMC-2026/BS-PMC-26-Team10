import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.booking_services import cancel_booking


class BookingCancellationTests(unittest.TestCase):
    def _booking_response(self, status="confirmed"):
        return SimpleNamespace(data=[{
            "id": 10,
            "tour_id": 1,
            "email": "visitor@example.com",
            "status": status,
            "participants_count": 2,
            "booking_reference": "ABC12345",
        }])

    def _tour_response(self, date="2026-12-31"):
        return SimpleNamespace(data=[{
            "id": 1,
            "date": date,
            "time": "10:00",
            "title": "Field Walk",
        }])

    def _supabase_mock(self, booking_response, tour_response):
        booking_query = MagicMock()
        booking_query.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value = booking_response
        booking_query.update.return_value.eq.return_value.execute.return_value = SimpleNamespace(data=[{}])

        tour_query = MagicMock()
        tour_query.select.return_value.eq.return_value.limit.return_value.execute.return_value = tour_response

        supabase = MagicMock()
        supabase.table.side_effect = lambda table_name: booking_query if table_name == "bookings" else tour_query
        return supabase

    def test_cancel_booking_updates_status_and_releases_spots(self):
        supabase = self._supabase_mock(self._booking_response(), self._tour_response())

        with patch("app.services.booking_services.supabase", supabase), \
                patch("app.services.booking_services.send_tour_cancellation_confirmation", return_value=True) as email_mock:
            result = cancel_booking("abc12345", "VISITOR@example.com")

        self.assertTrue(result["success"])
        self.assertEqual(result["booking_reference"], "ABC12345")
        self.assertEqual(result["released_spots"], 2)
        self.assertTrue(result["email_sent"])
        self.assertEqual(result["confirmation_channel"], "email")

        booking_query = supabase.table("bookings")
        booking_query.update.assert_called_once_with({"status": "cancelled"})
        email_mock.assert_called_once_with(
            booking_reference="ABC12345",
            visitor_email="visitor@example.com",
            tour_title="Field Walk",
            tour_date="2026-12-31",
            tour_time="10:00",
            participants_count=2,
        )

    def test_cancel_booking_still_succeeds_when_email_fails(self):
        supabase = self._supabase_mock(self._booking_response(), self._tour_response())

        with patch("app.services.booking_services.supabase", supabase), \
                patch("app.services.booking_services.send_tour_cancellation_confirmation", return_value=False):
            result = cancel_booking("ABC12345", "visitor@example.com")

        self.assertTrue(result["success"])
        self.assertFalse(result["email_sent"])

    def test_cancel_booking_returns_not_found_for_unknown_reference(self):
        supabase = self._supabase_mock(SimpleNamespace(data=[]), self._tour_response())

        with patch("app.services.booking_services.supabase", supabase), \
                patch("app.services.booking_services.send_tour_cancellation_confirmation") as email_mock:
            result = cancel_booking("missing", "visitor@example.com")

        self.assertEqual(result["error"], "booking_not_found")
        email_mock.assert_not_called()

    def test_cancel_booking_rejects_already_cancelled_booking(self):
        supabase = self._supabase_mock(self._booking_response(status="cancelled"), self._tour_response())

        with patch("app.services.booking_services.supabase", supabase), \
                patch("app.services.booking_services.send_tour_cancellation_confirmation") as email_mock:
            result = cancel_booking("ABC12345", "visitor@example.com")

        self.assertEqual(result["error"], "already_cancelled")
        email_mock.assert_not_called()

    def test_cancel_booking_rejects_past_tour(self):
        supabase = self._supabase_mock(self._booking_response(), self._tour_response(date="2025-01-01"))

        with patch("app.services.booking_services.supabase", supabase), \
                patch("app.services.booking_services.send_tour_cancellation_confirmation") as email_mock:
            result = cancel_booking("ABC12345", "visitor@example.com")

        self.assertEqual(result["error"], "tour_started")
        email_mock.assert_not_called()


if __name__ == "__main__":
    unittest.main()
