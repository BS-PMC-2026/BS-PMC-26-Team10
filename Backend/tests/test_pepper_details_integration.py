"""
Integration tests for the redesigned 'Learn More' (Pepper Details) page.

The redesigned PepperDetailsPage makes three API calls:
  - GET /chillies/{id}   — main pepper data
  - GET /chillies        — full catalogue (used for 'Filter Similar Peppers')
  - GET /chillies?...    — filtered catalogue (SHU / origin filters)

These tests drive the full HTTP cycle through FastAPI's TestClient,
mocking only the database layer so no network calls are made.
"""
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.chilli import router

_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)

# ── shared fixtures ────────────────────────────────────────────────────────────

HTTPS_IMAGE = "https://proj.supabase.co/storage/v1/object/sign/chilli-images/hab.jpg?token=x"
LOCAL_IMAGE = "../chilli_images/habanero.jpg"
BASE_URL = "http://testserver"


def _make_row(
    id=1,
    name="Habanero",
    description="A hot pepper",
    image_url=HTTPS_IMAGE,
    shu_min=100000,
    shu_max=350000,
    origin="Mexico",
    color="Orange",
    is_available=True,
    stock_quantity=10,
    season="Summer",
    full_description="The Habanero is one of the hottest peppers in the world.",
):
    return (id, name, description, image_url, shu_min, shu_max,
            origin, color, is_available, stock_quantity, season, full_description)


# ── GET /chillies/{id} ─────────────────────────────────────────────────────────

class GetChilliByIdTests(unittest.TestCase):
    """GET /chillies/{id} returns every field the Learn More page consumes."""

    def _get(self, row, chilli_id=1):
        with patch("app.routes.chilli.get_chilli_by_id", return_value=row):
            return client.get(f"/chillies/{chilli_id}")

    def test_returns_200_for_existing_pepper(self):
        resp = self._get(_make_row())
        self.assertEqual(resp.status_code, 200)

    def test_returns_404_when_pepper_not_found(self):
        with patch("app.routes.chilli.get_chilli_by_id", return_value=None):
            resp = client.get("/chillies/999")
        self.assertEqual(resp.status_code, 404)

    def test_404_detail_message(self):
        with patch("app.routes.chilli.get_chilli_by_id", return_value=None):
            resp = client.get("/chillies/999")
        self.assertIn("not found", resp.json()["detail"].lower())

    def test_name_field_returned(self):
        resp = self._get(_make_row(name="Ghost Pepper"))
        self.assertEqual(resp.json()["name"], "Ghost Pepper")

    def test_description_field_returned(self):
        resp = self._get(_make_row(description="Extremely hot."))
        self.assertEqual(resp.json()["description"], "Extremely hot.")

    def test_full_description_returned_when_set(self):
        resp = self._get(_make_row(full_description="Rich detail about this pepper."))
        self.assertEqual(resp.json()["full_description"], "Rich detail about this pepper.")

    def test_full_description_empty_string_returned_as_is(self):
        resp = self._get(_make_row(full_description=""))
        self.assertEqual(resp.json()["full_description"], "")

    def test_shu_min_and_shu_max_returned(self):
        resp = self._get(_make_row(shu_min=100000, shu_max=350000))
        data = resp.json()
        self.assertEqual(data["shu_min"], 100000)
        self.assertEqual(data["shu_max"], 350000)

    def test_origin_color_season_returned(self):
        resp = self._get(_make_row(origin="Jamaica", color="Red", season="Winter"))
        data = resp.json()
        self.assertEqual(data["origin"], "Jamaica")
        self.assertEqual(data["color"], "Red")
        self.assertEqual(data["season"], "Winter")

    def test_availability_and_stock_returned(self):
        resp = self._get(_make_row(is_available=True, stock_quantity=15))
        data = resp.json()
        self.assertEqual(data["is_available"], True)
        self.assertEqual(data["stock_quantity"], 15)

    def test_https_image_url_passed_through_unchanged(self):
        resp = self._get(_make_row(image_url=HTTPS_IMAGE))
        self.assertEqual(resp.json()["image_url"], HTTPS_IMAGE)

    def test_local_image_url_prefixed_with_base_url(self):
        resp = self._get(_make_row(image_url=LOCAL_IMAGE))
        self.assertTrue(resp.json()["image_url"].startswith(BASE_URL))
        self.assertIn("chilli_images/habanero.jpg", resp.json()["image_url"])

    def test_empty_image_url_uses_default(self):
        resp = self._get(_make_row(image_url=""))
        image_url = resp.json()["image_url"]
        self.assertIn("default", image_url)

    def test_all_fields_required_by_learn_more_page_present(self):
        resp = self._get(_make_row())
        data = resp.json()
        for field in ("id", "name", "description", "image_url", "shu_min", "shu_max",
                      "origin", "color", "is_available", "stock_quantity",
                      "season", "full_description"):
            self.assertIn(field, data, msg=f"Missing field: {field}")

    def test_id_field_matches_requested_pepper(self):
        resp = self._get(_make_row(id=7), chilli_id=7)
        self.assertEqual(resp.json()["id"], 7)

    def test_unavailable_pepper_still_returned(self):
        resp = self._get(_make_row(is_available=False, stock_quantity=0))
        data = resp.json()
        self.assertEqual(data["is_available"], False)
        self.assertEqual(data["stock_quantity"], 0)


