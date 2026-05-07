import unittest
from unittest.mock import patch, MagicMock
from app.services.promo_services import (
    _parse_ts,
    validate_promo_code,
    create_promo_code,
    get_all_promo_codes,
    update_promo_code,
    delete_promo_code,
    increment_promo_usage,
)
from datetime import datetime, timezone, timedelta


class ParseTimestampTests(unittest.TestCase):
    def test_none_returns_none(self):
        self.assertIsNone(_parse_ts(None))

    def test_empty_string_returns_none(self):
        self.assertIsNone(_parse_ts(""))

    def test_z_suffix_parsed(self):
        dt = _parse_ts("2025-01-01T00:00:00Z")
        self.assertIsNotNone(dt)
        self.assertEqual(dt.tzinfo, timezone.utc)

    def test_offset_string_parsed(self):
        dt = _parse_ts("2025-06-15T12:00:00+00:00")
        self.assertIsNotNone(dt)

    def test_naive_datetime_gets_utc(self):
        dt = _parse_ts("2025-01-01T00:00:00")
        self.assertIsNotNone(dt)
        self.assertEqual(dt.tzinfo, timezone.utc)

    def test_invalid_string_returns_none(self):
        self.assertIsNone(_parse_ts("not-a-date"))


def _make_promo(**overrides):
    base = {
        "code": "TEST10",
        "is_active": True,
        "valid_from": None,
        "valid_until": None,
        "max_uses": None,
        "used_count": 0,
        "min_order_amount": None,
        "discount_type": "percent",
        "discount_value": 10.0,
    }
    base.update(overrides)
    return base


class ValidatePromoCodeTests(unittest.TestCase):
    def _mock_response(self, promo_row=None):
        mock_resp = MagicMock()
        mock_resp.data = [promo_row] if promo_row else []
        return mock_resp

    @patch("app.services.promo_services.supabase")
    def test_code_not_found(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response()
        result = validate_promo_code("NOPE", 100.0)
        self.assertFalse(result["valid"])
        self.assertIn("not found", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_inactive_code(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(is_active=False))
        result = validate_promo_code("TEST10", 100.0)
        self.assertFalse(result["valid"])
        self.assertIn("no longer active", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_code_not_yet_valid(self, mock_sb):
        future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(valid_from=future))
        result = validate_promo_code("TEST10", 100.0)
        self.assertFalse(result["valid"])
        self.assertIn("not yet valid", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_code_expired(self, mock_sb):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(valid_until=past))
        result = validate_promo_code("TEST10", 100.0)
        self.assertFalse(result["valid"])
        self.assertIn("expired", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_max_uses_reached(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(max_uses=5, used_count=5))
        result = validate_promo_code("TEST10", 100.0)
        self.assertFalse(result["valid"])
        self.assertIn("maximum", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_min_order_not_met(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(min_order_amount=200.0))
        result = validate_promo_code("TEST10", 50.0)
        self.assertFalse(result["valid"])
        self.assertIn("minimum order", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_percent_discount_calculated(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo())
        result = validate_promo_code("TEST10", 100.0)
        self.assertTrue(result["valid"])
        self.assertEqual(result["discount_amount"], 10.0)
        self.assertIn("10%", result["message"])

    @patch("app.services.promo_services.supabase")
    def test_fixed_discount_calculated(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(discount_type="fixed", discount_value=15.0))
        result = validate_promo_code("TEST10", 100.0)
        self.assertTrue(result["valid"])
        self.assertEqual(result["discount_amount"], 15.0)

    @patch("app.services.promo_services.supabase")
    def test_fixed_discount_capped_at_order_amount(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = self._mock_response(_make_promo(discount_type="fixed", discount_value=200.0))
        result = validate_promo_code("TEST10", 50.0)
        self.assertTrue(result["valid"])
        self.assertEqual(result["discount_amount"], 50.0)

    @patch("app.services.promo_services.supabase")
    def test_exception_returns_invalid(self, mock_sb):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.side_effect = Exception("DB error")
        result = validate_promo_code("TEST10", 100.0)
        self.assertFalse(result["valid"])


class UpdatePromoCodeTests(unittest.TestCase):
    @patch("app.services.promo_services.supabase")
    def test_update_returns_success_message(self, mock_sb):
        mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        result = update_promo_code(1, {
            "code": "NEW10", "discount_type": "percent", "discount_value": 10.0,
            "min_order_amount": None, "max_uses": None,
            "valid_from": None, "valid_until": None, "is_active": True,
        })
        self.assertEqual(result, "Promo code updated successfully!")

    @patch("app.services.promo_services.supabase")
    def test_update_upcases_code(self, mock_sb):
        captured = {}
        def capture_update(data):
            captured["data"] = data
            m = MagicMock()
            m.eq.return_value.execute.return_value = MagicMock()
            return m
        mock_sb.table.return_value.update.side_effect = capture_update
        update_promo_code(1, {
            "code": "lowercase", "discount_type": "fixed", "discount_value": 5.0,
            "min_order_amount": None, "max_uses": None,
            "valid_from": None, "valid_until": None, "is_active": True,
        })
        self.assertEqual(captured["data"]["code"], "LOWERCASE")

    @patch("app.services.promo_services.supabase")
    def test_update_returns_none_on_exception(self, mock_sb):
        mock_sb.table.return_value.update.side_effect = Exception("DB error")
        result = update_promo_code(1, {
            "code": "X", "discount_type": "percent", "discount_value": 10.0,
            "min_order_amount": None, "max_uses": None,
            "valid_from": None, "valid_until": None, "is_active": True,
        })
        self.assertIsNone(result)


class DeletePromoCodeTests(unittest.TestCase):
    def _mock_select_chain(self, mock_sb, data):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = data

    @patch("app.services.promo_services.supabase")
    def test_delete_existing_code_returns_true(self, mock_sb):
        self._mock_select_chain(mock_sb, [{"id": 1}])
        mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        result = delete_promo_code(1)
        self.assertTrue(result)

    @patch("app.services.promo_services.supabase")
    def test_delete_nonexistent_code_returns_none(self, mock_sb):
        self._mock_select_chain(mock_sb, [])
        result = delete_promo_code(99)
        self.assertIsNone(result)

    @patch("app.services.promo_services.supabase")
    def test_delete_returns_false_on_exception(self, mock_sb):
        mock_sb.table.return_value.select.side_effect = Exception("DB error")
        result = delete_promo_code(1)
        self.assertFalse(result)

    @patch("app.services.promo_services.supabase")
    def test_delete_calls_delete_with_correct_id(self, mock_sb):
        self._mock_select_chain(mock_sb, [{"id": 5}])
        mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value = MagicMock()
        delete_promo_code(5)
        mock_sb.table.return_value.delete.return_value.eq.assert_called_once_with("id", 5)


if __name__ == "__main__":
    unittest.main()
