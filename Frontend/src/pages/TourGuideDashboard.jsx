import { useEffect, useMemo, useState } from "react";
import "../styles/TourGuideDashboard.css";

const API = import.meta.env.VITE_API_URL;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="tgd-stat-card" style={{ borderTopColor: accent }}>
      <div className="tgd-stat-icon" style={{ background: accent + "18", color: accent }}>
        {icon}
      </div>
      <div className="tgd-stat-body">
        <p className="tgd-stat-label">{label}</p>
        <h2 className="tgd-stat-value">{value}</h2>
        {sub && <p className="tgd-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function MiniCalendar({ tours }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const tourDateSet = useMemo(() => {
    const s = new Set();
    tours.forEach((t) => {
      if (t.date) s.add(t.date.slice(0, 10));
    });
    return s;
  }, [tours]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="tgd-mini-cal">
      <div className="tgd-mini-cal-header">
        <button className="tgd-mini-cal-nav" onClick={prevMonth}>‹</button>
        <span className="tgd-mini-cal-title">{MONTH_NAMES[month]} {year}</span>
        <button className="tgd-mini-cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="tgd-mini-cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="tgd-mini-cal-day-name">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasTour = tourDateSet.has(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={
                "tgd-mini-cal-cell" +
                (isToday ? " tgd-mini-cal-cell--today" : "") +
                (hasTour ? " tgd-mini-cal-cell--tour" : "")
              }
            >
              {day}
              {hasTour && <span className="tgd-mini-cal-dot" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingTourRow({ tour }) {
  const dateObj = tour.date ? new Date(tour.date) : null;
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const spotsLeft = tour.remaining_spots ?? (tour.capacity - (tour.booked ?? 0));
  const pct = tour.capacity > 0 ? Math.round(((tour.capacity - spotsLeft) / tour.capacity) * 100) : 0;

  return (
    <div className="tgd-upcoming-row">
      <div className="tgd-upcoming-info">
        <span className="tgd-upcoming-title">{tour.title}</span>
        <span className="tgd-upcoming-meta">
          {dateLabel} · {tour.time ? tour.time.slice(0, 5) : "—"} · {tour.duration || ""}
        </span>
        {tour.meeting_point && (
          <span className="tgd-upcoming-location">📍 {tour.meeting_point}</span>
        )}
      </div>
      <div className="tgd-upcoming-capacity">
        <div className="tgd-cap-bar-wrap">
          <div className="tgd-cap-bar" style={{ width: `${pct}%` }} />
        </div>
        <span className="tgd-cap-label">{tour.capacity - spotsLeft}/{tour.capacity} booked</span>
      </div>
      <div className="tgd-upcoming-price">
        {tour.price > 0 ? `₪${tour.price}` : <span className="tgd-free-badge">Free</span>}
      </div>
    </div>
  );
}

export default function TourGuideDashboard({ onNav }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalVisitors, setTotalVisitors] = useState(0);

  useEffect(() => {
    fetch(`${API}/tours`)
      .then((r) => (r.ok ? r.json() : []))
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setTours(list);

        // fetch bookings for all tours to get total visitors
        const counts = await Promise.all(
          list.map((t) =>
            fetch(`${API}/tours/${t.id}/bookings`)
              .then((r) => (r.ok ? r.json() : []))
              .then((rows) =>
                (Array.isArray(rows) ? rows : [])
                  .filter((b) => b.status !== "cancelled")
                  .reduce((s, b) => s + (parseInt(b.participants_count, 10) || 0), 0)
              )
              .catch(() => 0)
          )
        );
        setTotalVisitors(counts.reduce((a, b) => a + b, 0));
        setLoading(false);
      })
      .catch(() => { setError("Could not load tours."); setLoading(false); });
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTours = useMemo(
    () =>
      tours
        .filter((t) => t.date && new Date(t.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [tours, today]
  );

  const completedTours = tours.filter((t) => t.date && new Date(t.date) < today).length;

  const thisMonthTours = useMemo(
    () =>
      tours.filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
      }).length,
    [tours, today]
  );

  const nextTour = upcomingTours[0];
  const nextTourLabel = nextTour
    ? new Date(nextTour.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : null;

  if (loading) {
    return (
      <div className="tgd-loading">
        <div className="tgd-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="tgd-root">
      <div className="tgd-header">
        <p className="tgd-overline">Tour Guide Portal</p>
        <h1>Dashboard</h1>
        <p className="tgd-subtitle">Your tours, bookings and visitor overview at a glance.</p>
      </div>

      {error && <div className="tgd-error">{error}</div>}

      {/* KPI cards */}
      <div className="tgd-stats-row">
        <StatCard
          label="Upcoming Tours"
          value={upcomingTours.length}
          sub={nextTourLabel ? `Next: ${nextTourLabel}` : "No upcoming tours"}
          accent="#bb3e22"
          icon="🗓"
        />
        <StatCard
          label="Total Visitors"
          value={totalVisitors}
          sub="Confirmed bookings"
          accent="#a14d2a"
          icon="👥"
        />
        <StatCard
          label="This Month"
          value={thisMonthTours}
          sub={`${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`}
          accent="#6d9e3f"
          icon="📅"
        />
        <StatCard
          label="Completed"
          value={completedTours}
          sub="Past tours"
          accent="#5a7abf"
          icon="✅"
        />
      </div>

      <div className="tgd-main-row">
        {/* Upcoming tours list */}
        <div className="tgd-card tgd-card--upcoming">
          <div className="tgd-card-head">
            <div>
              <h3 className="tgd-card-title">Upcoming Tours</h3>
              <p className="tgd-card-sub">Your next scheduled tours</p>
            </div>
            <button className="tgd-view-all" onClick={() => onNav("calendar")}>
              View calendar →
            </button>
          </div>

          {upcomingTours.length === 0 ? (
            <div className="tgd-empty">
              <span className="tgd-empty-icon">🌶️</span>
              <p>No upcoming tours. <button className="tgd-link" onClick={() => onNav("create")}>Create one</button></p>
            </div>
          ) : (
            <div className="tgd-upcoming-list">
              {upcomingTours.slice(0, 6).map((t) => (
                <UpcomingTourRow key={t.id} tour={t} />
              ))}
              {upcomingTours.length > 6 && (
                <p className="tgd-more-hint">+{upcomingTours.length - 6} more tours</p>
              )}
            </div>
          )}
        </div>

        {/* Mini calendar */}
        <div className="tgd-card tgd-card--cal">
          <h3 className="tgd-card-title">Tour Calendar</h3>
          <p className="tgd-card-sub">Days with tours are highlighted</p>
          <MiniCalendar tours={tours} />
          <button className="tgd-full-cal-btn" onClick={() => onNav("calendar")}>
            Open full calendar
          </button>
        </div>
      </div>
    </div>
  );
}
