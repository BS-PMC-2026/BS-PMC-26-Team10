import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/OwnerBookings.css";

const BASE_URL = import.meta.env.VITE_API_URL;

function OwnerBookings() {
  const { t } = useTranslation();
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
    } catch (_err) {
      setError(t('owner.bookings.loadError'));
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
        <p className="ob-overline">{t('owner.controlCenter')}</p>
        <h1>{t('owner.bookings.title')}</h1>
        <p className="ob-subtitle">
          {t('owner.bookings.subtitle')}
        </p>
      </div>

      <div className="ob-stats">
        <div className="ob-stat-card">
          <p>{t('owner.bookings.totalBookings')}</p>
          <h2>{totalBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>{t('owner.bookings.paid')}</p>
          <h2>{paidBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>{t('owner.bookings.free')}</p>
          <h2>{freeBookings}</h2>
        </div>
        <div className="ob-stat-card">
          <p>{t('owner.bookings.totalParticipants')}</p>
          <h2>{totalParticipants}</h2>
        </div>
      </div>

      <div className="ob-toolbar">
        <input
          type="text"
          className="ob-search"
          placeholder={t('owner.bookings.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="ob-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{t('owner.bookings.allStatuses')}</option>
          <option value="paid">{t('owner.bookings.paidLabel')}</option>
          <option value="free">{t('owner.bookings.freeLabel')}</option>
        </select>
      </div>

      {loading && <div className="ob-message">{t('owner.bookings.loading')}</div>}
      {!loading && error && <div className="ob-message ob-message--error">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="ob-empty">
          <h2>{t('owner.bookings.emptyTitle')}</h2>
          <p>{t('owner.bookings.emptyDesc')}</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="ob-table-wrap">
          <table className="ob-table">
            <thead>
              <tr>
                <th>{t('owner.bookings.colRef')}</th>
                <th>{t('owner.bookings.colVisitor')}</th>
                <th>{t('owner.bookings.colTour')}</th>
                <th>{t('owner.bookings.colParticipants')}</th>
                <th>{t('owner.bookings.colPayment')}</th>
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
                      {b.payment_status === "paid" ? t('owner.bookings.paidLabel') : t('owner.bookings.freeLabel')}
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
