import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/TourGuideReviews.css";

const API = import.meta.env.VITE_API_URL;

function Stars({ rating }) {
  return (
    <span className="tgr-stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "tgr-star tgr-star--on" : "tgr-star"}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({ review, token, onReplySaved }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(review.owner_reply ?? "");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const hasReply = Boolean(review.owner_reply);
  const dateStr = review.created_at
    ? new Date(review.created_at).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  async function handleSave() {
    if (!replyText.trim()) { setSaveErr("Reply cannot be empty."); return; }
    setSaveErr("");
    setSaving(true);
    try {
      const res = await fetch(`${API}/reviews/${review.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save reply.");
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

  return (
    <div className={`tgr-card${expanded ? " tgr-card--expanded" : ""}`}>
      <div className="tgr-card-top">
        <div className="tgr-card-meta">
          <Stars rating={review.rating} />
          <span className="tgr-tour-name">{review.tour_title}</span>
          <span className="tgr-date">{dateStr}</span>
        </div>
        <span className={`tgr-reply-badge${hasReply ? " tgr-reply-badge--done" : " tgr-reply-badge--pending"}`}>
          {hasReply ? "✓ Replied" : "No reply yet"}
        </span>
      </div>

      <div className="tgr-card-body">
        <div className="tgr-reviewer">
          <span className="tgr-avatar">
            {review.reviewer_name?.trim()[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="tgr-reviewer-info">
            <span className="tgr-reviewer-name">{review.reviewer_name}</span>
            <span className="tgr-verified">Verified Visitor</span>
          </div>
        </div>

        {review.comment && (
          <p className="tgr-comment">"{review.comment}"</p>
        )}

        {review.photo_url && (
          <img src={review.photo_url} alt={`${review.reviewer_name}'s photo`} className="tgr-photo" />
        )}
      </div>

      {hasReply && !expanded && (
        <div className="tgr-reply-block">
          <span className="tgr-reply-label">Your response</span>
          <p className="tgr-reply-text">{review.owner_reply}</p>
        </div>
      )}

      {expanded && (
        <div className="tgr-reply-form">
          <label className="tgr-reply-form-label" htmlFor={`reply-${review.id}`}>
            {hasReply ? "Edit your response" : "Write a response"}
          </label>
          <textarea
            id={`reply-${review.id}`}
            className="tgr-reply-textarea"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a warm, helpful response visible to all visitors…"
            rows={3}
            maxLength={800}
            autoFocus
          />
          {saveErr && <p className="tgr-reply-error">{saveErr}</p>}
          <div className="tgr-reply-actions">
            <button className="tgr-btn tgr-btn--ghost" onClick={handleCancel} disabled={saving}>Cancel</button>
            <button className="tgr-btn tgr-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Response"}
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <button className="tgr-reply-toggle" onClick={() => setExpanded(true)}>
          {hasReply ? "✏ Edit Response" : "↩ Reply to Review"}
        </button>
      )}
    </div>
  );
}

export default function TourGuideReviews() {
  const { getToken } = useAuth();
  const [reviews, setReviews]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [replyFilter, setReplyFilter]   = useState("all");

  useEffect(() => {
    fetch(`${API}/reviews`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Could not load reviews."); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter((r) => {
      const matchSearch =
        (r.reviewer_name?.toLowerCase() ?? "").includes(q) ||
        (r.tour_title?.toLowerCase() ?? "").includes(q) ||
        (r.comment?.toLowerCase() ?? "").includes(q);
      const matchRating = ratingFilter === "all" || String(r.rating) === ratingFilter;
      const matchReply  =
        replyFilter === "all" ||
        (replyFilter === "replied"  && r.owner_reply) ||
        (replyFilter === "pending"  && !r.owner_reply);
      return matchSearch && matchRating && matchReply;
    });
  }, [reviews, search, ratingFilter, replyFilter]);

  function handleReplySaved(id, newReply) {
    setReviews((prev) =>
      prev.map((r) => r.id === id ? { ...r, owner_reply: newReply } : r)
    );
  }

  const token = getToken();

  const avgRating    = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const repliedCount = reviews.filter((r) => r.owner_reply).length;
  const pendingCount = reviews.length - repliedCount;
  const fiveStars    = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="tgr-root">
      <div className="tgr-header">
        <p className="tgr-overline">Tour Guide Portal</p>
        <h1>Guest Reviews</h1>
        <p className="tgr-subtitle">See what visitors say about your tours.</p>
      </div>

      {/* KPI row */}
      <div className="tgr-stats">
        <div className="tgr-stat-card" style={{ borderTopColor: "#bb3e22" }}>
          <p>Total Reviews</p>
          <h2>{reviews.length}</h2>
        </div>
        <div className="tgr-stat-card" style={{ borderTopColor: "#e8a838" }}>
          <p>Average Rating</p>
          <h2>{avgRating} <span className="tgr-stat-star">★</span></h2>
        </div>
        <div className="tgr-stat-card" style={{ borderTopColor: "#4a9e5c" }}>
          <p>5-Star Reviews</p>
          <h2 className="tgr-green">{fiveStars}</h2>
        </div>
        <div className="tgr-stat-card" style={{ borderTopColor: pendingCount > 0 ? "#e07b30" : "#4a9e5c" }}>
          <p>Awaiting Reply</p>
          <h2 className={pendingCount > 0 ? "tgr-orange" : "tgr-green"}>{pendingCount}</h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tgr-toolbar">
        <input
          className="tgr-search"
          type="text"
          placeholder="Search by reviewer, tour or comment…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="tgr-filter" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} ★</option>
          ))}
        </select>
        <select className="tgr-filter" value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Awaiting reply</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {loading && <div className="tgr-message">Loading reviews…</div>}
      {!loading && error && <div className="tgr-message tgr-message--error">{error}</div>}

      {!loading && !error && reviews.length === 0 && (
        <div className="tgr-empty">
          <span className="tgr-empty-icon">💬</span>
          <h2>No reviews yet</h2>
          <p>Visitor reviews from your tours will appear here once submitted.</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && filtered.length === 0 && (
        <div className="tgr-empty">
          <span className="tgr-empty-icon">🔍</span>
          <h2>No matches</h2>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="tgr-list">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} token={token} onReplySaved={handleReplySaved} />
          ))}
        </div>
      )}
    </div>
  );
}
