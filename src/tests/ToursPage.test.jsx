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
  {
    id: 4,
    title: "Past Tour",
    visibility: "public",
    date: PAST_DATE,
    time: "11:00",
    kind: "field-tasting",
    description: "Already happened",
    capacity: 6,
    remaining_spots: 3,
    is_full: false,
    duration: "90 min",
    price: 15,
  },
];

function renderPage(tours = mockTours) {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(tours) })
  ));
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

  test("shows remaining spots for available tours", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Field Walk")).toBeInTheDocument());
    expect(screen.getByText("5 / 12")).toBeInTheDocument();
  });

  test("shows Book Now link for available future tours", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Book Now")).toBeInTheDocument());
  });

  test("disables button and shows Fully Booked for full tours", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Fully Booked")).toBeInTheDocument());
    expect(screen.getByText("Fully Booked")).toBeDisabled();
  });

  test("shows Past badge and Tour Passed button for past tours", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Past Tour")).toBeInTheDocument());
    expect(screen.getByText("Past")).toBeInTheDocument();
    expect(screen.getByText("Tour Passed")).toBeDisabled();
  });

  test("shows error message when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));
    render(<MemoryRouter><ToursPage /></MemoryRouter>);
    await waitFor(() =>
      expect(screen.getByText("Network error")).toBeInTheDocument()
    );
  });

  test("shows empty message when no published tours exist", async () => {
    renderPage([{ ...mockTours[2] }]); // only a draft tour
    await waitFor(() =>
      expect(screen.getByText(/No tours are currently available/)).toBeInTheDocument()
    );
  });
});
