import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CLMonogram } from "../components/ChiliMark/ChiliMark";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const API_BASE = "http://127.0.0.1:8000";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Auth() {
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
    if (admin) navigate("/owner", { replace: true });
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
      setError("Please enter a valid email address.");
      return;
    }
    if (!loginData.password) {
      setError("Password is required.");
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
        setError(data.detail || "Login failed. Please try again.");
        return;
      }

      login(data.token, data.admin, data.expires_in);
      navigate("/owner", { replace: true });
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!forgotEmail || !EMAIL_RE.test(forgotEmail)) {
      setError("Please enter a valid email address.");
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
        setError(data.detail || "Request failed. Please try again.");
        return;
      }

      setSuccess(
        "If an admin account with this email exists, a reset link has been sent. Check your inbox."
      );
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (resetData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (resetData.password !== resetData.confirm) {
      setError("Passwords do not match.");
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
        setError(data.detail || "Password reset failed. Please try again.");
        return;
      }

      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        setView("login");
        navigate("/staffLogin", { replace: true });
      }, 2000);
    } catch {
      setError("Network error. Please check your connection.");
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
              title="ChilliLand"
            />
            <h1 className="auth-brand-title">ChilliLand</h1>
            <p className="auth-brand-badge">Admin Portal</p>
          </div>
          <p className="auth-brand-note">Secure staff access only</p>
          <button className="auth-back-to-site" onClick={() => navigate("/")}>
            ← Back to site
          </button>
        </div>

        {/* ── Right panel ── */}
        <div className="auth-right">
          {error && <div className="auth-alert auth-alert--error" role="alert">{error}</div>}
          {success && <div className="auth-alert auth-alert--success" role="status">{success}</div>}

          {/* Login */}
          {view === "login" && (
            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <h2 className="auth-form-title">Welcome back</h2>
              <p className="auth-form-sub">Sign in to your admin account</p>

              <div className="auth-field">
                <label htmlFor="l-email">Email</label>
                <input
                  id="l-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginData.email}
                  onChange={setL(setLoginData)}
                  autoComplete="email"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="l-password">Password</label>
                <input
                  id="l-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={setL(setLoginData)}
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-forgot-row">
                <span onClick={() => switchView("forgot")}>Forgot password?</span>
              </div>

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? <span className="auth-spinner" /> : "Sign In"}
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {view === "forgot" && (
            <form className="auth-form" onSubmit={handleForgot} noValidate>
              <button type="button" className="auth-back" onClick={() => switchView("login")}>
                ← Back to login
              </button>

              <h2 className="auth-form-title">Reset password</h2>
              <p className="auth-form-sub">
                Enter your admin email and we'll send you a secure reset link.
              </p>

              <div className="auth-field">
                <label htmlFor="f-email">Email</label>
                <input
                  id="f-email"
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading || !!success}>
                {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
              </button>
            </form>
          )}

          {/* Reset Password */}
          {view === "reset" && (
            <form className="auth-form" onSubmit={handleReset} noValidate>
              <h2 className="auth-form-title">Create new password</h2>
              <p className="auth-form-sub">Enter and confirm your new admin password.</p>

              <div className="auth-field">
                <label htmlFor="rp-pass">New Password</label>
                <input
                  id="rp-pass"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={resetData.password}
                  onChange={setL(setResetData)}
                  autoComplete="new-password"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="rp-confirm">Confirm Password</label>
                <input
                  id="rp-confirm"
                  name="confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={resetData.confirm}
                  onChange={setL(setResetData)}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading || !!success}>
                {loading ? <span className="auth-spinner" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;
