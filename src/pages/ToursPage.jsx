import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ToursPage.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/tours")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tours.");
        return res.json();
      })
      .then((data) => {
        setTours(data.filter((t) => t.visibility === "public" || t.visibility === "published"));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="tours-page">
      <header className="tours-page-header">
        <Link to="/" className="tours-page-back">&#8592; Back to home</Link>
        <div className="tours-page-header-text">
          <p className="tours-page-kicker">ChiliLand Farm Experiences</p>
          <h1 className="tours-page-title">Available Tours</h1>
          <p className="tours-page-subtitle">
            Choose a tour, pick your date, and secure your spot — no account needed.
          </p>
        </div>
      </header>

      <main className="tours-page-main">
        {loading && <p className="tours-page-status">Loading tours…</p>}
        {error && <p className="tours-page-status tours-page-error">{error}</p>}
        {!loading && !error && tours.length === 0 && (
          <p className="tours-page-status">No tours are currently available. Check back soon!</p>
        )}

        {!loading && !error && tours.length > 0 && (
          <div className="tours-grid">
            {tours.map((tour) => {
              const past = isPast(tour.date);
              const full = tour.is_full;
              const disabled = past || full;

              return (
                <article key={tour.id} className={`tours-grid-card${past ? " tours-grid-card--past" : ""}`}>
                  <div className="tours-grid-card-top">
                    <div className="tours-grid-card-badges">
                      <span className="tours-grid-badge tours-grid-badge--kind">{tour.kind.replace(/-/g, " ")}</span>
                      {full && <span className="tours-grid-badge tours-grid-badge--full">Full</span>}
                      {past && <span className="tours-grid-badge tours-grid-badge--past">Past</span>}
                    </div>
                    <h2 className="tours-grid-card-title">{tour.title}</h2>
                    {tour.description && (
                      <p className="tours-grid-card-description">{tour.description}</p>
                    )}
                  </div>

                  <div className="tours-grid-card-meta">
                    <div className="tours-grid-meta-row">
                      <span className="tours-grid-meta-label">Date</span>
                      <span>{formatDate(tour.date)}</span>
                    </div>
                    <div className="tours-grid-meta-row">
                      <span className="tours-grid-meta-label">Time</span>
                      <span>{formatTime(tour.time)}</span>
                    </div>
                    <div className="tours-grid-meta-row">
                      <span className="tours-grid-meta-label">Duration</span>
                      <span>{tour.duration}</span>
                    </div>
                    <div className="tours-grid-meta-row">
                      <span className="tours-grid-meta-label">Price</span>
                      <span>{tour.price > 0 ? `$${Number(tour.price).toFixed(2)}` : "Free"}</span>
                    </div>
                    <div className="tours-grid-meta-row">
                      <span className="tours-grid-meta-label">Spots left</span>
                      <span className={full ? "tours-grid-spots--none" : "tours-grid-spots--ok"}>
                        {full ? "0 — Full" : `${tour.remaining_spots} / ${tour.capacity}`}
                      </span>
                    </div>
                  </div>

                  <div className="tours-grid-card-footer">
                    {disabled ? (
                      <button className="tours-grid-btn tours-grid-btn--disabled" disabled>
                        {full ? "Fully Booked" : "Tour Passed"}
                      </button>
                    ) : (
                      <Link to={`/tours/${tour.id}`} className="tours-grid-btn">
                        Book Now
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ToursPage;
