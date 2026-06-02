import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./InventoryFormModal.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function InventoryFormModal({
  isOpen,
  onClose,
  onProductAdded,
  selectedProduct,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    restock_date: "",
    price: "",
    image_url: "",
    ingredients: "",
    ingredients_image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imageName, setImageName] = useState("");
  const [ingredientsImageFile, setIngredientsImageFile] = useState(null);
  const [ingredientsImageName, setIngredientsImageName] = useState("");
  const [ingredientsMode, setIngredientsMode] = useState("text"); // "text" | "image"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      const hasIngredientsImage = !!selectedProduct.ingredients_image_url;
      setIngredientsMode(hasIngredientsImage ? "image" : "text");
      setFormData({
        name: selectedProduct.name || "",
        description: selectedProduct.description || "",
        quantity: selectedProduct.quantity ?? "",
        restock_date: selectedProduct.restock_date || "",
        price: selectedProduct.price ?? "",
        image_url: selectedProduct.image_url || "",
        ingredients: selectedProduct.ingredients || "",
        ingredients_image_url: selectedProduct.ingredients_image_url || "",
      });
    } else {
      setIngredientsMode("text");
      setFormData({
        name: "",
        description: "",
        quantity: "",
        restock_date: "",
        price: "",
        image_url: "",
        ingredients: "",
        ingredients_image_url: "",
      });
    }
    setImageFile(null);
    setImageName("");
    setIngredientsImageFile(null);
    setIngredientsImageName("");
    setError("");
  }, [selectedProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", quantity: "", restock_date: "", price: "", image_url: "", ingredients: "", ingredients_image_url: "" });
    setImageFile(null);
    setImageName("");
    setIngredientsImageFile(null);
    setIngredientsImageName("");
    setIngredientsMode("text");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || formData.quantity === "" || formData.price === "") {
      setError(t('modals.inventoryForm.errRequired'));
      return;
    }

    const isEditing = !!selectedProduct;
    if (!isEditing && !imageFile) {
      setError(t('modals.inventoryForm.errNoImage'));
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
        if (!uploadRes.ok) throw new Error(t('modals.inventoryForm.errUpload'));
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.image_url;
      }

      let ingredientsImageUrl = formData.ingredients_image_url;

      if (ingredientsMode === "image" && ingredientsImageFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", ingredientsImageFile);
        if (ingredientsImageName.trim()) uploadForm.append("filename", ingredientsImageName.trim());
        const uploadRes = await fetch(`${API_BASE_URL}/inventory/upload-ingredients-image`, {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) throw new Error(t('modals.inventoryForm.errIngredientsUpload'));
        const uploadData = await uploadRes.json();
        ingredientsImageUrl = uploadData.image_url;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: Number(formData.quantity),
        restock_date: formData.restock_date || null,
        price: Number(formData.price),
        image_url: imageUrl,
        ingredients: ingredientsMode === "text" ? formData.ingredients.trim() : "",
        ingredients_image_url: ingredientsMode === "image" ? ingredientsImageUrl : "",
      };

      const url = isEditing
        ? `${API_BASE_URL}/inventory/${selectedProduct.id}`
        : `${API_BASE_URL}/inventory/add`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(t('modals.inventoryForm.errSave'));

      resetForm();
      onClose();
      onProductAdded();
    } catch (err) {
      console.error(err);
      setError(err.message || t('modals.inventoryForm.errSave'));
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
          <h2>{selectedProduct ? t('modals.inventoryForm.editTitle') : t('modals.inventoryForm.addTitle')}</h2>
          <button type="button" className="inventory-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="inventory-modal-form" onSubmit={handleSubmit}>
          <div className="inventory-form-group">
            <label>{t('modals.inventoryForm.nameLabel')}</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t('modals.inventoryForm.namePlaceholder')} />
          </div>

          <div className="inventory-form-group">
            <label>{t('modals.inventoryForm.descLabel')}</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder={t('modals.inventoryForm.descPlaceholder')} rows="4" />
          </div>

          {/* Ingredients section */}
          <div className="inventory-form-group">
            <label>{t('modals.inventoryForm.ingredientsLabel')}</label>
            <div className="inventory-ingredients-toggle">
              <button
                type="button"
                className={`inv-toggle-btn${ingredientsMode === "text" ? " active" : ""}`}
                onClick={() => setIngredientsMode("text")}
              >
                {t('modals.inventoryForm.modeText')}
              </button>
              <button
                type="button"
                className={`inv-toggle-btn${ingredientsMode === "image" ? " active" : ""}`}
                onClick={() => setIngredientsMode("image")}
              >
                {t('modals.inventoryForm.modeImage')}
              </button>
            </div>

            {ingredientsMode === "text" ? (
              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleChange}
                placeholder={t('modals.inventoryForm.ingredientsPlaceholder')}
                rows="4"
              />
            ) : (
              <div className="inventory-form-group" style={{ marginTop: "0.4vw" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files[0] || null;
                    setIngredientsImageFile(f);
                    if (f) setIngredientsImageName(f.name.replace(/\.[^/.]+$/, ""));
                  }}
                />
                <input
                  type="text"
                  value={ingredientsImageName}
                  onChange={(e) => setIngredientsImageName(e.target.value)}
                  placeholder={t('modals.inventoryForm.filenamePlaceholder')}
                />
                {selectedProduct && formData.ingredients_image_url && !ingredientsImageFile && (
                  <small style={{ color: "#888" }}>{t('modals.inventoryForm.currentIngredientsImage')}</small>
                )}
              </div>
            )}
          </div>

          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label>{t('modals.inventoryForm.quantityLabel')}</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="10" min="0" />
            </div>
            <div className="inventory-form-group">
              <label>{t('modals.inventoryForm.priceLabel')}</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="15" min="0" step="0.01" />
            </div>
          </div>

          <div className="inventory-form-row">
            <div className="inventory-form-group">
              <label>{t('modals.inventoryForm.restockLabel')}</label>
              <input type="date" name="restock_date" value={formData.restock_date} onChange={handleChange} />
            </div>
            <div className="inventory-form-group">
              <label>{selectedProduct ? t('modals.inventoryForm.imageLabelEdit') : t('modals.inventoryForm.imageLabel')}</label>
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
                placeholder={t('modals.inventoryForm.filenamePlaceholder')}
              />
              {selectedProduct && formData.image_url && !imageFile && (
                <small style={{ color: "#888" }}>{t('modals.inventoryForm.currentImage')}</small>
              )}
            </div>
          </div>

          {error && <div className="inventory-form-error">{error}</div>}

          <div className="inventory-modal-actions">
            <button type="button" className="inventory-cancel-btn" onClick={() => { resetForm(); onClose(); }}>{t('modals.inventoryForm.cancel')}</button>
            <button type="submit" className="inventory-save-btn" disabled={loading}>
              {loading
                ? (selectedProduct ? t('modals.inventoryForm.saving') : t('modals.inventoryForm.adding'))
                : (selectedProduct ? t('modals.inventoryForm.save') : t('modals.inventoryForm.add'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryFormModal;
