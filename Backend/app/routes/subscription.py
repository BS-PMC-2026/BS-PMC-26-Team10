from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from app.services.admin_auth_services import get_admin_from_token
from app.services.subscription_services import (
    get_subscription_stats,
    save_subscription,
    send_update,
    unsubscribe,
    unsubscribe_by_token,
)


router = APIRouter(prefix="/subscriptions")


class SubscriptionRequest(BaseModel):
    email: str
    events_enabled: bool = False
    discounts_enabled: bool = False
    new_products_enabled: bool = False
    consent_given: bool = False


class UnsubscribeRequest(BaseModel):
    email: str


class SendUpdateRequest(BaseModel):
    category: str
    subject: str
    message: str


def _require_admin(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    if not get_admin_from_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired session.")


@router.post("")
def create_or_update_subscription(request: SubscriptionRequest):
    try:
        return save_subscription(request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print("Error saving subscription:\n", exc)
        raise HTTPException(status_code=500, detail="Could not save subscription.") from exc


@router.post("/unsubscribe")
def unsubscribe_from_updates(request: UnsubscribeRequest):
    try:
        if not unsubscribe(request.email):
            raise HTTPException(status_code=404, detail="No subscription was found for this email.")
        return {"message": "You have been unsubscribed from ChiliLand updates."}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print("Error unsubscribing:\n", exc)
        raise HTTPException(status_code=500, detail="Could not unsubscribe.") from exc


@router.get("/unsubscribe/{token}", response_class=HTMLResponse)
def unsubscribe_from_email(token: str):
    try:
        if not unsubscribe_by_token(token):
            return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"/><title>ChiliLand Updates</title></head>
            <body style="margin:0;background:#fdf7f0;font-family:Arial,sans-serif;color:#4a2a1f;">
              <main style="max-width:560px;margin:80px auto;padding:36px;background:#fff;border:1px solid #ead6c6;border-radius:12px;text-align:center;">
                <h1>Subscription not found</h1>
                <p>This unsubscribe link is invalid or has already been used.</p>
              </main>
            </body>
            </html>
            """

        return """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"/><title>ChiliLand Updates</title></head>
        <body style="margin:0;background:#fdf7f0;font-family:Arial,sans-serif;color:#4a2a1f;">
          <main style="max-width:560px;margin:80px auto;padding:36px;background:#fff;border:1px solid #ead6c6;border-radius:12px;text-align:center;">
            <p style="margin:0 0 8px;color:#a14d2a;font-weight:700;">ChiliLand Farm</p>
            <h1>You have been unsubscribed</h1>
            <p>You will no longer receive ChiliLand event, discount, or product updates.</p>
          </main>
        </body>
        </html>
        """
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print("Error unsubscribing by token:\n", exc)
        raise HTTPException(status_code=500, detail="Could not unsubscribe.") from exc


@router.get("/stats")
def subscription_stats(authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    try:
        return get_subscription_stats()
    except Exception as exc:
        print("Error loading subscription stats:\n", exc)
        raise HTTPException(status_code=500, detail="Could not load subscription statistics.") from exc


@router.post("/send-update")
def send_subscriber_update(request: SendUpdateRequest, authorization: Optional[str] = Header(None)):
    _require_admin(authorization)
    try:
        return send_update(request.category, request.subject, request.message)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        print("Error sending subscriber update:\n", exc)
        raise HTTPException(status_code=500, detail="Could not send the update.") from exc
