import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, expect, describe } from "vitest";
import TourGuideBookings from "../pages/TourGuideBookings";

const mockTours = [
  { id: 1, title: "Spice Walk", date: "2026-07-10" },
  { id: 2, title: "Harvest Trail", date: "2026-08-05" },
];

const bookingsTour1 = [
  {
    booking_reference: "REF001",
    full_name: "Dana Mizrahi",
    email: "dana@example.com",
    phone: "0521111111",
    participants_count: 2,
    payment_status: "paid",
    status: "confirmed",
  },
];

const bookingsTour2 = [
  {
    booking_reference: "REF002",
    full_name: "Eran Shapira",
    email: "eran@example.com",
    phone: "0529999999",
    participants_count: 1,
    payment_status: "free",
    status: "cancelled",
  },
];

function mockFetch(tours = mockTours, t1 = bookingsTour1, t2 = bookingsTour2) {
  global.fetch = vi.fn((url) => {
    if (url.endsWith("/tours")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(tours) });
    }
    if (url.includes("/tours/1/bookings")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(t1) });
    }
    if (url.includes("/tours/2/bookings")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(t2) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

beforeEach(() => mockFetch());
afterEach(() => vi.clearAllMocks());

test("shows loading message initially", () => {
  render(<TourGuideBookings />);
  expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
});

test("shows error message when fetch fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false });
  render(<TourGuideBookings />);
  await waitFor(() => {
    expect(screen.getByText(/could not load bookings/i)).toBeInTheDocument();
  });
});

test("renders a row for each booking after load", async () => {
  render(<TourGuideBookings />);
  await waitFor(() => {
    expect(screen.getByText("Dana Mizrahi")).toBeInTheDocument();
    expect(screen.getByText("Eran Shapira")).toBeInTheDocument();
  });
});

test("shows KPI stat cards with correct counts", async () => {
  render(<TourGuideBookings />);
  await waitFor(() => screen.getByText("Dana Mizrahi"));

  expect(screen.getByText("Total Bookings")).toBeInTheDocument();
  expect(screen.getByText("Confirmed")).toBeInTheDocument();
  expect(screen.getByText("Cancelled")).toBeInTheDocument();
  expect(screen.getByText("Total Visitors")).toBeInTheDocument();
});

test("shows empty state when there are no bookings", async () => {
  global.fetch = vi.fn((url) => {
    if (url.endsWith("/tours")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
  render(<TourGuideBookings />);
  await waitFor(() => {
    expect(screen.getByText(/no bookings yet/i)).toBeInTheDocument();
  });
});

describe("search filter", () => {
  test("filters rows by visitor name", async () => {
    render(<TourGuideBookings />);
    await waitFor(() => screen.getByText("Dana Mizrahi"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "dana" },
    });

    expect(screen.getByText("Dana Mizrahi")).toBeInTheDocument();
    expect(screen.queryByText("Eran Shapira")).not.toBeInTheDocument();
  });

  test("shows no-matches empty state when search has no results", async () => {
    render(<TourGuideBookings />);
    await waitFor(() => screen.getByText("Dana Mizrahi"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });
});

describe("status filter", () => {
  test("filtering by confirmed shows only confirmed bookings", async () => {
    render(<TourGuideBookings />);
    await waitFor(() => screen.getByText("Dana Mizrahi"));

    const selects = screen.getAllByRole("combobox");
    const statusSelect = selects[selects.length - 1];
    fireEvent.change(statusSelect, { target: { value: "confirmed" } });

    expect(screen.getByText("Dana Mizrahi")).toBeInTheDocument();
    expect(screen.queryByText("Eran Shapira")).not.toBeInTheDocument();
  });
});
