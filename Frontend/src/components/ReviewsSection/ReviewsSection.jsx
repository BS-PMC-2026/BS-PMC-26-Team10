import { useEffect, useRef, useState } from "react";
import "./ReviewsSection.css";

/* ── Star display (read-only) ── */
function StarDisplay({ rating, size = "md" }) {
  return (
    <div className={`rev-stars rev-stars--${size}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`rev-star${n <= rating ? " rev-star--on" : ""}`}>★</span>
      ))}
    </div>
  );
}

/* ── Star picker (interactive) ── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return (
    <div className="rev-star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rev-pick-star${n <= active ? " rev-pick-star--on" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ── Single review card ── */
function ReviewCard({ review }) {
  const initials = review.reviewer_name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  return (
    <article className="rev-card">
      <div className="rev-card-top">
        <StarDisplay rating={review.rating} size="sm" />
        <span className="rev-card-date">{dateStr}</span>
      </div>

      {review.comment && (
        <blockquote className="rev-card-comment">
          <span className="rev-card-quote-mark">"</span>
          {review.comment}
          <span className="rev-card-quote-mark">"</span>
        </blockquote>
      )}

      <div className="rev-card-bottom">
        <div className="rev-card-avatar">
          {review.photo_url ? (
            <img src={review.photo_url} alt={review.reviewer_name} className="rev-card-photo" />
          ) : (
            <span className="rev-card-initials">{initials}</span>
          )}
        </div>
        <div className="rev-card-identity">
          <span className="rev-card-name">{review.reviewer_name}</span>
          <span className="rev-card-tour-label">{review.tour_title}</span>
        </div>
      </div>
    </article>
  );
}

/* ── Leave-a-review modal ── */
function ReviewModal({ onClose, onSuccess }) {
  const [step, setStep] = useState("verify");
  const [bookingRef, setBookingRef] = useState("");
  const [email, setEmail] = useState("");
  const [verifyData, setVerifyData] = useState(null);
  const [verifyErr, setVerifyErr] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [submitErr, setSubmitErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleVerify(e) {
    e.preventDefault();
    setVerifyErr("");
    setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("booking_reference", bookingRef.trim().toUpperCase());
      fd.append("email", email.trim().toLowerCase());
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/verify`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed.");
      setVerifyData(data);
      setStep("write");
    } catch (err) {
      setVerifyErr(err.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) { setSubmitErr("Please select a star rating."); return; }
    setSubmitErr("");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("booking_reference", bookingRef.trim().toUpperCase());
      fd.append("email", email.trim().toLowerCase());
      fd.append("rating", String(rating));
      fd.append("comment", comment.trim());
      if (photo) fd.append("photo", photo);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Submission failed.");
      setStep("done");
    } catch (err) {
      setSubmitErr(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rev-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div className="rev-modal" role="dialog" aria-modal="true" aria-label="Leave a review">
        <button className="rev-modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* ── Step 1: verify ── */}
        {step === "verify" && (
          <div className="rev-modal-body">
            <div className="rev-modal-icon-wrap">
              <span className="rev-modal-icon">🌶️</span>
            </div>
            <p className="rev-modal-kicker">Share Your Experience</p>
            <h2 className="rev-modal-title">Leave a Review</h2>
            <p className="rev-modal-desc">
              Enter your <strong>booking reference</strong> (from your confirmation email) and the email
              address you used when booking.
            </p>
            <form onSubmit={handleVerify} className="rev-modal-form">
              <div className="rev-modal-field">
                <label htmlFor="rev-ref-inp">Booking Reference</label>
                <input
                  id="rev-ref-inp"
                  type="text"
                  placeholder="e.g. A3F9B2C1"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                  required
                  maxLength={8}
                  autoComplete="off"
                  className="rev-modal-input"
                />
              </div>
              <div className="rev-modal-field">
                <label htmlFor="rev-email-inp">Email Address</label>
                <input
                  id="rev-email-inp"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rev-modal-input"
                />
              </div>
              {verifyErr && <p className="rev-modal-error">{verifyErr}</p>}
              <button
                type="submit"
                className="rev-modal-btn rev-modal-btn--primary"
                disabled={verifying}
              >
                {verifying ? "Verifying…" : "Verify Booking →"}
              </button>
            </form>
          </div>
        )}

        {/* ── Step 2: write review ── */}
        {step === "write" && verifyData && (
          <div className="rev-modal-body">
            <div className="rev-modal-icon-wrap rev-modal-icon-wrap--verified">
              <span className="rev-modal-verified-badge">✓</span>
            </div>
            <p className="rev-modal-kicker rev-modal-kicker--green">Booking Verified</p>
            <h2 className="rev-modal-title">Rate Your Experience</h2>
            <p className="rev-modal-desc">
              Hi <strong>{verifyData.reviewer_name}</strong>! You attended{" "}
              <strong>{verifyData.tour_title}</strong>. We'd love to hear what you thought.
            </p>
            <form onSubmit={handleSubmit} className="rev-modal-form">
              <div className="rev-modal-field rev-modal-field--stars">
                <label>Your Rating <span className="rev-modal-req">*</span></label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div className="rev-modal-field">
                <label htmlFor="rev-comment-inp">Your Review</label>
                <textarea
                  id="rev-comment-inp"
                  placeholder="Tell us about your ChiliLand experience…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="rev-modal-textarea"
                  rows={4}
                  maxLength={1000}
                />
              </div>
              <div className="rev-modal-field">
                <label>
                  Photo{" "}
                  <span className="rev-modal-optional">(optional)</span>
                </label>
                <label htmlFor="rev-photo-inp" className="rev-modal-photo-label">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="rev-modal-photo-preview"
                    />
                  ) : (
                    <div className="rev-modal-photo-placeholder">
                      <span className="rev-modal-photo-icon">📷</span>
                      <span>Click to upload a photo</span>
                    </div>
                  )}
                </label>
                <input
                  id="rev-photo-inp"
                  type="file"
                  accept="image/*"
                  className="rev-modal-file-hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              {submitErr && <p className="rev-modal-error">{submitErr}</p>}
              <div className="rev-modal-actions">
                <button
                  type="button"
                  className="rev-modal-btn rev-modal-btn--ghost"
                  onClick={() => setStep("verify")}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="rev-modal-btn rev-modal-btn--primary"
                  disabled={submitting || !rating}
                >
                  {submitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Step 3: success ── */}
        {step === "done" && (
          <div className="rev-modal-body rev-modal-body--success">
            <div className="rev-success-icon">🌶️</div>
            <h2 className="rev-modal-title">Thank You!</h2>
            <p className="rev-modal-desc">
              Your review has been submitted. We appreciate you sharing your ChiliLand experience!
            </p>
            <button
              className="rev-modal-btn rev-modal-btn--primary"
              onClick={() => { onClose(); onSuccess(); }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main exported section ── */
export default function ReviewsSection({ tours }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tourFilter, setTourFilter] = useState("all");
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fadingRef = useRef(false);
  const intervalRef = useRef(null);
  const reviewsLenRef = useRef(0);

  const pastTours = tours.filter((t) => {
    if (!t.date) return false;
    const [y, m, d] = t.date.split("-");
    return new Date(+y, +m - 1, +d) < new Date();
  });

  function fetchReviews(tourId = "all") {
    setLoading(true);
    const url =
      tourId === "all"
        ? `${import.meta.env.VITE_API_URL}/reviews`
        : `${import.meta.env.VITE_API_URL}/reviews?tour_id=${tourId}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setReviews(list);
        reviewsLenRef.current = list.length;
        setCurrent(0);
        setLoading(false);
      })
      .catch(() => {
        setReviews([]);
        reviewsLenRef.current = 0;
        setLoading(false);
      });
  }

  useEffect(() => { fetchReviews("all"); }, []);

  /* Auto-rotation — restarts whenever reviews change */
  function startAutoplay() {
    clearInterval(intervalRef.current);
    if (reviewsLenRef.current <= 1) return;
    intervalRef.current = setInterval(() => {
      if (fadingRef.current) return;
      fadingRef.current = true;
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % reviewsLenRef.current);
        fadingRef.current = false;
        setFading(false);
      }, 280);
    }, 5000);
  }

  useEffect(() => {
    reviewsLenRef.current = reviews.length;
    startAutoplay();
    return () => clearInterval(intervalRef.current);
  }, [reviews.length]);

  function navigate(dir) {
    if (fadingRef.current) return;
    fadingRef.current = true;
    setFading(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + dir + reviewsLenRef.current) % reviewsLenRef.current);
      fadingRef.current = false;
      setFading(false);
      startAutoplay();
    }, 280);
  }

  function goToIdx(idx) {
    if (idx === current || fadingRef.current) return;
    fadingRef.current = true;
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      fadingRef.current = false;
      setFading(false);
      startAutoplay();
    }, 280);
  }

  function handleTourFilter(e) {
    const val = e.target.value;
    setTourFilter(val);
    fetchReviews(val);
  }

  /* Build visible card indices — always up to 3, wrapping */
  function visibleIndices() {
    if (reviews.length === 0) return [];
    const count = Math.min(3, reviews.length);
    return Array.from({ length: count }, (_, i) => (current + i) % reviews.length);
  }

  const visible = visibleIndices();
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <>
      <section className="rev-section">
        {/* ── Section header ── */}
        <div className="rev-section-top">
          <div className="rev-heading">
            <p className="rev-kicker">Guest Reviews</p>
            <h2 className="rev-title">What Visitors Say</h2>
            {avgRating && (
              <div className="rev-avg-row">
                <StarDisplay rating={Math.round(Number(avgRating))} size="sm" />
                <span className="rev-avg-score">{avgRating}</span>
                <span className="rev-avg-count">
                  ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              </div>
            )}
            <p className="rev-subtitle">
              Authentic reviews from verified visitors who have experienced our farm tours.
            </p>
          </div>

          <div className="rev-controls">
            <select
              className="rev-filter"
              value={tourFilter}
              onChange={handleTourFilter}
              aria-label="Filter reviews by tour"
            >
              <option value="all">All Tours</option>
              {pastTours.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button className="rev-leave-btn" onClick={() => setShowModal(true)}>
              ✍ Leave a Review
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        {loading && <p className="rev-status">Loading reviews…</p>}

        {!loading && reviews.length === 0 && (
          <div className="rev-empty">
            <span className="rev-empty-icon">🌶️</span>
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}

        {!loading && reviews.length > 0 && (
          <div
            className="rev-carousel"
            onMouseEnter={() => clearInterval(intervalRef.current)}
            onMouseLeave={startAutoplay}
          >
            <button
              className="rev-nav-btn rev-nav-btn--prev"
              onClick={() => navigate(-1)}
              aria-label="Previous reviews"
            >
              &#8592;
            </button>

            <div className={`rev-track${fading ? " rev-track--fading" : ""}`}>
              {visible.map((idx, pos) => (
                <div key={`${pos}-${idx}`} className="rev-slide">
                  <ReviewCard review={reviews[idx]} />
                </div>
              ))}
            </div>

            <button
              className="rev-nav-btn rev-nav-btn--next"
              onClick={() => navigate(1)}
              aria-label="Next reviews"
            >
              &#8594;
            </button>
          </div>
        )}

        {/* ── Dots ── */}
        {!loading && reviews.length > 1 && (
          <div className="rev-dots" role="tablist" aria-label="Navigate reviews">
            {reviews.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === current}
                className={`rev-dot${i === current ? " rev-dot--active" : ""}`}
                onClick={() => goToIdx(i)}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <ReviewModal
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchReviews(tourFilter)}
        />
      )}
    </>
  );
}
