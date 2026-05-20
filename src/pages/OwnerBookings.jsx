import { useEffect, useMemo, useState } from "react";
import "../styles/OwnerBookings.css";

const BASE_URL = "http://127.0.0.1:8000";

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const toursRes = await fetch(`${BASE_URL}/tours`);
      if (!toursRes.ok) throw new Error("Failed to load tours");
      const toursData = await toursRes.json();
      const tourList = Array.isArray(toursData) ? toursData : [];
      const perTour = await Promise.all(
        tourList.map((t) =>
          fetch(`${BASE_URL}/tours/${t.id}/bookings`)
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) =>
              (Array.isArray(rows) ? rows : []).map((b) => ({
                ...b,
                tour_id: t.id,
                tour_title: t.title,
              }))
            )
            .catch(() => [])
        )
      );
      setBookings(perTour.flat());
    } catch (err) {
      setError("Could not load bookings from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return bookings.filter((b) => {
      const matchesSearch =
        (b.full_name?.toLowerCase() ?? "").includes(q) ||
        (b.email?.toLowerCase() ?? "").includes(q) ||
        (b.booking_reference?.toLowerCase() ?? "").includes(q) ||
        (b.tour_title?.toLowerCase() ?? "").includes(q);
      const matchesStatus =
        statusFilter === "all" || b.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const totalBookings = bookings.length;
  const paidBookings = bookings.filter((b) => b.payment_status === "paid").length;
  const freeBookings = bookings.filter((b) => b.payment_status === "free").length;
  const totalParticipants = bookings.reduce(
    (sum, b) => sum + (parseInt(b.participants_count, 10) || 0), 0
  );

  return (
    <div className="ob-content">
      <div className="ob-header">
        <p className="ob-overline">Owner Control Center</p>
        <h1>Booking Requests</h1>
        <p className="ob-subtitle">
          View and track all tour reservations, payment status, and visitor details.
        </p>
      </div>

      <div className="ob-stats">
        <div className="ob-stat-card">
          <p>Total Bookings</p>
          <h2>{totalBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>Paid</p>
          <h2>{paidBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>Free / Pending</p>
          <h2>{freeBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>Total Participants</p>
          <h2>{totalParticipants}</h2>
        </div>
      </div>

      <div className="ob-toolbar">
        <input
          type="text"
          className="ob-search"
          placeholder="Search by name, email, reference or tour…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="ob-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="free">Free</option>
        </select>
      </div>

      {loading && <div className="ob-message">Loading bookings…</div>}
      {!loading && error && <div className="ob-message ob-message--error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="ob-empty">
          <h2>No bookings found</h2>
          <p>Bookings will appear here once visitors start reserving tours.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Visitor</th>
                <th>Tour</th>
                <th>Participants</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.booking_reference ?? b.id}>
                  <td>
                    <span className="ob-reference">{b.booking_reference ?? "—"}</span>
                  </td>
                  <td>
                    <div className="ob-visitor">
                      <span>{b.full_name ?? "—"}</span>
                      <small>{b.email ?? ""}</small>
                      {b.phone && <small>{b.phone}</small>}
                    </div>
                  </td>
                  <td>{b.tour_title ?? `Tour #${b.tour_id}`}</td>
                  <td>{b.participants_count ?? "—"}</td>
                  <td>
                    <span className={`ob-badge ob-badge--${b.payment_status === "paid" ? "paid" : "free"}`}>
                      {b.payment_status === "paid" ? "Paid" : "Free"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OwnerBookings;
