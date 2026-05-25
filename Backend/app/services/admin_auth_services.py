import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.db import get_connection

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


def register_admin(first_name: str, last_name: str, email: str, password: str) -> dict:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM admin_users WHERE email = %s", (email,))
                if cur.fetchone():
                    return {"error": "email_taken", "message": "An admin with this email already exists."}

                cur.execute(
                    """
                    INSERT INTO admin_users (first_name, last_name, email, password_hash)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, first_name, last_name, email
                    """,
                    (first_name, last_name, email, _hash(password)),
                )
                row = cur.fetchone()
                token = _make_token(row[0], row[3])
                return {
                    "token": token,
                    "expires_in": JWT_EXPIRE_MINUTES * 60,
                    "admin": {"id": row[0], "first_name": row[1], "last_name": row[2], "email": row[3]},
                }
    except Exception as e:
        print("register_admin error:", e)
        return {"error": "server_error", "message": "Registration failed. Please try again."}
    finally:
        conn.close()


def login_admin(email: str, password: str) -> dict:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, email, password_hash FROM admin_users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            if not row or not _verify(password, row[4]):
                return {"error": "invalid_credentials", "message": "Invalid email or password."}

            token = _make_token(row[0], row[3])
            return {
                "token": token,
                "expires_in": JWT_EXPIRE_MINUTES * 60,
                "admin": {"id": row[0], "first_name": row[1], "last_name": row[2], "email": row[3]},
            }
    except Exception as e:
        print("login_admin error:", e)
        return {"error": "server_error", "message": "Login failed. Please try again."}
    finally:
        conn.close()


def get_admin_from_token(token: str) -> Optional[dict]:
    payload = _decode_token(token)
    if not payload:
        return None

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, first_name, last_name, email FROM admin_users WHERE id = %s",
                (int(payload["sub"]),),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {"id": row[0], "first_name": row[1], "last_name": row[2], "email": row[3]}
    except Exception as e:
        print("get_admin_from_token error:", e)
        return None
    finally:
        conn.close()


def create_password_reset_token(email: str) -> Optional[tuple]:
    """Returns (token, first_name) or None if admin not found."""
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, first_name FROM admin_users WHERE email = %s", (email,))
                row = cur.fetchone()
                if not row:
                    return None

                admin_id, first_name = row
                token = secrets.token_urlsafe(32)
                expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

                cur.execute("DELETE FROM password_reset_tokens WHERE admin_id = %s", (admin_id,))
                cur.execute(
                    "INSERT INTO password_reset_tokens (admin_id, token, expires_at) VALUES (%s, %s, %s)",
                    (admin_id, token, expires_at),
                )
                return (token, first_name)
    except Exception as e:
        print("create_password_reset_token error:", e)
        return None
    finally:
        conn.close()


def reset_password_with_token(token: str, new_password: str) -> dict:
    conn = get_connection()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, admin_id, expires_at, used_at FROM password_reset_tokens WHERE token = %s",
                    (token,),
                )
                row = cur.fetchone()
                if not row:
                    return {"error": "invalid_token", "message": "Invalid or expired reset link."}

                token_id, admin_id, expires_at, used_at = row

                if used_at is not None:
                    return {"error": "token_used", "message": "This reset link has already been used."}

                if datetime.now(timezone.utc) > expires_at:
                    return {"error": "token_expired", "message": "This reset link has expired. Please request a new one."}

                cur.execute(
                    "UPDATE admin_users SET password_hash = %s, updated_at = NOW() WHERE id = %s",
                    (_hash(new_password), admin_id),
                )
                cur.execute(
                    "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = %s",
                    (token_id,),
                )
                return {"success": True, "message": "Password reset successfully."}
    except Exception as e:
        print("reset_password_with_token error:", e)
        return {"error": "server_error", "message": "Password reset failed. Please try again."}
    finally:
        conn.close()
