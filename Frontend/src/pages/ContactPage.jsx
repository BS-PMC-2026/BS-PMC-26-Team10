import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import "../styles/ContactPage.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const SOCIAL = [
  {
    href: "https://www.instagram.com/spicy_with_dinars/",
    icon: <FaInstagram />,
    label: "Instagram",
    color: "#E1306C",
  },
  {
    href: "https://www.facebook.com/p/%D7%94%D7%93%D7%99%D7%A0%D7%A8%D7%99%D7%9D-%D7%91%D7%99%D7%AA-%D7%A9%D7%9C-%D7%97%D7%A8%D7%99%D7%A3-100080427739369/",
    icon: <FaFacebook />,
    label: "Facebook",
    color: "#1877F2",
  },
  {
    href: "https://wa.me/972523244448",
    icon: <FaWhatsapp />,
    label: "WhatsApp",
    color: "#25D366",
  },
];

export default function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function validate() {
    const e = {};
    if (!form.name.trim())    e.name    = t("contact.errorName");
    if (!form.phone.trim())   e.phone   = t("contact.errorPhone");
    if (!form.email.trim())   e.email   = t("contact.errorEmail");
    if (!form.message.trim()) e.message = t("contact.errorMessage");
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  return (
    <div className="cp-root">
      <section className="cp-hero">
        <p className="cp-kicker">{t("contact.kicker")}</p>
        <h1 className="cp-title">{t("contact.title")}</h1>
        <p className="cp-subtitle">{t("contact.subtitle")}</p>
      </section>

      <div className="cp-body">
        <div className="cp-form-wrap">
          {status === "success" ? (
            <div className="cp-success" role="status">
              <span className="cp-success-icon">✓</span>
              <h2>{t("contact.successTitle")}</h2>
              <p>{t("contact.successBody")}</p>
              <p className="cp-success-urgent">{t("contact.successUrgent")}</p>
              <button className="cp-btn" onClick={() => setStatus("idle")}>
                {t("contact.sendAnother")}
              </button>
            </div>
          ) : (
            <form className="cp-form" onSubmit={handleSubmit} noValidate>
              <h2 className="cp-form-title">{t("contact.formTitle")}</h2>

              <div className="cp-field">
                <label htmlFor="cp-name">{t("contact.name")}</label>
                <input
                  id="cp-name"
                  name="name"
                  type="text"
                  placeholder={t("contact.namePlaceholder")}
                  value={form.name}
                  onChange={handleChange}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <span className="cp-error">{errors.name}</span>}
              </div>

              <div className="cp-field">
                <label htmlFor="cp-phone">{t("contact.phone")}</label>
                <input
                  id="cp-phone"
                  name="phone"
                  type="tel"
                  placeholder={t("contact.phonePlaceholder")}
                  value={form.phone}
                  onChange={handleChange}
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <span className="cp-error">{errors.phone}</span>}
              </div>

              <div className="cp-field">
                <label htmlFor="cp-email">{t("contact.email")}</label>
                <input
                  id="cp-email"
                  name="email"
                  type="email"
                  placeholder={t("contact.emailPlaceholder")}
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <span className="cp-error">{errors.email}</span>}
              </div>

              <div className="cp-field">
                <label htmlFor="cp-message">{t("contact.message")}</label>
                <textarea
                  id="cp-message"
                  name="message"
                  rows={5}
                  placeholder={t("contact.messagePlaceholder")}
                  value={form.message}
                  onChange={handleChange}
                  aria-invalid={!!errors.message}
                />
                {errors.message && <span className="cp-error">{errors.message}</span>}
              </div>

              {status === "error" && (
                <p className="cp-error cp-send-error">{t("contact.sendError")}</p>
              )}

              <button className="cp-btn" type="submit" disabled={status === "sending"}>
                {status === "sending" ? t("contact.sending") : t("contact.send")}
              </button>
            </form>
          )}
        </div>

        <div className="cp-aside">
          <div className="cp-info-card">
            <h3>{t("contact.directTitle")}</h3>
            <a href="tel:+972523244448" className="cp-info-item">📞 052-324-4448</a>
            <a href="mailto:SPICYDINARS@GMAIL.COM" className="cp-info-item">✉️ SPICYDINARS@GMAIL.COM</a>
          </div>

          <div className="cp-social-card">
            <h3>{t("contact.socialTitle")}</h3>
            <p className="cp-social-desc">{t("contact.socialDesc")}</p>
            <div className="cp-social-links">
              {SOCIAL.map(({ href, icon, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="cp-social-btn"
                  aria-label={label}
                  style={{ "--cp-color": color }}
                >
                  {icon}
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
