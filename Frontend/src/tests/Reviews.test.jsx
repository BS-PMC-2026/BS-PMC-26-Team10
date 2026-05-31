import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewsSection from "../components/ReviewsSection/ReviewsSection";

const mockReviews = [
  {
    id: 1,
    tour_id: 4,
    tour_title: "Past Harvest Tour",
    booking_reference: "SEED0001",
    reviewer_name: "Sarah M.",
    rating: 5,
    comment: "Absolutely incredible experience!",
    photo_url: "",
    created_at: "2026-05-28T10:00:00Z",
  },
  {
    id: 2,
    tour_id: 4,
    tour_title: "Past Harvest Tour",
    booking_reference: "SEED0002",
    reviewer_name: "David K.",
    rating: 4,
    comment: "Very informative and fun.",
    photo_url: "https://i.pravatar.cc/80?img=5",
    created_at: "2026-05-26T10:00:00Z",
  },
];

const mockTours = [
  { id: 4, title: "Past Harvest Tour", date: "2025-01-01", visibility: "public" },
  { id: 5, title: "Future Tour", date: "2099-12-31", visibility: "public" },
];

function stubFetch(reviews = mockReviews) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url) => {
      if (url.includes("/reviews/verify")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              reviewer_name: "Sarah M.",
              tour_title: "Past Harvest Tour",
              tour_id: 4,
              booking_reference: "SEED0001",
            }),
        });
      }
      if (url.includes("/reviews")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(reviews),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllTimers();
});

describe("ReviewsSection", () => {
  test("shows loading state before reviews arrive", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<ReviewsSection tours={mockTours} />);
    expect(screen.getByText("Loading reviews…")).toBeInTheDocument();
  });

  test("renders review cards after fetch resolves", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByText("Sarah M.")).toBeInTheDocument());
    expect(screen.getByText("David K.")).toBeInTheDocument();
  });

  test("displays reviewer comment text on card", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() =>
      expect(screen.getByText(/Absolutely incredible experience!/i)).toBeInTheDocument()
    );
  });

  test("displays tour title on each card", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => {
      const labels = screen.getAllByText("Past Harvest Tour");
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  test("shows empty state when no reviews are returned", async () => {
    stubFetch([]);
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() =>
      expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument()
    );
  });

  test("renders the Leave a Review button", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByText(/Leave a Review/i)).toBeInTheDocument());
  });

  test("opens the review modal when Leave a Review is clicked", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByText(/Leave a Review/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Leave a Review/i));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Booking Reference/i)).toBeInTheDocument();
  });

  test("closes the modal when the X button is clicked", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByText(/Leave a Review/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Leave a Review/i));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("filter dropdown includes All Tours option", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByLabelText(/Filter reviews by tour/i)).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "All Tours" })).toBeInTheDocument();
  });

  test("filter dropdown lists only past tours", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByLabelText(/Filter reviews by tour/i)).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "Past Harvest Tour" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Future Tour" })).not.toBeInTheDocument();
  });

  test("modal verify form advances to rating step on success", async () => {
    stubFetch();
    render(<ReviewsSection tours={mockTours} />);
    await waitFor(() => expect(screen.getByText(/Leave a Review/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Leave a Review/i));

    await userEvent.type(screen.getByLabelText(/Booking Reference/i), "SEED0001");
    await userEvent.type(screen.getByLabelText(/Email Address/i), "sarah@example.com");
    await userEvent.click(screen.getByText(/Verify Booking/i));

    await waitFor(() =>
      expect(screen.getByText(/Rate Your Experience/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Booking Verified/i)).toBeInTheDocument();
  });
});
