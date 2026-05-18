import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

try:
    import resend
except ImportError:
    resend = None

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")
SMTP_SENDER_EMAIL = os.getenv("SMTP_SENDER_EMAIL", SMTP_USERNAME or SENDER_EMAIL)

if resend:
    resend.api_key = RESEND_API_KEY


def _send_smtp_email(to_email, subject, html):
    if not SMTP_USERNAME or not SMTP_APP_PASSWORD:
        print("Gmail SMTP is not configured; email was not sent.")
        return False

    message = EmailMessage()
    message["From"] = SMTP_SENDER_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content("This email requires an HTML-capable email client.")
    message.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USERNAME, SMTP_APP_PASSWORD)
            smtp.send_message(message)
        print("Email sent via Gmail SMTP.")
        return True
    except Exception as e:
        print("Failed to send email via Gmail SMTP:", e)
        return False


def send_order_confirmation(order_id, customer_name, customer_email, items, total_amount):
    items_rows = "".join([
        f"""
        <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f2e4db;color:#3a2a20;">{item['name']}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f2e4db;color:#3a2a20;text-align:center;">{item['quantity']}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f2e4db;color:#a14d2a;text-align:right;font-weight:600;">₪{item['unit_price']:.2f}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f2e4db;color:#a14d2a;text-align:right;font-weight:700;">₪{item['total_price']:.2f}</td>
        </tr>
        """
        for item in items
    ])

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#fdf7f0;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7f0;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <tr>
                <td style="background:#4a2a1f;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e4a97a;font-weight:600;">ChiliLand Farm</p>
                    <h1 style="margin:0;font-size:32px;color:#ffffff;font-weight:700;">Order Confirmed 🌶</h1>
                    <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.7);">Thank you for your order, {customer_name}!</p>
                </td>
            </tr>

            <tr>
                <td style="background:#a14d2a;padding:14px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:1px;">ORDER NUMBER</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;">#{order_id}</p>
                </td>
            </tr>

            <tr>
                <td style="background:#ffffff;padding:36px 40px;">
                    <p style="margin:0 0 24px;font-size:15px;color:#7b5c4d;line-height:1.6;">
                        Your fiery order is on its way! Here's a summary of what you ordered.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efd8cc;border-radius:10px;overflow:hidden;">
                        <tr style="background:#fdf7f0;">
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#a07060;text-transform:uppercase;letter-spacing:1px;">Product</th>
                            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#a07060;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#a07060;text-transform:uppercase;letter-spacing:1px;">Unit Price</th>
                            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#a07060;text-transform:uppercase;letter-spacing:1px;">Total</th>
                        </tr>
                        {items_rows}
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                        <tr>
                            <td style="font-size:18px;font-weight:700;color:#3a2a20;">Total Paid</td>
                            <td style="font-size:22px;font-weight:700;color:#a14d2a;text-align:right;">₪{total_amount:.2f}</td>
                        </tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #efd8cc;margin:28px 0;"/>
                    <p style="margin:0;font-size:14px;color:#7b5c4d;line-height:1.7;">
                        We'll be in touch shortly with shipping details.
                    </p>
                </td>
            </tr>

            <tr>
                <td style="background:#fdf7f0;border:1px solid #efd8cc;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#a07060;">🌶 ChiliLand Farm · Grown with fire, packed with love</p>
                </td>
            </tr>

        </table>
        </td></tr>
        </table>
    </body>
    </html>
    """

    try:
        if resend is None or not RESEND_API_KEY:
            print("Resend is not configured; order confirmation email was not sent.")
            return False

        response = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": customer_email,
            "subject": f"🌶 ChiliLand Order Confirmed — #{order_id}",
            "html": html,
        })
        print("Email sent:", response)
        return True
    except Exception as e:
        print("Failed to send email:", e)
        return False


def send_tour_booking_confirmation(
    booking_reference,
    visitor_name,
    visitor_email,
    tour_title,
    tour_date,
    tour_time,
    participants_count,
    meeting_point="",
    confirmation_message="",
):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#fdf7f0;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7f0;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <tr>
                <td style="background:#4a2a1f;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e4a97a;font-weight:600;">ChiliLand Farm</p>
                    <h1 style="margin:0;font-size:32px;color:#ffffff;font-weight:700;">Tour Booking Confirmed</h1>
                    <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.7);">Thank you for booking with us, {visitor_name}.</p>
                </td>
            </tr>

            <tr>
                <td style="background:#a14d2a;padding:14px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:1px;">BOOKING REFERENCE</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;">{booking_reference}</p>
                </td>
            </tr>

            <tr>
                <td style="background:#ffffff;padding:36px 40px;">
                    <p style="margin:0 0 24px;font-size:15px;color:#7b5c4d;line-height:1.6;">
                        {confirmation_message or "Your reservation was successful. Please keep this email and your booking reference for future changes or cancellation."}
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efd8cc;border-radius:10px;overflow:hidden;">
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Tour</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_title}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Date</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_date}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Time</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_time}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Participants</td>
                            <td style="padding:12px;color:#3a2a20;">{participants_count}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Meeting point</td>
                            <td style="padding:12px;color:#3a2a20;">{meeting_point or "To be confirmed"}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="background:#fdf7f0;border:1px solid #efd8cc;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#a07060;">ChiliLand Farm - we look forward to seeing you.</p>
                </td>
            </tr>

        </table>
        </td></tr>
        </table>
    </body>
    </html>
    """

    return _send_smtp_email(
        to_email=visitor_email,
        subject=f"ChiliLand Tour Booking Confirmed - {booking_reference}",
        html=html,
    )


