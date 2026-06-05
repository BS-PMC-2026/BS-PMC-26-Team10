import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.subscription_services import (
    get_subscription_stats,
    save_subscription,
    send_update,
    unsubscribe,
    unsubscribe_by_token,
)


class SubscriptionServicesTests(unittest.TestCase):
    def test_save_subscription_inserts_new_subscriber(self):
        supabase = MagicMock()
        table = supabase.table.return_value
        table.select.return_value.eq.return_value.limit.return_value.execute.return_value = SimpleNamespace(data=[])
        table.insert.return_value.execute.return_value = SimpleNamespace(data=[{"id": 1, "email": "visitor@example.com"}])

        with patch("app.services.subscription_services.supabase", supabase):
            result = save_subscription({
                "email": " Visitor@Example.com ",
                "events_enabled": True,
                "discounts_enabled": False,
                "new_products_enabled": False,
                "consent_given": True,
            })

        payload = table.insert.call_args.args[0]
        self.assertEqual(payload["email"], "visitor@example.com")
        self.assertTrue(payload["events_enabled"])
        self.assertTrue(payload["is_active"])
        self.assertTrue(payload["unsubscribe_token"])
        self.assertIn("subscribed", result["message"])

    def test_save_subscription_rejects_missing_consent(self):
        with self.assertRaisesRegex(ValueError, "Consent"):
            save_subscription({
                "email": "visitor@example.com",
                "events_enabled": True,
                "consent_given": False,
            })

    def test_unsubscribe_returns_false_when_email_is_unknown(self):
        supabase = MagicMock()
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .limit.return_value
            .execute.return_value
        ) = SimpleNamespace(data=[])

        with patch("app.services.subscription_services.supabase", supabase):
            self.assertFalse(unsubscribe("unknown@example.com"))

    def test_unsubscribe_by_token_deactivates_subscription(self):
        supabase = MagicMock()
        table = supabase.table.return_value
        table.select.return_value.eq.return_value.limit.return_value.execute.return_value = SimpleNamespace(
            data=[{"id": 7}]
        )

        with patch("app.services.subscription_services.supabase", supabase):
            self.assertTrue(unsubscribe_by_token("token-123"))

        payload = table.update.call_args.args[0]
        self.assertFalse(payload["is_active"])
        self.assertFalse(payload["consent_given"])

    def test_get_subscription_stats_counts_only_active_rows(self):
        supabase = MagicMock()
        supabase.table.return_value.select.return_value.execute.return_value = SimpleNamespace(data=[
            {"is_active": True, "events_enabled": True, "discounts_enabled": False, "new_products_enabled": True},
            {"is_active": True, "events_enabled": False, "discounts_enabled": True, "new_products_enabled": False},
            {"is_active": False, "events_enabled": True, "discounts_enabled": True, "new_products_enabled": True},
        ])

        with patch("app.services.subscription_services.supabase", supabase):
            result = get_subscription_stats()

        self.assertEqual(result, {
            "active_subscribers": 2,
            "events": 1,
            "discounts": 1,
            "new_products": 1,
        })

    def test_send_update_uses_only_matching_subscribers(self):
        supabase = MagicMock()
        chain = supabase.table.return_value.select.return_value.eq.return_value.eq.return_value
        chain.execute.return_value = SimpleNamespace(data=[
            {"id": 1, "email": "one@example.com", "unsubscribe_token": "token-one"},
            {"id": 2, "email": "two@example.com", "unsubscribe_token": "token-two"},
        ])

        with (
            patch("app.services.subscription_services.supabase", supabase),
            patch("app.services.subscription_services.send_subscription_update", side_effect=[True, False]) as send_email,
        ):
            result = send_update("events", "Farm event", "Join us this Friday.")

        self.assertEqual(result["recipients"], 2)
        self.assertEqual(result["sent"], 1)
        self.assertEqual(result["failed"], 1)
        self.assertEqual(send_email.call_count, 2)
        send_email.assert_any_call("one@example.com", "Farm event", "Join us this Friday.", "events", "token-one")


if __name__ == "__main__":
    unittest.main()
