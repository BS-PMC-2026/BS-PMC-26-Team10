"""
Shared fixtures and TestClient for all integration tests.

The full FastAPI app (all routers + CORS middleware) is used so tests exercise
the real routing table. Supabase is never called — every test patches the DB
layer before making HTTP requests.
"""
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# ── path setup ────────────────────────────────────────────────────────────────
# Must happen before any Backend import so Python can resolve the package.
sys.path.insert(0, str(Path(__file__).parent.parent / "Backend"))

# Supabase client initialises at module-import time using env vars.
# Provide dummy values so the package loads cleanly without real credentials.
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key-for-integration-tests")

from fastapi.testclient import TestClient  # noqa: E402
from main import app  # noqa: E402  — full app with all routers + middleware

client = TestClient(app, raise_server_exceptions=True)


# ── tour fixture ──────────────────────────────────────────────────────────────

def make_tour_row(
    tour_id=1,
    title="Chili Farm Walk",
    date="2099-12-31",
    time_str="10:00:00",
    capacity=20,
    price=0.0,
    booked_count=0,
    confirmation_message="Keep your booking reference for future changes.",
):
    """17-element tuple matching the format returned by get_all_tours."""
    return (
        tour_id, title, "field-tasting",
        "A guided walk through the chili fields.",
        date, time_str, "90 min", capacity, price,
        "Main gate", "5 tastings", "mostly-yes", "public",
        "2026-01-01 10:00:00", booked_count,
        confirmation_message, None,
    )


# ── admin / auth fixtures ─────────────────────────────────────────────────────

# Pre-hash once at module load to avoid repeating the slow bcrypt operation.
from passlib.context import CryptContext  # noqa: E402
_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

TEST_ADMIN_EMAIL = "owner@chilliland.com"
TEST_ADMIN_PASSWORD = "TestPass123!"
_TEST_PASSWORD_HASH = _pwd_ctx.hash(TEST_ADMIN_PASSWORD)


def make_admin_row(
    admin_id=1,
    email=TEST_ADMIN_EMAIL,
    first_name="Farm",
    last_name="Owner",
    role="owner",
):
    return {
        "id": admin_id,
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "password_hash": _TEST_PASSWORD_HASH,
    }


def make_admin_supabase_mock(admin_row):
    """Supabase mock for admin_auth_services — returns admin_row on any query."""
    mock_sb = MagicMock()
    result = MagicMock()
    result.data = [admin_row]
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = result
    return mock_sb


def make_empty_supabase_mock():
    """Supabase mock that returns no rows — simulates unknown email / not found."""
    mock_sb = MagicMock()
    result = MagicMock()
    result.data = []
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = result
    return mock_sb


# ── promo fixtures ────────────────────────────────────────────────────────────

def make_promo_row(
    code="SAVE10",
    discount_type="percent",
    discount_value=10.0,
    is_active=True,
    min_order_amount=None,
    max_uses=None,
    used_count=0,
    valid_from=None,
    valid_until=None,
):
    return {
        "id": 1,
        "code": code,
        "discount_type": discount_type,
        "discount_value": discount_value,
        "is_active": is_active,
        "min_order_amount": min_order_amount,
        "max_uses": max_uses,
        "used_count": used_count,
        "valid_from": valid_from,
        "valid_until": valid_until,
    }


def make_promo_supabase_mock(promo_row=None):
    """Supabase mock for promo_services. Pass None to simulate code not found."""
    mock_sb = MagicMock()
    result = MagicMock()
    result.data = [promo_row] if promo_row is not None else []
    # Chain: .table().select().eq().limit().execute()
    mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = result
    return mock_sb
