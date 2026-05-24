import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auth from "../pages/Auth";

// ── Module-level mocks ─────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
let mockAdmin = null;

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ admin: mockAdmin, login: mockLogin }),
}));

vi.stubGlobal("fetch", vi.fn());

afterEach(() => {
  vi.clearAllMocks();
  mockAdmin = null;
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderAuth(route = "/staffLogin") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Auth />
    </MemoryRouter>
  );
}

function mockFetchOk(body) {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => body });
}

function mockFetchErr(detail) {
  fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail }) });
}

// ── Login view ─────────────────────────────────────────────────────────────────

describe("Auth — Login view", () => {
  test("renders Welcome back heading by default", () => {
    renderAuth();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  test("shows error for empty email on submit", async () => {
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
  });

  test("shows error for invalid email format", async () => {
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "notanemail");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
  });

  test("shows error when password is empty", async () => {
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/password is required/i);
  });

  test("does not call fetch when validation fails", async () => {
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(fetch).not.toHaveBeenCalled();
  });

  test("calls /admin/login with email and password on valid submit", async () => {
    mockFetchOk({ token: "t", admin: { id: 1, first_name: "J", last_name: "D", email: "a@b.com" }, expires_in: 600 });
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/login"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("admin@example.com"),
        })
      )
    );
  });

  test("calls login() with token, admin, and expires_in on success", async () => {
    const admin = { id: 1, first_name: "Jane", last_name: "Doe", email: "jane@ex.com" };
    mockFetchOk({ token: "jwt-tok", admin, expires_in: 600 });
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "jane@ex.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("jwt-tok", admin, 600)
    );
  });

  test("navigates to /owner on successful login", async () => {
    const admin = { id: 1, first_name: "J", last_name: "D", email: "j@d.com" };
    mockFetchOk({ token: "t", admin, expires_in: 600 });
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "j@d.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/owner", { replace: true })
    );
  });

  test("shows server error message on failed login", async () => {
    mockFetchErr("Invalid email or password.");
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.")
    );
  });

  test("shows network error message when fetch throws", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));
    renderAuth();
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/network error/i)
    );
  });

  test("redirects to /owner when admin is already authenticated", async () => {
    mockAdmin = { id: 1, email: "a@b.com" };
    renderAuth();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/owner", { replace: true })
    );
  });
});

// ── Forgot Password view ───────────────────────────────────────────────────────

describe("Auth — Forgot Password view", () => {
  test("switches to forgot view when clicking Forgot password?", async () => {
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    expect(screen.getByText("Reset password")).toBeInTheDocument();
  });

  test("shows error for empty email in forgot view", async () => {
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
  });

  test("does not call fetch when email is invalid in forgot view", async () => {
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(fetch).not.toHaveBeenCalled();
  });

  test("calls /admin/forgot-password with entered email", async () => {
    mockFetchOk({ message: "If an admin..." });
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/forgot-password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("admin@example.com"),
        })
      )
    );
  });

  test("shows success message after sending reset link", async () => {
    mockFetchOk({ message: "If an admin account..." });
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  test("Back to login button returns to login view", async () => {
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.click(screen.getByText(/back to login/i));
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  test("shows error message from server on failure", async () => {
    mockFetchErr("Request failed.");
    renderAuth();
    await userEvent.click(screen.getByText("Forgot password?"));
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Request failed.")
    );
  });
});

// ── Reset Password view ────────────────────────────────────────────────────────

describe("Auth — Reset Password view", () => {
  const RESET_ROUTE = "/staffLogin?reset=valid-token-abc";

  test("shows Create new password heading when reset token is in URL", () => {
    renderAuth(RESET_ROUTE);
    expect(screen.getByText("Create new password")).toBeInTheDocument();
  });

  test("shows error when new password is too short", async () => {
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/at least 8/i);
  });

  test("shows error when passwords do not match", async () => {
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "longpassword1");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "differentpass");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/do not match/i);
  });

  test("does not call fetch when validation fails", async () => {
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(fetch).not.toHaveBeenCalled();
  });

  test("calls /admin/reset-password with token and new password", async () => {
    mockFetchOk({ success: true });
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "newpassword123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/reset-password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("valid-token-abc"),
        })
      )
    );
  });

  test("shows success message on successful reset", async () => {
    mockFetchOk({ success: true });
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "newpassword123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  test("shows error message for invalid/expired token from server", async () => {
    mockFetchErr("Invalid or expired reset link.");
    renderAuth(RESET_ROUTE);
    await userEvent.type(screen.getByLabelText("New Password"), "newpassword123");
    await userEvent.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid or expired reset link.")
    );
  });
});

// ── Back to site button ────────────────────────────────────────────────────────

describe("Auth — Back to site button", () => {
  test("renders the Back to site button", () => {
    renderAuth();
    expect(screen.getByText(/back to site/i)).toBeInTheDocument();
  });

  test("clicking Back to site navigates to /", async () => {
    renderAuth();
    await userEvent.click(screen.getByText(/back to site/i));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
