import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException

from app.models import AdminLogin, ForgotPasswordRequest, ResetPasswordRequest
from app.services.admin_auth_services import (
    create_password_reset_token,
    get_admin_from_token,
    login_admin,
    reset_password_with_token,
)
from app.services.email_service import send_password_reset_email

load_dotenv()

router = APIRouter(prefix="/admin")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

_HTTP_STATUS = {
    "email_taken": 409,
    "invalid_credentials": 401,
    "invalid_token": 400,
    "token_used": 400,
    "token_expired": 400,
    "server_error": 500,
}



@router.post("/login")
def admin_login(data: AdminLogin):
    result = login_admin(data.email, data.password)
    if "error" in result:
        raise HTTPException(_HTTP_STATUS.get(result["error"], 400), result["message"])
    return result


@router.get("/me")
def get_current_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated.")
    token = authorization.split(" ", 1)[1]
    admin = get_admin_from_token(token)
    if not admin:
        raise HTTPException(401, "Invalid or expired session.")
    return admin


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    result = create_password_reset_token(data.email)
    if result:
        token, first_name = result
        reset_url = f"{FRONTEND_URL}/staffLogin?reset={token}"
        send_password_reset_email(data.email, reset_url, first_name)
    # Always return the same message to prevent email enumeration
    return {"message": "If an admin account with this email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    if len(data.new_password) < 8:
        raise HTTPException(422, "Password must be at least 8 characters.")
    result = reset_password_with_token(data.token, data.new_password)
    if "error" in result:
        raise HTTPException(_HTTP_STATUS.get(result["error"], 400), result["message"])
    return result
