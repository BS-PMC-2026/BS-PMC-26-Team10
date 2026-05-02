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


if __name__ == "__main__":
    unittest.main()
