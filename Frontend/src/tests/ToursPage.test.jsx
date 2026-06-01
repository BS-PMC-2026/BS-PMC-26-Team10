// Tests for ToursPage component (BSPMT10-12-usn12)
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToursPage from "../pages/ToursPage";

const FUTURE_DATE = "2026-12-31";
const PAST_DATE = "2025-01-01";

const mockTours = [
  {
    id: 1,
    title: "Field Walk",
    visibility: "public",
    date: FUTURE_DATE,
    time: "10:00",
    kind: "field-tasting",
    description: "A guided walk",
    capacity: 12,
    remaining_spots: 5,
    is_full: false,
    duration: "90 min",
    price: 28,
  },
  {
    id: 2,
    title: "Full Tour",
    visibility: "public",
    date: FUTURE_DATE,
    time: "14:00",
    kind: "workshop",
    description: "All booked up",
    capacity: 10,
    remaining_spots: 0,
    is_full: true,
    duration: "2 hrs",
    price: 0,
  },
  {
    id: 3,
    title: "Draft Tour",
    visibility: "draft",
    date: FUTURE_DATE,
    time: "09:00",
    kind: "harvest",
    description: "Not published",
    capacity: 8,
    remaining_spots: 8,
    is_full: false,
    duration: "45 min",
    price: 0,
  },
];

const mockFaq = [
  {
    id: 1,
    question: "How do I book a tour?",
    answer: "Choose an available tour and confirm your booking online.",
    category: "Booking",
    display_order: 1,
  },
];

function renderPage(tours = mockTours, faq = mockFaq, fetchOverride = null) {
  vi.stubGlobal("fetch", fetchOverride ?? vi.fn((url) => {
    if (url.includes("/faq")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(faq) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve(tours) });
  }));
  return render(<MemoryRouter><ToursPage /></MemoryRouter>);
}

describe("ToursPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("shows loading state before data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<MemoryRouter><ToursPage /></MemoryRouter>);
    expect(screen.getByText("Loading tours…")).toBeInTheDocument();
  });

  test("shows published tours after loading", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Field Walk")).toBeInTheDocument());
    expect(screen.getByText("Full Tour")).toBeInTheDocument();
  });

  test("hides draft tours from public listing", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Field Walk")).toBeInTheDocument());
    expect(screen.queryByText("Draft Tour")).not.toBeInTheDocument();
  });

  test("shows Full badge for fully booked tours", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Full Tour")).toBeInTheDocument());
    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  test("shows error message when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));
    render(<MemoryRouter><ToursPage /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("Network error")).toBeInTheDocument()
    );
  });
});
