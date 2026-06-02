import { useEffect, useMemo, useState } from "react";
import "../styles/TourGuideBookings.css";

const API = import.meta.env.VITE_API_URL;

function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  return (
    <span className={`tgb-badge tgb-badge--${s === "confirmed" ? "confirmed" : "cancelled"}`}>
      {s === "confirmed" ? "Confirmed" : "Cancelled"}
    </span>
  );
}

function PayBadge({ status }) {
  return (
    <span className={`tgb-badge tgb-badge--${status === "paid" ? "paid" : "free"}`}>
      {status === "paid" ? "Paid" : "Free"}
    </span>
  );
}

export default function TourGuideBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [tourFilter, setTourFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tours, setTours]       = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const toursRes = await fetch(`${API}/tours`);
        if (!toursRes.ok) throw new Error();
        const tourList = await toursRes.json();
        const list = Array.isArray(tourList) ? tourList : [];
        setTours(list);

        const perTour = await Promise.all(
          list.map((t) =>
            fetch(`${API}/tours/${t.id}/bookings`)
              .then((r) => (r.ok ? r.json() : []))
              .then((rows) =>
                (Array.isArray(rows) ? rows : []).map((b) => ({
                  ...b,
                  tour_id: t.id,
                  tour_title: t.title,
                  tour_date: t.date,
                }))
              )
              .catch(() => [])
          )
        );
        setBookings(perTour.flat().sort((a, b) => {
          if (a.tour_date && b.tour_date) return new Date(a.tour_date) - new Date(b.tour_date);
          return 0;
        }));
      } catch {
        setError("Could not load bookings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter((b) => {
      const matchSearch =
        (b.full_name?.toLowerCase() ?? "").includes(q) ||
        (b.email?.toLowerCase() ?? "").includes(q) ||
        (b.booking_reference?.toLowerCase() ?? "").includes(q) ||
        (b.tour_title?.toLowerCase() ?? "").includes(q);
      const matchTour   = tourFilter === "all" || String(b.tour_id) === tourFilter;
      const matchStatus = statusFilter === "all" || b.status?.toLowerCase() === statusFilter;
      return matchSearch && matchTour && matchStatus;
    });
  }, [bookings, search, tourFilter, statusFilter]);

  const confirmed   = bookings.filter((b) => b.status?.toLowerCase() === "confirmed").length;
  const cancelled   = bookings.filter((b) => b.status?.toLowerCase() === "cancelled").length;
  const totalPeople = bookings
    .filter((b) => b.status?.toLowerCase() === "confirmed")
    .reduce((s, b) => s + (parseInt(b.participants_count, 10) || 0), 0);

  return (
    <div className="tgb-root">
      <div className="tgb-header">
        <p className="tgb-overline">Tour Guide Portal</p>
        <h1>Bookings</h1>
        <p className="tgb-subtitle">All visitor reservations across your tours.</p>
      </div>

      {/* KPI row */}
      <div className="tgb-stats">
        <div className="tgb-stat-card" style={{ borderTopColor: "#bb3e22" }}>
          <p>Total Bookings</p>
          <h2>{bookings.length}</h2>
        </div>
        <div className="tgb-stat-card" style={{ borderTopColor: "#4a9e5c" }}>
          <p>Confirmed</p>
          <h2 className="tgb-green">{confirmed}</h2>
        </div>
        <div className="tgb-stat-card" style={{ borderTopColor: "#c0392b" }}>
          <p>Cancelled</p>
          <h2 className="tgb-red">{cancelled}</h2>
        </div>
        <div className="tgb-stat-card" style={{ borderTopColor: "#a14d2a" }}>
          <p>Total Visitors</p>
          <h2>{totalPeople}</h2>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tgb-toolbar">
        <input
          className="tgb-search"
          type="text"
          placeholder="Search by name, email, reference or tour…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="tgb-filter" value={tourFilter} onChange={(e) => setTourFilter(e.target.value)}>
          <option value="all">All tours</option>
          {tours.map((t) => (
            <option key={t.id} value={String(t.id)}>{t.title}</option>
          ))}
        </select>
        <select className="tgb-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && <div className="tgb-message">Loading bookings…</div>}
      {!loading && error && <div className="tgb-message tgb-message--error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="tgb-empty">
          <span className="tgb-empty-icon">📋</span>
          <h2>{bookings.length === 0 ? "No bookings yet" : "No matches"}</h2>
          <p>{bookings.length === 0 ? "Bookings will appear here once visitors reserve a spot." : "Try adjusting your search or filters."}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="tgb-table-wrap">
          <table className="tgb-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Visitor</th>
                <th>Tour</th>
                <th>Date</th>
                <th>Participants</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const dateLabel = b.tour_date
                  ? new Date(b.tour_date).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })
                  : "—";
                return (
                  <tr key={b.booking_reference ?? b.id}>
                    <td>
                      <span className="tgb-ref">{b.booking_reference ?? "—"}</span>
                    </td>
                    <td>
                      <div className="tgb-visitor">
                        <span className="tgb-visitor-name">{b.full_name ?? "—"}</span>
                        <span className="tgb-visitor-email">{b.email ?? ""}</span>
                        {b.phone && <span className="tgb-visitor-phone">{b.phone}</span>}
                      </div>
                    </td>
                    <td className="tgb-tour-cell">{b.tour_title ?? `Tour #${b.tour_id}`}</td>
                    <td className="tgb-date-cell">{dateLabel}</td>
                    <td className="tgb-count-cell">{b.participants_count ?? "—"}</td>
                    <td><PayBadge status={b.payment_status} /></td>
                    <td><StatusBadge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
