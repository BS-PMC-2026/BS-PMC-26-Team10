import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useTranslation } from "react-i18next";
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

function getFormErrors(form, t) {
  const errors = {};
  if (!form.email.trim()) errors.email = t("tourDetail.errEmailRequired");
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = t("tourDetail.errEmailInvalid");
  if (!form.full_name.trim()) errors.full_name = t("tourDetail.errNameRequired");
  if (!form.phone.trim()) errors.phone = t("tourDetail.errPhoneRequired");
  else if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = t("tourDetail.errPhoneInvalid");
  if (parseInt(form.participants_count, 10) < 1) errors.participants_count = t("tourDetail.errParticipants");
  return errors;
}

function TourDetailPage() {
  const { t } = useTranslation();
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
        if (!res.ok) throw new Error(t("tourDetail.loadError"));
        return res.json();
      })
      .then((data) => {
        const found = data.find((tour) => String(tour.id) === String(id));
        if (!found) throw new Error(t("tourDetail.loadError"));
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
      setCancelResult({ success: false, message: t("tourDetail.cancelFillFields") });
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
            ? t("tourDetail.cancelSuccess")
            : t("tourDetail.cancelSuccessNoEmail"),
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
    const errors = getFormErrors(form, t);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    await submitBooking(null);
  }

  function createPayPalOrder(data, actions) {
    const errors = getFormErrors(form, t);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPaypalError(t("tourDetail.fillFields"));
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

  function onPayPalError(error) {
    setPaypalError(t("tourDetail.paypalError", { error }));
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
          <Link to="/">{t("tourDetail.breadcrumbHome")}</Link>
          <span> / </span>
          <Link to="/tours">{t("tourDetail.breadcrumbTours")}</Link>
          <span> / </span>
          <span>{tour.title}</span>
        </nav>

        <div className="tdp-layout">
          {/* ── left: tour info ── */}
          <aside className="tdp-info">
            <div className="tdp-info-badges">
              <span className="tdp-badge tdp-badge--kind">{tour.kind.replace(/-/g, " ")}</span>
              {full && <span className="tdp-badge tdp-badge--full">{t("tourDetail.full")}</span>}
              {past && <span className="tdp-badge tdp-badge--past">{t("tourDetail.past")}</span>}
            </div>

            <h1 className="tdp-title">{tour.title}</h1>
            {tour.description && <p className="tdp-description">{tour.description}</p>}

            <dl className="tdp-details">
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.date")}</dt>
                <dd>{formatDate(tour.date)}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.time")}</dt>
                <dd>{formatTime(tour.time)}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.duration")}</dt>
                <dd>{tour.duration}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.price")}</dt>
                <dd>{tour.price > 0 ? `₪${Number(tour.price).toFixed(2)} per person` : "Free"}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.capacity")}</dt>
                <dd>{t("tourDetail.totalSpots", { count: tour.capacity })}</dd>
              </div>
              <div className="tdp-detail-row">
                <dt>{t("tourDetail.available")}</dt>
                <dd className={full ? "tdp-spots--none" : "tdp-spots--ok"}>
                  {full
                    ? t("tourDetail.fullyBooked")
                    : t("tourDetail.spotsLeft", { count: tour.remaining_spots })}
                </dd>
              </div>
              {tour.meeting_point && (
                <div className="tdp-detail-row">
                  <dt>{t("tourDetail.meetingPoint")}</dt>
                  <dd>{tour.meeting_point}</dd>
                </div>
              )}
              {tour.includes && (
                <div className="tdp-detail-row">
                  <dt>{t("tourDetail.includes")}</dt>
                  <dd>{tour.includes}</dd>
                </div>
              )}
              {tour.accessibility && (
                <div className="tdp-detail-row">
                  <dt>{t("tourDetail.accessibility")}</dt>
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
                <h2 className="tdp-result-title">{t("tourDetail.confirmedTitle")}</h2>
                {result.paid && (
                  <p className="tdp-result-paid-badge">{t("tourDetail.confirmedPayment")}</p>
                )}
                <p className="tdp-result-text">{t("tourDetail.confirmedRef")}</p>
                <p className="tdp-result-reference">{result.reference}</p>
                <p className="tdp-result-text">{t("tourDetail.confirmedSave")}</p>
                <p className="tdp-result-text">
                  {result.emailSent
                    ? t("tourDetail.confirmedEmail")
                    : t("tourDetail.confirmedEmailFail")}
                </p>
                {result.confirmationMessage && (
                  <p className="tdp-result-text">{result.confirmationMessage}</p>
                )}
                <div className="tdp-result-actions">
                  <Link to="/tours" className="tdp-result-btn">{t("tourDetail.moreTours")}</Link>
                  <Link to="/" className="tdp-result-btn tdp-result-btn--secondary">{t("tourDetail.backHome")}</Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="tdp-form-heading">
                  {past
                    ? t("tourDetail.btnPast")
                    : full
                    ? t("tourDetail.btnFull")
                    : isPaid
                    ? t("tourDetail.btnPay")
                    : t("tourDetail.btnBook")}
                </h2>

                {!canBook && !result && (
                  <p className="tdp-unavailable">
                    {past ? t("tourDetail.pastDesc") : t("tourDetail.fullDesc")}
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
                      <label htmlFor="email" className="tdp-label">{t("tourDetail.emailLabel")}</label>
                      <input
                        id="email" name="email" type="email" className={`tdp-input${fieldErrors.email ? " tdp-input--error" : ""}`}
                        value={form.email} onChange={handleChange}
                        placeholder={t("tourDetail.emailPlaceholder")} required autoComplete="email"
                      />
                      {fieldErrors.email && <span className="tdp-field-error">{fieldErrors.email}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="full_name" className="tdp-label">{t("tourDetail.nameLabel")}</label>
                      <input
                        id="full_name" name="full_name" type="text" className={`tdp-input${fieldErrors.full_name ? " tdp-input--error" : ""}`}
                        value={form.full_name} onChange={handleChange}
                        placeholder={t("tourDetail.namePlaceholder")} required autoComplete="name"
                      />
                      {fieldErrors.full_name && <span className="tdp-field-error">{fieldErrors.full_name}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="phone" className="tdp-label">{t("tourDetail.phoneLabel")}</label>
                      <input
                        id="phone" name="phone" type="tel" className={`tdp-input${fieldErrors.phone ? " tdp-input--error" : ""}`}
                        value={form.phone} onChange={handleChange}
                        placeholder={t("tourDetail.phonePlaceholder")} pattern="\d{10}" maxLength={10}
                        title="Phone must be exactly 10 digits" required autoComplete="tel"
                      />
                      {fieldErrors.phone && <span className="tdp-field-error">{fieldErrors.phone}</span>}
                    </div>

                    <div className="tdp-field">
                      <label htmlFor="participants_count" className="tdp-label">
                        {t("tourDetail.participantsLabel")}
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
                            <span>{t("tourDetail.pricePerPerson")}</span>
                            <span>₪{Number(tour.price).toFixed(2)}</span>
                          </div>
                          <div className="tdp-price-row">
                            <span>{t("tourDetail.participants")}</span>
                            <span>× {participants}</span>
                          </div>
                          <div className="tdp-price-total">
                            <span>{t("tourDetail.total")}</span>
                            <span>₪{total}</span>
                          </div>
                        </div>

                        {paypalError && (
                          <p className="tdp-paypal-error">⚠ {paypalError}</p>
                        )}

                        <div className="tdp-paypal-wrap">
                          <p className="tdp-paypal-label">{t("tourDetail.paypalLabel")}</p>
                          <PayPalButtons
                            style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
                            disabled={submitting}
                            createOrder={createPayPalOrder}
                            onApprove={onPayPalApprove}
                            onError={onPayPalError}
                          />
                        </div>

                        <p className="tdp-form-note">{t("tourDetail.paymentNote")}</p>
                      </>
                    ) : (
                      <>
                        <button type="submit" className="tdp-submit" disabled={submitting}>
                          {submitting ? t("tourDetail.confirming") : t("tourDetail.confirm")}
                        </button>
                        <p className="tdp-form-note">{t("tourDetail.noAccount")}</p>
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
                        {t("tourDetail.cancelTitle")}
                      </button>
                    ) : (
                      <>
                        <h3 className="tdp-cancel-title">{t("tourDetail.cancelTitle")}</h3>
                        <form className="tdp-form" onSubmit={handleCancelBooking} noValidate>
                          <div className="tdp-field">
                            <label htmlFor="booking_reference" className="tdp-label">{t("tourDetail.cancelRefLabel")}</label>
                            <input
                              id="booking_reference"
                              name="booking_reference"
                              type="text"
                              className="tdp-input"
                              value={cancelForm.booking_reference}
                              onChange={handleCancelChange}
                              placeholder={t("tourDetail.cancelRefPlaceholder")}
                              autoComplete="off"
                            />
                          </div>

                          <div className="tdp-field">
                            <label htmlFor="cancel_email" className="tdp-label">{t("tourDetail.cancelEmailLabel")}</label>
                            <input
                              id="cancel_email"
                              name="email"
                              type="email"
                              className="tdp-input"
                              value={cancelForm.email}
                              onChange={handleCancelChange}
                              placeholder={t("tourDetail.cancelEmailPlaceholder")}
                              autoComplete="email"
                            />
                          </div>

                          {cancelResult && (
                            <div className={`tdp-result ${cancelResult.success ? "tdp-result--success tdp-result--compact" : "tdp-result--error"}`}>
                              <p>{cancelResult.message}</p>
                            </div>
                          )}

                          <button type="submit" className="tdp-cancel-submit" disabled={cancelling}>
                            {cancelling ? t("tourDetail.cancellingBtn") : t("tourDetail.cancelBtn")}
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
