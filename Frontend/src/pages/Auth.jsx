import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CLMonogram } from "../components/ChiliMark/ChiliMark";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_URL;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { admin, login } = useAuth();

  const resetToken = searchParams.get("reset");

  const [view, setView] = useState(resetToken ? "reset" : "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetData, setResetData] = useState({ password: "", confirm: "" });

  useEffect(() => {
    if (admin) navigate(admin.role === "guide" ? "/tourguide" : "/owner", { replace: true });
  }, [admin, navigate]);

  function switchView(next) {
    setError("");
    setSuccess("");
    setView(next);
  }

  function setL(setter) {
    return (e) => setter((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginData.email || !EMAIL_RE.test(loginData.email)) {
      setError(t('auth.errEmail'));
      return;
    }
    if (!loginData.password) {
      setError(t('auth.errPassword'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t('auth.errLogin'));
        return;
      }

      login(data.token, data.admin, data.expires_in);
      navigate(data.admin.role === "guide" ? "/tourguide" : "/owner", { replace: true });
    } catch {
      setError(t('auth.errNetwork'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!forgotEmail || !EMAIL_RE.test(forgotEmail)) {
      setError(t('auth.errEmail'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t('auth.resetFail'));
        return;
      }

      setSuccess(t('auth.resetSent'));
    } catch {
      setError(t('auth.errNetwork'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (resetData.password.length < 8) {
      setError(t('auth.errPasswordLength'));
      return;
    }
    if (resetData.password !== resetData.confirm) {
      setError(t('auth.errPasswordMatch'));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: resetData.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || t('auth.errResetFail'));
        return;
      }

      setSuccess(t('auth.resetSuccess'));
      setTimeout(() => {
        setView("login");
        navigate("/staffLogin", { replace: true });
      }, 2000);
    } catch {
      setError(t('auth.errNetwork'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* ── Left panel ── */}
        <div className="auth-left">
          <div className="auth-brand">
            <CLMonogram
              size={52}
              color="#ffffff"
              stemColor="rgba(255, 220, 180, 0.9)"
              title={t('auth.brand')}
            />
            <h1 className="auth-brand-title">{t('auth.brand')}</h1>
            <p className="auth-brand-badge">{t('auth.portal')}</p>
          </div>
          <p className="auth-brand-note">{t('auth.portalSub')}</p>
          <button className="auth-back-to-site" onClick={() => navigate("/")}>
            {t('auth.backSite')}
          </button>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          {error && <div className="auth-alert auth-alert--error" role="alert">{error}</div>}
          {success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}

          {/* Login */}
          {view === "login" && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <h2 className="auth-form-title">{t('auth.loginTitle')}</h2>
              <p className="auth-form-sub">{t('auth.loginSub')}</p>

              <div className="auth-field">
                <label htmlFor="l-email">{t('auth.emailLabel')}</label>
                <input
                  id="l-email"
                  name="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={loginData.email}
                  onChange={setL(setLoginData)}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="l-password">{t('auth.passwordLabel')}</label>
                <input
                  id="l-password"
                  name="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={loginData.password}
                  onChange={setL(setLoginData)}
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-forgot-row">
                <span onClick={() => switchView("forgot")}>{t('auth.forgotPassword')}</span>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : t('auth.signIn')}
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {view === "forgot" && (
            <form className="auth-form" onSubmit={handleForgot} noValidate>
              <button type="button" className="auth-back" onClick={() => switchView("login")}>
                {t('auth.backSite')}
              </button>

              <h2 className="auth-form-title">{t('auth.resetTitle')}</h2>
              <p className="auth-form-sub">
                {t('auth.resetSub')}
              </p>

              <div className="auth-field">
                <label htmlFor="f-email">{t('auth.emailLabel')}</label>
                <input
                  id="f-email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading || !!success}>
                {loading ? <span className="auth-spinner" /> : t('auth.sendReset')}
              </button>
            </form>
          )}

          {/* Reset Password */}
          {view === "reset" && (
            <form className="auth-form" onSubmit={handleReset} noValidate>
              <h2 className="auth-form-title">{t('auth.newPasswordTitle')}</h2>
              <p className="auth-form-sub">{t('auth.newPasswordSub')}</p>

              <div className="auth-field">
                <label htmlFor="rp-pass">{t('auth.newPasswordLabel')}</label>
                <input
                  id="rp-pass"
                  name="password"
                  type="password"
                  placeholder={t('auth.newPasswordPlaceholder')}
                  value={resetData.password}
                  onChange={setL(setResetData)}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="rp-confirm">{t('auth.confirmPasswordLabel')}</label>
                <input
                  id="rp-confirm"
                  name="confirm"
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={resetData.confirm}
                  onChange={setL(setResetData)}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading || !!success}>
                {loading ? <span className="auth-spinner" /> : t('auth.resetPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
