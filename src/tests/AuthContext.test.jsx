import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

const TOKEN_KEY = "cl_admin_token";
const EXPIRY_KEY = "cl_admin_expiry";

const ADMIN = { id: 1, first_name: "Jane", last_name: "Doe", email: "jane@example.com" };

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// ── Initial state ──────────────────────────────────────────────────────────────

describe("AuthContext — initial state", () => {
  test("loading starts as true before effect runs", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    let capturedLoading;
    const { result } = renderHook(() => {
      const ctx = useAuth();
      if (capturedLoading === undefined) capturedLoading = ctx.loading;
      return ctx;
    }, { wrapper });
    expect(capturedLoading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test("admin is null and loading becomes false when no token in storage", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.admin).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("clears storage and sets admin null when token is already expired", async () => {
    localStorage.setItem(TOKEN_KEY, "old-token");
    localStorage.setItem(EXPIRY_KEY, String(Date.now() - 1000));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admin).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ── Token verification on mount ────────────────────────────────────────────────

describe("AuthContext — token verification on mount", () => {
  test("calls /admin/me with stored token when token is not expired", async () => {
    localStorage.setItem(TOKEN_KEY, "existing-token");
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + 600_000));
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ADMIN });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/me"),
      expect.objectContaining({ headers: { Authorization: "Bearer existing-token" } })
    );
    expect(result.current.admin).toEqual(ADMIN);
  });

  test("clears session when /admin/me returns non-ok", async () => {
    localStorage.setItem(TOKEN_KEY, "bad-token");
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + 600_000));
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admin).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  test("clears session when fetch throws a network error", async () => {
    localStorage.setItem(TOKEN_KEY, "some-token");
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + 600_000));
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.admin).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

// ── login() ────────────────────────────────────────────────────────────────────

describe("AuthContext — login()", () => {
  test("stores token in localStorage", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("my-token", ADMIN, 600));
    expect(localStorage.getItem(TOKEN_KEY)).toBe("my-token");
  });

  test("stores expiry in localStorage as a future timestamp", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const before = Date.now();
    act(() => result.current.login("tok", ADMIN, 300));
    const expiry = Number(localStorage.getItem(EXPIRY_KEY));

    expect(expiry).toBeGreaterThanOrEqual(before + 300_000);
  });

  test("sets admin state", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("tok", ADMIN, 600));
    expect(result.current.admin).toEqual(ADMIN);
  });
});

// ── logout() ───────────────────────────────────────────────────────────────────

describe("AuthContext — logout()", () => {
  test("sets admin to null", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("tok", ADMIN, 600));
    act(() => result.current.logout());

    expect(result.current.admin).toBeNull();
  });

  test("removes token and expiry from localStorage", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("tok", ADMIN, 600));
    act(() => result.current.logout());

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(EXPIRY_KEY)).toBeNull();
  });
});

// ── Auto-logout timer ──────────────────────────────────────────────────────────

describe("AuthContext — auto-logout", () => {
  test("logs out automatically when session expires", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Wait with real timers until hook is stable, then switch to fake timers
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.useFakeTimers();
    try {
      act(() => result.current.login("tok", ADMIN, 10));
      expect(result.current.admin).not.toBeNull();

      act(() => vi.advanceTimersByTime(10_001));
      expect(result.current.admin).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test("does not log out before session expires", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.useFakeTimers();
    try {
      act(() => result.current.login("tok", ADMIN, 60));
      act(() => vi.advanceTimersByTime(30_000));
      expect(result.current.admin).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── getToken() ─────────────────────────────────────────────────────────────────

describe("AuthContext — getToken()", () => {
  test("returns null when no session exists", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.getToken()).toBeNull();
  });

  test("returns the token when a valid session is active", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("active-token", ADMIN, 600));
    expect(result.current.getToken()).toBe("active-token");
  });

  test("returns null after logout", async () => {
    fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.login("tok", ADMIN, 600));
    act(() => result.current.logout());
    expect(result.current.getToken()).toBeNull();
  });
});
