import { useEffect, useState } from "react";
import { BellRing, CalendarDays, MailCheck, Percent, Sprout, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "../styles/OwnerUpdates.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const EMPTY_MESSAGE = { category: "events", subject: "", message: "" };

function OwnerUpdates() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [stats, setStats] = useState({ active_subscribers: 0, events: 0, discounts: 0, new_products: 0 });
  const [form, setForm] = useState(EMPTY_MESSAGE);
  const [loadingStats, setLoadingStats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const statCards = [
    { key: "active_subscribers", icon: <Users size={22} />, label: t("owner.updates.activeSubscribers") },
    { key: "events", icon: <CalendarDays size={22} />, label: t("subscriptions.events") },
    { key: "discounts", icon: <Percent size={22} />, label: t("subscriptions.discounts") },
    { key: "new_products", icon: <Sprout size={22} />, label: t("subscriptions.newProducts") },
  ];

  async function loadStats() {
    setLoadingStats(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/subscriptions/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      setStats(await response.json());
    } catch {
      setStatus({ type: "error", message: t("owner.updates.statsError") });
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setStatus({ type: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/subscriptions/send-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || t("owner.updates.sendError"));

      setStatus({
        type: "success",
        message: t("owner.updates.sentResult", { sent: data.sent, recipients: data.recipients, failed: data.failed }),
      });
      setForm(EMPTY_MESSAGE);
    } catch (error) {
      setStatus({ type: "error", message: error.message || t("owner.updates.sendError") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="owner-updates">
      <header className="owner-updates-header">
        <span>{t("owner.controlCenter")}</span>
        <h1>{t("owner.updates.title")}</h1>
        <p>{t("owner.updates.subtitle")}</p>
      </header>

      <section className="owner-updates-stats" aria-label={t("owner.updates.statsLabel")}>
        {statCards.map((card) => (
          <article key={card.key} className="owner-updates-stat">
            <span className="owner-updates-stat-icon">{card.icon}</span>
            <strong>{loadingStats ? "..." : stats[card.key] ?? 0}</strong>
            <span>{card.label}</span>
          </article>
        ))}
      </section>

      <section className="owner-updates-compose">
        <div className="owner-updates-compose-copy">
          <BellRing size={25} />
          <h2>{t("owner.updates.composeTitle")}</h2>
          <p>{t("owner.updates.composeSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            <span>{t("owner.updates.category")}</span>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="events">{t("subscriptions.events")}</option>
              <option value="discounts">{t("subscriptions.discounts")}</option>
              <option value="new_products">{t("subscriptions.newProducts")}</option>
            </select>
          </label>
          <label>
            <span>{t("owner.updates.subject")}</span>
            <input name="subject" value={form.subject} onChange={handleChange} required />
          </label>
          <label>
            <span>{t("owner.updates.message")}</span>
            <textarea name="message" value={form.message} onChange={handleChange} rows="7" required />
          </label>

          {status.message && (
            <p className={`owner-updates-status owner-updates-status--${status.type}`}>{status.message}</p>
          )}

          <button type="submit" disabled={submitting}>
            <MailCheck size={18} />
            {submitting ? t("owner.updates.sending") : t("owner.updates.send")}
          </button>
        </form>
      </section>
    </div>
  );
}

export default OwnerUpdates;
