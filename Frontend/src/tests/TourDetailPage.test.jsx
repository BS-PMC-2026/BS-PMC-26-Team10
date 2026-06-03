// Tests for TourDetailPage component (BSPMT10-12-usn12, USN-13)
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TourDetailPage from "../pages/TourDetailPage";

vi.mock("@paypal/react-paypal-js", () => ({
  PayPalButtons: ({ createOrder, onApprove, disabled }) => (
    <button
      data-testid="paypal-btn"
      disabled={disabled}
      onClick={async () => {
        try {
          const orderId = await createOrder({}, {
            order: { create: async () => "PAYPAL_ORDER_123" },
          });
          await onApprove({}, {
            order: { capture: async () => ({ id: orderId }) },
          });
        } catch {
          // createOrder rejects when form is invalid — that's expected
        }
      }}
    >
      Pay with PayPal
    </button>
  ),
}));

const FUTURE_DATE = "2026-12-31";

const freeTour = {
  id: 2,
  title: "Free Field Walk",
  visibility: "public",
  date: FUTURE_DATE,
  time: "10:00",
  kind: "field-tasting",
  description: "A free tour",
  capacity: 12,
  remaining_spots: 5,
  is_full: false,
  duration: "90 min",
  price: 0,
  meeting_point: "Main gate",
  includes: "5 tastings",
  accessibility: "mostly-yes",
};

const paidTour = {
  id: 1,
  title: "Field Walk",
  visibility: "public",
  date: FUTURE_DATE,
  time: "10:00",
  kind: "field-tasting",
  description: "A great tour",
  capacity: 12,
  remaining_spots: 5,
  is_full: false,
  duration: "90 min",
  price: 28,
  meeting_point: "Main gate",
  includes: "5 tastings",
  accessibility: "mostly-yes",
};

function makeBookingFetch(overrides = {}) {
  return {
    success: true,
    booking_reference: "ABC12345",
    message: "Booking confirmed.",
    email_sent: true,
    confirmation_message: "Please keep this reference for future changes.",
    ...overrides,
  };
}

function renderDetailPage(tour = paidTour, fetchOverride = null) {
  const tourId = String(tour.id);
  vi.stubGlobal("fetch", fetchOverride ?? vi.fn((url) => {
    if (url.includes("/bookings")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makeBookingFetch()),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([tour]),
    });
  }));

  return render(
    <MemoryRouter initialEntries={[`/tours/${tourId}`]}>
      <Routes>
        <Route path="/tours/:id" element={<TourDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("TourDetailPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("shows loading state before data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(
      <MemoryRouter initialEntries={["/tours/1"]}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Loading tour…")).toBeInTheDocument();
  });

  test("shows error when tour is not found", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ));
    render(
      <MemoryRouter initialEntries={["/tours/999"]}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText("Tour not found.")).toBeInTheDocument()
    );
  });

  test("displays tour title after loading", async () => {
    renderDetailPage(paidTour);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Field Walk" })).toBeInTheDocument()
    );
  });

  test("free tour shows Confirm Booking button, not PayPal", async () => {
    renderDetailPage(freeTour);
    await waitFor(() =>
      expect(screen.getByText("Confirm Booking")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("paypal-btn")).not.toBeInTheDocument();
  });

  test("paid tour shows PayPal button instead of Confirm Booking", async () => {
    renderDetailPage(paidTour);
    await waitFor(() =>
      expect(screen.getByTestId("paypal-btn")).toBeInTheDocument()
    );
    expect(screen.queryByText("Confirm Booking")).not.toBeInTheDocument();
  });
});
