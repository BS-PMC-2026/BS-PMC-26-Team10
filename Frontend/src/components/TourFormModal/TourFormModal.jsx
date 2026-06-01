import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./TourFormModal.css";

const DEFAULT_CONFIRMATION_MESSAGE =
  "Your tour reservation was successful. Please keep this email and your booking reference for future changes or cancellation.";

const EMPTY = {
  title: "", kind: "field-tasting", description: "", date: "", time: "",
  duration: "90 min", capacity: "", price: "", meeting_point: "", includes: "",
  accessibility: "mostly-yes", confirmation_message: DEFAULT_CONFIRMATION_MESSAGE,
  picture: "",
};

function TourFormModal({ isOpen, onClose, onTourSaved, selectedTour }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");

  const KIND_OPTIONS = [
    { value: "field-tasting", label: t('modals.tourForm.types.field') },
    { value: "workshop", label: t('modals.tourForm.types.workshop') },
    { value: "harvest", label: t('modals.tourForm.types.harvest') },
    { value: "private", label: t('modals.tourForm.types.private') },
  ];

  const DURATION_OPTIONS = [
    { value: "45 min", label: t('modals.tourForm.durations.45min') },
    { value: "90 min", label: t('modals.tourForm.durations.90min') },
    { value: "2 hrs", label: t('modals.tourForm.durations.2hrs') },
    { value: "3 hrs", label: t('modals.tourForm.durations.3hrs') },
    { value: "5 hrs", label: t('modals.tourForm.durations.5hrs') },
    { value: "Full day", label: t('modals.tourForm.durations.fullDay') },
  ];

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
        confirmation_message: selectedTour.confirmation_message || DEFAULT_CONFIRMATION_MESSAGE,
        picture: selectedTour.picture || "",
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/upload-image`, {
        method: "POST",
        body: data,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setFormData((prev) => ({ ...prev, picture: json.image_url }));
    } catch {
      setError(t('modals.tourForm.errUpload'));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.date || !formData.time || formData.capacity === "") {
      setError(t('modals.tourForm.errRequired'));
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
        confirmation_message: formData.confirmation_message.trim() || DEFAULT_CONFIRMATION_MESSAGE,
        picture: formData.picture || "",
      };

      const url = `${import.meta.env.VITE_API_URL}/tours/${selectedTour.id}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(t('modals.tourForm.errSave'));

      onClose();
      onTourSaved();
    } catch (err) {
      console.error(err);
      setError(err.message || t('modals.tourForm.errSave'));
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
          <h2>{t('modals.tourForm.editTitle')}</h2>
          <button type="button" className="tour-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="tour-modal-form" onSubmit={handleSubmit}>
          <div className="tour-form-group">
            <label>{t('modals.tourForm.nameLabel')}</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('modals.tourForm.namePlaceholder')}
            />
          </div>

          <div className="tour-form-group">
            <label>{t('modals.tourForm.typeLabel')}</label>
            <select name="kind" value={formData.kind} onChange={handleChange} className="tour-form-select">
              {KIND_OPTIONS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          <div className="tour-form-group">
            <label>{t('modals.tourForm.descLabel')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('modals.tourForm.descPlaceholder')}
              rows="3"
            />
          </div>

          <div className="tour-form-row">
            <div className="tour-form-group">
              <label>{t('modals.tourForm.dateLabel')}</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>
            <div className="tour-form-group">
              <label>{t('modals.tourForm.timeLabel')}</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} />
            </div>
          </div>

          <div className="tour-form-row">
            <div className="tour-form-group">
              <label>{t('modals.tourForm.durationLabel')}</label>
              <select name="duration" value={formData.duration} onChange={handleChange} className="tour-form-select">
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="tour-form-group">
              <label>{t('modals.tourForm.capacityLabel')}</label>
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
              <label>{t('modals.tourForm.priceLabel')}</label>
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
              <label>{t('modals.tourForm.meetingLabel')}</label>
              <input
                type="text"
                name="meeting_point"
                value={formData.meeting_point}
                onChange={handleChange}
                placeholder={t('modals.tourForm.meetingPlaceholder')}
              />
            </div>
          </div>

          <div className="tour-form-group">
            <label>{t('modals.tourForm.includesLabel')}</label>
            <input
              type="text"
              name="includes"
              value={formData.includes}
              onChange={handleChange}
              placeholder={t('modals.tourForm.includesPlaceholder')}
            />
          </div>

          <div className="tour-form-group">
            <label htmlFor="modal-tour-image">{t('modals.tourForm.imageLabel')}</label>
            <input
              id="modal-tour-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageUploading}
            />
            {imageUploading && <span style={{ fontSize: "13px", color: "#888" }}>{t('modals.tourForm.uploading')}</span>}
            {formData.picture && (
              <img
                src={formData.picture}
                alt="Tour"
                style={{ marginTop: "8px", width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}
          </div>

          <div className="tour-form-group">
            <label>{t('modals.tourForm.confirmationLabel')}</label>
            <textarea
              name="confirmation_message"
              value={formData.confirmation_message}
              onChange={handleChange}
              placeholder={t('modals.tourForm.confirmationDefault')}
              rows="3"
              maxLength={220}
            />
          </div>

          <div className="tour-form-group">
            <label>{t('modals.tourForm.accessibilityLabel')}</label>
            <select name="accessibility" value={formData.accessibility} onChange={handleChange} className="tour-form-select">
              <option value="full">{t('modals.tourForm.accessibilityOptions.full')}</option>
              <option value="mostly-yes">{t('modals.tourForm.accessibilityOptions.mostlyYes')}</option>
              <option value="limited">{t('modals.tourForm.accessibilityOptions.limited')}</option>
            </select>
          </div>

          {error && <div className="tour-form-error">{error}</div>}

          <div className="tour-modal-actions">
            <button type="button" className="tour-cancel-btn" onClick={onClose}>
              {t('modals.tourForm.cancel')}
            </button>
            <button type="submit" className="tour-save-btn" disabled={loading}>
              {loading ? t('modals.tourForm.saving') : t('modals.tourForm.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TourFormModal;
