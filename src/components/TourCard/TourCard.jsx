import { useState } from "react";
import { Calendar, Clock, Users } from "lucide-react";
import "./TourCard.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

function TourCard({ tour, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const booked = tour.capacity - (tour.remaining_spots ?? tour.capacity);

  function toggleBookings() {
    if (!open && bookings === null) {
      setLoadingBookings(true);
      fetch(`http://127.0.0.1:8000/tours/${tour.id}/bookings`)
        .then((r) => r.json())
        .then((data) => { setBookings(data); setLoadingBookings(false); })
        .catch(() => { setBookings([]); setLoadingBookings(false); });
    }
    setOpen((prev) => !prev);
  }

  return (
    <div className="tour-card">
      <div className="tour-card-header">
        <h3 className="tour-card-title">{tour.title}</h3>
        <div className="tour-card-actions">
          <button className="tour-card-edit-btn" onClick={() => onEdit(tour)}>Edit</button>
          <button className="tour-card-delete-btn" onClick={() => onDelete(tour.id)}>Delete</button>
        </div>
      </div>

      {tour.description && (
        <p className="tour-card-description">{tour.description}</p>
      )}

      <div className="tour-card-meta">
        <div className="tour-card-meta-item">
          <span className="tour-card-meta-icon"><Calendar size={14} /></span>
          <span>{formatDate(tour.date)}</span>
        </div>
        <div className="tour-card-meta-item">
          <span className="tour-card-meta-icon"><Clock size={14} /></span>
          <span>{formatTime(tour.time)}</span>
        </div>
        <div className="tour-card-meta-item">
          <span className="tour-card-meta-icon"><Users size={14} /></span>
          <span>{booked} / {tour.capacity} booked</span>
        </div>
      </div>

      <button className="tour-card-bookings-toggle" onClick={toggleBookings}>
        {open ? "Hide bookings ▲" : `View bookings (${booked}) ▼`}
      </button>

      {open && (
        <div className="tour-card-bookings">
          {loadingBookings && <p className="tour-card-bookings-empty">Loading…</p>}
          {!loadingBookings && bookings?.length === 0 && (
            <p className="tour-card-bookings-empty">No bookings yet.</p>
          )}
          {!loadingBookings && bookings?.length > 0 && (
            <table className="tour-card-bookings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Participants</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b.booking_reference}>
                    <td>{i + 1}</td>
                    <td>{b.full_name}</td>
                    <td>{b.phone}</td>
                    <td>{b.participants_count}</td>
                    <td className="tour-card-ref">{b.booking_reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TourCard;
