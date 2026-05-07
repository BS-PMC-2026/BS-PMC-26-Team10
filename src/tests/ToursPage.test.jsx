// Tests for ToursPage component (BSPMT10-12-usn12)
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ToursPage from "../pages/ToursPage";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

// ── Calendar sidebar tests ─────────────────────────────────────────────────

const THIS_YEAR = new Date().getFullYear();
const THIS_MONTH = new Date().getMonth();
const THIS_MONTH_STR = String(THIS_MONTH + 1).padStart(2, "0");

const calTours = [
  {
    id: 10,
    title: "Morning Harvest",
    visibility: "public",
    date: `${THIS_YEAR}-${THIS_MONTH_STR}-15`,
    time: "09:00",
    kind: "harvest",
    description: "",
    capacity: 10,
    remaining_spots: 5,
    is_full: false,
    duration: "90 min",
    price: 20,
  },
  {
    id: 11,
    title: "Sunset Tasting",
    visibility: "public",
    date: `${THIS_YEAR}-${THIS_MONTH_STR}-22`,
    time: "17:00",
    kind: "field-tasting",
    description: "",
    capacity: 8,
    remaining_spots: 3,
    is_full: false,
    duration: "60 min",
    price: 15,
  },
];

function renderCalPage(tours = calTours) {
  vi.stubGlobal("fetch", vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(tours) })
  ));
  return render(<MemoryRouter><ToursPage /></MemoryRouter>);
}

describe("ToursPage — Calendar sidebar", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("renders the calendar sidebar title", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByText("Tour Calendar")).toBeInTheDocument()
    );
  });

  test("calendar displays the current month and year", async () => {
    renderCalPage();
    const label = `${MONTH_NAMES[THIS_MONTH]} ${THIS_YEAR}`;
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
  });

  test("calendar shows previous and next month navigation buttons", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByLabelText("Previous month")).toBeInTheDocument()
    );
    expect(screen.getByLabelText("Next month")).toBeInTheDocument();
  });

  test("clicking next month navigates the calendar forward", async () => {
    renderCalPage();
    await waitFor(() => expect(screen.getByText("Tour Calendar")).toBeInTheDocument());

    const next = new Date(THIS_YEAR, THIS_MONTH + 1, 1);
    const nextLabel = `${MONTH_NAMES[next.getMonth()]} ${next.getFullYear()}`;

    await userEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText(nextLabel)).toBeInTheDocument();
  });

  test("clicking previous month navigates the calendar back", async () => {
    renderCalPage();
    await waitFor(() => expect(screen.getByText("Tour Calendar")).toBeInTheDocument());

    const prev = new Date(THIS_YEAR, THIS_MONTH - 1, 1);
    const prevLabel = `${MONTH_NAMES[prev.getMonth()]} ${prev.getFullYear()}`;

    await userEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(prevLabel)).toBeInTheDocument();
  });

  test("days with tours show a dot indicator via aria-label", async () => {
    renderCalPage();
    await waitFor(() => expect(screen.getByText("Tour Calendar")).toBeInTheDocument());

    expect(
      screen.getByLabelText(`15 ${MONTH_NAMES[THIS_MONTH]} — has tours`)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(`22 ${MONTH_NAMES[THIS_MONTH]} — has tours`)
    ).toBeInTheDocument();
  });

  test("clicking a tour date filters the tour list to that date only", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Morning Harvest" })).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByLabelText(`15 ${MONTH_NAMES[THIS_MONTH]} — has tours`)
    );

    expect(screen.getByRole("heading", { level: 2, name: "Morning Harvest" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Sunset Tasting" })).not.toBeInTheDocument();
  });

  test("shows filter label with selected date", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Morning Harvest" })).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByLabelText(`15 ${MONTH_NAMES[THIS_MONTH]} — has tours`)
    );

    expect(screen.getByText(/Showing tours for/i)).toBeInTheDocument();
  });

  test("Show all tours button clears the date filter", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Morning Harvest" })).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByLabelText(`15 ${MONTH_NAMES[THIS_MONTH]} — has tours`)
    );
    expect(screen.queryByRole("heading", { level: 2, name: "Sunset Tasting" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText(/Show all tours/i));
    expect(screen.getByRole("heading", { level: 2, name: "Sunset Tasting" })).toBeInTheDocument();
    expect(screen.queryByText(/Showing tours for/i)).not.toBeInTheDocument();
  });

  test("clicking the same date again clears the filter", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: "Morning Harvest" })).toBeInTheDocument()
    );

    const dayBtn = screen.getByLabelText(`15 ${MONTH_NAMES[THIS_MONTH]} — has tours`);
    await userEvent.click(dayBtn);
    expect(screen.queryByRole("heading", { level: 2, name: "Sunset Tasting" })).not.toBeInTheDocument();

    await userEvent.click(dayBtn);
    expect(screen.getByRole("heading", { level: 2, name: "Sunset Tasting" })).toBeInTheDocument();
  });

  test("shows no-tours message when a date with no tours is selected", async () => {
    renderCalPage();
    await waitFor(() => expect(screen.getByText("Tour Calendar")).toBeInTheDocument());

    // day 10 has no tours
    await userEvent.click(screen.getByLabelText(`10 ${MONTH_NAMES[THIS_MONTH]}`));
    expect(screen.getByText("No tours on this date.")).toBeInTheDocument();
  });

  test("monthly summary shows correct tour count for current month", async () => {
    renderCalPage();
    await waitFor(() =>
      expect(screen.getByText("2 tours this month")).toBeInTheDocument()
    );
  });
});
