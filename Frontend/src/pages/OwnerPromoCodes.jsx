import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import "../styles/OwnerPromoCodes.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const EMPTY_FORM = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  min_order_amount: "",
  max_uses: "",
  valid_from: "",
  valid_until: "",
  is_active: true,
};

function validateForm(form) {
  const missing = [];
  if (!form.code.trim()) missing.push("Code");
  if (!form.discount_value) missing.push("Discount Value");
  if (!form.min_order_amount) missing.push("Min Order Amount");
  if (!form.max_uses) missing.push("Max Uses");
  if (!form.valid_from) missing.push("Valid From");
  if (!form.valid_until) missing.push("Valid Until");
  if (missing.length > 0) return `Missing required fields: ${missing.join(", ")}.`;
  return "";
}

function toLocalDatetimeInput(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function OwnerPromoCodes() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const labelStyle = { display: "block", fontSize: "0.82rem", color: dark ? "#c8a090" : "#555", marginBottom: "0.25rem", fontWeight: 500 };
  const inputStyle = { width: "100%", border: `1px solid ${dark ? "#5c2b2b" : "#ddd"}`, borderRadius: 6, padding: "0.45rem 0.7rem", fontSize: "0.9rem", boxSizing: "border-box", background: dark ? "#1a0d0d" : "#fff", color: dark ? "#e8c8b8" : "inherit" };
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/promo/codes`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load promo codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : "",
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      valid_from: toLocalDatetimeInput(c.valid_from),
      valid_until: toLocalDatetimeInput(c.valid_until),
      is_active: c.is_active,
    });
    setFormError("");
    setFormSuccess("");
    formRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      const payload = {
        code: form.code.trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount),
        max_uses: parseInt(form.max_uses, 10),
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: new Date(form.valid_until).toISOString(),
        is_active: form.is_active,
      };
      const url = editingId
        ? `${API_BASE_URL}/promo/codes/${editingId}`
        : `${API_BASE_URL}/promo/codes`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to ${editingId ? "update" : "create"} promo code.`);
      }
      setFormSuccess(editingId ? "Promo code updated!" : "Promo code created!");
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchCodes();
    } catch (err) {
      setFormError(err.message || "Could not save promo code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this promo code?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/promo/codes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete.");
      }
      if (editingId === id) handleCancelEdit();
      fetchCodes();
    } catch (err) {
      alert(err.message || "Could not delete promo code.");
    }
  };

  const formatDateTime = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="owner-promo-content" style={{ flex: 1, padding: "2rem" }}>
        <p style={{ color: "#888", margin: 0 }}>Owner Control Center</p>
        <h1 style={{ margin: "0.25rem 0 0.5rem" }}>Promo Codes</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Create discount codes for customers to use at checkout.
        </p>

        {/* Add / Edit form */}
        <div
          ref={formRef}
          style={{
            background: theme === "dark" ? "#261414" : (editingId ? "#fffbf0" : "#fff"),
            border: `1px solid ${theme === "dark" ? "#5c2b2b" : (editingId ? "#f0c060" : "#eee")}`,
            borderRadius: 8, padding: "1.5rem", marginBottom: "2rem", maxWidth: 640,
          }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
            {editingId ? "Edit Promo Code" : "Add Promo Code"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="owner-promo-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={labelStyle}>Code <span style={reqStyle}>*</span></label>
                <input name="code" value={form.code} onChange={handleChange}
                  placeholder="SUMMER20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Discount Type <span style={reqStyle}>*</span></label>
                <select name="discount_type" value={form.discount_type} onChange={handleChange} style={inputStyle}>
                  <option value="percent">Percent (%)</option>
                  <option value="fixed">Fixed (₪)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Discount Value <span style={reqStyle}>*</span></label>
                <input name="discount_value" value={form.discount_value} onChange={handleChange}
                  type="number" min="0" step="0.01" placeholder="20" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Min Order Amount (₪) <span style={reqStyle}>*</span></label>
                <input name="min_order_amount" value={form.min_order_amount} onChange={handleChange}
                  type="number" min="0" step="0.01" placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Uses <span style={reqStyle}>*</span></label>
                <input name="max_uses" value={form.max_uses} onChange={handleChange}
                  type="number" min="1" placeholder="e.g. 100" style={inputStyle} />
              </div>
              <div />
              <div>
                <label style={labelStyle}>Valid From <span style={reqStyle}>*</span></label>
                <input name="valid_from" value={form.valid_from} onChange={handleChange}
                  type="datetime-local" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Valid Until <span style={reqStyle}>*</span></label>
                <input name="valid_until" value={form.valid_until} onChange={handleChange}
                  type="datetime-local" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input type="checkbox" id="is_active" name="is_active"
                checked={form.is_active} onChange={handleChange} />
              <label htmlFor="is_active" style={{ fontSize: "0.9rem", color: "#444" }}>Active</label>
            </div>
            {formError && <p style={{ color: "#c0392b", fontSize: "0.85rem", marginTop: "0.5rem" }}>{formError}</p>}
            {formSuccess && <p style={{ color: "#27ae60", fontSize: "0.85rem", marginTop: "0.5rem" }}>{formSuccess}</p>}
            <div className="owner-promo-form-actions" style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button type="submit" disabled={submitting} style={{
                background: editingId ? "#e67e22" : "#c0392b", color: "#fff",
                border: "none", borderRadius: 6, padding: "0.6rem 1.4rem",
                fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
              }}>
                {submitting
                  ? (editingId ? "Saving..." : "Creating...")
                  : (editingId ? "Save Changes" : "+ Create Code")}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{
                  background: "none", border: "1px solid #bbb", color: "#555",
                  borderRadius: 6, padding: "0.6rem 1.2rem",
                  fontSize: "0.95rem", cursor: "pointer",
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Codes table */}
        {loading && <p>Loading promo codes...</p>}
        {!loading && error && <p style={{ color: "red" }}>{error}</p>}
        {!loading && !error && codes.length === 0 && (
          <p style={{ color: "#888" }}>No promo codes yet.</p>
        )}
        {!loading && !error && codes.length > 0 && (
          <div className="owner-promo-table-wrap">
          <table className="owner-promo-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Min Order</th>
                <th style={thStyle}>Uses / Max</th>
                <th style={thStyle}>Valid From</th>
                <th style={thStyle}>Valid Until</th>
                <th style={thStyle}>Active</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: editingId === c.id ? "#fffdf0" : "transparent",
                  }}
                >
                  <td style={tdStyle}><strong>{c.code}</strong></td>
                  <td style={tdStyle}>{c.discount_type}</td>
                  <td style={tdStyle}>
                    {c.discount_type === "percent"
                      ? `${c.discount_value}%`
                      : `₪${parseFloat(c.discount_value).toFixed(2)}`}
                  </td>
                  <td style={tdStyle}>{c.min_order_amount != null ? `₪${parseFloat(c.min_order_amount).toFixed(2)}` : "—"}</td>
                  <td style={tdStyle}>{c.used_count ?? 0} / {c.max_uses ?? "∞"}</td>
                  <td style={tdStyle}>{formatDateTime(c.valid_from)}</td>
                  <td style={tdStyle}>{formatDateTime(c.valid_until)}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "2px 10px",
                      borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
                      background: c.is_active ? "#e8f8e8" : "#f8e8e8",
                      color: c.is_active ? "#27ae60" : "#c0392b",
                    }}>
                      {c.is_active ? "Yes" : "No"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => handleEdit(c)}
                      style={{
                        background: "none", border: "1px solid #e67e22", color: "#e67e22",
                        borderRadius: 4, padding: "0.25rem 0.6rem", cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        background: "none", border: "1px solid #e74c3c", color: "#e74c3c",
                        borderRadius: 4, padding: "0.25rem 0.6rem", cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
    </div>
  );
}

const reqStyle = { color: "#c0392b" };
const thStyle = { padding: "0.5rem 1rem" };
const tdStyle = { padding: "0.5rem 1rem" };

export default OwnerPromoCodes;
