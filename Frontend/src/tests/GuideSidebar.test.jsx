import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GuideSidebar from "../components/GuideSidebar/GuideSidebar";

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

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <GuideSidebar current="dashboard" onNav={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe("GuideSidebar", () => {
  afterEach(() => vi.clearAllMocks());

  test("renders the ChiliLand brand and Guide badge", () => {
    renderSidebar();
    expect(screen.getByText("ChiliLand")).toBeInTheDocument();
    expect(screen.getByText("Guide")).toBeInTheDocument();
  });

  test("renders all navigation items", () => {
    renderSidebar();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("My tours")).toBeInTheDocument();
    expect(screen.getByText("Create tour")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("displays the guide name when provided", () => {
    renderSidebar({ guideName: "Yael Levi" });
    expect(screen.getByText("Yael Levi")).toBeInTheDocument();
  });

  test("displays default name when guideName is not provided", () => {
    renderSidebar();
    expect(screen.getByText("Tour Guide")).toBeInTheDocument();
  });

  test("calls onNav with the correct key when a nav item is clicked", async () => {
    const onNav = vi.fn();
    renderSidebar({ onNav });
    await userEvent.click(screen.getByText("Bookings"));
    expect(onNav).toHaveBeenCalledWith("bookings");
  });

  test("calls logout and navigates to /staffLogin on Log out click", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Log out"));
    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/staffLogin", { replace: true });
  });

  test("shows a theme-toggle button", () => {
    renderSidebar();
    // The button contains an icon + a <span> — match via role + accessible name substring
    expect(
      screen.getByRole("button", { name: /dark mode|light mode/i })
    ).toBeInTheDocument();
  });
});
