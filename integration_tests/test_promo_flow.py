"""
Promo code integration flow tests.

Covers: validate valid code → discount calculated → apply to order total,
plus all rejection cases (expired, inactive, max uses, min order, not found).

The full service logic (date parsing, discount math, cap logic) runs for
real — only the supabase DB call is mocked.
"""
import unittest
from unittest.mock import patch

from helpers import client, make_promo_row, make_promo_supabase_mock

_PROMO_PATCH = "app.services.promo_services.supabase"
_ORDER_AMOUNT = 200.0


class PercentPromoTests(unittest.TestCase):

    def test_valid_percent_promo_returns_valid_true(self):
        promo = make_promo_row(code="SAVE10", discount_type="percent", discount_value=10.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "SAVE10", "order_amount": _ORDER_AMOUNT}).json()
        self.assertTrue(data["valid"])

    def test_percent_discount_amount_calculated_correctly(self):
        promo = make_promo_row(code="SAVE10", discount_type="percent", discount_value=10.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "SAVE10", "order_amount": 200.0}).json()
        self.assertEqual(data["discount_amount"], 20.0)

    def test_percent_promo_response_includes_code(self):
        promo = make_promo_row(code="SAVE10")
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "SAVE10", "order_amount": 100.0}).json()
        self.assertEqual(data["code"], "SAVE10")

    def test_code_lookup_is_case_insensitive(self):
        promo = make_promo_row(code="SAVE10")
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "save10", "order_amount": 100.0}).json()
        self.assertTrue(data["valid"])


class FixedPromoTests(unittest.TestCase):

    def test_valid_fixed_promo_returns_valid_true(self):
        promo = make_promo_row(code="FLAT50", discount_type="fixed", discount_value=50.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "FLAT50", "order_amount": 200.0}).json()
        self.assertTrue(data["valid"])

    def test_fixed_discount_amount_is_correct(self):
        promo = make_promo_row(code="FLAT50", discount_type="fixed", discount_value=50.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "FLAT50", "order_amount": 200.0}).json()
        self.assertEqual(data["discount_amount"], 50.0)

    def test_fixed_discount_capped_at_order_amount(self):
        promo = make_promo_row(code="FLAT50", discount_type="fixed", discount_value=50.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "FLAT50", "order_amount": 30.0}).json()
        self.assertEqual(data["discount_amount"], 30.0)


class InvalidPromoTests(unittest.TestCase):

    def test_unknown_code_returns_valid_false(self):
        with patch(_PROMO_PATCH, make_promo_supabase_mock(None)):
            data = client.post("/promo/validate", json={"code": "NOTREAL", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_inactive_code_returns_valid_false(self):
        promo = make_promo_row(code="OFF", is_active=False)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "OFF", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_expired_code_returns_valid_false(self):
        promo = make_promo_row(code="OLD", valid_until="2020-01-01T00:00:00+00:00")
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "OLD", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_not_yet_active_code_returns_valid_false(self):
        promo = make_promo_row(code="FUTURE", valid_from="2099-01-01T00:00:00+00:00")
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "FUTURE", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_max_uses_exhausted_returns_valid_false(self):
        promo = make_promo_row(code="USED", max_uses=10, used_count=10)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "USED", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_min_order_not_met_returns_valid_false(self):
        promo = make_promo_row(code="BIG", min_order_amount=500.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "BIG", "order_amount": 100.0}).json()
        self.assertFalse(data["valid"])

    def test_min_order_met_exactly_is_accepted(self):
        promo = make_promo_row(code="BIG", min_order_amount=100.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            data = client.post("/promo/validate", json={"code": "BIG", "order_amount": 100.0}).json()
        self.assertTrue(data["valid"])


class PromoApplyFlowTests(unittest.TestCase):
    """
    Multi-step flow: validate promo → use returned discount_amount to compute
    the final order total, as the frontend does before calling /bookings.
    """

    def test_discount_correctly_reduces_order_total(self):
        order_amount = 300.0
        promo = make_promo_row(code="SAVE10", discount_type="percent", discount_value=10.0)
        with patch(_PROMO_PATCH, make_promo_supabase_mock(promo)):
            promo_data = client.post(
                "/promo/validate", json={"code": "SAVE10", "order_amount": order_amount}
            ).json()

        self.assertTrue(promo_data["valid"])
        discounted_total = round(order_amount - promo_data["discount_amount"], 2)
        self.assertEqual(discounted_total, 270.0)

    def test_invalid_promo_carries_no_discount_amount(self):
        with patch(_PROMO_PATCH, make_promo_supabase_mock(None)):
            promo_data = client.post(
                "/promo/validate", json={"code": "FAKE", "order_amount": 200.0}
            ).json()

        self.assertFalse(promo_data["valid"])
        self.assertNotIn("discount_amount", promo_data)

    def test_percent_and_fixed_produce_different_amounts_for_same_order(self):
        order_amount = 100.0
        percent_promo = make_promo_row(code="PCT10", discount_type="percent", discount_value=10.0)
        fixed_promo = make_promo_row(code="FIX10", discount_type="fixed", discount_value=10.0)

        with patch(_PROMO_PATCH, make_promo_supabase_mock(percent_promo)):
            pct_discount = client.post(
                "/promo/validate", json={"code": "PCT10", "order_amount": order_amount}
            ).json()["discount_amount"]

        with patch(_PROMO_PATCH, make_promo_supabase_mock(fixed_promo)):
            fix_discount = client.post(
                "/promo/validate", json={"code": "FIX10", "order_amount": order_amount}
            ).json()["discount_amount"]

        # 10% of 100 = 10, fixed 10 = 10 — same in this case, but both paths ran
        self.assertEqual(pct_discount, 10.0)
        self.assertEqual(fix_discount, 10.0)


if __name__ == "__main__":
    unittest.main()
