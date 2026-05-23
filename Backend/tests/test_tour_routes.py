"""
Tests for tour route helpers (BSPMT10-3-usn3).
No database connection required.
"""
import unittest
from datetime import date, time
from pydantic import ValidationError

from app.models import Tour
from app.routes.tour import serialize_tours


class SerializeToursTests(unittest.TestCase):
    def _make_row(self, overrides=None):
        row = (
            1,                      # id
            "Field Walk",           # title
            "field-tasting",        # kind
            "A nice walk",          # description
            date(2026, 6, 1),       # date
            time(10, 0),            # time
            "90 min",               # duration
            12,                     # capacity
            28.0,                   # price
            "Main gate",            # meeting_point
            "5 tastings",           # includes
            "mostly-yes",           # accessibility
            "public",               # visibility
            "2026-05-01 10:00:00",  # created_at
            0,                      # booked_count (from LEFT JOIN bookings)
        )
        if overrides:
            row = list(row)
            for idx, val in overrides.items():
                row[idx] = val
            row = tuple(row)
        return row

    def test_returns_empty_list_for_no_tours(self):
        self.assertEqual(serialize_tours([]), [])

    def test_serializes_single_tour_correctly(self):
        result = serialize_tours([self._make_row()])
        self.assertEqual(len(result), 1)
        tour = result[0]
        self.assertEqual(tour["id"], 1)
        self.assertEqual(tour["title"], "Field Walk")
        self.assertEqual(tour["kind"], "field-tasting")
        self.assertEqual(tour["capacity"], 12)
        self.assertEqual(tour["price"], 28.0)
        self.assertEqual(tour["visibility"], "public")

    def test_serializes_multiple_tours(self):
        row2 = self._make_row({0: 2, 1: "Hot Sauce Workshop", 8: 65.0})
        result = serialize_tours([self._make_row(), row2])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[1]["title"], "Hot Sauce Workshop")
        self.assertEqual(result[1]["price"], 65.0)

    def test_none_price_becomes_zero(self):
        row = self._make_row({8: None})
        result = serialize_tours([row])
        self.assertEqual(result[0]["price"], 0)

    def test_date_and_time_are_strings(self):
        result = serialize_tours([self._make_row()])
        self.assertIsInstance(result[0]["date"], str)
        self.assertIsInstance(result[0]["time"], str)


    def test_remaining_spots_equals_capacity_when_no_bookings(self):
        result = serialize_tours([self._make_row()])
        self.assertEqual(result[0]["remaining_spots"], 12)

    def test_remaining_spots_decreases_with_bookings(self):
        row = self._make_row({14: 5})  # 5 participants already booked
        result = serialize_tours([row])
        self.assertEqual(result[0]["remaining_spots"], 7)

    def test_is_full_false_when_spots_available(self):
        result = serialize_tours([self._make_row()])
        self.assertFalse(result[0]["is_full"])

    def test_is_full_true_when_capacity_reached(self):
        row = self._make_row({14: 12})  # all 12 spots booked
        result = serialize_tours([row])
        self.assertTrue(result[0]["is_full"])
        self.assertEqual(result[0]["remaining_spots"], 0)

    def test_remaining_spots_never_negative(self):
        row = self._make_row({14: 20})  # overbooking guard
        result = serialize_tours([row])
        self.assertEqual(result[0]["remaining_spots"], 0)
        self.assertTrue(result[0]["is_full"])


