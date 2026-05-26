import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import "./OwnerDashboard.css";

const API = import.meta.env.VITE_API_URL;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SPICE_LEVELS = [
  { name: "Mild",    color: "#e8a838", max: 2500 },
  { name: "Medium",  color: "#e07b30", max: 30000 },
  { name: "Hot",     color: "#cc4d1f", max: 100000 },
  { name: "Fierce",  color: "#b52a10", max: 500000 },
  { name: "Inferno", color: "#7a0a0a", max: Infinity },
];

function classifySpice(chilli) {
  const shu = chilli.shu_max ?? chilli.shu_min ?? 0;
  return SPICE_LEVELS.find((l) => shu <= l.max)?.name ?? "Inferno";
}

function buildMonthlyRevenue(orders) {
  const map = {};
  orders.forEach((o) => {
    if (!o.order_date) return;
    const d = new Date(o.order_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = { month: MONTH_NAMES[d.getMonth()], revenue: 0, _sort: d.getFullYear() * 12 + d.getMonth() };
    map[key].revenue += parseFloat(o.total_amount ?? 0);
  });
  return Object.values(map)
    .sort((a, b) => a._sort - b._sort)
    .slice(-7)
    .map(({ month, revenue }) => ({ month, revenue: Math.round(revenue) }));
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="od-stat-card" style={{ borderTopColor: accent }}>
      <p className="od-stat-label">{label}</p>
      <h2 className="od-stat-value">{value}</h2>
      {sub && <p className="od-stat-sub">{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  pending:   { bg: "#fff3e0", text: "#e07b30" },
  completed: { bg: "#e8f5e9", text: "#2e7d32" },
  cancelled: { bg: "#fce4ec", text: "#c62828" },
  delivered: { bg: "#e3f2fd", text: "#1565c0" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status?.toLowerCase()] ?? { bg: "#f0f0f0", text: "#666" };
  return (
    <span className="od-badge" style={{ background: s.bg, color: s.text }}>
      {status ?? "—"}
    </span>
  );
}

export default function OwnerDashboard() {
  const [orders, setOrders]     = useState([]);
  const [chillies, setChillies] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/orders`).then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/chillies`).then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API}/inventory`).then((r) => r.ok ? r.json() : []).catch(() => []),
    ]).then(([o, c, i]) => {
      setOrders(Array.isArray(o) ? o : []);
      setChillies(Array.isArray(c) ? c : []);
      setInventory(Array.isArray(i) ? i : []);
      setLoading(false);
    });
  }, []);

  // ── KPIs ────────────────────────────────────────
  const totalOrders   = orders.length;
  const totalRevenue  = orders.reduce((s, o) => s + parseFloat(o.total_amount ?? 0), 0);
  const pendingOrders = orders.filter((o) => o.status?.toLowerCase() === "pending").length;
  const totalProducts = inventory.length;

  // ── Spice level donut ─────────────────────────
  const spiceMap = {};
  SPICE_LEVELS.forEach((l) => { spiceMap[l.name] = 0; });
  chillies.forEach((c) => { spiceMap[classifySpice(c)] = (spiceMap[classifySpice(c)] ?? 0) + 1; });
  const spiceData = SPICE_LEVELS.map((l) => ({ name: l.name, value: spiceMap[l.name], color: l.color })).filter((d) => d.value > 0);

  // ── Monthly revenue line ──────────────────────
  const revenueData = buildMonthlyRevenue(orders);

  // ── Top inventory bar ─────────────────────────
  const topProducts = [...inventory]
    .sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name, stock: p.quantity ?? 0 }));

  // ── Recent orders table ───────────────────────
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.order_date ?? 0) - new Date(a.order_date ?? 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="od-loading">
        <div className="od-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="od-root">
      <div className="od-header">
        <p className="od-overline">Owner Control Center</p>
        <h1>Dashboard</h1>
        <p className="od-subtitle">Your farm's performance at a glance.</p>
      </div>

      {/* ── KPI row ─────────────────────────────── */}
      <div className="od-stats-row">
        <StatCard label="Total Orders"   value={totalOrders}                         accent="#bb3e22" />
        <StatCard label="Total Revenue"  value={`₪${totalRevenue.toFixed(0)}`}       accent="#a14d2a" sub="all time" />
        <StatCard label="Products Listed" value={totalProducts}                      accent="#4a2a1f" />
        <StatCard label="Pending Orders" value={pendingOrders}                       accent="#e07b30" sub="need action" />
      </div>

      {/* ── Charts row 1 ──────────────────────── */}
      <div className="od-charts-row">

        {/* Spice-level donut */}
        <div className="od-card od-card--donut">
          <h3 className="od-card-title">Spice Level Distribution</h3>
          <p className="od-card-sub">Pepper varieties by heat category</p>
          {spiceData.length === 0 ? (
            <p className="od-empty">No chilli data yet.</p>
          ) : (
            <div className="od-donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={spiceData}
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {spiceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} pepper${v !== 1 ? "s" : ""}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="od-legend">
                {spiceData.map((d) => (
                  <li key={d.name} className="od-legend-item">
                    <span className="od-legend-dot" style={{ background: d.color }} />
                    <span className="od-legend-name">{d.name}</span>
                    <span className="od-legend-val">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recent orders table */}
        <div className="od-card od-card--table">
          <h3 className="od-card-title">Recent Orders</h3>
          <p className="od-card-sub">Latest 5 customer orders</p>
          {recentOrders.length === 0 ? (
            <p className="od-empty">No orders yet.</p>
          ) : (
            <table className="od-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.order_id}>
                    <td className="od-order-id">#{o.order_id}</td>
                    <td>{o.customer_name ?? "—"}</td>
                    <td>{o.order_date ? new Date(o.order_date).toLocaleDateString() : "—"}</td>
                    <td className="od-amount">{o.total_amount != null ? `₪${parseFloat(o.total_amount).toFixed(0)}` : "—"}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Charts row 2 ──────────────────────── */}
      <div className="od-charts-row">

        {/* Monthly revenue line */}
        <div className="od-card od-card--line">
          <h3 className="od-card-title">Revenue Trends</h3>
          <p className="od-card-sub">Monthly revenue (₪)</p>
          {revenueData.length === 0 ? (
            <p className="od-empty">Not enough order data for trends.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,42,31,0.08)" />
                <XAxis dataKey="month" tick={{ fontSize: "0.82vw", fill: "#6d5447" }} />
                <YAxis tick={{ fontSize: "0.82vw", fill: "#6d5447" }} width={48} tickFormatter={(v) => `₪${v}`} />
                <Tooltip formatter={(v) => [`₪${v}`, "Revenue"]} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#bb3e22"
                  strokeWidth={2.5}
                  dot={{ fill: "#bb3e22", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top products horizontal bar */}
        <div className="od-card od-card--bar">
          <h3 className="od-card-title">Top Products by Stock</h3>
          <p className="od-card-sub">Items with the most units available</p>
          {topProducts.length === 0 ? (
            <p className="od-empty">No inventory data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(74,42,31,0.08)" />
                <XAxis type="number" tick={{ fontSize: "0.82vw", fill: "#6d5447" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: "0.8vw", fill: "#4a2a1f" }}
                />
                <Tooltip formatter={(v) => [v, "Units in stock"]} />
                <Bar dataKey="stock" fill="#a14d2a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
