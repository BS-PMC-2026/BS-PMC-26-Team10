import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OwnerPromoCodes from "../pages/OwnerPromoCodes";

const mockCodes = [
  {
    id: 1,
    code: "SUMMER20",
    discount_type: "percent",
    discount_value: 20,
    min_order_amount: 30,
    max_uses: 100,
    used_count: 5,
    valid_from: "2026-01-01T00:00:00Z",
    valid_until: "2027-01-01T00:00:00Z",
    is_active: true,
  },
  {
    id: 2,
    code: "FLAT15",
    discount_type: "fixed",
    discount_value: 15,
    min_order_amount: 50,
    max_uses: null,
    used_count: 2,
    valid_from: null,
    valid_until: null,
    is_active: false,
  },
];

function renderPage(fetchImpl = null) {
  vi.stubGlobal(
    "fetch",
    fetchImpl ??
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockCodes) })
      )
  );
  return render(
    <MemoryRouter>
      <OwnerPromoCodes />
    </MemoryRouter>
  );
}

describe("OwnerPromoCodes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("renders page heading", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Promo Codes"));
    expect(screen.getByText("Promo Codes")).toBeInTheDocument();
  });

  test("shows promo codes in table after loading", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    expect(screen.getByText("FLAT15")).toBeInTheDocument();
  });

  test("shows validation error listing missing fields when form submitted empty", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    await userEvent.click(screen.getByRole("button", { name: "+ Create Code" }));
    expect(screen.getByText(/Missing required fields/i)).toBeInTheDocument();
  });
});
