import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OwnerSidebar from "../components/OwnerSidebar/OwnerSidebar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderSidebar() {
  return render(
    <MemoryRouter>
      <OwnerSidebar />
    </MemoryRouter>
  );
}

describe("OwnerSidebar", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders quick actions heading", () => {
    renderSidebar();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
  });

  test("renders Add Promo Code button", () => {
    renderSidebar();
    expect(screen.getByText("Add Promo Code")).toBeInTheDocument();
  });

  test("renders View Site button", () => {
    renderSidebar();
    expect(screen.getByText("View Site")).toBeInTheDocument();
  });

  test("clicking Add Promo Code navigates to /owner/promo-codes", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Add Promo Code"));
    expect(mockNavigate).toHaveBeenCalledWith("/owner/promo-codes");
  });

  test("clicking View Site navigates to /", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("View Site"));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("buttons without a route do not navigate", async () => {
    renderSidebar();
    await userEvent.click(screen.getByText("Add Tour"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