class TourModelValidationTests(unittest.TestCase):
    def _valid(self, **kwargs):
        defaults = dict(title="Test Tour", date="2026-06-01", time="10:00", capacity=10)
        defaults.update(kwargs)
        return Tour(**defaults)

    def test_valid_tour_is_created(self):
        tour = self._valid()
        self.assertEqual(tour.title, "Test Tour")
        self.assertEqual(tour.capacity, 10)

    def test_defaults_are_applied(self):
        tour = self._valid()
        self.assertEqual(tour.kind, "field-tasting")
        self.assertEqual(tour.duration, "90 min")
        self.assertEqual(tour.visibility, "draft")
        self.assertEqual(tour.price, 0)

    def test_missing_title_raises(self):
        with self.assertRaises(ValidationError):
            Tour(date="2026-06-01", time="10:00", capacity=10)

    def test_missing_date_raises(self):
        with self.assertRaises(ValidationError):
            Tour(title="Test", time="10:00", capacity=10)

    def test_missing_capacity_raises(self):
        with self.assertRaises(ValidationError):
            Tour(title="Test", date="2026-06-01", time="10:00")

    def test_custom_fields_are_stored(self):
        tour = self._valid(
            kind="workshop",
            duration="3 hrs",
            price=65.0,
            meeting_point="Barn entrance",
            visibility="public",
        )
        self.assertEqual(tour.kind, "workshop")
        self.assertEqual(tour.duration, "3 hrs")
        self.assertEqual(tour.price, 65.0)
        self.assertEqual(tour.meeting_point, "Barn entrance")
        self.assertEqual(tour.visibility, "public")


class SerializeTourCalendarFieldsTests(unittest.TestCase):
    """Tests that serialize_tours returns fields the calendar sidebar depends on."""

    def _make_row(self, overrides=None):
        row = (
            1, "Field Walk", "field-tasting", "A nice walk",
            date(2026, 6, 1), time(10, 0), "90 min", 12, 28.0,
            "Main gate", "5 tastings", "mostly-yes", "public",
            "2026-05-01 10:00:00", 0,
        )
        if overrides:
            row = list(row)
            for idx, val in overrides.items():
                row[idx] = val
            row = tuple(row)
        return row

    def test_date_format_is_yyyy_mm_dd(self):
        result = serialize_tours([self._make_row()])
        date_str = result[0]["date"]
        parts = date_str.split("-")
        self.assertEqual(len(parts), 3)
        self.assertEqual(len(parts[0]), 4)   # YYYY
        self.assertEqual(len(parts[1]), 2)   # MM
        self.assertEqual(len(parts[2]), 2)   # DD

    def test_date_value_matches_source(self):
        result = serialize_tours([self._make_row()])
        self.assertEqual(result[0]["date"], "2026-06-01")

    def test_visibility_field_preserved_as_public(self):
        result = serialize_tours([self._make_row()])
        self.assertEqual(result[0]["visibility"], "public")

    def test_visibility_field_preserved_as_draft(self):
        result = serialize_tours([self._make_row({12: "draft"})])
        self.assertEqual(result[0]["visibility"], "draft")

    def test_visibility_field_preserved_as_published(self):
        result = serialize_tours([self._make_row({12: "published"})])
        self.assertEqual(result[0]["visibility"], "published")

    def test_multiple_tours_same_date_all_serialized(self):
        row1 = self._make_row({0: 1, 1: "Morning Walk"})
        row2 = self._make_row({0: 2, 1: "Afternoon Walk", 5: time(14, 0)})
        result = serialize_tours([row1, row2])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["date"], result[1]["date"])

    def test_all_calendar_required_fields_present(self):
        result = serialize_tours([self._make_row()])
        tour = result[0]
        for field in ("id", "title", "date", "time", "visibility", "remaining_spots", "is_full"):
            self.assertIn(field, tour)

    def test_time_format_is_hh_mm(self):
        result = serialize_tours([self._make_row()])
        time_str = result[0]["time"]
        parts = time_str.split(":")
        self.assertGreaterEqual(len(parts), 2)
        self.assertTrue(parts[0].isdigit())
        self.assertTrue(parts[1].isdigit())

    def test_tours_with_mixed_visibility_all_returned(self):
        rows = [
            self._make_row({0: 1, 12: "public"}),
            self._make_row({0: 2, 12: "draft"}),
            self._make_row({0: 3, 12: "published"}),
        ]
        result = serialize_tours(rows)
        self.assertEqual(len(result), 3)
        visibilities = {t["visibility"] for t in result}
        self.assertEqual(visibilities, {"public", "draft", "published"})


