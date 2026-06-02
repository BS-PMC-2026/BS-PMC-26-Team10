import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ReviewsSection from "../components/ReviewsSection/ReviewsSection";
import "../styles/ToursPage.css";

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
  const { t } = useTranslation();
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const dayNames = t("tours.dayNames", { returnObjects: true });
  const tourDates = new Set(tours.map((tour) => tour.date));

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

  const toursThisMonth = tours.filter((tour) => {
    if (!tour.date) return false;
    const [y, mo] = tour.date.split("-");
    return parseInt(y) === calYear && parseInt(mo) - 1 === calMonth;
  });

  return (
    <aside className="tours-calendar">
      <div className="tours-cal-title">
        <span className="tours-cal-title-icon">📅</span>
        {t("tours.calTitle")}
      </div>

      <div className="tours-cal-header">
        <button className="tours-cal-nav" onClick={prevMonth} aria-label={t("tours.prevMonth")}>&#8592;</button>
        <span className="tours-cal-month">{MONTH_NAMES[calMonth]} {calYear}</span>
        <button className="tours-cal-nav" onClick={nextMonth} aria-label={t("tours.nextMonth")}>&#8594;</button>
      </div>

      <div className="tours-cal-grid">
        {Array.isArray(dayNames) && dayNames.map((d) => (
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
          {t("tours.showAll")}
        </button>
      )}

      <div className="tours-cal-summary">
        {toursThisMonth.length === 0 ? (
          <p className="tours-cal-summary-empty">{t("tours.noToursMonth")}</p>
        ) : (
          <>
            <p className="tours-cal-summary-label">
              {t("tours.toursMonth", { count: toursThisMonth.length })}
            </p>
            <ul className="tours-cal-summary-list">
              {toursThisMonth.slice(0, 4).map((tour) => (
                <li key={tour.id} className="tours-cal-summary-item">
                  <span className="tours-cal-summary-dot" />
                  <span className="tours-cal-summary-day">
                    {new Date(tour.date + "T00:00:00").getDate()}
                  </span>
                  <span className="tours-cal-summary-name">{tour.title}</span>
                </li>
              ))}
              {toursThisMonth.length > 4 && (
                <li className="tours-cal-summary-more">
                  {t("tours.more", { count: toursThisMonth.length - 4 })}
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      <div className="tours-cal-legend">
        <span className="tours-cal-legend-dot" />
        <span>{t("tours.tourScheduled")}</span>
      </div>
    </aside>
  );
}

function ToursPage() {
  const { t, i18n } = useTranslation();
  const [tours, setTours] = useState([]);
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faqLoading, setFaqLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faqError, setFaqError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [openFaqIds, setOpenFaqIds] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tours`)
      .then((res) => {
        if (!res.ok) throw new Error(t("tours.loading"));
        return res.json();
      })
      .then((data) => {
        setTours(data.filter((tour) => tour.visibility === "public" || tour.visibility === "published"));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // In Hebrew, use static translated FAQ from i18n; in English, fetch from API.
  useEffect(() => {
    if (i18n.language === "he") {
      const staticFaq = t("tours.faqStatic", { returnObjects: true });
      const items = Array.isArray(staticFaq)
        ? staticFaq.map((item, idx) => ({ id: idx, question: item.question, answer: item.answer }))
        : [];
      setFaqItems(items); // eslint-disable-line react-hooks/set-state-in-effect
      setFaqLoading(false);
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/faq`)
      .then((res) => {
        if (!res.ok) throw new Error(t("tours.faqError"));
        return res.json();
      })
      .then((data) => {
        setFaqItems(Array.isArray(data) ? data : []);
        setFaqLoading(false);
      })
      .catch((err) => {
        setFaqError(err.message);
        setFaqLoading(false);
      });
  }, [i18n.language]);

  function toggleFaq(id) {
    setOpenFaqIds((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  }

  const visibleTours = selectedDate
    ? tours.filter((tour) => tour.date === selectedDate)
    : tours;

  return (
    <div className="tours-page">
      <header className="tours-page-header">
        <Link to="/" className="tours-page-back">&#8592; {t("tours.backHome")}</Link>
        <div className="tours-page-header-text">
          <p className="tours-page-kicker">{t("tours.kicker")}</p>
          <h1 className="tours-page-title">{t("tours.title")}</h1>
          <a href="#tour-faq" className="tours-page-faq-link">{t("tours.faqBtn")}</a>
          <p className="tours-page-subtitle">{t("tours.subtitle")}</p>
        </div>
      </header>

      <main className="tours-page-main">
        {loading && <p className="tours-page-status">{t("tours.loading")}</p>}
        {error && <p className="tours-page-status tours-page-error">{error}</p>}

        {!loading && !error && (
          <div className="tours-page-content">
            <div className="tours-page-left">
              {selectedDate && (
                <p className="tours-filter-label">
                  {t("tours.showingDate", { date: formatDate(selectedDate) })}
                </p>
              )}

              {visibleTours.length === 0 ? (
                <p className="tours-page-status">
                  {selectedDate ? t("tours.noToursDate") : t("tours.noTours")}
                </p>
              ) : (
                <div className="tours-grid">
                  {visibleTours.map((tour) => {
                    const past = isPast(tour.date);
                    const full = tour.is_full;

                    return (
                      <article
                        key={tour.id}
                        className={`tours-grid-card${past ? " tours-grid-card--past" : ""}`}
                      >
                        {tour.picture && (
                          <img
                            src={tour.picture}
                            alt={tour.title}
                            className="tours-grid-card-image"
                          />
                        )}
                        <div className="tours-grid-card-top">
                          <div className="tours-grid-card-badges">
                            <span className="tours-grid-badge tours-grid-badge--kind">
                              {tour.kind.replace(/-/g, " ")}
                            </span>
                            {full && <span className="tours-grid-badge tours-grid-badge--full">{t("tours.full")}</span>}
                            {past && <span className="tours-grid-badge tours-grid-badge--past">{t("tours.past")}</span>}
                          </div>
                          <h2 className="tours-grid-card-title">{tour.title}</h2>
                          {tour.description && (
                            <p className="tours-grid-card-description">{tour.description}</p>
                          )}
                        </div>

                        <div className="tours-grid-card-meta">
                          <div className="tours-grid-meta-row">
                            <span className="tours-grid-meta-label">{t("tours.date")}</span>
                            <span>{formatDate(tour.date)}</span>
                          </div>
                          <div className="tours-grid-meta-row">
                            <span className="tours-grid-meta-label">{t("tours.time")}</span>
                            <span>{formatTime(tour.time)}</span>
                          </div>
                          <div className="tours-grid-meta-row">
                            <span className="tours-grid-meta-label">{t("tours.duration")}</span>
                            <span>{tour.duration}</span>
                          </div>
                          <div className="tours-grid-meta-row">
                            <span className="tours-grid-meta-label">{t("tours.price")}</span>
                            <span>{tour.price > 0 ? `$${Number(tour.price).toFixed(2)}` : t("tours.free")}</span>
                          </div>
                          <div className="tours-grid-meta-row">
                            <span className="tours-grid-meta-label">{t("tours.spots")}</span>
                            <span className={full ? "tours-grid-spots--none" : "tours-grid-spots--ok"}>
                              {full ? t("tours.fullyBooked") : `${tour.remaining_spots} / ${tour.capacity}`}
                            </span>
                          </div>
                        </div>

                        <div className="tours-grid-card-footer">
                          {past ? (
                            <button className="tours-grid-btn tours-grid-btn--disabled" disabled>
                              {t("tours.tourPassed")}
                            </button>
                          ) : (
                            <Link to={`/tours/${tour.id}`} className="tours-grid-btn">
                              {full ? t("tours.viewDetails") : t("tours.bookNow")}
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

        {!loading && !error && (
          <ReviewsSection tours={tours} />
        )}

        {!loading && (
          <section id="tour-faq" className="tours-faq" aria-labelledby="tour-faq-title">
            <div className="tours-faq-heading">
              <p className="tours-faq-kicker">{t("tours.faqTitle")}</p>
              <h2 id="tour-faq-title">{t("tours.faqSubtitle")}</h2>
              <p>{t("tours.faqDesc")}</p>
            </div>

            {faqLoading && <p className="tours-faq-status">{t("tours.faqLoading")}</p>}
            {faqError && (
              <p className="tours-faq-status tours-faq-status--error">
                {t("tours.faqError")}
              </p>
            )}
            {!faqLoading && !faqError && faqItems.length === 0 && (
              <p className="tours-faq-status">{t("tours.faqEmpty")}</p>
            )}
            {!faqLoading && !faqError && faqItems.length > 0 && (
              <div className="tours-faq-list">
                {faqItems.map((item) => {
                  const isOpen = openFaqIds.includes(item.id);
                  return (
                    <article key={item.id} className={`tours-faq-item${isOpen ? " tours-faq-item--open" : ""}`}>
                      <button
                        type="button"
                        className="tours-faq-question"
                        onClick={() => toggleFaq(item.id)}
                        aria-expanded={isOpen}
                      >
                        <span>
                          {item.category && <span className="tours-faq-category">{item.category}</span>}
                          {item.question}
                        </span>
                        <span className="tours-faq-icon" aria-hidden="true">{isOpen ? "-" : "+"}</span>
                      </button>
                      {isOpen && (
                        <p className="tours-faq-answer">{item.answer}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default ToursPage;
