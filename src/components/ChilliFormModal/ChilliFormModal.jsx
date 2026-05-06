import { useState } from "react";
import "./ChilliFormModal.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function ChilliFormModal({ isOpen, onClose, onChilliAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fullDescription: "",
    shuMin: "",
    shuMax: "",
    origin: "",
    color: "",
    season: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", fullDescription: "", shuMin: "", shuMax: "", origin: "", color: "", season: "" });
    setImageFile(null);
    setImageName("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.shuMin || !formData.shuMax) {
      setError("Name, SHU min, and SHU max are required.");
      return;
    }
    if (!imageFile) {
      setError("Please select an image.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const uploadForm = new FormData();
      uploadForm.append("file", imageFile);
      if (imageName.trim()) uploadForm.append("filename", imageName.trim());
      const uploadRes = await fetch(`${API_BASE_URL}/chillies/upload-image`, {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed.");
      const { image_url } = await uploadRes.json();

      const res = await fetch(`${API_BASE_URL}/chillies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          full_description: formData.fullDescription.trim(),
          image_url,
          shuMin: Number(formData.shuMin),
          shuMax: Number(formData.shuMax),
          origin: formData.origin.trim(),
          color: formData.color.trim(),
          season: formData.season.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add pepper.");

      resetForm();
      onClose();
      if (onChilliAdded) onChilliAdded();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "chilli-modal-overlay") onClose();
  };

  return (
    <div className="chilli-modal-overlay" onClick={handleOverlayClick}>
      <div className="chilli-modal">
        <div className="chilli-modal-header">
          <h2>Add Pepper</h2>
          <button type="button" className="chilli-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="chilli-modal-form" onSubmit={handleSubmit}>
          <div className="chilli-form-group">
            <label>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Habanero" />
          </div>

          <div className="chilli-form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Short description..." rows="3" />
          </div>

          <div className="chilli-form-group">
            <label>Full Description</label>
            <textarea name="fullDescription" value={formData.fullDescription} onChange={handleChange} placeholder="Detailed description shown on the pepper's page..." rows="5" />
          </div>

          <div className="chilli-form-row">
            <div className="chilli-form-group">
              <label>SHU Min *</label>
              <input type="number" name="shuMin" value={formData.shuMin} onChange={handleChange} placeholder="100000" min="0" />
            </div>
            <div className="chilli-form-group">
              <label>SHU Max *</label>
              <input type="number" name="shuMax" value={formData.shuMax} onChange={handleChange} placeholder="350000" min="0" />
            </div>
          </div>

          <div className="chilli-form-row">
            <div className="chilli-form-group">
              <label>Origin</label>
              <input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="Mexico" />
            </div>
            <div className="chilli-form-group">
              <label>Color</label>
              <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Orange" />
            </div>
          </div>

          <div className="chilli-form-group">
            <label>Season</label>
            <input type="text" name="season" value={formData.season} onChange={handleChange} placeholder="Summer" />
          </div>

          <div className="chilli-form-group">
            <label>Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0] || null;
                setImageFile(f);
                if (f) setImageName(f.name.replace(/\.[^/.]+$/, ""));
              }}
            />
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="File name (optional)"
            />
          </div>

          {error && <div className="chilli-form-error">{error}</div>}

          <div className="chilli-modal-actions">
            <button type="button" className="chilli-cancel-btn" onClick={() => { resetForm(); onClose(); }}>Cancel</button>
            <button type="submit" className="chilli-save-btn" disabled={loading}>
              {loading ? "Adding..." : "Add Pepper"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChilliFormModal;
