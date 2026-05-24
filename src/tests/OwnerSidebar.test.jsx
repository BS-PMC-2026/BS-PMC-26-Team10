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

  test("renders the View Site button", () => {
    renderSidebar();
    expect(screen.getByText("View Site")).toBeInTheDocument();
  });

  test("active nav item has the active CSS class", () => {
    renderSidebar("orders");
    const ordersBtn = screen.getByText("Orders").closest("button");
    expect(ordersBtn).toHaveClass("owner-nav-btn--active");
  });

  test("inactive nav items do not have the active CSS class", () => {
    renderSidebar("dashboard");
    const ordersBtn = screen.getByText("Orders").closest("button");
    expect(ordersBtn).not.toHaveClass("owner-nav-btn--active");
  });

  test("clicking a nav item navigates to /owner/{section}", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Orders").closest("button"));
    expect(mockNavigate).toHaveBeenCalledWith("/owner/orders");
  });

  test("clicking Promo Codes navigates to /owner/promo-codes", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Promo Codes").closest("button"));
    expect(mockNavigate).toHaveBeenCalledWith("/owner/promo-codes");
  });

  test("clicking View Site navigates to /", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("View Site"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("renders the Log Out button", () => {
    renderSidebar();
    expect(screen.getByText("Log Out")).toBeInTheDocument();
  });

  test("clicking Log Out calls logout() and navigates to /staffLogin", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Log Out"));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/staffLogin", { replace: true });
  });
});
