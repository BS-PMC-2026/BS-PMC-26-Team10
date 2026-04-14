import InventoryCard from "../InventoryCard/InventoryCard";
import "./InventoryGrid.css";

function InventoryGrid({ items, onDeleteProduct, onEditProduct }) {
  return (
    <section className="owner-inventory-grid">
      {items.map((item) => (
        <InventoryCard
          key={item.id}
          item={item}
          onDeleteProduct={onDeleteProduct}
          onEditProduct={onEditProduct}
        />
      ))}
    </section>
  );
}

export default InventoryGrid;