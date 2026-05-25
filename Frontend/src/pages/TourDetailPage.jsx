import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import "../styles/TourDetailPage.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function isPast(dateStr) {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split("-");
  const tourDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tourDate < today;
}

const INITIAL_FORM = { email: "", full_name: "", phone: "", participants_count: 1 };
const INITIAL_CANCEL_FORM = { booking_reference: "", email: "" };

function getFormErrors(form) {
  const errors = {};
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = "Invalid email format.";
  if (!form.full_name.trim()) errors.full_name = "Full name is required.";
  if (!form.phone.trim()) errors.phone = "Phone is required.";
  else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = "Phone must be exactly 10 digits.";
  if (parseInt(form.participants_count, 10) < 1) errors.participants_count = "At least 1 participant.";
  return errors;
}

function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [paypalError, setPaypalError] = useState("");
  const [result, setResult] = useState(null);
  const [cancelForm, setCancelForm] = useState(INITIAL_CANCEL_FORM);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tour.");
        return res.json();
      })
      .then((data) => {
        const found = data.find((t) => String(t.id) === String(id));
        if (!found) throw new Error("Tour not found.");
        setTour(found);
        setLoading(false);
      })
      .catch((err) => {
        setFetchError(err.message);
        setLoading(false);
      });
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleCancelChange(e) {
    const { name, value } = e.target;
    setCancelForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitBooking(paypalOrderId = null) {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour_id: tour.id,
          email: form.email.trim(),
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          participants_count: parseInt(form.participants_count, 10),
          payment_status: paypalOrderId ? "paid" : "free",
          paypal_order_id: paypalOrderId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ success: false, message: data.detail || "Booking failed. Please try again." });
      } else {
        setResult({
          success: true,
          message: "Booking confirmed!",
          reference: data.booking_reference,
          emailSent: data.email_sent,
          confirmationMessage: data.confirmation_message,
          paid: !!paypalOrderId,
        });
        setForm(INITIAL_FORM);
        setTour((prev) => ({
          ...prev,
          remaining_spots: Math.max(0, prev.remaining_spots - parseInt(form.participants_count, 10)),
          is_full: prev.remaining_spots - parseInt(form.participants_count, 10) <= 0,
        }));
      }
    } catch {
      setResult({ success: false, message: "Network error. Please check your connection." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelBooking(e) {
    e.preventDefault();
    setCancelResult(null);

    const reference = cancelForm.booking_reference.trim().toUpperCase();
    const email = cancelForm.email.trim();

    if (!reference || !email) {
      setCancelResult({ success: false, message: "Please enter your booking reference and email." });
      return;
    }

    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    setCancelling(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${reference}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCancelResult({ success: false, message: data.detail || "Cancellation failed. Please try again." });
      } else {
        setCancelResult({
          success: true,
          message: data.email_sent
            ? "Booking cancelled successfully. A cancellation confirmation email was sent to your email address."
            : "Booking cancelled successfully. Your spots are now available again, but the confirmation email could not be sent right now.",
        });
        setCancelForm(INITIAL_CANCEL_FORM);
        setTour((prev) => ({
          ...prev,
          remaining_spots: Math.min(prev.capacity, prev.remaining_spots + Number(data.released_spots || 0)),
          is_full: false,
        }));
      }
    } catch {
      setCancelResult({ success: false, message: "Network error. Please check your connection." });
    } finally {
      setCancelling(false);
    }
  }

  async function handleFreeSubmit(e) {
    e.preventDefault();
    const errors = getFormErrors(form);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    await submitBooking(null);
  }

  function createPayPalOrder(data, actions) {
    const errors = getFormErrors(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPaypalError("Please fill in all fields correctly before paying.");
      return Promise.reject(new Error("Form invalid"));
    }
    setPaypalError("");
    const total = (tour.price * parseInt(form.participants_count, 10)).toFixed(2);
    return actions.order.create({
      purchase_units: [{
        amount: { value: total, currency_code: "ILS" },
        description: `ChiliLand Tour: ${tour.title}`,
      }],
    });
  }

  async function onPayPalApprove(data, actions) {
    setSubmitting(true);
    try {
      const paypalOrder = await actions.order.capture();
      await submitBooking(paypalOrder.id);
    } catch {
      setResult({ success: false, message: "Payment failed. Please try again." });
      setSubmitting(false);
    }
  }

  function onPayPalError() {
    setPaypalError("PayPal encountered an error. Please try again.");
  }

  if (loading) return <div className="tdp-status">Loading tour…</div>;
  if (fetchError) return <div className="tdp-status tdp-status--error">{fetchError}</div>;

  const past = isPast(tour.date);
  const full = tour.is_full;
  const canBook = !past && !full && !result?.success;
  const isPaid = tour.price > 0;
  const participants = parseInt(form.participants_count, 10) || 1;
  const total = isPaid ? (tour.price * participants).toFixed(2) : 0;

  return (
    <div className="tdp">
      <div className="tdp-inner">
        <nav className="tdp-breadcrumb">
          <Link to="/">Home</Link>
          <span> / </span>
          <Link to="/tours">Tours</Link>
          <span> / </span>
          <span>{tour.title}</span>
        </nav>

        <div className="tdp-layout">
          {/* ── left: tour info ── */}
          <aside className="tdp-info">
            <div className="tdp-info-badges">
              <span className="tdp-badge tdp-badge--kind">{tour.kind.replace(/-/g, " ")}</span>
              {full && <span className="tdp-badge tdp-badge--full">Full</span>}
              {past && <span className="tdp-badge tdp-badge--past">Past tour</span>}
            </div>

            <h1 className="tdp-title">{tour.title}</h1>
            {tour.description && <p className="tdp-description">{tour.description}</p>}

            <dl className="tdp-details">
              <div className="tdp-detail-row">
                <dt>Date</dt>
                <dd>{formatDate(tour.date)}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>Time</dt>
                <dd>{formatTime(tour.time)}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>Duration</dt>
                <dd>{tour.duration}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>Price</dt>
                <dd>{tour.price > 0 ? `₪${Number(tour.price).toFixed(2)} per person` : "Free"}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>Capacity</dt>
                <dd>{tour.capacity} total spots</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>Available</dt>
                <dd className={full ? "tdp-spots--none" : "tdp-spots--ok"}>
                  {full ? "0 — Fully booked" : `${tour.remaining_spots} spot${tour.remaining_spots !== 1 ? "s" : ""} left`}
                </dd>
              </div>
              {tour.meeting_point && (
                <div className="tdp-detail-row">
                  <dt>Meeting point</dt>
                  <dd>{tour.meeting_point}</dd>
                </div>
              )}
              {tour.includes && (
                <div className="tdp-detail-row">
                  <dt>Includes</dt>
                  <dd>{tour.includes}</dd>
                </div>
              )}
              {tour.accessibility && (
                <div className="tdp-detail-row">
                  <dt>Accessibility</dt>
                  <dd>{tour.accessibility.replace(/-/g, " ")}</dd>
                </div>
              )}
            </dl>
          </aside>

          {/* ── right: booking form or result ── */}
          <section className="tdp-form-panel">
            {result?.success ? (
              <div className="tdp-result tdp-result--success">
                <div className="tdp-result-icon">&#10003;</div>
                <h2 className="tdp-result-title">Booking Confirmed!</h2>
                {result.paid && (
                  <p className="tdp-result-paid-badge">✓ Payment received</p>
                )}
                <p className="tdp-result-text">Your booking reference is:</p>
                <p className="tdp-result-reference">{result.reference}</p>
                <p className="tdp-result-text">Save this reference for future use.</p>
                <p className="tdp-result-text">
                  {result.emailSent
                    ? "A confirmation email was sent to your email address."
                    : "Your booking is saved, but the confirmation email could not be sent right now."}
                </p>
                {result.confirmationMessage && (
                  <p className="tdp-result-text">{result.confirmationMessage}</p>
                )}
                <div className="tdp-result-actions">
                  <Link to="/tours" className="tdp-result-btn">View More Tours</Link>
                  <Link to="/" className="tdp-result-btn tdp-result-btn--secondary">Back to Home</Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="tdp-form-heading">
                  {past ? "Tour has passed" : full ? "Tour is fully booked" : isPaid ? "Book & Pay" : "Book this tour"}
                </h2>

                {!canBook && !result && (
                  <p className="tdp-unavailable">
                    {past
                      ? "This tour has already taken place and is no longer available for booking."
                      : "All spots for this tour have been filled."}
                  </p>
                )}

                {result && !result.success && (
                  <div className="tdp-result tdp-result--error">
                    <p>{result.message}</p>
                  </div>
                )}

                {canBook && (
                  <form
                    className="tdp-form"
                    onSubmit={isPaid ? (e) => e.preventDefault() : handleFreeSubmit}
                    noValidate
                  >
                    <div className="tdp-field">
                      <label htmlFor="email" className="tdp-label">Email address</label>
                      <input
                        id="email" name="email" type="email" className={`tdp-input${fieldErrors.email ? " tdp-input--error" : ""}`}
                        value={form.email} onChange={handleChange}
                        placeholder="you@example.com" required autoComplete="email"
                      />
                      {fieldErrors.email && <span className="tdp-field-error">{fieldErrors.email}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="full_name" className="tdp-label">Full name</label>
                      <input
                        id="full_name" name="full_name" type="text" className={`tdp-input${fieldErrors.full_name ? " tdp-input--error" : ""}`}
                        value={form.full_name} onChange={handleChange}
                        placeholder="Jane Smith" required autoComplete="name"
                      />
                      {fieldErrors.full_name && <span className="tdp-field-error">{fieldErrors.full_name}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="phone" className="tdp-label">Phone number</label>
                      <input
                        id="phone" name="phone" type="tel" className={`tdp-input${fieldErrors.phone ? " tdp-input--error" : ""}`}
                        value={form.phone} onChange={handleChange}
                        placeholder="0549164691" pattern="\d{10}" maxLength={10}
                        title="Phone must be exactly 10 digits" required autoComplete="tel"
                      />
                      {fieldErrors.phone && <span className="tdp-field-error">{fieldErrors.phone}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="participants_count" className="tdp-label">
                        Number of participants
                        <span className="tdp-label-hint"> (max {tour.remaining_spots})</span>
                      </label>
                      <input
                        id="participants_count" name="participants_count" type="number"
                        className={`tdp-input${fieldErrors.participants_count ? " tdp-input--error" : ""}`}
                        value={form.participants_count} onChange={handleChange}
                        min={1} max={tour.remaining_spots} required
                      />
                      {fieldErrors.participants_count && <span className="tdp-field-error">{fieldErrors.participants_count}</span>}
                    </div>

                    {isPaid ? (
                      <>
                        <div className="tdp-payment-divider" />

                        <div className="tdp-price-summary">
                          <div className="tdp-price-row">
                            <span>Price per person</span>
                            <span>₪{Number(tour.price).toFixed(2)}</span>
                          </div>
                          <div className="tdp-price-row">
                            <span>Participants</span>
                            <span>× {participants}</span>
                          </div>
                          <div className="tdp-price-total">
                            <span>Total</span>
                            <span>₪{total}</span>
                          </div>
                        </div>

                        {paypalError && (
                          <p className="tdp-paypal-error">⚠ {paypalError}</p>
                        )}

                        <div className="tdp-paypal-wrap">
                          <p className="tdp-paypal-label">Pay securely with PayPal</p>
                          <PayPalButtons
                            style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
                            disabled={submitting}
                            createOrder={createPayPalOrder}
                            onApprove={onPayPalApprove}
                            onError={onPayPalError}
                          />
                        </div>

                        <p className="tdp-form-note">
                          Your spot is reserved only after payment is complete.
                        </p>
                      </>
                    ) : (
                      <>
                        <button type="submit" className="tdp-submit" disabled={submitting}>
                          {submitting ? "Confirming…" : "Confirm Booking"}
                        </button>
                        <p className="tdp-form-note">No account required. Booking is instant.</p>
                      </>
                    )}
                  </form>
                )}

                {!past && (
                  <div className="tdp-cancel-panel">
                    {!showCancelForm ? (
                      <button
                        type="button"
                        className="tdp-cancel-toggle"
                        onClick={() => setShowCancelForm(true)}
                      >
                        Cancel a booking
                      </button>
                    ) : (
                      <>
                        <h3 className="tdp-cancel-title">Cancel a booking</h3>
                        <form className="tdp-form" onSubmit={handleCancelBooking} noValidate>
                          <div className="tdp-field">
                            <label htmlFor="booking_reference" className="tdp-label">Booking reference</label>
                            <input
                              id="booking_reference"
                              name="booking_reference"
                              type="text"
                              className="tdp-input"
                              value={cancelForm.booking_reference}
                              onChange={handleCancelChange}
                              placeholder="ABC12345"
                              autoComplete="off"
                            />
                          </div>

                          <div className="tdp-field">
                            <label htmlFor="cancel_email" className="tdp-label">Booking email address</label>
                            <input
                              id="cancel_email"
                              name="email"
                              type="email"
                              className="tdp-input"
                              value={cancelForm.email}
                              onChange={handleCancelChange}
                              placeholder="you@example.com"
                              autoComplete="email"
                            />
                          </div>

                          {cancelResult && (
                            <div className={`tdp-result ${cancelResult.success ? "tdp-result--success tdp-result--compact" : "tdp-result--error"}`}>
                              <p>{cancelResult.message}</p>
                            </div>
                          )}

                          <button type="submit" className="tdp-cancel-submit" disabled={cancelling}>
                            {cancelling ? "Cancelling..." : "Cancel Booking"}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default TourDetailPage;
