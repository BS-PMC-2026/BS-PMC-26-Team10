import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, beforeEach, afterEach, test, expect, describe } from "vitest";
import TourGuideReviews from "../pages/TourGuideReviews";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ getToken: () => "mock-token" }),
}));

const mockReviews = [
  {
    id: 1,
    reviewer_name: "Tal Geva",
    tour_title: "Spice Walk",
    rating: 5,
    comment: "Amazing experience!",
    owner_reply: null,
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: 2,
    reviewer_name: "Noa Ben-David",
    tour_title: "Harvest Trail",
    rating: 3,
    comment: "Pretty good overall.",
    owner_reply: "Thank you for visiting!",
    created_at: "2026-05-20T09:00:00Z",
  },
];

function mockFetch(reviews = mockReviews) {
  global.fetch = vi.fn((url) => {
    if (url.includes("/reviews")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(reviews) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

beforeEach(() => mockFetch());
afterEach(() => vi.clearAllMocks());

test("shows loading message initially", () => {
  render(<TourGuideReviews />);
  expect(screen.getByText(/loading reviews/i)).toBeInTheDocument();
});

test("shows error message when fetch fails", async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: false });
  render(<TourGuideReviews />);
  await waitFor(() => {
    expect(screen.getByText(/could not load reviews/i)).toBeInTheDocument();
  });
});

test("renders a card for each review", async () => {
  render(<TourGuideReviews />);
  await waitFor(() => {
    expect(screen.getByText("Tal Geva")).toBeInTheDocument();
    expect(screen.getByText("Noa Ben-David")).toBeInTheDocument();
  });
});

test("shows empty state when there are no reviews", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  });
  render(<TourGuideReviews />);
  await waitFor(() => {
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });
});

test("shows KPI stat cards", async () => {
  render(<TourGuideReviews />);
  await waitFor(() => screen.getByText("Tal Geva"));

  expect(screen.getByText("Total Reviews")).toBeInTheDocument();
  expect(screen.getByText("Average Rating")).toBeInTheDocument();
  expect(screen.getByText("5-Star Reviews")).toBeInTheDocument();
  expect(screen.getByText("Awaiting Reply")).toBeInTheDocument();
});

test("shows existing reply block when review already has a reply", async () => {
  render(<TourGuideReviews />);
  await waitFor(() => screen.getByText("Noa Ben-David"));
  expect(screen.getByText("Thank you for visiting!")).toBeInTheDocument();
});

describe("search filter", () => {
  test("filters by reviewer name", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Tal Geva"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "tal" },
    });

    expect(screen.getByText("Tal Geva")).toBeInTheDocument();
    expect(screen.queryByText("Noa Ben-David")).not.toBeInTheDocument();
  });

  test("shows no-matches state when search has no results", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Tal Geva"));

    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });
});

describe("reply filter", () => {
  test("pending filter shows only reviews without a reply", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Tal Geva"));

    const selects = screen.getAllByRole("combobox");
    const replySelect = selects[selects.length - 1];
    fireEvent.change(replySelect, { target: { value: "pending" } });

    expect(screen.getByText("Tal Geva")).toBeInTheDocument();
    expect(screen.queryByText("Noa Ben-David")).not.toBeInTheDocument();
  });

  test("replied filter shows only reviews that have a reply", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Noa Ben-David"));

    const selects = screen.getAllByRole("combobox");
    const replySelect = selects[selects.length - 1];
    fireEvent.change(replySelect, { target: { value: "replied" } });

    expect(screen.getByText("Noa Ben-David")).toBeInTheDocument();
    expect(screen.queryByText("Tal Geva")).not.toBeInTheDocument();
  });
});

describe("reply form", () => {
  test("opens reply textarea when reply button is clicked", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Tal Geva"));

    fireEvent.click(screen.getByText(/reply to review/i));
    expect(screen.getByPlaceholderText(/write a warm/i)).toBeInTheDocument();
  });

  test("shows error when trying to save an empty reply", async () => {
    render(<TourGuideReviews />);
    await waitFor(() => screen.getByText("Tal Geva"));

    fireEvent.click(screen.getByText(/reply to review/i));
    fireEvent.click(screen.getByText("Save Response"));

    await waitFor(() => {
      expect(screen.getByText(/reply cannot be empty/i)).toBeInTheDocument();
    });
  });
});
