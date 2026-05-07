from datetime import datetime, timezone
from app.db2 import supabase


def _parse_ts(ts_str):
    if not ts_str:
        return None
    s = str(ts_str).strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError:
        return None


def validate_promo_code(code: str, order_amount: float):
    try:
        response = supabase.table("promo_codes").select("*").eq("code", code.upper().strip()).limit(1).execute()
        if not response.data:
            return {"valid": False, "message": "Promo code not found."}

        p = response.data[0]

        if not p["is_active"]:
            return {"valid": False, "message": "This promo code is no longer active."}

        now = datetime.now(timezone.utc)
        valid_from = _parse_ts(p.get("valid_from"))
        valid_until = _parse_ts(p.get("valid_until"))

        if valid_from and now < valid_from:
            return {"valid": False, "message": "This promo code is not yet valid."}

        if valid_until and now > valid_until:
            return {"valid": False, "message": "This promo code has expired."}

        if p["max_uses"] is not None and p["used_count"] >= p["max_uses"]:
            return {"valid": False, "message": "This promo code has reached its maximum number of uses."}

        min_order = float(p["min_order_amount"]) if p.get("min_order_amount") is not None else None
        if min_order is not None and order_amount < min_order:
            return {"valid": False, "message": f"This code requires a minimum order of ₪{min_order:.2f}."}

        discount_value = float(p["discount_value"])
        if p["discount_type"] == "percent":
            discount_amount = round(order_amount * discount_value / 100, 2)
            message = f"{discount_value:g}% discount applied!"
        else:
            discount_amount = round(min(discount_value, order_amount), 2)
            message = f"₪{discount_value:.2f} discount applied!"

        return {
            "valid": True,
            "code": p["code"],
            "discount_type": p["discount_type"],
            "discount_value": discount_value,
            "discount_amount": discount_amount,
            "message": message,
        }
    except Exception as e:
        print("Error validating promo code:\n", e)
        return {"valid": False, "message": "Could not validate promo code. Try again."}


def create_promo_code(promo_data: dict):
    try:
        supabase.table("promo_codes").insert({
            "code": promo_data["code"].upper().strip(),
            "discount_type": promo_data["discount_type"],
            "discount_value": promo_data["discount_value"],
            "min_order_amount": promo_data.get("min_order_amount"),
            "max_uses": promo_data.get("max_uses"),
            "valid_from": promo_data.get("valid_from") or None,
            "valid_until": promo_data.get("valid_until") or None,
            "is_active": promo_data.get("is_active", True),
        }).execute()
        return "Promo code created successfully!"
    except Exception as e:
        print("Error creating promo code:\n", e)
        return None


def get_all_promo_codes():
    try:
        response = supabase.table("promo_codes").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print("Error fetching promo codes:\n", e)
        return []


def update_promo_code(code_id: int, promo_data: dict):
    try:
        supabase.table("promo_codes").update({
            "code": promo_data["code"].upper().strip(),
            "discount_type": promo_data["discount_type"],
            "discount_value": promo_data["discount_value"],
            "min_order_amount": promo_data.get("min_order_amount"),
            "max_uses": promo_data.get("max_uses"),
            "valid_from": promo_data.get("valid_from") or None,
            "valid_until": promo_data.get("valid_until") or None,
            "is_active": promo_data.get("is_active", True),
        }).eq("id", code_id).execute()
        return "Promo code updated successfully!"
    except Exception as e:
        print("Error updating promo code:\n", e)
        return None


def delete_promo_code(code_id: int):
    try:
        check = supabase.table("promo_codes").select("id").eq("id", code_id).limit(1).execute()
        if not check.data:
            return None
        supabase.table("promo_codes").delete().eq("id", code_id).execute()
        return True
    except Exception as e:
        print("Error deleting promo code:\n", e)
        return False


def increment_promo_usage(code: str):
    try:
        resp = supabase.table("promo_codes").select("used_count").eq("code", code.upper()).limit(1).execute()
        if resp.data:
            new_count = (resp.data[0]["used_count"] or 0) + 1
            supabase.table("promo_codes").update({"used_count": new_count}).eq("code", code.upper()).execute()
    except Exception as e:
        print("Error incrementing promo usage:\n", e)
