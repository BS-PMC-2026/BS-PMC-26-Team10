import { useEffect, useMemo, useState } from "react";
import OwnerSidebar from "../components/OwnerSidebar/OwnerSidebar";
import "../styles/ownerOrders.css";

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://127.0.0.1:8000/orders");

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Could not load orders from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = order.customer_name?.toLowerCase() || "";
      const customerEmail = order.customer_email?.toLowerCase() || "";
      const orderId = String(order.order_id || "");
      const search = searchTerm.toLowerCase();

      return (
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        orderId.includes(search)
      );
    });
  }, [orders, searchTerm]);

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status?.toLowerCase() === "pending"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.delivery_status?.toLowerCase() === "delivered"
  ).length;

  return (
    <div className="owner-orders-layout">
      <div className="owner-orders-bg-shape owner-orders-bg-shape-1"></div>
      <div className="owner-orders-bg-shape owner-orders-bg-shape-2"></div>

      <OwnerSidebar />

      <main className="owner-orders-content">
        <div className="owner-orders-header">
          <p className="owner-orders-overline">Owner Control Center</p>
          <h1>Orders</h1>
          <p className="owner-orders-subtitle">
            Track recent orders, payment progress and delivery updates in one
            place.
          </p>
        </div>

        <div className="owner-orders-summary">
          <div className="owner-orders-stat-card">
            <p>Total Orders</p>
            <h2>{totalOrders}</h2>
          </div>

          <div className="owner-orders-stat-card">
            <p>Pending Orders</p>
            <h2>{pendingOrders}</h2>
          </div>

          <div className="owner-orders-stat-card">
            <p>Delivered</p>
            <h2>{deliveredOrders}</h2>
          </div>
        </div>

        <div className="owner-orders-toolbar">
          <input
            type="text"
            placeholder="Search by order ID, name or email..."
            className="owner-orders-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && (
          <div className="owner-orders-message">Loading orders...</div>
        )}

        {!loading && error && (
          <div className="owner-orders-message error">{error}</div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="owner-orders-empty">
            <h2>No orders found</h2>
            <p>Orders will appear here once customers start buying.</p>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="owner-orders-table-wrap">
            <table className="owner-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td>#{order.order_id}</td>
                    <td>
                      <div className="owner-orders-customer">
                        <span>{order.customer_name}</span>
                        <small>{order.customer_email}</small>
                      </div>
                    </td>
                    <td>
                      {order.order_date
                        ? new Date(order.order_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {order.total_amount !== null
                        ? `₪${order.total_amount}`
                        : "-"}
                    </td>
                    <td>{order.payment_status || "-"}</td>
                    <td>{order.delivery_status || "-"}</td>
                    <td>{order.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerOrders;