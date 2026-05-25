import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, expect, describe } from "vitest";
import OwnerBookings from "../pages/OwnerBookings";

// ── fixtures ─────────────────────────────────────────────────────────────────

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

// ── unit: loading & error states ──────────────────────────────────────────────

describe("loading and error states", () => {
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

  test("shows empty state when all tours have no bookings", async () => {
    mockFetch(mockTours, [], []);
    render(<OwnerBookings />);
    await waitFor(() => {
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
    });
  });
});

// ── unit: stat cards ──────────────────────────────────────────────────────────

describe("stat cards", () => {
  test("shows correct total bookings count", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      // 1 booking from tour1 + 1 from tour2 = 2
      const cards = document.querySelectorAll(".ob-stat-card h2");
      expect(cards[0].textContent).toBe("2");
    });
  });

  test("shows correct paid count from payment_status field", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      const cards = document.querySelectorAll(".ob-stat-card h2");
      // Alice is paid, Bob is free → paid = 1
      expect(cards[1].textContent).toBe("1");
    });
  });

  test("shows correct free/pending count", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      const cards = document.querySelectorAll(".ob-stat-card h2");
      // Bob is free → free = 1
      expect(cards[2].textContent).toBe("1");
    });
  });

  test("shows correct total participants count", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      const cards = document.querySelectorAll(".ob-stat-card h2");
      // 2 + 3 = 5
      expect(cards[3].textContent).toBe("5");
    });
  });

  test("paid is 0 when no bookings have payment_status 'paid'", async () => {
    const allFree = [{ ...bookingsTour1[0], payment_status: "free" }];
    mockFetch(mockTours, allFree, []);
    render(<OwnerBookings />);
    await waitFor(() => {
      const cards = document.querySelectorAll(".ob-stat-card h2");
      expect(cards[1].textContent).toBe("0");
    });
  });
});

// ── unit: table rendering ─────────────────────────────────────────────────────

describe("table rendering", () => {
  test("renders a row for each booking", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      expect(screen.getByText("Alice Cohen")).toBeInTheDocument();
      expect(screen.getByText("Bob Levi")).toBeInTheDocument();
    });
  });

  test("displays booking references", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      expect(screen.getByText("ABC12345")).toBeInTheDocument();
      expect(screen.getByText("DEF67890")).toBeInTheDocument();
    });
  });

  test("displays visitor email addresses", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });
  });

  test("attaches tour_title from the parent tour to each booking row", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      expect(screen.getByText("Field Walk")).toBeInTheDocument();
      expect(screen.getByText("Harvest Tour")).toBeInTheDocument();
    });
  });

  test("shows participant counts in the table", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      // Each booking row has a <td> with just the participants_count number
      const cells = document.querySelectorAll(".ob-table tbody td:nth-child(4)");
      const values = Array.from(cells).map((c) => c.textContent);
      expect(values).toContain("2");
      expect(values).toContain("3");
    });
  });

  test("shows green 'Paid' badge for paid booking", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      const badge = document.querySelector(".ob-badge--paid");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Paid");
    });
  });

  test("shows amber 'Free' badge for free booking", async () => {
    render(<OwnerBookings />);
    await waitFor(() => {
      const badge = document.querySelector(".ob-badge--free");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Free");
    });
  });
});

// ── integration: search filter ────────────────────────────────────────────────

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

  test("filters rows by email", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "bob@example.com" },
    });

    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
    expect(screen.queryByText("Alice Cohen")).not.toBeInTheDocument();
  });

  test("filters rows by booking reference", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "DEF" },
    });

    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
    expect(screen.queryByText("Alice Cohen")).not.toBeInTheDocument();
  });

  test("filters rows by tour title", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "harvest" },
    });

    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
    expect(screen.queryByText("Alice Cohen")).not.toBeInTheDocument();
  });

  test("shows no-bookings state when search has no matches", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
  });
});

// ── integration: status filter ────────────────────────────────────────────────

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

  test("filtering by 'free' shows only free bookings", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "free" },
    });

    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
    expect(screen.queryByText("Alice Cohen")).not.toBeInTheDocument();
  });

  test("'all statuses' filter shows every booking", async () => {
    render(<OwnerBookings />);
    await waitFor(() => screen.getByText("Alice Cohen"));

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "paid" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "all" } });

    expect(screen.getByText("Alice Cohen")).toBeInTheDocument();
    expect(screen.getByText("Bob Levi")).toBeInTheDocument();
  });
});
