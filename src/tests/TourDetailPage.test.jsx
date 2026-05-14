// Tests for TourDetailPage component (BSPMT10-12-usn12, USN-13)
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TourDetailPage from "../pages/TourDetailPage";

// Mock PayPalButtons so tests don't need PayPalScriptProvider.
// The mock simulates the full create-order → approve flow via a single button.
vi.mock("@paypal/react-paypal-js", () => ({
  PayPalButtons: ({ createOrder, onApprove, onError, disabled }) => (
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
const PAST_DATE = "2025-01-01";

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

  // ── loading / error states ──────────────────────────────────────────────

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

  // ── tour info display ───────────────────────────────────────────────────

  test("displays tour title after loading", async () => {
    renderDetailPage(paidTour);
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Field Walk" })).toBeInTheDocument()
    );
  });

  test("displays tour description and meeting point", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByText("A great tour")).toBeInTheDocument());
    expect(screen.getByText("Main gate")).toBeInTheDocument();
  });

  // ── past / full tour states ─────────────────────────────────────────────

  test("hides booking form for past tours", async () => {
    renderDetailPage({ ...paidTour, date: PAST_DATE });
    await waitFor(() =>
      expect(screen.getByText("Tour has passed")).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
  });

  test("hides booking form for fully booked tours", async () => {
    renderDetailPage({ ...paidTour, is_full: true, remaining_spots: 0 });
    await waitFor(() =>
      expect(screen.getByText("Tour is fully booked")).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
  });

  // ── free tour flow ──────────────────────────────────────────────────────

  test("free tour shows 'Book this tour' heading", async () => {
    renderDetailPage(freeTour);
    await waitFor(() =>
      expect(screen.getByText("Book this tour")).toBeInTheDocument()
    );
  });

  test("free tour shows Confirm Booking button, not PayPal", async () => {
    renderDetailPage(freeTour);
    await waitFor(() =>
      expect(screen.getByText("Confirm Booking")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("paypal-btn")).not.toBeInTheDocument();
  });

  test("shows booking form fields for free tour", async () => {
    renderDetailPage(freeTour);
    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of participants/)).toBeInTheDocument();
  });

  test("free tour shows confirmation after successful booking", async () => {
    renderDetailPage(freeTour);
    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() =>
      expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument()
    );
    expect(screen.getByText("ABC12345")).toBeInTheDocument();
    expect(screen.getByText("A confirmation email was sent to your email address.")).toBeInTheDocument();
    expect(screen.getByText("Please keep this reference for future changes.")).toBeInTheDocument();
  });

  test("free tour success screen does NOT show 'Payment received' badge", async () => {
    renderDetailPage(freeTour);
    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() =>
      expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument()
    );
    expect(screen.queryByText(/Payment received/)).not.toBeInTheDocument();
  });

  test("shows saved booking message when confirmation email fails", async () => {
    renderDetailPage(freeTour, vi.fn((url) => {
      if (url.includes("/bookings")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeBookingFetch({ email_sent: false })),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([freeTour]) });
    }));

    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() =>
      expect(
        screen.getByText("Your booking is saved, but the confirmation email could not be sent right now.")
      ).toBeInTheDocument()
    );
  });

  test("shows error message when booking fails", async () => {
    renderDetailPage(freeTour, vi.fn((url) => {
      if (url.includes("/bookings")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ detail: "You have already booked this tour." }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([freeTour]) });
    }));

    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() =>
      expect(screen.getByText("You have already booked this tour.")).toBeInTheDocument()
    );
  });

  // ── paid tour / PayPal flow ─────────────────────────────────────────────

  test("paid tour shows 'Book & Pay' heading", async () => {
    renderDetailPage(paidTour);
    await waitFor(() =>
      expect(screen.getByText("Book & Pay")).toBeInTheDocument()
    );
  });

  test("paid tour shows price summary with correct total", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByText("Price per person")).toBeInTheDocument());
    // ₪28.00 appears twice: once as unit price, once as total (1 participant default)
    expect(screen.getAllByText("₪28.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("paid tour shows PayPal button instead of Confirm Booking", async () => {
    renderDetailPage(paidTour);
    await waitFor(() =>
      expect(screen.getByTestId("paypal-btn")).toBeInTheDocument()
    );
    expect(screen.queryByText("Confirm Booking")).not.toBeInTheDocument();
  });

  test("clicking PayPal without filling form shows field validation errors", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByTestId("paypal-btn")).toBeInTheDocument());

    await userEvent.click(screen.getByTestId("paypal-btn"));

    await waitFor(() =>
      expect(screen.getByText("Email is required.")).toBeInTheDocument()
    );
    expect(screen.getByText("Full name is required.")).toBeInTheDocument();
    expect(screen.getByText("Phone is required.")).toBeInTheDocument();
  });

  test("successful PayPal payment shows 'Payment received' badge", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByTestId("paypal-btn")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByTestId("paypal-btn"));

    await waitFor(() =>
      expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument()
    );
    expect(screen.getByText(/Payment received/)).toBeInTheDocument();
    expect(screen.getByText("ABC12345")).toBeInTheDocument();
  });

  test("PayPal payment sends paypal_order_id to backend", async () => {
    const mockFetch = vi.fn((url) => {
      if (url.includes("/bookings")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeBookingFetch()),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([paidTour]) });
    });
    renderDetailPage(paidTour, mockFetch);

    await waitFor(() => expect(screen.getByTestId("paypal-btn")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByTestId("paypal-btn"));

    await waitFor(() =>
      expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument()
    );

    const bookingCall = mockFetch.mock.calls.find(([url]) => url.includes("/bookings"));
    const body = JSON.parse(bookingCall[1].body);
    expect(body.payment_status).toBe("paid");
    expect(body.paypal_order_id).toBe("PAYPAL_ORDER_123");
  });

  test("invalid email format shows field-level error", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByTestId("paypal-btn")).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "not-an-email");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByTestId("paypal-btn"));

    await waitFor(() =>
      expect(screen.getByText("Invalid email format.")).toBeInTheDocument()
    );
  });

  test("price total updates when participant count changes", async () => {
    renderDetailPage(paidTour);
    await waitFor(() => expect(screen.getByLabelText(/Number of participants/)).toBeInTheDocument());

    const input = screen.getByLabelText(/Number of participants/);
    await userEvent.clear(input);
    await userEvent.type(input, "3");

    await waitFor(() =>
      expect(screen.getByText("₪84.00")).toBeInTheDocument()
    );
  });

  test("cancels booking after visitor confirms action", async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes("/cancel")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            booking_reference: "ABC12345",
            released_spots: 2,
          }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([paidTour]) });
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/tours/1"]}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Cancel a booking")).toBeInTheDocument());
    expect(screen.queryByLabelText(/Booking reference/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Cancel a booking"));

    await userEvent.type(screen.getByLabelText(/Booking reference/), "ABC12345");
    await userEvent.type(screen.getByLabelText(/Booking email address/), "visitor@example.com");
    await userEvent.click(screen.getByText("Cancel Booking"));

    await waitFor(() =>
      expect(screen.getByText("Booking cancelled successfully. Your spots are now available again.")).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/bookings/ABC12345/cancel",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "visitor@example.com" }),
      })
    );
  });

  test("does not send cancellation request when visitor rejects confirmation", async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([paidTour]) }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/tours/1"]}>
        <Routes>
          <Route path="/tours/:id" element={<TourDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Cancel a booking")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Cancel a booking"));

    await userEvent.type(screen.getByLabelText(/Booking reference/), "ABC12345");
    await userEvent.type(screen.getByLabelText(/Booking email address/), "visitor@example.com");
    await userEvent.click(screen.getByText("Cancel Booking"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
