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

  test("renders back to owner panel link", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    expect(screen.getByText("← Back to Owner Panel")).toBeInTheDocument();
  });

  test("shows promo codes in table after loading", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    expect(screen.getByText("FLAT15")).toBeInTheDocument();
  });

  test("shows empty state when no codes returned", async () => {
    renderPage(
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))
    );
    await waitFor(() =>
      expect(screen.getByText("No promo codes yet.")).toBeInTheDocument()
    );
  });

  test("shows error when fetch fails", async () => {
    renderPage(vi.fn(() => Promise.resolve({ ok: false })));
    await waitFor(() =>
      expect(screen.getByText("Could not load promo codes.")).toBeInTheDocument()
    );
  });

  test("shows validation error listing missing fields when form submitted empty", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    await userEvent.click(screen.getByRole("button", { name: "+ Create Code" }));
    expect(screen.getByText(/Missing required fields/i)).toBeInTheDocument();
  });

  test("shows specific missing fields in validation error", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    await userEvent.click(screen.getByRole("button", { name: "+ Create Code" }));
    const errMsg = screen.getByText(/Missing required fields/i).textContent;
    expect(errMsg).toContain("Discount Value");
    expect(errMsg).toContain("Valid From");
    expect(errMsg).toContain("Valid Until");
    expect(errMsg).toContain("Max Uses");
  });

  test("shows Uses / Max column in table", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    expect(screen.getByText("Uses / Max")).toBeInTheDocument();
    expect(screen.getByText("5 / 100")).toBeInTheDocument();
  });

  test("clicking Edit populates form with existing code values", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    await userEvent.click(screen.getAllByText("Edit")[0]);
    expect(screen.getByRole("heading", { name: "Edit Promo Code" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("SUMMER20")).toHaveValue("SUMMER20");
    expect(screen.getByPlaceholderText("20")).toHaveValue(20);
  });

  test("Cancel button in edit mode resets form to add mode", async () => {
    renderPage();
    await waitFor(() => screen.getByText("SUMMER20"));
    await userEvent.click(screen.getAllByText("Edit")[0]);
    expect(screen.getByRole("heading", { name: "Edit Promo Code" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Add Promo Code" })).toBeInTheDocument();
  });

  test("calls PUT endpoint when saving edited code", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCodes) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Promo code updated successfully!" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCodes) });
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerPromoCodes /></MemoryRouter>);
    await waitFor(() => screen.getByText("SUMMER20"));

    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/promo/codes/1",
        expect.objectContaining({ method: "PUT" })
      )
    );
  });

  test("shows success message after code is updated", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCodes) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Promo code updated successfully!" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCodes) });
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerPromoCodes /></MemoryRouter>);
    await waitFor(() => screen.getByText("SUMMER20"));

    await userEvent.click(screen.getAllByText("Edit")[0]);
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(screen.getByText("Promo code updated!")).toBeInTheDocument()
    );
  });

  test("calls DELETE endpoint when delete is confirmed", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockCodes) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Promo code deleted." }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockCodes[1]]) });
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerPromoCodes /></MemoryRouter>);
    await waitFor(() => screen.getByText("SUMMER20"));

    await userEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/promo/codes/1",
        { method: "DELETE" }
      )
    );
  });

  test("does not call DELETE when confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockCodes) })
    );
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerPromoCodes /></MemoryRouter>);
    await waitFor(() => screen.getByText("SUMMER20"));

    await userEvent.click(screen.getAllByText("Delete")[0]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
