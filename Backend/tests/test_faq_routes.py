import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class FaqRoutesTests(unittest.TestCase):
    def test_get_faq_returns_items(self):
        items = [{
            "id": 1,
            "question": "How do I book a tour?",
            "answer": "Choose an available tour and confirm online.",
            "category": "Booking",
            "display_order": 1,
        }]

        with patch("app.routes.faq.get_active_faq_items", return_value=items):
            response = TestClient(app).get("/faq")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), items)


if __name__ == "__main__":
    unittest.main()
