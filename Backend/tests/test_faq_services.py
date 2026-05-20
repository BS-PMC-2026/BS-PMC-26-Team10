import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.services.faq_services import get_active_faq_items


class FaqServicesTests(unittest.TestCase):
    def test_get_active_faq_items_returns_ordered_rows(self):
        rows = [
            {
                "id": 1,
                "question": "How do I book a tour?",
                "answer": "Choose an available tour and confirm online.",
                "category": "Booking",
                "display_order": 1,
            }
        ]

        supabase = MagicMock()
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .order.return_value
            .execute.return_value
        ) = SimpleNamespace(data=rows)

        with patch("app.services.faq_services.supabase", supabase):
            result = get_active_faq_items()

        self.assertEqual(result, rows)
        supabase.table.assert_called_once_with("faq")
        supabase.table.return_value.select.assert_called_once_with(
            "id, question, answer, category, display_order"
        )
        supabase.table.return_value.select.return_value.eq.assert_called_once_with("is_active", True)
        supabase.table.return_value.select.return_value.eq.return_value.order.assert_called_once_with("display_order")

    def test_get_active_faq_items_returns_empty_list_when_no_rows(self):
        supabase = MagicMock()
        (
            supabase.table.return_value
            .select.return_value
            .eq.return_value
            .order.return_value
            .execute.return_value
        ) = SimpleNamespace(data=None)

        with patch("app.services.faq_services.supabase", supabase):
            result = get_active_faq_items()

        self.assertEqual(result, [])

    def test_get_active_faq_items_returns_empty_list_on_db_error(self):
        supabase = MagicMock()
        supabase.table.return_value.select.side_effect = Exception("DB error")

        with patch("app.services.faq_services.supabase", supabase):
            result = get_active_faq_items()

        self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
