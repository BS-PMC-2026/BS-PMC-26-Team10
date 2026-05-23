"""
Unit tests for get_bookings_for_tour — verifies that payment_status and
paypal_order_id are included in the returned rows (fixed in BSPMT10-22).
No database connection required.
"""
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.booking_services import get_bookings_for_tour


def _make_row(**kwargs):
    defaults = {
        "full_name": "Alice Cohen",
        "phone": "0521234567",
        "email": "alice@example.com",
        "participants_count": 2,
        "booking_reference": "ABC12345",
        "created_at": "2026-05-15 10:00:00",
        "payment_status": "paid",
        "paypal_order_id": "PAYPAL_ORDER_123",
    }
    defaults.update(kwargs)
    return defaults


def _supabase_mock(rows):
    query = MagicMock()
    (query.select.return_value
          .eq.return_value
          .eq.return_value
          .order.return_value
          .execute.return_value) = SimpleNamespace(data=rows)
    supabase = MagicMock()
    supabase.table.return_value = query
    return supabase


class GetBookingsForTourFieldTests(unittest.TestCase):
    def test_returns_list(self):
        supabase = _supabase_mock([_make_row()])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 1)

    def test_payment_status_present_and_correct(self):
        supabase = _supabase_mock([_make_row(payment_status="paid")])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertIn("payment_status", result[0])
        self.assertEqual(result[0]["payment_status"], "paid")

    def test_free_payment_status_preserved(self):
        supabase = _supabase_mock([_make_row(payment_status="free", paypal_order_id=None)])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertEqual(result[0]["payment_status"], "free")

    def test_paypal_order_id_present_and_correct(self):
        supabase = _supabase_mock([_make_row(paypal_order_id="PAYPAL_ORDER_123")])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertIn("paypal_order_id", result[0])
        self.assertEqual(result[0]["paypal_order_id"], "PAYPAL_ORDER_123")

    def test_paypal_order_id_is_none_for_free_booking(self):
        supabase = _supabase_mock([_make_row(payment_status="free", paypal_order_id=None)])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertIsNone(result[0]["paypal_order_id"])

    def test_payment_status_defaults_to_free_when_field_missing(self):
        """Rows in older DB snapshots may lack payment_status; must fall back to 'free'."""
        row = _make_row()
        del row["payment_status"]
        supabase = _supabase_mock([row])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertEqual(result[0]["payment_status"], "free")

    def test_paypal_order_id_defaults_to_none_when_field_missing(self):
        row = _make_row()
        del row["paypal_order_id"]
        supabase = _supabase_mock([row])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertIsNone(result[0]["paypal_order_id"])

    def test_all_required_fields_present(self):
        supabase = _supabase_mock([_make_row()])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        required = {
            "full_name", "phone", "email", "participants_count",
            "booking_reference", "created_at", "payment_status", "paypal_order_id",
        }
        self.assertTrue(required.issubset(result[0].keys()))

    def test_returns_empty_list_when_no_bookings(self):
        supabase = _supabase_mock([])
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertEqual(result, [])

    def test_returns_empty_list_on_db_exception(self):
        supabase = MagicMock()
        supabase.table.side_effect = Exception("DB unavailable")
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertEqual(result, [])

    def test_multiple_bookings_all_have_payment_status(self):
        rows = [
            _make_row(full_name="Alice", payment_status="paid", paypal_order_id="PP_1"),
            _make_row(full_name="Bob", payment_status="free", paypal_order_id=None),
            _make_row(full_name="Carol", payment_status="paid", paypal_order_id="PP_2"),
        ]
        supabase = _supabase_mock(rows)
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        self.assertEqual(len(result), 3)
        statuses = [r["payment_status"] for r in result]
        self.assertEqual(statuses, ["paid", "free", "paid"])

    def test_paid_count_derivable_from_response(self):
        rows = [
            _make_row(payment_status="paid"),
            _make_row(payment_status="paid"),
            _make_row(payment_status="free"),
        ]
        supabase = _supabase_mock(rows)
        with patch("app.services.booking_services.supabase", supabase):
            result = get_bookings_for_tour(1)
        paid = sum(1 for r in result if r["payment_status"] == "paid")
        self.assertEqual(paid, 2)


if __name__ == "__main__":
    unittest.main()
