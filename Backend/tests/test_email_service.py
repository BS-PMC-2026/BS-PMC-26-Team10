import unittest
from unittest.mock import MagicMock, patch

from app.services import email_service


class TourBookingConfirmationSmtpTests(unittest.TestCase):
    def _send_booking_email(self):
        return email_service.send_tour_booking_confirmation(
            booking_reference="ABC12345",
            visitor_name="Jane Smith",
            visitor_email="visitor@example.com",
            tour_title="Field Walk",
            tour_date="2026-12-31",
            tour_time="10:00",
            participants_count=2,
            meeting_point="Main gate",
            confirmation_message="Please keep this reference.",
        )

    def test_tour_booking_confirmation_uses_gmail_smtp(self):
        smtp_instance = MagicMock()
        smtp_context = MagicMock()
        smtp_context.__enter__.return_value = smtp_instance

        with patch.object(email_service, "SMTP_USERNAME", "project@example.com"), \
                patch.object(email_service, "SMTP_APP_PASSWORD", "app-password"), \
                patch.object(email_service, "SENDER_EMAIL", "project@example.com"), \
                patch.object(email_service.smtplib, "SMTP", return_value=smtp_context) as smtp_mock:
            result = self._send_booking_email()

        self.assertTrue(result)
        smtp_mock.assert_called_once_with(email_service.SMTP_HOST, email_service.SMTP_PORT)
        smtp_instance.starttls.assert_called_once()
        smtp_instance.login.assert_called_once_with("project@example.com", "app-password")
        smtp_instance.send_message.assert_called_once()

        sent_message = smtp_instance.send_message.call_args.args[0]
        self.assertEqual(sent_message["To"], "visitor@example.com")
        self.assertEqual(sent_message["From"], "project@example.com")
        self.assertEqual(sent_message["Subject"], "ChiliLand Tour Booking Confirmed - ABC12345")

    def test_tour_booking_confirmation_returns_false_when_smtp_is_not_configured(self):
        with patch.object(email_service, "SMTP_USERNAME", None), \
                patch.object(email_service, "SMTP_APP_PASSWORD", None), \
                patch.object(email_service.smtplib, "SMTP") as smtp_mock:
            result = self._send_booking_email()

        self.assertFalse(result)
        smtp_mock.assert_not_called()

    def test_tour_booking_confirmation_returns_false_when_smtp_fails(self):
        smtp_context = MagicMock()
        smtp_context.__enter__.side_effect = OSError("smtp unavailable")

        with patch.object(email_service, "SMTP_USERNAME", "project@example.com"), \
                patch.object(email_service, "SMTP_APP_PASSWORD", "app-password"), \
                patch.object(email_service.smtplib, "SMTP", return_value=smtp_context):
            result = self._send_booking_email()

        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()