# ── GET /chillies (full catalogue for filter section) ─────────────────────────

class GetAllChilliesTests(unittest.TestCase):
    """GET /chillies returns the catalogue the 'Filter Similar Peppers' section uses."""

    def _get_all(self, rows):
        with patch("app.routes.chilli.get_all_chillies", return_value=rows):
            return client.get("/chillies")

    def test_returns_200_with_empty_list(self):
        resp = self._get_all([])
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_returns_all_peppers_in_list(self):
        rows = [_make_row(id=1, name="Habanero"), _make_row(id=2, name="Ghost Pepper")]
        resp = self._get_all(rows)
        names = [p["name"] for p in resp.json()]
        self.assertIn("Habanero", names)
        self.assertIn("Ghost Pepper", names)

    def test_each_pepper_has_color_for_filter_dropdown(self):
        rows = [_make_row(color="Orange"), _make_row(id=2, color="Red")]
        resp = self._get_all(rows)
        colors = [p["color"] for p in resp.json()]
        self.assertEqual(colors, ["Orange", "Red"])

    def test_each_pepper_has_season_for_filter_dropdown(self):
        rows = [_make_row(season="Summer"), _make_row(id=2, name="Ghost", season="Autumn")]
        resp = self._get_all(rows)
        seasons = [p["season"] for p in resp.json()]
        self.assertEqual(seasons, ["Summer", "Autumn"])

    def test_each_pepper_has_shu_fields_for_heat_filter(self):
        resp = self._get_all([_make_row(shu_min=500, shu_max=2500)])
        data = resp.json()[0]
        self.assertEqual(data["shu_min"], 500)
        self.assertEqual(data["shu_max"], 2500)

    def test_full_description_present_in_list_response(self):
        resp = self._get_all([_make_row(full_description="Detailed info.")])
        self.assertEqual(resp.json()[0]["full_description"], "Detailed info.")


# ── GET /chillies?shu_min=&shu_max= (SHU heat filter) ─────────────────────────

class FilterChilliesBySHUTests(unittest.TestCase):
    """GET /chillies with SHU params — used when visitor applies heat-level filter."""

    def _filtered(self, rows, shu_min=None, shu_max=None, origin=None):
        params = {}
        if shu_min is not None:
            params["shu_min"] = shu_min
        if shu_max is not None:
            params["shu_max"] = shu_max
        if origin:
            params["origin"] = origin
        with patch("app.routes.chilli.filter_chillies", return_value=rows):
            return client.get("/chillies", params=params)

    def test_shu_range_filter_returns_matching_peppers(self):
        rows = [_make_row(name="Anaheim", shu_min=500, shu_max=2500)]
        resp = self._filtered(rows, shu_min=0, shu_max=5000)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()[0]["name"], "Anaheim")

    def test_shu_min_greater_than_max_returns_400(self):
        resp = client.get("/chillies", params={"shu_min": 5000, "shu_max": 1000})
        self.assertEqual(resp.status_code, 400)

    def test_400_detail_explains_shu_range_error(self):
        resp = client.get("/chillies", params={"shu_min": 5000, "shu_max": 1000})
        self.assertIn("shu_min", resp.json()["detail"].lower())

    def test_origin_filter_returns_matching_peppers(self):
        rows = [_make_row(name="Scotch Bonnet", origin="Jamaica")]
        resp = self._filtered(rows, origin="Jamaica")
        self.assertEqual(resp.json()[0]["origin"], "Jamaica")

    def test_shu_filter_returns_empty_list_when_no_match(self):
        resp = self._filtered([], shu_min=0, shu_max=100)
        self.assertEqual(resp.json(), [])

    def test_no_filter_params_calls_get_all(self):
        rows = [_make_row()]
        with patch("app.routes.chilli.get_all_chillies", return_value=rows) as mock_all:
            resp = client.get("/chillies")
        self.assertEqual(resp.status_code, 200)
        mock_all.assert_called_once()

    def test_equal_shu_min_and_max_is_valid(self):
        rows = [_make_row(shu_min=5000, shu_max=5000)]
        resp = self._filtered(rows, shu_min=5000, shu_max=5000)
        self.assertEqual(resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
