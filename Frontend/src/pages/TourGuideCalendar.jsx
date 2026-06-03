import { useEffect, useMemo, useState } from "react";
import "../styles/TourGuideCalendar.css";

const API = import.meta.env.VITE_API_URL;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function TourPill({ tour, onClick }) {
  const isFull = tour.is_full;
  return (
    <button
      className={`tgc-pill${isFull ? " tgc-pill--full" : ""}`}
      onClick={() => onClick(tour)}
      title={tour.title}
    >
      <span className="tgc-pill-dot" />
      <span className="tgc-pill-text">{tour.title}</span>
    </button>
  );
}

function TourDetailPanel({ tour, onClose }) {
  if (!tour) return null;

  const dateLabel = tour.date
    ? new Date(tour.date).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "—";
  const booked = tour.capacity - (tour.remaining_spots ?? tour.capacity);
  const pct = tour.capacity > 0 ? Math.round((booked / tour.capacity) * 100) : 0;

  return (
    <div className="tgc-detail-panel">
      <div className="tgc-detail-header">
        <h3 className="tgc-detail-title">{tour.title}</h3>
        <button className="tgc-detail-close" onClick={onClose}>✕</button>
      </div>

      {tour.picture && (
        <img src={tour.picture} alt={tour.title} className="tgc-detail-img" />
      )}

      <div className="tgc-detail-meta">
        <div className="tgc-detail-row">
          <span className="tgc-detail-icon">📅</span>
          <span>{dateLabel}</span>
        </div>
        <div className="tgc-detail-row">
          <span className="tgc-detail-icon">🕐</span>
          <span>{tour.time ? tour.time.slice(0, 5) : "—"} · {tour.duration || "—"}</span>
        </div>
        {tour.meeting_point && (
          <div className="tgc-detail-row">
            <span className="tgc-detail-icon">📍</span>
            <span>{tour.meeting_point}</span>
          </div>
        )}
        <div className="tgc-detail-row">
          <span className="tgc-detail-icon">💰</span>
          <span>{tour.price > 0 ? `₪${tour.price}` : "Free"}</span>
        </div>
        {tour.kind && (
          <div className="tgc-detail-row">
            <span className="tgc-detail-icon">🌶️</span>
            <span>{tour.kind}</span>
          </div>
        )}
      </div>

      <div className="tgc-detail-capacity">
        <div className="tgc-detail-cap-header">
          <span>Bookings</span>
          <span>{booked} / {tour.capacity}</span>
        </div>
        <div className="tgc-detail-cap-bar-wrap">
          <div className="tgc-detail-cap-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="tgc-detail-cap-note">
          {tour.remaining_spots === 0 ? "Fully booked" : `${tour.remaining_spots} spots remaining`}
        </p>
      </div>

      {tour.description && (
        <p className="tgc-detail-desc">{tour.description}</p>
      )}

      {tour.includes && (
        <div className="tgc-detail-includes">
          <span className="tgc-detail-includes-label">Includes</span>
          <span>{tour.includes}</span>
        </div>
      )}
    </div>
  );
}

export default function TourGuideCalendar() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTour, setSelectedTour] = useState(null);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    fetch(`${API}/tours`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { setTours(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Could not load tours."); setLoading(false); });
  }, []);

  // group tours by date string "YYYY-MM-DD"
  const toursByDate = useMemo(() => {
    const map = {};
    tours.forEach((t) => {
      if (!t.date) return;
      const key = t.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tours]);

  const pad = (n) => String(n).padStart(2, "0");
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const toursThisMonth = useMemo(
    () => tours.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
    [tours, year, month]
  );

  if (loading) {
    return (
      <div className="tgc-loading">
        <div className="tgc-spinner" />
        <p>Loading calendar…</p>
      </div>
    );
  }

  return (
    <div className="tgc-root">
      <div className="tgc-header">
        <div>
          <p className="tgc-overline">Tour Guide Portal</p>
          <h1>Tour Calendar</h1>
          <p className="tgc-subtitle">
            {toursThisMonth.length} tour{toursThisMonth.length !== 1 ? "s" : ""} scheduled in {MONTH_NAMES[month]} {year}
          </p>
        </div>
      </div>

      {error && <div className="tgc-error">{error}</div>}

      <div className="tgc-layout">
        <div className="tgc-cal-wrap">
          {/* Calendar nav */}
          <div className="tgc-cal-nav">
            <button className="tgc-nav-btn" onClick={prevMonth}>‹ Prev</button>
            <div className="tgc-cal-month-title">
              {MONTH_NAMES[month]} {year}
            </div>
            <button className="tgc-today-btn" onClick={goToday}>Today</button>
            <button className="tgc-nav-btn" onClick={nextMonth}>Next ›</button>
          </div>

          {/* Calendar grid */}
          <div className="tgc-cal-grid">
            {DAY_NAMES.map((d) => (
              <div key={d} className="tgc-col-head">{d}</div>
            ))}

            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} className="tgc-cell tgc-cell--empty" />;
              const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
              const dayTours = toursByDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;

              return (
                <div
                  key={dateStr}
                  className={
                    "tgc-cell" +
                    (isToday ? " tgc-cell--today" : "") +
                    (isPast ? " tgc-cell--past" : "") +
                    (dayTours.length > 0 ? " tgc-cell--has-tours" : "")
                  }
                >
                  <span className="tgc-day-num">{day}</span>
                  <div className="tgc-pills">
                    {dayTours.slice(0, 3).map((t) => (
                      <TourPill key={t.id} tour={t} onClick={setSelectedTour} />
                    ))}
                    {dayTours.length > 3 && (
                      <span className="tgc-pill-more">+{dayTours.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className={`tgc-side${selectedTour ? " tgc-side--open" : ""}`}>
          {selectedTour ? (
            <TourDetailPanel tour={selectedTour} onClose={() => setSelectedTour(null)} />
          ) : (
            <div className="tgc-side-placeholder">
              <span className="tgc-side-icon">🌶️</span>
              <p>Click a tour to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
