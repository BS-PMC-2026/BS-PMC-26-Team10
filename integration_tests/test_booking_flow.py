"""
Booking integration flow tests.

Covers: list tours → create booking (free & paid) → cancel booking.

Route-level validation (email regex, phone regex, participant count) is
tested against the real route code. Service functions are mocked so no
DB or email calls are made.
"""
import unittest
from unittest.mock import patch

from helpers import client, make_tour_row

_TOUR_ROW = make_tour_row()

_VALID_BOOKING = {
    "tour_id": 1,
    "email": "visitor@example.com",
    "full_name": "Test Visitor",
    "phone": "0541234567",
    "participants_count": 2,
}

_BOOKING_SUCCESS = {
    "success": True,
    "booking_reference": "ABC12345",
    "message": "Booking confirmed.",
    "email_sent": True,
    "confirmation_channel": "email",
    "confirmation_message": "Keep your booking reference.",
}

_CANCEL_SUCCESS = {
    "success": True,
    "message": "Booking cancelled successfully.",
    "booking_reference": "ABC12345",
    "released_spots": 2,
    "tour_id": 1,
    "email_sent": True,
    "confirmation_channel": "email",
}


class TourListTests(unittest.TestCase):

    def test_get_tours_returns_200(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_TOUR_ROW]):
            resp = client.get("/tours")
        self.assertEqual(resp.status_code, 200)

    def test_get_tours_returns_list_with_correct_count(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_TOUR_ROW, _TOUR_ROW]):
            data = client.get("/tours").json()
        self.assertEqual(len(data), 2)

    def test_tour_object_has_required_fields(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_TOUR_ROW]):
            tour = client.get("/tours").json()[0]
        for field in ("id", "title", "date", "capacity", "remaining_spots"):
            self.assertIn(field, tour, msg=f"Missing field: {field}")

    def test_empty_tour_list_returns_200(self):
        with patch("app.routes.tour.get_all_tours", return_value=[]):
            resp = client.get("/tours")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])


class FreeBookingTests(unittest.TestCase):

    def test_free_booking_returns_200(self):
        with patch("app.routes.booking.create_booking", return_value=_BOOKING_SUCCESS):
            resp = client.post("/bookings", json=_VALID_BOOKING)
        self.assertEqual(resp.status_code, 200)

    def test_free_booking_response_contains_reference(self):
        with patch("app.routes.booking.create_booking", return_value=_BOOKING_SUCCESS):
            data = client.post("/bookings", json=_VALID_BOOKING).json()
        self.assertIn("booking_reference", data)
        self.assertTrue(len(data["booking_reference"]) > 0)

    def test_free_booking_confirms_success(self):
        with patch("app.routes.booking.create_booking", return_value=_BOOKING_SUCCESS):
            data = client.post("/bookings", json=_VALID_BOOKING).json()
        self.assertTrue(data["success"])

    def test_paid_booking_accepted_with_paypal_order_id(self):
        paid_result = {**_BOOKING_SUCCESS, "booking_reference": "PAY99999"}
        payload = {
            **_VALID_BOOKING,
            "payment_status": "paid",
            "paypal_order_id": "PAYPAL-TEST-XYZ123",
        }
        with patch("app.routes.booking.create_booking", return_value=paid_result):
            resp = client.post("/bookings", json=payload)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["booking_reference"], "PAY99999")


class BookingValidationTests(unittest.TestCase):
    """Route-level validation — no mocking needed, rejected before service call."""

    def test_invalid_email_returns_422(self):
        resp = client.post("/bookings", json={**_VALID_BOOKING, "email": "not-an-email"})
        self.assertEqual(resp.status_code, 422)

    def test_phone_too_short_returns_422(self):
        resp = client.post("/bookings", json={**_VALID_BOOKING, "phone": "123"})
        self.assertEqual(resp.status_code, 422)

    def test_phone_with_dashes_returns_422(self):
        resp = client.post("/bookings", json={**_VALID_BOOKING, "phone": "054-123-4567"})
        self.assertEqual(resp.status_code, 422)

    def test_zero_participants_returns_422(self):
        resp = client.post("/bookings", json={**_VALID_BOOKING, "participants_count": 0})
        self.assertEqual(resp.status_code, 422)

    def test_negative_participants_returns_422(self):
        resp = client.post("/bookings", json={**_VALID_BOOKING, "participants_count": -1})
        self.assertEqual(resp.status_code, 422)


