"""
Tests for booking route validation helpers (BSPMT10-12-usn12).
No database connection required.
"""
import re
import unittest
from pydantic import ValidationError

from app.models import BookingCreate

_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_PHONE_RE = re.compile(r'^\d{10}$')


class EmailValidationTests(unittest.TestCase):
    def test_valid_standard_email(self):
        self.assertTrue(_EMAIL_RE.match("user@example.com"))

    def test_valid_email_with_subdomain(self):
        self.assertTrue(_EMAIL_RE.match("user@mail.example.com"))

    def test_valid_email_with_plus(self):
        self.assertTrue(_EMAIL_RE.match("user+tag@example.com"))

    def test_invalid_email_missing_at(self):
        self.assertIsNone(_EMAIL_RE.match("userexample.com"))

    def test_invalid_email_missing_domain(self):
        self.assertIsNone(_EMAIL_RE.match("user@"))

    def test_invalid_email_space_before_at(self):
        self.assertIsNone(_EMAIL_RE.match("user @example.com"))

    def test_invalid_empty_string(self):
        self.assertIsNone(_EMAIL_RE.match(""))


class PhoneValidationTests(unittest.TestCase):
    def test_valid_10_digit_phone(self):
        self.assertTrue(_PHONE_RE.match("0549164691"))

    def test_valid_another_10_digit_phone(self):
        self.assertTrue(_PHONE_RE.match("0521234567"))

    def test_invalid_9_digits(self):
        self.assertIsNone(_PHONE_RE.match("054916469"))

    def test_invalid_11_digits(self):
        self.assertIsNone(_PHONE_RE.match("05491646910"))

    def test_invalid_with_dashes(self):
        self.assertIsNone(_PHONE_RE.match("054-916-4691"))

    def test_invalid_with_plus_prefix(self):
        self.assertIsNone(_PHONE_RE.match("+9720549164691"))

    def test_invalid_contains_letter(self):
        self.assertIsNone(_PHONE_RE.match("054916469a"))

    def test_invalid_empty_string(self):
        self.assertIsNone(_PHONE_RE.match(""))


class BookingCreateModelTests(unittest.TestCase):
    def _valid(self, **kwargs):
        defaults = dict(
            tour_id=1,
            email="visitor@example.com",
            full_name="Jane Smith",
            phone="0549164691",
            participants_count=2,
        )
        defaults.update(kwargs)
        return BookingCreate(**defaults)

    def test_valid_booking_is_created(self):
        b = self._valid()
        self.assertEqual(b.tour_id, 1)
        self.assertEqual(b.email, "visitor@example.com")
        self.assertEqual(b.participants_count, 2)

    def test_missing_tour_id_raises(self):
        with self.assertRaises(ValidationError):
            BookingCreate(
                email="visitor@example.com",
                full_name="Jane Smith",
                phone="0549164691",
                participants_count=2,
            )

    def test_missing_email_raises(self):
        with self.assertRaises(ValidationError):
            BookingCreate(
                tour_id=1,
                full_name="Jane Smith",
                phone="0549164691",
                participants_count=2,
            )

    def test_missing_participants_count_raises(self):
        with self.assertRaises(ValidationError):
            BookingCreate(
                tour_id=1,
                email="visitor@example.com",
                full_name="Jane Smith",
                phone="0549164691",
            )

    def test_all_fields_are_stored(self):
        b = self._valid(full_name="John Doe", phone="0521234567", participants_count=4)
        self.assertEqual(b.full_name, "John Doe")
        self.assertEqual(b.phone, "0521234567")
        self.assertEqual(b.participants_count, 4)

    # ── payment fields (USN-13) ────────────────────────────────────────────

    def test_payment_status_defaults_to_free(self):
        b = self._valid()
        self.assertEqual(b.payment_status, "free")

    def test_paypal_order_id_defaults_to_none(self):
        b = self._valid()
        self.assertIsNone(b.paypal_order_id)

    def test_payment_status_can_be_set_to_paid(self):
        b = self._valid(payment_status="paid")
        self.assertEqual(b.payment_status, "paid")

    def test_paypal_order_id_accepts_string(self):
        b = self._valid(payment_status="paid", paypal_order_id="1AB23456CD789")
        self.assertEqual(b.paypal_order_id, "1AB23456CD789")

    def test_paid_booking_has_both_payment_fields(self):
        b = self._valid(payment_status="paid", paypal_order_id="ORDER_XYZ")
        self.assertEqual(b.payment_status, "paid")
        self.assertEqual(b.paypal_order_id, "ORDER_XYZ")

    def test_free_booking_ignores_paypal_order_id(self):
        b = self._valid(payment_status="free", paypal_order_id=None)
        self.assertEqual(b.payment_status, "free")
        self.assertIsNone(b.paypal_order_id)


if __name__ == "__main__":
    unittest.main()
