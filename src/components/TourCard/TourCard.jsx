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
          <span className="tour-card-meta-icon">📅</span>
          <span>{formatDate(tour.date)}</span>
        </div>
        <div className="tour-card-meta-item">
          <span className="tour-card-meta-icon">🕐</span>
          <span>{formatTime(tour.time)}</span>
        </div>
        <div className="tour-card-meta-item">
          <span className="tour-card-meta-icon">👥</span>
          <span>{tour.capacity} spots</span>
        </div>
      </div>
    </div>
  );
}

export default TourCard;
