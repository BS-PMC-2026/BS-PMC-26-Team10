import "./InventoryCard.css";

function InventoryCard({ item, onDeleteProduct, onEditProduct }) {
  const getStockLabel = (quantity) => {
    if (quantity === 0) return "Out of stock";
    if (quantity < 10) return "Low stock";
    return "In stock";
  };

  const getStockClass = (quantity) => {
    if (quantity === 0) return "out";
    if (quantity < 10) return "low";
    return "in";
  };

  return (
    <article className="inventory-card">
      <div className="inventory-card-image-wrapper">
        <img
          src={
            item.image_url || `${import.meta.env.VITE_API_URL}/product_images/hot_sour.jpg`
          }
          alt={item.name}
          className="inventory-card-image"
        />
      </div>

      <div className="inventory-card-body">
        <div className="inventory-card-top">
          <span className={`inventory-card-stock ${getStockClass(item.quantity)}`}>
            {getStockLabel(item.quantity)}
          </span>
        </div>

        <h3>{item.name}</h3>

        <p className="inventory-card-description">
          {item.description || "No description yet."}
        </p>

        <div className="inventory-card-info">
          <span>₪{item.price}</span>
          <span>{item.quantity} units</span>
        </div>

        <div className="inventory-card-extra">
          <p>
            <strong>Restock:</strong> {item.restock_date || "Not set"}
          </p>
          <p>
            <strong>Updated:</strong> {item.last_updated || "Unknown"}
          </p>
        </div>

        <div className="inventory-card-actions">
          <button type="button" onClick={() => onEditProduct(item)}>
            Edit
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onDeleteProduct(item.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default InventoryCard;