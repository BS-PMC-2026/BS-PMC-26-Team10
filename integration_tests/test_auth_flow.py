"""
Auth integration flow tests.

Covers: login → receive JWT → use token on protected route → token rejected.

The supabase DB layer is mocked throughout. Real JWT generation and
verification happens so the token produced in step 1 is the same token
validated in step 2 — that's the integration being tested.
"""
import unittest
from unittest.mock import MagicMock, patch

from helpers import (
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    client,
    make_admin_row,
    make_admin_supabase_mock,
    make_empty_supabase_mock,
)

_AUTH_PATCH = "app.services.admin_auth_services.supabase"


class LoginTests(unittest.TestCase):

    def test_valid_credentials_return_200(self):
        with patch(_AUTH_PATCH, make_admin_supabase_mock(make_admin_row())):
            resp = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            })
        self.assertEqual(resp.status_code, 200)

    def test_login_response_contains_token(self):
        with patch(_AUTH_PATCH, make_admin_supabase_mock(make_admin_row())):
            data = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            }).json()
        self.assertIn("token", data)
        self.assertIsInstance(data["token"], str)
        self.assertTrue(len(data["token"]) > 20)

    def test_login_response_contains_admin_info(self):
        with patch(_AUTH_PATCH, make_admin_supabase_mock(make_admin_row(first_name="Farm"))):
            data = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            }).json()
        self.assertEqual(data["admin"]["email"], TEST_ADMIN_EMAIL)
        self.assertEqual(data["admin"]["first_name"], "Farm")

    def test_wrong_password_returns_401(self):
        with patch(_AUTH_PATCH, make_admin_supabase_mock(make_admin_row())):
            resp = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": "wrongpassword",
            })
        self.assertEqual(resp.status_code, 401)

    def test_unknown_email_returns_401(self):
        with patch(_AUTH_PATCH, make_empty_supabase_mock()):
            resp = client.post("/admin/login", json={
                "email": "nobody@example.com", "password": TEST_ADMIN_PASSWORD,
            })
        self.assertEqual(resp.status_code, 401)


class ProtectedRouteTests(unittest.TestCase):

    def _get_token(self, row=None):
        row = row or make_admin_row()
        with patch(_AUTH_PATCH, make_admin_supabase_mock(row)):
            return client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            }).json()["token"]

    def test_valid_token_returns_200_on_me(self):
        row = make_admin_row()
        token = self._get_token(row)
        with patch(_AUTH_PATCH, make_admin_supabase_mock(row)):
            resp = client.get("/admin/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)

    def test_me_returns_correct_admin_details(self):
        row = make_admin_row(first_name="Farm", last_name="Owner")
        token = self._get_token(row)
        with patch(_AUTH_PATCH, make_admin_supabase_mock(row)):
            data = client.get("/admin/me", headers={"Authorization": f"Bearer {token}"}).json()
        self.assertEqual(data["email"], TEST_ADMIN_EMAIL)
        self.assertEqual(data["first_name"], "Farm")

    def test_invalid_token_returns_401(self):
        resp = client.get("/admin/me", headers={"Authorization": "Bearer not-a-real-token"})
        self.assertEqual(resp.status_code, 401)

    def test_missing_auth_header_returns_401(self):
        resp = client.get("/admin/me")
        self.assertEqual(resp.status_code, 401)

    def test_malformed_bearer_prefix_returns_401(self):
        resp = client.get("/admin/me", headers={"Authorization": "Token abc123"})
        self.assertEqual(resp.status_code, 401)


class LoginThenAccessFlowTests(unittest.TestCase):
    """Multi-step: token from POST /admin/login feeds GET /admin/me."""

    def test_token_from_login_works_on_protected_route(self):
        row = make_admin_row()
        mock_sb = make_admin_supabase_mock(row)
        with patch(_AUTH_PATCH, mock_sb):
            token = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            }).json()["token"]
            resp = client.get("/admin/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(resp.status_code, 200)

    def test_tampered_token_rejected_on_protected_route(self):
        row = make_admin_row()
        with patch(_AUTH_PATCH, make_admin_supabase_mock(row)):
            real_token = client.post("/admin/login", json={
                "email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD,
            }).json()["token"]

        tampered = real_token[:-4] + "XXXX"
        resp = client.get("/admin/me", headers={"Authorization": f"Bearer {tampered}"})
        self.assertEqual(resp.status_code, 401)


if __name__ == "__main__":
    unittest.main()
