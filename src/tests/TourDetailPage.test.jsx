// Tests for TourDetailPage component (BSPMT10-12-usn12)
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TourDetailPage from "../pages/TourDetailPage";

const FUTURE_DATE = "2026-12-31";
const PAST_DATE = "2025-01-01";

const availableTour = {
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

function renderDetailPage(tour = availableTour, fetchOverride = null) {
  const tourId = String(tour.id);
  vi.stubGlobal("fetch", fetchOverride ?? vi.fn((url) => {
    if (url.includes("/bookings")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, booking_reference: "ABC12345", message: "Booking confirmed." }),
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

  test("displays tour title after loading", async () => {
    renderDetailPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Field Walk" })).toBeInTheDocument()
    );
  });

  test("displays tour description and meeting point", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("A great tour")).toBeInTheDocument());
    expect(screen.getByText("Main gate")).toBeInTheDocument();
  });

  test("shows booking form for available future tour", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByText("Book this tour")).toBeInTheDocument());
    expect(screen.getByLabelText(/Email address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of participants/)).toBeInTheDocument();
  });

  test("hides booking form for past tours", async () => {
    renderDetailPage({ ...availableTour, date: PAST_DATE });
    await waitFor(() =>
      expect(screen.getByText("Tour has passed")).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
  });

  test("hides booking form for fully booked tours", async () => {
    renderDetailPage({ ...availableTour, is_full: true, remaining_spots: 0 });
    await waitFor(() =>
      expect(screen.getByText("Tour is fully booked")).toBeInTheDocument()
    );
    expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
  });

  test("shows confirmation screen after successful booking", async () => {
    renderDetailPage();
    await waitFor(() => expect(screen.getByLabelText(/Email address/)).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Email address/), "visitor@example.com");
    await userEvent.type(screen.getByLabelText(/Full name/), "Jane Smith");
    await userEvent.type(screen.getByLabelText(/Phone number/), "0549164691");

    await userEvent.click(screen.getByText("Confirm Booking"));

    await waitFor(() =>
      expect(screen.getByText("Booking Confirmed!")).toBeInTheDocument()
    );
    expect(screen.getByText("ABC12345")).toBeInTheDocument();
  });

  test("shows error message when booking fails", async () => {
    renderDetailPage(availableTour, vi.fn((url) => {
      if (url.includes("/bookings")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ detail: "You have already booked this tour." }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([availableTour]) });
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

  test("shows error when tour is not found", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) }) // empty list, tour id not found
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
});
