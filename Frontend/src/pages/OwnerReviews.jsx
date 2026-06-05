import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "../styles/OwnerReviews.css";

const BASE_URL = import.meta.env.VITE_API_URL;

function StarDisplay({ rating }) {
  const { t } = useTranslation();
  return (
    <span className="or-stars" aria-label={t("reviews.ratingAlt", { rating, count: 5 })}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "or-star or-star--on" : "or-star"}>★</span>
      ))}
    </span>
  );
}

function ReviewRow({ review, token, onReplySaved }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(review.owner_reply ?? "");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const hasReply = Boolean(review.owner_reply);

  async function handleSave() {
    if (!replyText.trim()) { setSaveErr(t("owner.reviews.replyEmpty")); return; }
    setSaveErr("");
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/reviews/${review.id}/reply`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t("owner.reviews.saveFail"));
      onReplySaved(review.id, replyText.trim());
      setExpanded(false);
    } catch (err) {
      setSaveErr(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setReplyText(review.owner_reply ?? "");
    setSaveErr("");
    setExpanded(false);
  }

  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className={`or-review-card${expanded ? " or-review-card--expanded" : ""}`}>
      <div className="or-review-top">
        <div className="or-review-meta">
          <StarDisplay rating={review.rating} />
          <span className="or-review-tour">{review.tour_title}</span>
          <span className="or-review-date">{dateStr}</span>
        </div>
        <span className={`or-reply-badge${hasReply ? " or-reply-badge--replied" : " or-reply-badge--pending"}`}>
          {hasReply ? t("owner.reviews.badgeReplied") : t("owner.reviews.badgePending")}
        </span>
      </div>

      <div className="or-review-body">
        <div className="or-review-left">
          <div className="or-reviewer-identity">
            <span className="or-reviewer-avatar">
              {review.reviewer_name.trim()[0].toUpperCase()}
            </span>
            <div>
              <span className="or-reviewer-name">{review.reviewer_name}</span>
              <span className="or-verified-tag">{t("owner.reviews.verifiedVisitor")}</span>
            </div>
          </div>
          {review.comment && (
            <p className="or-review-comment">"{review.comment}"</p>
          )}
        </div>

        {review.photo_url && (
          <img
            src={review.photo_url}
            alt={`${review.reviewer_name}'s photo`}
            className="or-review-photo"
          />
        )}
      </div>

      {hasReply && !expanded && (
        <div className="or-existing-reply">
          <span className="or-existing-reply-label">{t("owner.reviews.yourResponse")}</span>
          <p className="or-existing-reply-text">{review.owner_reply}</p>
        </div>
      )}

      {expanded && (
        <div className="or-reply-form">
          <label className="or-reply-label" htmlFor={`reply-${review.id}`}>
            {hasReply ? t("owner.reviews.editResponse") : t("owner.reviews.writeResponse")}
          </label>
          <textarea
            id={`reply-${review.id}`}
            className="or-reply-textarea"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("owner.reviews.replyPlaceholder")}
            rows={3}
            maxLength={800}
            autoFocus
          />
          {saveErr && <p className="or-reply-error">{saveErr}</p>}
          <div className="or-reply-actions">
            <button className="or-btn or-btn--ghost" onClick={handleCancel} disabled={saving}>
              {t("owner.reviews.cancel")}
            </button>
            <button className="or-btn or-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? t("owner.reviews.saving") : t("owner.reviews.save")}
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <button className="or-reply-toggle" onClick={() => setExpanded(true)}>
          {hasReply ? t("owner.reviews.toggleEdit") : t("owner.reviews.toggleReply")}
        </button>
      )}
    </div>
  );
}

function OwnerReviews() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState("all");

  useEffect(() => {
    fetch(`${BASE_URL}/reviews`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError(t("owner.reviews.loadError")); setLoading(false); });
  }, []);

  function handleReplySaved(id, newReply) {
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, owner_reply: newReply, replied_at: new Date().toISOString() } : r)
    );
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter((r) => {
      const matchSearch =
        r.reviewer_name.toLowerCase().includes(q) ||
        r.tour_title.toLowerCase().includes(q) ||
        (r.comment ?? "").toLowerCase().includes(q);
      const matchRating = ratingFilter === "all" || String(r.rating) === ratingFilter;
      const matchReply =
        replyFilter === "all" ||
        (replyFilter === "replied" && r.owner_reply) ||
        (replyFilter === "pending" && !r.owner_reply);
      return matchSearch && matchRating && matchReply;
    });
  }, [reviews, search, ratingFilter, replyFilter]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const repliedCount = reviews.filter((r) => r.owner_reply).length;
  const pendingCount = reviews.length - repliedCount;

  const token = getToken();

  return (
    <div className="or-content">
      <div className="or-header">
        <p className="or-overline">{t("owner.controlCenter")}</p>
        <h1>{t("owner.reviews.title")}</h1>
        <p className="or-subtitle">{t("owner.reviews.subtitle")}</p>
      </div>

      <div className="or-stats">
        <div className="or-stat-card">
          <p>{t("owner.reviews.totalReviews")}</p>
          <h2>{reviews.length}</h2>
        </div>
        <div className="or-stat-card">
          <p>{t("owner.reviews.avgRating")}</p>
          <h2>{avgRating} <span className="or-stat-star">★</span></h2>
        </div>
        <div className="or-stat-card">
          <p>{t("owner.reviews.replied")}</p>
          <h2 className="or-stat--green">{repliedCount}</h2>
        </div>
        <div className="or-stat-card">
          <p>{t("owner.reviews.awaitingReply")}</p>
          <h2 className={pendingCount > 0 ? "or-stat--orange" : ""}>{pendingCount}</h2>
        </div>
      </div>

      <div className="or-toolbar">
        <input
          type="text"
          className="or-search"
          placeholder={t("owner.reviews.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="or-filter" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="all">{t("owner.reviews.allRatings")}</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
        <select className="or-filter" value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)}>
          <option value="all">{t("owner.reviews.allStatuses")}</option>
          <option value="pending">{t("owner.reviews.filterAwaiting")}</option>
          <option value="replied">{t("owner.reviews.filterReplied")}</option>
        </select>
      </div>

      {loading && <div className="or-message">{t("owner.reviews.loading")}</div>}
      {!loading && error && <div className="or-message or-message--error">{error}</div>}

      {!loading && !error && reviews.length === 0 && (
        <div className="or-empty">
          <span className="or-empty-icon">💬</span>
          <h2>{t("owner.reviews.emptyTitle")}</h2>
          <p>{t("owner.reviews.emptyDesc")}</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && filtered.length === 0 && (
        <div className="or-empty">
          <span className="or-empty-icon">🔍</span>
          <h2>{t("owner.reviews.noMatchTitle")}</h2>
          <p>{t("owner.reviews.noMatchDesc")}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="or-reviews-list">
          {filtered.map((review) => (
            <ReviewRow
              key={review.id}
              review={review}
              token={token}
              onReplySaved={handleReplySaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OwnerReviews;
