import re
import secrets
from datetime import datetime, timezone

from app.db2 import supabase
from app.services.email_service import send_subscription_update


CATEGORY_COLUMNS = {
    "events": "events_enabled",
    "discounts": "discounts_enabled",
    "new_products": "new_products_enabled",
}

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(email: str) -> str:
    normalized = (email or "").strip().lower()
    if not EMAIL_PATTERN.match(normalized):
        raise ValueError("Please enter a valid email address.")
    return normalized


def _has_selected_category(data: dict) -> bool:
    return any(bool(data.get(column)) for column in CATEGORY_COLUMNS.values())


def _new_unsubscribe_token() -> str:
    return secrets.token_urlsafe(32)


def save_subscription(data: dict):
    email = _normalize_email(data.get("email"))
    if not data.get("consent_given"):
        raise ValueError("Consent is required to receive email updates.")
    if not _has_selected_category(data):
        raise ValueError("Please select at least one update category.")

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "email": email,
        "events_enabled": bool(data.get("events_enabled")),
        "discounts_enabled": bool(data.get("discounts_enabled")),
        "new_products_enabled": bool(data.get("new_products_enabled")),
        "consent_given": True,
        "is_active": True,
        "unsubscribe_token": _new_unsubscribe_token(),
        "updated_at": now,
    }

    existing = (
        supabase.table("notification_subscriptions")
        .select("id")
        .eq("email", email)
        .limit(1)
        .execute()
    )

    if existing.data:
        response = (
            supabase.table("notification_subscriptions")
            .update(payload)
            .eq("id", existing.data[0]["id"])
            .execute()
        )
        message = "Your update preferences were saved."
    else:
        payload["created_at"] = now
        response = supabase.table("notification_subscriptions").insert(payload).execute()
        message = "You are now subscribed to ChiliLand updates."

    return {
        "message": message,
        "subscription": response.data[0] if response.data else payload,
    }


def unsubscribe(email: str) -> bool:
    normalized = _normalize_email(email)
    existing = (
        supabase.table("notification_subscriptions")
        .select("id")
        .eq("email", normalized)
        .limit(1)
        .execute()
    )
    if not existing.data:
        return False

    (
        supabase.table("notification_subscriptions")
        .update({
            "is_active": False,
            "consent_given": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", existing.data[0]["id"])
        .execute()
    )
    return True


def unsubscribe_by_token(token: str) -> bool:
    clean_token = (token or "").strip()
    if not clean_token:
        raise ValueError("Unsubscribe token is required.")

    existing = (
        supabase.table("notification_subscriptions")
        .select("id")
        .eq("unsubscribe_token", clean_token)
        .limit(1)
        .execute()
    )
    if not existing.data:
        return False

    (
        supabase.table("notification_subscriptions")
        .update({
            "is_active": False,
            "consent_given": False,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", existing.data[0]["id"])
        .execute()
    )
    return True


def get_subscription_stats():
    response = (
        supabase.table("notification_subscriptions")
        .select("events_enabled, discounts_enabled, new_products_enabled, is_active")
        .execute()
    )
    rows = response.data or []
    active = [row for row in rows if row.get("is_active")]
    return {
        "active_subscribers": len(active),
        "events": sum(bool(row.get("events_enabled")) for row in active),
        "discounts": sum(bool(row.get("discounts_enabled")) for row in active),
        "new_products": sum(bool(row.get("new_products_enabled")) for row in active),
    }


def send_update(category: str, subject: str, message: str):
    category_key = (category or "").strip().lower()
    if category_key not in CATEGORY_COLUMNS:
        raise ValueError("Unknown update category.")

    clean_subject = (subject or "").strip()
    clean_message = (message or "").strip()
    if not clean_subject or not clean_message:
        raise ValueError("Subject and message are required.")

    category_column = CATEGORY_COLUMNS[category_key]
    response = (
        supabase.table("notification_subscriptions")
        .select("id, email, unsubscribe_token")
        .eq("is_active", True)
        .eq(category_column, True)
        .execute()
    )
    rows = [row for row in (response.data or []) if row.get("email")]

    sent = 0
    failed = 0
    for row in rows:
        unsubscribe_token = row.get("unsubscribe_token") or _new_unsubscribe_token()
        if not row.get("unsubscribe_token"):
            (
                supabase.table("notification_subscriptions")
                .update({
                    "unsubscribe_token": unsubscribe_token,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })
                .eq("id", row["id"])
                .execute()
            )

        if send_subscription_update(row["email"], clean_subject, clean_message, category_key, unsubscribe_token):
            sent += 1
        else:
            failed += 1

    return {
        "message": "Update sending completed.",
        "recipients": len(rows),
        "sent": sent,
        "failed": failed,
    }
