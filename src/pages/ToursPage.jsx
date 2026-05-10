import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ToursPage.css";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
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

function toYMD(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function TourCalendar({ tours, selectedDate, onSelectDate }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const tourDates = new Set(tours.map((t) => t.date));

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const toursThisMonth = tours.filter((t) => {
    if (!t.date) return false;
    const [y, mo] = t.date.split("-");
    return parseInt(y) === calYear && parseInt(mo) - 1 === calMonth;
  });

  return (
    <aside className="tours-calendar">
      <div className="tours-cal-title">
        <span className="tours-cal-title-icon">📅</span>
        Tour Calendar
      </div>

      <div className="tours-cal-header">
        <button className="tours-cal-nav" onClick={prevMonth} aria-label="Previous month">&#8592;</button>
        <span className="tours-cal-month">{MONTH_NAMES[calMonth]} {calYear}</span>
        <button className="tours-cal-nav" onClick={nextMonth} aria-label="Next month">&#8594;</button>
      </div>

      <div className="tours-cal-grid">
        {DAY_NAMES.map((d) => (
          <div key={d} className="tours-cal-dayname">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="tours-cal-empty" />;
          const ymd = toYMD(calYear, calMonth, day);
          const hasTour = tourDates.has(ymd);
          const isToday =
            today.getFullYear() === calYear &&
            today.getMonth() === calMonth &&
            today.getDate() === day;
          const isSelected = selectedDate === ymd;

          return (
            <button
              key={ymd}
              className={[
                "tours-cal-day",
                hasTour ? "tours-cal-day--has-tour" : "",
                isToday ? "tours-cal-day--today" : "",
                isSelected ? "tours-cal-day--selected" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onSelectDate(isSelected ? null : ymd)}
              aria-label={`${day} ${MONTH_NAMES[calMonth]}${hasTour ? " — has tours" : ""}`}
            >
              <span className="tours-cal-day-num">{day}</span>
              {hasTour && <span className="tours-cal-dot" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button className="tours-cal-clear" onClick={() => onSelectDate(null)}>
          ✕ Show all tours
        </button>
      )}

      <div className="tours-cal-summary">
        {toursThisMonth.length === 0 ? (
          <p className="tours-cal-summary-empty">No tours this month</p>
        ) : (
          <>
            <p className="tours-cal-summary-label">
              {toursThisMonth.length} tour{toursThisMonth.length > 1 ? "s" : ""} this month
            </p>
            <ul className="tours-cal-summary-list">
              {toursThisMonth.slice(0, 4).map((t) => (
                <li key={t.id} className="tours-cal-summary-item">
                  <span className="tours-cal-summary-dot" />
                  <span className="tours-cal-summary-day">
                    {new Date(t.date + "T00:00:00").getDate()}
                  </span>
                  <span className="tours-cal-summary-name">{t.title}</span>
                </li>
              ))}
              {toursThisMonth.length > 4 && (
                <li className="tours-cal-summary-more">+{toursThisMonth.length - 4} more</li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="tours-cal-legend">
        <span className="tours-cal-legend-dot" />
        <span>Tour scheduled</span>
      </div>
    </aside>
  );
}

function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

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

  const visibleTours = selectedDate
    ? tours.filter((t) => t.date === selectedDate)
    : tours;

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

        {!loading && !error && (
          <div className="tours-page-content">
            <div className="tours-page-left">
              {selectedDate && (
                <p className="tours-filter-label">
                  Showing tours for <strong>{formatDate(selectedDate)}</strong>
                </p>
              )}

              {visibleTours.length === 0 ? (
                <p className="tours-page-status">
                  {selectedDate
                    ? "No tours on this date."
                    : "No tours are currently available. Check back soon!"}
                </p>
              ) : (
                <div className="tours-grid">
                  {visibleTours.map((tour) => {
                    const past = isPast(tour.date);
                    const full = tour.is_full;
                    const disabled = past || full;

                    return (
                      <article
                        key={tour.id}
                        className={`tours-grid-card${past ? " tours-grid-card--past" : ""}`}
                      >
                        <div className="tours-grid-card-top">
                          <div className="tours-grid-card-badges">
                            <span className="tours-grid-badge tours-grid-badge--kind">
                              {tour.kind.replace(/-/g, " ")}
                            </span>
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
            </div>

            <TourCalendar
              tours={tours}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default ToursPage;
