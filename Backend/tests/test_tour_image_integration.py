"""
Integration tests for the tour image feature.

These tests spin up a real FastAPI app (tour router only) via TestClient and
drive the full HTTP request → routing → serialisation → response cycle.
Only the database/storage layer is mocked so no network calls are made.
"""
import io
import unittest
from datetime import date, time
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.tour import router

_app = FastAPI()
_app.include_router(router)
client = TestClient(_app)

PICTURE_URL = (
    "https://proj.supabase.co/storage/v1/object/sign/"
    "tours-booking-images/walk.jpg?token=abc"
)

BASE_PAYLOAD = {
    "title": "Field Walk",
    "date": "2026-06-01",
    "time": "10:00",
    "capacity": 12,
}


def _make_row(picture=None, tour_id=1):
    """Return a full 17-element tour tuple as produced by get_all_tours."""
    return (
        tour_id,                    # 0  id
        "Field Walk",               # 1  title
        "field-tasting",            # 2  kind
        "A guided walk",            # 3  description
        date(2026, 6, 1),           # 4  date
        time(10, 0),                # 5  time
        "90 min",                   # 6  duration
        12,                         # 7  capacity
        28.0,                       # 8  price
        "Main gate",                # 9  meeting_point
        "5 tastings",               # 10 includes
        "mostly-yes",               # 11 accessibility
        "public",                   # 12 visibility
        "2026-05-01 10:00:00",      # 13 created_at
        0,                          # 14 booked_count
        "Keep your reference.",     # 15 confirmation_message
        picture,                    # 16 picture
    )


# ── GET /tours ────────────────────────────────────────────────────────────────

class GetToursImageTests(unittest.TestCase):
    """GET /tours — picture field is present and correct in every response."""

    def test_picture_url_returned_when_set(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_make_row(PICTURE_URL)]):
            resp = client.get("/tours")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()[0]["picture"], PICTURE_URL)

    def test_picture_is_null_when_not_set(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_make_row(None)]):
            resp = client.get("/tours")
        self.assertIsNone(resp.json()[0]["picture"])

    def test_picture_key_always_present_in_tour_object(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_make_row()]):
            resp = client.get("/tours")
        self.assertIn("picture", resp.json()[0])

    def test_multiple_tours_carry_independent_pictures(self):
        url_a = "https://example.com/tour_a.jpg"
        url_b = "https://example.com/tour_b.jpg"
        rows = [_make_row(url_a, tour_id=1), _make_row(url_b, tour_id=2)]
        with patch("app.routes.tour.get_all_tours", return_value=rows):
            data = client.get("/tours").json()
        self.assertEqual(data[0]["picture"], url_a)
        self.assertEqual(data[1]["picture"], url_b)

    def test_empty_list_returns_200_with_no_items(self):
        with patch("app.routes.tour.get_all_tours", return_value=[]):
            resp = client.get("/tours")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_other_core_fields_still_present_alongside_picture(self):
        with patch("app.routes.tour.get_all_tours", return_value=[_make_row(PICTURE_URL)]):
            tour = client.get("/tours").json()[0]
        for field in ("id", "title", "date", "capacity", "remaining_spots", "picture"):
            self.assertIn(field, tour)


# ── POST /tours ───────────────────────────────────────────────────────────────

class CreateTourImageTests(unittest.TestCase):
    """POST /tours — picture field accepted and forwarded to the service."""

    def test_create_with_picture_returns_200(self):
        with patch("app.routes.tour.create_tour", return_value="Tour has been created!"):
            resp = client.post("/tours", json={**BASE_PAYLOAD, "picture": PICTURE_URL})
        self.assertEqual(resp.status_code, 200)

    def test_create_without_picture_returns_200(self):
        with patch("app.routes.tour.create_tour", return_value="Tour has been created!"):
            resp = client.post("/tours", json=BASE_PAYLOAD)
        self.assertEqual(resp.status_code, 200)

    def test_create_passes_picture_to_service(self):
        captured = {}

        def _capture(tour):
            captured["picture"] = tour.picture
            return "Tour has been created!"

        with patch("app.routes.tour.create_tour", side_effect=_capture):
            client.post("/tours", json={**BASE_PAYLOAD, "picture": PICTURE_URL})

        self.assertEqual(captured["picture"], PICTURE_URL)

    def test_create_picture_defaults_to_empty_string_when_omitted(self):
        captured = {}

        def _capture(tour):
            captured["picture"] = tour.picture
            return "Tour has been created!"

        with patch("app.routes.tour.create_tour", side_effect=_capture):
            client.post("/tours", json=BASE_PAYLOAD)

        self.assertEqual(captured["picture"], "")

    def test_create_missing_required_fields_returns_422(self):
        with patch("app.routes.tour.create_tour", return_value="Tour has been created!"):
            resp = client.post("/tours", json={"picture": PICTURE_URL})
        self.assertEqual(resp.status_code, 422)


