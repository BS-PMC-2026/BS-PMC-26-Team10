"""
Unit tests for admin authentication Pydantic models (BSPMT10-131-usn34).
No database connection required.
"""
import unittest
from pydantic import ValidationError

from app.models import AdminLogin, AdminRegister, ForgotPasswordRequest, ResetPasswordRequest


class AdminRegisterModelTests(unittest.TestCase):
    def _valid(self, **kwargs):
        defaults = dict(
            first_name="Jane",
            last_name="Doe",
            email="jane@example.com",
            password="securepass123",
        )
        defaults.update(kwargs)
        return AdminRegister(**defaults)

    def test_valid_model_is_created(self):
        m = self._valid()
        self.assertEqual(m.first_name, "Jane")
        self.assertEqual(m.last_name, "Doe")
        self.assertEqual(m.email, "jane@example.com")
        self.assertEqual(m.password, "securepass123")

    def test_missing_first_name_raises(self):
        with self.assertRaises(ValidationError):
            AdminRegister(last_name="Doe", email="jane@example.com", password="pass1234")

    def test_missing_last_name_raises(self):
        with self.assertRaises(ValidationError):
            AdminRegister(first_name="Jane", email="jane@example.com", password="pass1234")

    def test_missing_email_raises(self):
        with self.assertRaises(ValidationError):
            AdminRegister(first_name="Jane", last_name="Doe", password="pass1234")

    def test_missing_password_raises(self):
        with self.assertRaises(ValidationError):
            AdminRegister(first_name="Jane", last_name="Doe", email="jane@example.com")

    def test_all_fields_stored(self):
        m = self._valid(first_name="Alice", last_name="Smith", email="alice@farm.com", password="farmpass99")
        self.assertEqual(m.first_name, "Alice")
        self.assertEqual(m.last_name, "Smith")
        self.assertEqual(m.email, "alice@farm.com")
        self.assertEqual(m.password, "farmpass99")


class AdminLoginModelTests(unittest.TestCase):
    def test_valid_login_is_created(self):
        m = AdminLogin(email="admin@example.com", password="mypassword")
        self.assertEqual(m.email, "admin@example.com")
        self.assertEqual(m.password, "mypassword")

    def test_missing_email_raises(self):
        with self.assertRaises(ValidationError):
            AdminLogin(password="mypassword")

    def test_missing_password_raises(self):
        with self.assertRaises(ValidationError):
            AdminLogin(email="admin@example.com")

    def test_both_fields_missing_raises(self):
        with self.assertRaises(ValidationError):
            AdminLogin()


class ForgotPasswordRequestModelTests(unittest.TestCase):
    def test_valid_request_is_created(self):
        m = ForgotPasswordRequest(email="user@example.com")
        self.assertEqual(m.email, "user@example.com")

    def test_missing_email_raises(self):
        with self.assertRaises(ValidationError):
            ForgotPasswordRequest()


class ResetPasswordRequestModelTests(unittest.TestCase):
    def test_valid_request_is_created(self):
        m = ResetPasswordRequest(token="abc123token", new_password="newpass456")
        self.assertEqual(m.token, "abc123token")
        self.assertEqual(m.new_password, "newpass456")

    def test_missing_token_raises(self):
        with self.assertRaises(ValidationError):
            ResetPasswordRequest(new_password="newpass456")

    def test_missing_new_password_raises(self):
        with self.assertRaises(ValidationError):
            ResetPasswordRequest(token="abc123token")

    def test_both_fields_missing_raises(self):
        with self.assertRaises(ValidationError):
            ResetPasswordRequest()


if __name__ == "__main__":
    unittest.main()
