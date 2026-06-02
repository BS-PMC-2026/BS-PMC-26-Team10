import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, expect, describe } from "vitest";
import OwnerBookings from "../pages/OwnerBookings";

const mockTours = [
  { id: 1, title: "Field Walk" },
  { id: 2, title: "Harvest Tour" },
];

const bookingsTour1 = [
  {
    booking_reference: "ABC12345",
    full_name: "Alice Cohen",
    email: "alice@example.com",
    phone: "0521234567",
    participants_count: 2,
    payment_status: "paid",
    paypal_order_id: "PAYPAL_ORDER_1",
  },
];

const bookingsTour2 = [
  {
    booking_reference: "DEF67890",
    full_name: "Bob Levi",
    email: "bob@example.com",
    phone: "0539876543",
    participants_count: 3,
    payment_status: "free",
    paypal_order_id: null,
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
  render(<OwnerBookings />);
  expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
});

test("shows error when tours fetch fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false });
  render(<OwnerBookings />);
  await waitFor(() => {
    expect(screen.getByText(/could not load bookings/i)).toBeInTheDocument();
  });
});

test("renders a row for each booking", async () => {
  render(<OwnerBookings />);
  await waitFor(() => {
    expect(screen.getByText("Alice Cohen")).toBeInTheDocument();
    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
  });
});

describe("search filter", () => {
  test("filters rows by visitor name", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "alice" },
    });

    expect(screen.getByText("Alice Cohen")).toBeInTheDocument();
    expect(screen.queryByText("Bob Levi")).not.toBeInTheDocument();
  });
});

describe("status filter", () => {
  test("filtering by 'paid' shows only paid bookings", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "paid" },
    });

    expect(screen.getByText("Alice Cohen")).toBeInTheDocument();
    expect(screen.queryByText("Bob Levi")).not.toBeInTheDocument();
  });
});