# ── PUT /tours/{id} ───────────────────────────────────────────────────────────

class UpdateTourImageTests(unittest.TestCase):
    """PUT /tours/{id} — picture field accepted, forwarded, and persisted."""

    def test_update_with_picture_returns_200(self):
        with patch("app.routes.tour.update_tour", return_value="Tour updated successfully!"):
            resp = client.put("/tours/1", json={**BASE_PAYLOAD, "picture": PICTURE_URL})
        self.assertEqual(resp.status_code, 200)

    def test_update_passes_new_picture_to_service(self):
        captured = {}

        def _capture(tour_id, tour):
            captured["picture"] = tour.picture
            return "Tour updated successfully!"

        with patch("app.routes.tour.update_tour", side_effect=_capture):
            client.put("/tours/1", json={**BASE_PAYLOAD, "picture": PICTURE_URL})

        self.assertEqual(captured["picture"], PICTURE_URL)

    def test_update_passes_correct_tour_id_to_service(self):
        captured = {}

        def _capture(tour_id, tour):
            captured["tour_id"] = tour_id
            return "Tour updated successfully!"

        with patch("app.routes.tour.update_tour", side_effect=_capture):
            client.put("/tours/42", json=BASE_PAYLOAD)

        self.assertEqual(captured["tour_id"], 42)

    def test_update_nonexistent_tour_returns_404(self):
        with patch("app.routes.tour.update_tour", return_value=None):
            resp = client.put("/tours/999", json=BASE_PAYLOAD)
        self.assertEqual(resp.status_code, 404)

    def test_update_picture_cleared_when_empty_string_sent(self):
        captured = {}

        def _capture(tour_id, tour):
            captured["picture"] = tour.picture
            return "Tour updated successfully!"

        with patch("app.routes.tour.update_tour", side_effect=_capture):
            client.put("/tours/1", json={**BASE_PAYLOAD, "picture": ""})

        self.assertEqual(captured["picture"], "")


# ── POST /tours/upload-image ──────────────────────────────────────────────────

class UploadImageEndpointTests(unittest.TestCase):
    """POST /tours/upload-image — full HTTP cycle for file upload."""

    def _post_file(self, content=b"img", filename="tour.jpg",
                   content_type="image/jpeg", extra_data=None):
        data = extra_data or {}
        return client.post(
            "/tours/upload-image",
            files={"file": (filename, io.BytesIO(content), content_type)},
            data=data,
        )

    def test_successful_upload_returns_200(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock, return_value=PICTURE_URL):
            resp = self._post_file()
        self.assertEqual(resp.status_code, 200)

    def test_successful_upload_returns_image_url(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock, return_value=PICTURE_URL):
            resp = self._post_file()
        self.assertEqual(resp.json()["image_url"], PICTURE_URL)

    def test_upload_uses_tours_booking_images_bucket(self):
        captured = {}

        async def _capture(file, bucket, filename=None):
            captured["bucket"] = bucket
            return PICTURE_URL

        with patch("app.routes.tour.upload_image", side_effect=_capture):
            self._post_file()

        self.assertEqual(captured["bucket"], "tours-booking-images")

    def test_upload_forwards_custom_filename(self):
        captured = {}

        async def _capture(file, bucket, filename=None):
            captured["filename"] = filename
            return PICTURE_URL

        with patch("app.routes.tour.upload_image", side_effect=_capture):
            self._post_file(extra_data={"filename": "custom-name.jpg"})

        self.assertEqual(captured["filename"], "custom-name.jpg")

    def test_upload_accepts_png_file(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock, return_value=PICTURE_URL):
            resp = self._post_file(filename="tour.png", content_type="image/png")
        self.assertEqual(resp.status_code, 200)

    def test_storage_failure_returns_500(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock,
                   side_effect=Exception("Bucket not found")):
            resp = self._post_file()
        self.assertEqual(resp.status_code, 500)

    def test_storage_failure_detail_contains_error_message(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock,
                   side_effect=Exception("Permission denied")):
            resp = self._post_file()
        self.assertIn("Permission denied", resp.json()["detail"])

    def test_storage_failure_detail_starts_with_image_upload_failed(self):
        with patch("app.routes.tour.upload_image",
                   new_callable=AsyncMock,
                   side_effect=Exception("Some error")):
            resp = self._post_file()
        self.assertTrue(resp.json()["detail"].startswith("Image upload failed"))

    def test_missing_file_returns_422(self):
        resp = client.post("/tours/upload-image")
        self.assertEqual(resp.status_code, 422)


if __name__ == "__main__":
    unittest.main()
