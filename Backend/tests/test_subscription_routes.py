import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


class SubscriptionRoutesTests(unittest.TestCase):
    def test_create_subscription_returns_service_result(self):
        result = {"message": "saved", "subscription": {"email": "visitor@example.com"}}
        with patch("app.routes.subscription.save_subscription", return_value=result):
            response = client.post("/subscriptions", json={
                "email": "visitor@example.com",
                "events_enabled": True,
                "consent_given": True,
            })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), result)

    def test_create_subscription_maps_validation_error_to_400(self):
        with patch("app.routes.subscription.save_subscription", side_effect=ValueError("Consent is required.")):
            response = client.post("/subscriptions", json={
                "email": "visitor@example.com",
                "events_enabled": True,
                "consent_given": False,
            })

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Consent is required.")

    def test_unsubscribe_unknown_email_returns_404(self):
        with patch("app.routes.subscription.unsubscribe", return_value=False):
            response = client.post("/subscriptions/unsubscribe", json={"email": "unknown@example.com"})

        self.assertEqual(response.status_code, 404)

    def test_unsubscribe_link_returns_confirmation_page(self):
        with patch("app.routes.subscription.unsubscribe_by_token", return_value=True):
            response = client.get("/subscriptions/unsubscribe/token-123")

        self.assertEqual(response.status_code, 200)
        self.assertIn("You have been unsubscribed", response.text)

    def test_stats_returns_counts(self):
        stats = {"active_subscribers": 4, "events": 3, "discounts": 2, "new_products": 1}
        with (
            patch("app.routes.subscription.get_admin_from_token", return_value={"id": 1}),
            patch("app.routes.subscription.get_subscription_stats", return_value=stats),
        ):
            response = client.get("/subscriptions/stats", headers={"Authorization": "Bearer valid-token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), stats)

    def test_stats_requires_admin_authentication(self):
        response = client.get("/subscriptions/stats")
        self.assertEqual(response.status_code, 401)

    def test_send_update_returns_delivery_summary(self):
        result = {"message": "done", "recipients": 3, "sent": 3, "failed": 0}
        with (
            patch("app.routes.subscription.get_admin_from_token", return_value={"id": 1}),
            patch("app.routes.subscription.send_update", return_value=result),
        ):
            response = client.post("/subscriptions/send-update", json={
                "category": "events",
                "subject": "New event",
                "message": "Join us.",
            }, headers={"Authorization": "Bearer valid-token"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), result)


if __name__ == "__main__":
    unittest.main()
