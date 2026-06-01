"""
Unit tests for admin authentication service layer (BSPMT10-131-usn34).
No database connection required — psycopg2 is fully mocked.
"""
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from app.services.admin_auth_services import (
    JWT_ALGORITHM,
    JWT_SECRET,
    _decode_token,
    _hash,
    _make_token,
    _verify,
    create_password_reset_token,
    get_admin_from_token,
    login_admin,
    reset_password_with_token,
)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _mock_conn(fetchone_value=None, fetchone_side_effect=None):
    """Return (mock_conn, mock_cur) with a configurable cursor."""
    cur = MagicMock()
    cur.__enter__ = MagicMock(return_value=cur)
    cur.__exit__ = MagicMock(return_value=False)
    if fetchone_side_effect is not None:
        cur.fetchone.side_effect = fetchone_side_effect
    else:
        cur.fetchone.return_value = fetchone_value

    conn = MagicMock()
    conn.__enter__ = MagicMock(return_value=conn)
    conn.__exit__ = MagicMock(return_value=False)
    conn.cursor.return_value = cur
    return conn, cur


def _broken_conn():
    """Return a connection whose cursor() raises immediately."""
    conn = MagicMock()
    conn.__enter__ = MagicMock(return_value=conn)
    conn.__exit__ = MagicMock(return_value=False)
    conn.cursor.side_effect = Exception("DB down")
    return conn


# ── Password hashing ───────────────────────────────────────────────────────────

class PasswordHashTests(unittest.TestCase):
    def test_hash_differs_from_plain_text(self):
        self.assertNotEqual(_hash("mypassword"), "mypassword")

    def test_verify_correct_password_returns_true(self):
        self.assertTrue(_verify("secret123", _hash("secret123")))

    def test_verify_wrong_password_returns_false(self):
        self.assertFalse(_verify("wrongpass", _hash("secret123")))

    def test_two_hashes_of_same_password_differ(self):
        # bcrypt uses a random salt per call
        self.assertNotEqual(_hash("password"), _hash("password"))


# ── JWT ───────────────────────────────────────────────────────────────────────

class JwtTokenTests(unittest.TestCase):
    def test_make_token_returns_non_empty_string(self):
        token = _make_token(1, "admin@example.com")
        self.assertIsInstance(token, str)
        self.assertGreater(len(token), 20)

    def test_decode_valid_token_returns_correct_payload(self):
        token = _make_token(42, "test@example.com")
        payload = _decode_token(token)
        self.assertIsNotNone(payload)
        self.assertEqual(payload["sub"], "42")
        self.assertEqual(payload["email"], "test@example.com")
        self.assertEqual(payload["type"], "admin")

    def test_decode_garbage_string_returns_none(self):
        self.assertIsNone(_decode_token("not.a.valid.token"))

    def test_decode_tampered_signature_returns_none(self):
        token = _make_token(1, "admin@example.com")
        self.assertIsNone(_decode_token(token[:-5] + "XXXXX"))

    def test_token_with_wrong_type_is_rejected(self):
        from jose import jwt
        payload = {
            "sub": "1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
            "type": "visitor",
        }
        bad_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        self.assertIsNone(_decode_token(bad_token))

    def test_expired_token_returns_none(self):
        from jose import jwt
        payload = {
            "sub": "1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            "type": "admin",
        }
        expired = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        self.assertIsNone(_decode_token(expired))


# ── login_admin ────────────────────────────────────────────────────────────────

class LoginAdminTests(unittest.TestCase):
    def test_returns_error_for_nonexistent_email(self):
        conn, _ = _mock_conn(fetchone_value=None)
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = login_admin("nobody@example.com", "password")
        self.assertEqual(result["error"], "invalid_credentials")

    def test_returns_error_for_wrong_password(self):
        hashed = _hash("correctpassword")
        conn, _ = _mock_conn(fetchone_value=(1, "Jane", "Doe", "jane@example.com", hashed))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = login_admin("jane@example.com", "wrongpassword")
        self.assertEqual(result["error"], "invalid_credentials")

    def test_returns_token_on_correct_credentials(self):
        hashed = _hash("correctpassword")
        conn, _ = _mock_conn(fetchone_value=(1, "Jane", "Doe", "jane@example.com", hashed))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = login_admin("jane@example.com", "correctpassword")
        self.assertIn("token", result)
        self.assertEqual(result["admin"]["first_name"], "Jane")
        self.assertEqual(result["expires_in"], 600)

    def test_returns_server_error_on_db_exception(self):
        with patch("app.services.admin_auth_services.get_connection", return_value=_broken_conn()):
            result = login_admin("jane@example.com", "password")
        self.assertEqual(result["error"], "server_error")