class BookingServiceErrorTests(unittest.TestCase):
    """Service errors are correctly mapped to HTTP status codes by the route."""

    def test_tour_not_found_returns_404(self):
        error = {"error": "tour_not_found", "message": "Tour not found."}
        with patch("app.routes.booking.create_booking", return_value=error):
            resp = client.post("/bookings", json=_VALID_BOOKING)
        self.assertEqual(resp.status_code, 404)

    def test_tour_full_returns_400(self):
        error = {"error": "tour_full", "message": "Tour is full."}
        with patch("app.routes.booking.create_booking", return_value=error):
            resp = client.post("/bookings", json=_VALID_BOOKING)
        self.assertEqual(resp.status_code, 400)

    def test_not_enough_spots_returns_400(self):
        error = {"error": "not_enough_spots", "message": "Only 1 spot remaining."}
        with patch("app.routes.booking.create_booking", return_value=error):
            resp = client.post("/bookings", json=_VALID_BOOKING)
        self.assertEqual(resp.status_code, 400)

    def test_duplicate_booking_returns_409(self):
        error = {"error": "duplicate_booking", "message": "Already booked."}
        with patch("app.routes.booking.create_booking", return_value=error):
            resp = client.post("/bookings", json=_VALID_BOOKING)
        self.assertEqual(resp.status_code, 409)


class CancellationTests(unittest.TestCase):

    def test_cancel_returns_200(self):
        with patch("app.routes.booking.cancel_booking", return_value=_CANCEL_SUCCESS):
            resp = client.post(
                "/bookings/ABC12345/cancel", json={"email": "visitor@example.com"}
            )
        self.assertEqual(resp.status_code, 200)

    def test_cancel_response_contains_reference(self):
        with patch("app.routes.booking.cancel_booking", return_value=_CANCEL_SUCCESS):
            data = client.post(
                "/bookings/ABC12345/cancel", json={"email": "visitor@example.com"}
            ).json()
        self.assertEqual(data["booking_reference"], "ABC12345")

    def test_cancel_invalid_email_returns_422(self):
        resp = client.post("/bookings/ABC12345/cancel", json={"email": "bad-email"})
        self.assertEqual(resp.status_code, 422)

    def test_cancel_booking_not_found_returns_404(self):
        error = {"error": "booking_not_found", "message": "Booking not found."}
        with patch("app.routes.booking.cancel_booking", return_value=error):
            resp = client.post(
                "/bookings/NOTFOUND/cancel", json={"email": "visitor@example.com"}
            )
        self.assertEqual(resp.status_code, 404)

    def test_cancel_already_cancelled_returns_409(self):
        error = {"error": "already_cancelled", "message": "Already cancelled."}
        with patch("app.routes.booking.cancel_booking", return_value=error):
            resp = client.post(
                "/bookings/ABC12345/cancel", json={"email": "visitor@example.com"}
            )
        self.assertEqual(resp.status_code, 409)


class BookThenCancelFlowTests(unittest.TestCase):
    """
    Multi-step flow: booking reference returned by POST /bookings is used
    directly in POST /bookings/{ref}/cancel — tests that both endpoints
    speak the same reference format.
    """

    def test_reference_from_booking_feeds_cancellation(self):
        ref = "FLOW1234"
        book_result = {**_BOOKING_SUCCESS, "booking_reference": ref}
        cancel_result = {**_CANCEL_SUCCESS, "booking_reference": ref}

        with patch("app.routes.booking.create_booking", return_value=book_result):
            booking_ref = client.post("/bookings", json=_VALID_BOOKING).json()["booking_reference"]

        self.assertEqual(booking_ref, ref)

        with patch("app.routes.booking.cancel_booking", return_value=cancel_result):
            cancel_resp = client.post(
                f"/bookings/{booking_ref}/cancel",
                json={"email": _VALID_BOOKING["email"]},
            )

        self.assertEqual(cancel_resp.status_code, 200)
        self.assertEqual(cancel_resp.json()["booking_reference"], ref)

    def test_list_tours_then_book_uses_tour_id(self):
        """Tour id from GET /tours is correctly forwarded in POST /bookings."""
        tour_row = make_tour_row(tour_id=7)
        captured = {}

        def capture_booking(booking):
            captured["tour_id"] = booking.tour_id
            return _BOOKING_SUCCESS

        with patch("app.routes.tour.get_all_tours", return_value=[tour_row]):
            tour = client.get("/tours").json()[0]

        with patch("app.routes.booking.create_booking", side_effect=capture_booking):
            client.post("/bookings", json={**_VALID_BOOKING, "tour_id": tour["id"]})

        self.assertEqual(captured["tour_id"], 7)


if __name__ == "__main__":
    unittest.main()