class GetAllToursServiceTests(unittest.TestCase):
    """Tests for get_all_tours with mocked Supabase (no DB required)."""

    def _make_supabase_tour(self, overrides=None):
        t = {
            "id": 1, "title": "Field Walk", "kind": "field-tasting",
            "description": "A walk", "date": "2026-06-01", "time": "10:00:00",
            "duration": "90 min", "capacity": 12, "price": 28.0,
            "meeting_point": "Main gate", "includes": "5 tastings",
            "accessibility": "mostly-yes", "visibility": "public",
            "created_at": "2026-05-01T10:00:00",
        }
        if overrides:
            t.update(overrides)
        return t

    def _mock_supabase(self, tours, bookings):
        from unittest.mock import patch, MagicMock
        mock_sb = MagicMock()

        tours_resp = MagicMock()
        tours_resp.data = tours

        bookings_resp = MagicMock()
        bookings_resp.data = bookings

        (mock_sb.table.return_value
             .select.return_value
             .order.return_value
             .order.return_value
             .execute.return_value) = tours_resp

        (mock_sb.table.return_value
             .select.return_value
             .eq.return_value
             .execute.return_value) = bookings_resp

        return mock_sb

    def test_returns_empty_list_when_no_tours(self):
        from unittest.mock import patch, MagicMock
        mock_sb = MagicMock()
        resp = MagicMock()
        resp.data = []
        mock_sb.table.return_value.select.return_value.order.return_value.order.return_value.execute.return_value = resp
        mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

        with patch("app.services.tour_services.supabase", mock_sb):
            from app.services.tour_services import get_all_tours
            result = get_all_tours()
        self.assertEqual(result, [])

    def test_booked_count_aggregated_per_tour(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        tours = [self._make_supabase_tour({"id": 1})]
        bookings = [
            {"tour_id": 1, "participants_count": 3},
            {"tour_id": 1, "participants_count": 2},
        ]
        with patch("app.services.tour_services.supabase", self._mock_supabase(tours, bookings)):
            result = get_all_tours()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0][14], 5)

    def test_tour_with_no_bookings_has_zero_booked_count(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        tours = [self._make_supabase_tour({"id": 2})]
        with patch("app.services.tour_services.supabase", self._mock_supabase(tours, [])):
            result = get_all_tours()
        self.assertEqual(result[0][14], 0)

    def test_bookings_for_other_tours_not_counted(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        tours = [self._make_supabase_tour({"id": 1})]
        bookings = [{"tour_id": 99, "participants_count": 10}]
        with patch("app.services.tour_services.supabase", self._mock_supabase(tours, bookings)):
            result = get_all_tours()
        self.assertEqual(result[0][14], 0)


class SerializeToursPictureTests(unittest.TestCase):
    """Tests for picture field handling in serialize_tours."""

    def _make_row(self, picture=None):
        return (
            1, "Field Walk", "field-tasting", "A walk",
            date(2026, 6, 1), time(10, 0), "90 min", 12, 28.0,
            "Main gate", "5 tastings", "mostly-yes", "public",
            "2026-05-01 10:00:00", 0, "Confirmation.",
            picture,
        )

    def test_picture_included_when_url_is_set(self):
        url = "https://supabase.co/storage/v1/object/sign/tours-booking-images/walk.jpg?token=x"
        result = serialize_tours([self._make_row(url)])
        self.assertEqual(result[0]["picture"], url)

    def test_picture_is_none_when_value_is_none(self):
        result = serialize_tours([self._make_row(None)])
        self.assertIsNone(result[0]["picture"])

    def test_picture_is_none_for_short_tuple_without_picture_column(self):
        row = (
            1, "Field Walk", "field-tasting", "A walk",
            date(2026, 6, 1), time(10, 0), "90 min", 12, 28.0,
            "Main gate", "5 tastings", "mostly-yes", "public",
            "2026-05-01 10:00:00", 0, "Confirmation.",
        )
        result = serialize_tours([row])
        self.assertIsNone(result[0]["picture"])

    def test_picture_field_present_in_output(self):
        result = serialize_tours([self._make_row()])
        self.assertIn("picture", result[0])

    def test_multiple_tours_each_have_own_picture(self):
        url1 = "https://example.com/img1.jpg"
        url2 = "https://example.com/img2.jpg"
        result = serialize_tours([self._make_row(url1), self._make_row(url2)])
        self.assertEqual(result[0]["picture"], url1)
        self.assertEqual(result[1]["picture"], url2)


class TourModelPictureTests(unittest.TestCase):
    """Tests for the picture field on the Tour Pydantic model."""

    def _valid(self, **kwargs):
        defaults = dict(title="Test Tour", date="2026-06-01", time="10:00", capacity=10)
        defaults.update(kwargs)
        return Tour(**defaults)

    def test_picture_defaults_to_empty_string(self):
        tour = self._valid()
        self.assertEqual(tour.picture, "")

    def test_picture_can_be_set_to_a_url(self):
        url = "https://example.com/tour.jpg"
        tour = self._valid(picture=url)
        self.assertEqual(tour.picture, url)

    def test_picture_is_included_in_model_fields(self):
        self.assertIn("picture", Tour.model_fields)


class TourPayloadPictureTests(unittest.TestCase):
    """Tests that _tour_payload handles picture correctly."""

    def _make_tour(self, **kwargs):
        defaults = dict(title="Test", date="2026-06-01", time="10:00", capacity=10)
        defaults.update(kwargs)
        return Tour(**defaults)

    def test_payload_includes_picture_when_set(self):
        from app.services.tour_services import _tour_payload
        url = "https://example.com/img.jpg"
        payload = _tour_payload(self._make_tour(picture=url))
        self.assertEqual(payload["picture"], url)

    def test_payload_excludes_picture_when_empty(self):
        from app.services.tour_services import _tour_payload
        payload = _tour_payload(self._make_tour(picture=""))
        self.assertNotIn("picture", payload)


class GetAllToursWithPictureTests(unittest.TestCase):
    """Tests that get_all_tours passes picture through in the tuple."""

    def _mock_supabase(self, tours, bookings=None):
        from unittest.mock import MagicMock
        if bookings is None:
            bookings = []
        mock_sb = MagicMock()
        tours_resp = MagicMock()
        tours_resp.data = tours
        bookings_resp = MagicMock()
        bookings_resp.data = bookings
        (mock_sb.table.return_value
             .select.return_value
             .order.return_value
             .order.return_value
             .execute.return_value) = tours_resp
        (mock_sb.table.return_value
             .select.return_value
             .eq.return_value
             .execute.return_value) = bookings_resp
        return mock_sb

    def _base_tour(self, **overrides):
        t = {
            "id": 1, "title": "Field Walk", "kind": "field-tasting",
            "description": "A walk", "date": "2026-06-01", "time": "10:00:00",
            "duration": "90 min", "capacity": 12, "price": 28.0,
            "meeting_point": "Main gate", "includes": "5 tastings",
            "accessibility": "mostly-yes", "visibility": "public",
            "created_at": "2026-05-01T10:00:00", "confirmation_message": "",
        }
        t.update(overrides)
        return t

    def test_picture_url_is_at_index_16(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        url = "https://example.com/tour.jpg"
        with patch("app.services.tour_services.supabase",
                   self._mock_supabase([self._base_tour(picture=url)])):
            result = get_all_tours()
        self.assertEqual(result[0][16], url)

    def test_picture_is_none_when_missing_from_row(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        with patch("app.services.tour_services.supabase",
                   self._mock_supabase([self._base_tour()])):
            result = get_all_tours()
        self.assertIsNone(result[0][16])

    def test_picture_is_none_when_explicitly_null(self):
        from unittest.mock import patch
        from app.services.tour_services import get_all_tours
        with patch("app.services.tour_services.supabase",
                   self._mock_supabase([self._base_tour(picture=None)])):
            result = get_all_tours()
        self.assertIsNone(result[0][16])


if __name__ == "__main__":
    unittest.main()
