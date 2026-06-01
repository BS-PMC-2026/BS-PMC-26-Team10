import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
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

test("admin is null and loading becomes false when no token in storage", async () => {
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.admin).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

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

test("sets admin state after login()", async () => {
  fetch.mockResolvedValue({ ok: false, json: async () => ({}) });
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));

  act(() => result.current.login("my-token", ADMIN, 600));
  expect(result.current.admin).toEqual(ADMIN);
});
