import { useEffect, useState } from "react";
import "./InventoryFormModal.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function InventoryFormModal({
  isOpen,
  onClose,
  onProductAdded,
  selectedProduct,
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    restock_date: "",
    price: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        quantity: selectedProduct.quantity ?? "",
        restock_date: selectedProduct.restock_date || "",
        price: selectedProduct.price ?? "",
        image_url: selectedProduct.image_url || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        quantity: "",
        restock_date: "",
        price: "",
        image_url: "",
      });
    }
    setImageFile(null);
    setImageName("");
    setError("");
  }, [selectedProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", quantity: "", restock_date: "", price: "", image_url: "" });
    setImageFile(null);
    setImageName("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || formData.quantity === "" || formData.price === "") {
      setError("Please fill in name, description, quantity, and price.");
      return;
    }

    const isEditing = !!selectedProduct;
    if (!isEditing && !imageFile) {
      setError("Please select an image.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let imageUrl = formData.image_url;

      if (imageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", imageFile);
        if (imageName.trim()) uploadForm.append("filename", imageName.trim());
        const uploadRes = await fetch(`${API_BASE_URL}/inventory/upload-image`, {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) throw new Error("Image upload failed.");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.image_url;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: Number(formData.quantity),
        restock_date: formData.restock_date || null,
        price: Number(formData.price),
        image_url: imageUrl,
      };

      const url = isEditing
        ? `${API_BASE_URL}/inventory/${selectedProduct.id}`
        : `${API_BASE_URL}/inventory/add`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(isEditing ? "Failed to update product." : "Failed to add product.");

      resetForm();
      onClose();
      onProductAdded();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === "inventory-modal-overlay") onClose();
  };

  return (
    <div className="inventory-modal-overlay" onClick={handleOverlayClick}>
      <div className="inventory-modal">
        <div className="inventory-modal-header">
          <h2>{selectedProduct ? "Edit Product" : "Add Product"}</h2>
          <button type="button" className="inventory-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="inventory-modal-form" onSubmit={handleSubmit}>
          <div className="inventory-form-group">
            <label>Product name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Hot Sour Sauce" />
          </div>

          <div className="inventory-form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Write a short product description..." rows="4" />
          </div>

          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label>Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="10" min="0" />
            </div>
            <div className="inventory-form-group">
              <label>Price</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="15" min="0" step="0.01" />
            </div>
          </div>

          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label>Restock date</label>
              <input type="date" name="restock_date" value={formData.restock_date} onChange={handleChange} />
            </div>
            <div className="inventory-form-group">
              <label>Image {selectedProduct ? "(leave empty to keep current)" : ""}</label>
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
              {selectedProduct && formData.image_url && !imageFile && (
                <small style={{ color: "#888" }}>Current image already set</small>
              )}
            </div>
          </div>

          {error && <div className="inventory-form-error">{error}</div>}

          <div className="inventory-modal-actions">
            <button type="button" className="inventory-cancel-btn" onClick={() => { resetForm(); onClose(); }}>Cancel</button>
            <button type="submit" className="inventory-save-btn" disabled={loading}>
              {loading ? (selectedProduct ? "Saving..." : "Adding...") : (selectedProduct ? "Save Changes" : "Add Product")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryFormModal;
