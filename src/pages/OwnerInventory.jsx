import { useEffect, useMemo, useState } from "react";
import InventoryGrid from "../components/InventoryGrid/InventoryGrid";
import InventoryFormModal from "../components/InventoryFormModal/InventoryFormModal";
import "../styles/OwnerInventory.css";

function OwnerInventory() {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://127.0.0.1:8000/inventory");

      if (!response.ok) {
        throw new Error("Failed to load inventory");
      }

      const data = await response.json();
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Could not load inventory from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/inventory/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete product");
      }

      fetchInventory();
    } catch (err) {
      console.error(err);
      alert(err.message || "Could not delete product.");
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="owner-inventory-content">
        <div className="owner-inventory-header">
          <p className="owner-inventory-overline">Owner Control Center</p>
          <h1>Inventory</h1>
          <p className="owner-inventory-subtitle">
            Manage products, stock levels, prices and restocking in one place.
          </p>
        </div>

        <div className="owner-inventory-toolbar">
          <input
            type="text"
            placeholder="Search products..."
            className="owner-inventory-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            className="owner-inventory-add-btn"
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
          >
            + Add Product
          </button>
        </div>

        {loading && (
          <div className="owner-inventory-message">Loading inventory...</div>
        )}

        {!loading && error && (
          <div className="owner-inventory-message error">{error}</div>
        )}

        {!loading && !error && filteredInventory.length === 0 && (
          <div className="owner-inventory-empty">
            <h2>No products found</h2>
            <p>Add products or try another search.</p>
          </div>
        )}

        {!loading && !error && filteredInventory.length > 0 && (
          <InventoryGrid
            items={filteredInventory}
            onDeleteProduct={handleDeleteProduct}
            onEditProduct={handleEditProduct}
          />
        )}

        <InventoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onProductAdded={fetchInventory}
          selectedProduct={selectedProduct}
        />
    </div>
  );
}

export default OwnerInventory;
