import { useState } from "react";
import { BellRing, CalendarDays, Mail, Percent, Sprout } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./UpdateSubscription.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const INITIAL_FORM = {
  email: "",
  events_enabled: true,
  discounts_enabled: true,
  new_products_enabled: true,
  consent_given: false,
};

function UpdateSubscription() {
  const { t } = useTranslation();
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { name: "events_enabled", icon: <CalendarDays size={22} />, label: t("subscriptions.events") },
    { name: "discounts_enabled", icon: <Percent size={22} />, label: t("subscriptions.discounts") },
    { name: "new_products_enabled", icon: <Sprout size={22} />, label: t("subscriptions.newProducts") },
  ];

  function handleChange(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setStatus({ type: "", message: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || t("subscriptions.saveError"));

      setStatus({ type: "success", message: t("subscriptions.saved") });
    } catch (error) {
      setStatus({ type: "error", message: error.message || t("subscriptions.saveError") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="update-subscription" aria-labelledby="updates-heading">
      <div className="update-subscription-copy">
        <span className="update-subscription-kicker">
          <BellRing size={17} />
          {t("subscriptions.kicker")}
        </span>
        <h2 id="updates-heading">{t("subscriptions.title")}</h2>
        <p>{t("subscriptions.subtitle")}</p>
      </div>

      <form className="update-subscription-form" onSubmit={handleSubmit}>
        <label className="update-subscription-email">
          <span>{t("subscriptions.email")}</span>
          <span className="update-subscription-input-wrap">
            <Mail size={19} />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("subscriptions.emailPlaceholder")}
              required
            />
          </span>
        </label>

        <fieldset className="update-subscription-categories">
          <legend>{t("subscriptions.choose")}</legend>
          {categories.map((category) => (
            <label key={category.name} className="update-subscription-category">
              <input
                type="checkbox"
                name={category.name}
                checked={form[category.name]}
                onChange={handleChange}
              />
              <span className="update-subscription-category-icon">{category.icon}</span>
              <span>{category.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="update-subscription-consent">
          <input
            type="checkbox"
            name="consent_given"
            checked={form.consent_given}
            onChange={handleChange}
          />
          <span>{t("subscriptions.consent")}</span>
        </label>

        {status.message && (
          <p className={`update-subscription-status update-subscription-status--${status.type}`}>
            {status.message}
          </p>
        )}

        <div className="update-subscription-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? t("subscriptions.saving") : t("subscriptions.subscribe")}
          </button>
        </div>
      </form>
    </section>
  );
}

export default UpdateSubscription;