def send_tour_cancellation_confirmation(
    booking_reference,
    visitor_email,
    tour_title,
    tour_date,
    tour_time,
    participants_count,
):
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#fdf7f0;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7f0;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

            <tr>
                <td style="background:#4a2a1f;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e4a97a;font-weight:600;">ChiliLand Farm</p>
                    <h1 style="margin:0;font-size:32px;color:#ffffff;font-weight:700;">Tour Booking Cancelled</h1>
                    <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.7);">Your cancellation has been processed successfully.</p>
                </td>
            </tr>

            <tr>
                <td style="background:#a14d2a;padding:14px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:1px;">BOOKING REFERENCE</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:2px;">{booking_reference}</p>
                </td>
            </tr>

            <tr>
                <td style="background:#ffffff;padding:36px 40px;">
                    <p style="margin:0 0 24px;font-size:15px;color:#7b5c4d;line-height:1.6;">
                        Your tour booking was cancelled and your reserved spots were released back to availability.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #efd8cc;border-radius:10px;overflow:hidden;">
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Tour</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_title}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Date</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_date}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Time</td>
                            <td style="padding:12px;color:#3a2a20;">{tour_time}</td>
                        </tr>
                        <tr>
                            <td style="padding:12px;color:#a07060;background:#fdf7f0;font-weight:600;">Released spots</td>
                            <td style="padding:12px;color:#3a2a20;">{participants_count}</td>
                        </tr>
                    </table>
                </td>
            </tr>

            <tr>
                <td style="background:#fdf7f0;border:1px solid #efd8cc;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#a07060;">ChiliLand Farm - thank you for letting us know.</p>
                </td>
            </tr>

        </table>
        </td></tr>
        </table>
    </body>
    </html>
    """

    try:
        if resend is None or not RESEND_API_KEY:
            print("Resend is not configured; tour cancellation email was not sent.")
            return False

        response = resend.Emails.send({
            "from": SENDER_EMAIL,
            "to": visitor_email,
            "subject": f"ChiliLand Tour Booking Cancelled - {booking_reference}",
            "html": html,
        })
        print("Tour cancellation email sent:", response)
        return True
    except Exception as e:
        print("Failed to send tour cancellation email:", e)
        return False
