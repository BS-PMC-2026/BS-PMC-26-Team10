import { createContext, useContext, useEffect, useRef, useState } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "cl_admin_token";
const EXPIRY_KEY = "cl_admin_expiry";

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);

    if (!token || !expiry || Date.now() >= Number(expiry)) {
      _clear();
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAdmin(data);
          _scheduleLogout(Number(expiry));
        } else {
          _clear();
        }
      })
      .catch(() => _clear())
      .finally(() => setLoading(false));
  }, []);

  function _clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  }

  function _scheduleLogout(expiryMs) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const remaining = expiryMs - Date.now();
    if (remaining <= 0) {
      logout();
      return;
    }
    timerRef.current = setTimeout(logout, remaining);
  }

  function login(token, adminData, expiresInSeconds = 600) {
    const expiry = Date.now() + expiresInSeconds * 1000;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRY_KEY, String(expiry));
    setAdmin(adminData);
    _scheduleLogout(expiry);
  }

  function logout() {
    if (timerRef.current) clearTimeout(timerRef.current);
    _clear();
    setAdmin(null);
  }

  function getToken() {
    const token = localStorage.getItem(TOKEN_KEY);
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (!token || !expiry || Date.now() >= Number(expiry)) return null;
    return token;
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
