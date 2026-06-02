import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Auth from "../pages/Auth";

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
});
