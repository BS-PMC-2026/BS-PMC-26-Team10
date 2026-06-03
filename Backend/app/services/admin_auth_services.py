import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.db2 import supabase

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 10
RESET_TOKEN_EXPIRE_HOURS = 1

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash(password: str) -> str:
    return _pwd.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def _make_token(admin_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(admin_id), "email": email, "exp": expire, "type": "admin"},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def _decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "admin":
            return None
        return payload
    except JWTError:
        return None


def login_admin(email: str, password: str) -> dict:
    try:
        result = supabase.table("admin_users").select("id, first_name, last_name, email, password_hash, role").eq("email", email).execute()
        if not result.data:
            return {"error": "invalid_credentials", "message": "Invalid email or password."}

        row = result.data[0]
        if not _verify(password, row["password_hash"]):
            return {"error": "invalid_credentials", "message": "Invalid email or password."}

        token = _make_token(row["id"], row["email"])
        return {
            "token": token,
            "expires_in": JWT_EXPIRE_MINUTES * 60,
            "admin": {"id": row["id"], "first_name": row["first_name"], "last_name": row["last_name"], "email": row["email"], "role": row.get("role")},
        }
    except Exception as e:
        print("login_admin error:", e)
        return {"error": "server_error", "message": "Login failed. Please try again."}


def get_admin_from_token(token: str) -> Optional[dict]:
    payload = _decode_token(token)
    if not payload:
        return None

    try:
        result = supabase.table("admin_users").select("id, first_name, last_name, email, role").eq("id", int(payload["sub"])).execute()
        result = supabase.table("admin_users").select("id, first_name, last_name, email, role").eq("id", int(payload["sub"])).execute()
        if not result.data:
            return None
        row = result.data[0]
        return {"id": row["id"], "first_name": row["first_name"], "last_name": row["last_name"], "email": row["email"], "role": row.get("role")}
    except Exception as e:
        print("get_admin_from_token error:", e)
        return None


def create_password_reset_token(email: str) -> Optional[tuple]:
    """Returns (token, first_name) or None if admin not found."""
    try:
        result = supabase.table("admin_users").select("id, first_name").eq("email", email).execute()
        if not result.data:
            return None

        row = result.data[0]
        admin_id = row["id"]
        first_name = row["first_name"]
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)).isoformat()

        supabase.table("password_reset_token").delete().eq("admin_id", admin_id).execute()
        supabase.table("password_reset_token").insert({
            "admin_id": admin_id,
            "token": token,
            "expires_at": expires_at,
        }).execute()
        return (token, first_name)
    except Exception as e:
        print("create_password_reset_token error:", e)
        return None


def reset_password_with_token(token: str, new_password: str) -> dict:
    try:
        result = supabase.table("password_reset_token").select("id, admin_id, expires_at, used_at").eq("token", token).execute()
        if not result.data:
            return {"error": "invalid_token", "message": "Invalid or expired reset link."}

        row = result.data[0]
        token_id = row["id"]
        admin_id = row["admin_id"]
        used_at = row["used_at"]

        if used_at is not None:
            return {"error": "token_used", "message": "This reset link has already been used."}

        expires_at = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            return {"error": "token_expired", "message": "This reset link has expired. Please request a new one."}

        supabase.table("admin_users").update({
            "password_hash": _hash(new_password),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", admin_id).execute()

        supabase.table("password_reset_token").update({
            "used_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", token_id).execute()

        return {"success": True, "message": "Password reset successfully."}
    except Exception as e:
        print("reset_password_with_token error:", e)
        return {"error": "server_error", "message": "Password reset failed. Please try again."}
