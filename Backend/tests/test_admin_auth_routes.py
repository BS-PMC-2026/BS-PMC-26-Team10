"""
Integration tests for admin authentication API endpoints (BSPMT10-131-usn34).
Uses FastAPI TestClient — no real database connection required.
"""
import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes.admin_auth import router

_app = FastAPI()
_app.include_router(router)
client = TestClient(_app, raise_server_exceptions=False)

_VALID_ADMIN = {
    "id": 1,
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
}

_VALID_TOKEN_RESPONSE = {
    "token": "header.payload.signature",
    "expires_in": 600,
    "admin": _VALID_ADMIN,
}


# ── POST /admin/login ──────────────────────────────────────────────────────────

class LoginRouteTests(unittest.TestCase):
    def _post(self, body):
        return client.post("/admin/login", json=body)

    def test_invalid_credentials_returns_401(self):
        mock = {"error": "invalid_credentials", "message": "Invalid email or password."}
        with patch("app.routes.admin_auth.login_admin", return_value=mock):
            self.assertEqual(self._post({"email": "a@b.com", "password": "wrong"}).status_code, 401)

    def test_successful_login_returns_200(self):
        with patch("app.routes.admin_auth.login_admin", return_value=_VALID_TOKEN_RESPONSE):
            self.assertEqual(self._post({"email": "a@b.com", "password": "right"}).status_code, 200)

    def test_successful_login_returns_token(self):
        with patch("app.routes.admin_auth.login_admin", return_value=_VALID_TOKEN_RESPONSE):
            data = self._post({"email": "a@b.com", "password": "right"}).json()
        self.assertIn("token", data)
        self.assertEqual(data["admin"]["first_name"], "Jane")

    def test_missing_email_returns_422(self):
        self.assertEqual(self._post({"password": "somepass"}).status_code, 422)

    def test_missing_password_returns_422(self):
        self.assertEqual(self._post({"email": "admin@example.com"}).status_code, 422)

    def test_server_error_returns_500(self):
        mock = {"error": "server_error", "message": "Login failed."}
        with patch("app.routes.admin_auth.login_admin", return_value=mock):
            self.assertEqual(self._post({"email": "a@b.com", "password": "x"}).status_code, 500)


# ── GET /admin/me ──────────────────────────────────────────────────────────────

class GetMeRouteTests(unittest.TestCase):
    def _get(self, token=None):
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        return client.get("/admin/me", headers=headers)

    def test_no_authorization_header_returns_401(self):
        self.assertEqual(client.get("/admin/me").status_code, 401)

    def test_malformed_header_non_bearer_returns_401(self):
        res = client.get("/admin/me", headers={"Authorization": "Token abc123"})
        self.assertEqual(res.status_code, 401)

    def test_invalid_token_returns_401(self):
        with patch("app.routes.admin_auth.get_admin_from_token", return_value=None):
            self.assertEqual(self._get("bad.token.here").status_code, 401)

    def test_valid_token_returns_200_with_admin_data(self):
        with patch("app.routes.admin_auth.get_admin_from_token", return_value=_VALID_ADMIN):
            res = self._get("valid.token.here")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["email"], "jane@example.com")

    def test_valid_token_returns_all_admin_fields(self):
        with patch("app.routes.admin_auth.get_admin_from_token", return_value=_VALID_ADMIN):
            data = self._get("valid.token.here").json()
        self.assertIn("id", data)
        self.assertIn("first_name", data)
        self.assertIn("last_name", data)
        self.assertIn("email", data)


# ── POST /admin/forgot-password ────────────────────────────────────────────────

class ForgotPasswordRouteTests(unittest.TestCase):
    def _post(self, body):
        return client.post("/admin/forgot-password", json=body)

    def test_returns_200_when_admin_found(self):
        with patch("app.routes.admin_auth.create_password_reset_token", return_value=("tok", "Jane")), \
             patch("app.routes.admin_auth.send_password_reset_email"):
            self.assertEqual(self._post({"email": "jane@example.com"}).status_code, 200)

    def test_returns_200_when_admin_not_found(self):
        """Email enumeration prevention: same status whether email exists or not."""
        with patch("app.routes.admin_auth.create_password_reset_token", return_value=None):
            self.assertEqual(self._post({"email": "nobody@example.com"}).status_code, 200)

    def test_response_message_is_same_regardless_of_email_existence(self):
        with patch("app.routes.admin_auth.create_password_reset_token", return_value=("tok", "Jane")), \
             patch("app.routes.admin_auth.send_password_reset_email"):
            msg_found = self._post({"email": "jane@example.com"}).json()["message"]

        with patch("app.routes.admin_auth.create_password_reset_token", return_value=None):
            msg_not_found = self._post({"email": "nobody@example.com"}).json()["message"]

        self.assertEqual(msg_found, msg_not_found)

    def test_email_is_sent_when_admin_exists(self):
        with patch("app.routes.admin_auth.create_password_reset_token", return_value=("tok", "Jane")), \
             patch("app.routes.admin_auth.send_password_reset_email") as mock_email:
            self._post({"email": "jane@example.com"})
        mock_email.assert_called_once()

    def test_email_is_not_sent_when_admin_does_not_exist(self):
        with patch("app.routes.admin_auth.create_password_reset_token", return_value=None), \
             patch("app.routes.admin_auth.send_password_reset_email") as mock_email:
            self._post({"email": "nobody@example.com"})
        mock_email.assert_not_called()

    def test_missing_email_field_returns_422(self):
        self.assertEqual(self._post({}).status_code, 422)


# ── POST /admin/reset-password ─────────────────────────────────────────────────

class ResetPasswordRouteTests(unittest.TestCase):
    def _post(self, body):
        return client.post("/admin/reset-password", json=body)

    def test_short_password_returns_422(self):
        self.assertEqual(self._post({"token": "abc", "new_password": "short"}).status_code, 422)

    def test_missing_token_returns_422(self):
        self.assertEqual(self._post({"new_password": "newpass123"}).status_code, 422)

    def test_missing_new_password_returns_422(self):
        self.assertEqual(self._post({"token": "abc"}).status_code, 422)

    def test_invalid_token_returns_400(self):
        mock = {"error": "invalid_token", "message": "Invalid or expired reset link."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            self.assertEqual(self._post({"token": "bad", "new_password": "newpass123"}).status_code, 400)

    def test_expired_token_returns_400(self):
        mock = {"error": "token_expired", "message": "This reset link has expired."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            self.assertEqual(self._post({"token": "exp", "new_password": "newpass123"}).status_code, 400)

    def test_used_token_returns_400(self):
        mock = {"error": "token_used", "message": "This reset link has already been used."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            self.assertEqual(self._post({"token": "used", "new_password": "newpass123"}).status_code, 400)

    def test_valid_token_returns_200(self):
        mock = {"success": True, "message": "Password reset successfully."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            self.assertEqual(self._post({"token": "valid", "new_password": "newpass123"}).status_code, 200)

    def test_valid_token_returns_success_in_body(self):
        mock = {"success": True, "message": "Password reset successfully."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            data = self._post({"token": "valid", "new_password": "newpass123"}).json()
        self.assertTrue(data.get("success"))

    def test_server_error_returns_500(self):
        mock = {"error": "server_error", "message": "Password reset failed."}
        with patch("app.routes.admin_auth.reset_password_with_token", return_value=mock):
            self.assertEqual(self._post({"token": "x", "new_password": "newpass123"}).status_code, 500)


if __name__ == "__main__":
    unittest.main()