# ── get_admin_from_token ───────────────────────────────────────────────────────

class GetAdminFromTokenTests(unittest.TestCase):
    def test_returns_none_for_invalid_token(self):
        self.assertIsNone(get_admin_from_token("not-a-valid-token"))

    def test_returns_admin_data_for_valid_token(self):
        token = _make_token(7, "admin@example.com")
        conn, _ = _mock_conn(fetchone_value=(7, "Jane", "Doe", "admin@example.com"))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = get_admin_from_token(token)
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 7)
        self.assertEqual(result["email"], "admin@example.com")

    def test_returns_none_when_admin_not_in_db(self):
        token = _make_token(99, "ghost@example.com")
        conn, _ = _mock_conn(fetchone_value=None)
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            self.assertIsNone(get_admin_from_token(token))

    def test_returns_none_on_db_exception(self):
        token = _make_token(1, "admin@example.com")
        with patch("app.services.admin_auth_services.get_connection", return_value=_broken_conn()):
            self.assertIsNone(get_admin_from_token(token))


# ── create_password_reset_token ────────────────────────────────────────────────

class CreatePasswordResetTokenTests(unittest.TestCase):
    def test_returns_none_for_nonexistent_email(self):
        conn, _ = _mock_conn(fetchone_value=None)
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            self.assertIsNone(create_password_reset_token("nobody@example.com"))

    def test_returns_token_and_name_for_existing_admin(self):
        conn, _ = _mock_conn(fetchone_value=(1, "Jane"))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = create_password_reset_token("jane@example.com")
        self.assertIsNotNone(result)
        token, first_name = result
        self.assertIsInstance(token, str)
        self.assertEqual(first_name, "Jane")

    def test_generated_token_is_url_safe(self):
        import re
        conn, _ = _mock_conn(fetchone_value=(1, "Jane"))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            token, _ = create_password_reset_token("jane@example.com")
        self.assertRegex(token, r'^[A-Za-z0-9_\-]+$')

    def test_each_call_generates_unique_token(self):
        conn1, _ = _mock_conn(fetchone_value=(1, "Jane"))
        conn2, _ = _mock_conn(fetchone_value=(1, "Jane"))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn1):
            token1, _ = create_password_reset_token("jane@example.com")
        with patch("app.services.admin_auth_services.get_connection", return_value=conn2):
            token2, _ = create_password_reset_token("jane@example.com")
        self.assertNotEqual(token1, token2)


# ── reset_password_with_token ──────────────────────────────────────────────────

class ResetPasswordWithTokenTests(unittest.TestCase):
    def _conn_for_token(self, token_row):
        cur = MagicMock()
        cur.__enter__ = MagicMock(return_value=cur)
        cur.__exit__ = MagicMock(return_value=False)
        cur.fetchone.return_value = token_row
        conn = MagicMock()
        conn.__enter__ = MagicMock(return_value=conn)
        conn.__exit__ = MagicMock(return_value=False)
        conn.cursor.return_value = cur
        return conn

    def test_returns_invalid_token_error_when_not_found(self):
        conn = self._conn_for_token(None)
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = reset_password_with_token("bad-token", "newpass123")
        self.assertEqual(result["error"], "invalid_token")

    def test_returns_token_used_error_for_already_used_token(self):
        used_at = datetime.now(timezone.utc)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        conn = self._conn_for_token((1, 5, expires_at, used_at))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = reset_password_with_token("used-token", "newpass123")
        self.assertEqual(result["error"], "token_used")

    def test_returns_token_expired_error_for_past_expiry(self):
        expires_at = datetime.now(timezone.utc) - timedelta(hours=2)
        conn = self._conn_for_token((1, 5, expires_at, None))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = reset_password_with_token("expired-token", "newpass123")
        self.assertEqual(result["error"], "token_expired")

    def test_returns_success_for_valid_unused_unexpired_token(self):
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        conn = self._conn_for_token((1, 5, expires_at, None))
        with patch("app.services.admin_auth_services.get_connection", return_value=conn):
            result = reset_password_with_token("valid-token", "newpass123")
        self.assertTrue(result.get("success"))

    def test_returns_server_error_on_db_exception(self):
        with patch("app.services.admin_auth_services.get_connection", return_value=_broken_conn()):
            result = reset_password_with_token("any-token", "newpass123")
        self.assertEqual(result["error"], "server_error")


if __name__ == "__main__":
    unittest.main()
