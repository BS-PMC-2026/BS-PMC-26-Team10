import { useEffect, useState } from "react";
import "./TourFormModal.css";

const KIND_OPTIONS = [
  { value: "field-tasting", label: "Field & Tasting" },
  { value: "workshop", label: "Workshop" },
  { value: "harvest", label: "Harvest day" },
  { value: "private", label: "Private booking" },
];

const DURATION_OPTIONS = ["45 min", "90 min", "2 hrs", "3 hrs", "5 hrs", "Full day"];

const EMPTY = {
  title: "", kind: "field-tasting", description: "", date: "", time: "",
  duration: "90 min", capacity: "", price: "", meeting_point: "", includes: "",
  accessibility: "mostly-yes",
};

function TourFormModal({ isOpen, onClose, onTourSaved, selectedTour }) {
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedTour) {
      setFormData({
        title: selectedTour.title || "",
        kind: selectedTour.kind || "field-tasting",
        description: selectedTour.description || "",
        date: selectedTour.date || "",
        time: selectedTour.time || "",
        duration: selectedTour.duration || "90 min",
        capacity: selectedTour.capacity ?? "",
        price: selectedTour.price ?? "",
        meeting_point: selectedTour.meeting_point || "",
        includes: selectedTour.includes || "",
        accessibility: selectedTour.accessibility || "mostly-yes",
      });
    } else {
      setFormData(EMPTY);
    }
    setError("");
  }, [selectedTour, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.date || !formData.time || formData.capacity === "") {
      setError("Please fill in title, date, time, and capacity.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        title: formData.title.trim(),
        kind: formData.kind,
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        capacity: Number(formData.capacity),
        price: Number(formData.price) || 0,
        meeting_point: formData.meeting_point.trim(),
        includes: formData.includes.trim(),
        accessibility: formData.accessibility,
        visibility: selectedTour?.visibility ?? "draft",
      };

      const url = `http://127.0.0.1:8000/tours/${selectedTour.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update tour.");

      onClose();
      onTourSaved();
    } catch (err) {
      console.error(err);
      setError("Could not update tour. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "tour-modal-overlay") onClose();
  };

  return (
    <div className="tour-modal-overlay" onClick={handleOverlayClick}>
      <div className="tour-modal">
        <div className="tour-modal-header">
          <h2>Edit tour</h2>
          <button type="button" className="tour-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="tour-modal-form" onSubmit={handleSubmit}>
          <div className="tour-form-group">
            <label>Tour name</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Chilli Farm Harvest Walk"
            />
          </div>

          <div className="tour-form-group">
            <label>Tour type</label>
            <select name="kind" value={formData.kind} onChange={handleChange} className="tour-form-select">
              {KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div className="tour-form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what visitors can expect..."
              rows="3"
            />
          </div>

          <div className="tour-form-row">
            <div className="tour-form-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>
            <div className="tour-form-group">
              <label>Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} />
            </div>
          </div>

          <div className="tour-form-row">
            <div className="tour-form-group">
              <label>Duration</label>
              <select name="duration" value={formData.duration} onChange={handleChange} className="tour-form-select">
                {DURATION_OPTIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="tour-form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="12"
                min="1"
              />
            </div>
          </div>

          <div className="tour-form-row">
            <div className="tour-form-group">
              <label>Price per person (NIS)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="28"
                min="0"
                step="0.5"
              />
            </div>
            <div className="tour-form-group">
              <label>Meeting point</label>
              <input
                type="text"
                name="meeting_point"
                value={formData.meeting_point}
                onChange={handleChange}
                placeholder="Main farm gate"
              />
            </div>
          </div>

          <div className="tour-form-group">
            <label>What's included</label>
            <input
              type="text"
              name="includes"
              value={formData.includes}
              onChange={handleChange}
              placeholder="Guided walk · tastings · take-home"
            />
          </div>

          <div className="tour-form-group">
            <label>Accessibility</label>
            <select name="accessibility" value={formData.accessibility} onChange={handleChange} className="tour-form-select">
              <option value="full">Wheelchair-accessible throughout</option>
              <option value="mostly-yes">Mostly accessible · uneven gravel</option>
              <option value="limited">Limited · field walking required</option>
            </select>
          </div>

          {error && <div className="tour-form-error">{error}</div>}

          <div className="tour-modal-actions">
            <button type="button" className="tour-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tour-save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TourFormModal;
