import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/OwnerOrders.css";

function translateStatus(value, t) {
  if (!value) return "—";
  const key = value.toLowerCase().replace(/\s+/g, "_");
  return t(`owner.status.${key}`, value);
}

function OwnerOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`);

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(t('owner.orders.loadError'));
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
    <div className="owner-orders-content">
        <div className="owner-orders-header">
          <p className="owner-orders-overline">{t('owner.controlCenter')}</p>
          <h1>{t('owner.orders.title')}</h1>
          <p className="owner-orders-subtitle">
            {t('owner.orders.subtitle')}
          </p>
        </div>

        <div className="owner-orders-summary">
          <div className="owner-orders-stat-card">
            <p>{t('owner.orders.totalOrders')}</p>
            <h2>{totalOrders}</h2>
          </div>

          <div className="owner-orders-stat-card">
            <p>{t('owner.orders.pendingOrders')}</p>
            <h2>{pendingOrders}</h2>
          </div>

          <div className="owner-orders-stat-card">
            <p>{t('owner.orders.delivered')}</p>
            <h2>{deliveredOrders}</h2>
          </div>
        </div>

        <div className="owner-orders-toolbar">
          <input
            type="text"
            placeholder={t('owner.orders.searchPlaceholder')}
            className="owner-orders-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && (
          <div className="owner-orders-message">{t('owner.orders.loading')}</div>
        )}

        {!loading && error && (
          <div className="owner-orders-message error">{error}</div>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <div className="owner-orders-empty">
            <h2>{t('owner.orders.emptyTitle')}</h2>
            <p>{t('owner.orders.emptyDesc')}</p>
          </div>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="owner-orders-table-wrap">
            <table className="owner-orders-table">
              <thead>
                <tr>
                  <th>{t('owner.orders.colId')}</th>
                  <th>{t('owner.orders.colCustomer')}</th>
                  <th>{t('owner.orders.colDate')}</th>
                  <th>{t('owner.orders.colTotal')}</th>
                  <th>{t('owner.orders.colPayment')}</th>
                  <th>{t('owner.orders.colDelivery')}</th>
                  <th>{t('owner.orders.colStatus')}</th>
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
                    <td>{translateStatus(order.payment_status, t)}</td>
                    <td>{translateStatus(order.delivery_status, t)}</td>
                    <td>{translateStatus(order.status, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

export default OwnerOrders;
