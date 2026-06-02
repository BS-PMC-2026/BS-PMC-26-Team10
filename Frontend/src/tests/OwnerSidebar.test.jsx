import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OwnerSidebar from "../components/OwnerSidebar/OwnerSidebar";

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

vi.mock("../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

function renderSidebar(activeSection = "dashboard") {
  return render(
    <MemoryRouter>
      <OwnerSidebar activeSection={activeSection} />
    </MemoryRouter>
  );
}

describe("OwnerSidebar", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders the Owner Panel heading", () => {
    renderSidebar();
    expect(screen.getByText("Owner Panel")).toBeInTheDocument();
  });

  test("renders all main nav items", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Stock & Inventory")).toBeInTheDocument();
    expect(screen.getByText("Pepper Catalogue")).toBeInTheDocument();
    expect(screen.getByText("Promo Codes")).toBeInTheDocument();
  });

  test("clicking Log Out calls logout() and navigates to /staffLogin", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Log Out"));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/staffLogin", { replace: true });
  });
});
