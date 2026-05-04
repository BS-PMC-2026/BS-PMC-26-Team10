// Tests for TourCard component (BSPMT10-12-usn12)
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TourCard from "../components/TourCard/TourCard";

const mockTour = {
  id: 1,
  title: "Field & Tasting Tour",
  description: "Walk the rows and taste five fresh peppers.",
  date: "2026-06-15",
  time: "10:00",
  capacity: 12,
  remaining_spots: 7,
};

describe("TourCard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders the tour title", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Field & Tasting Tour")).toBeInTheDocument();
  });

  test("renders booked count out of capacity", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    // booked = capacity - remaining_spots = 12 - 7 = 5
    expect(screen.getByText("5 / 12 booked")).toBeInTheDocument();
  });

  test("shows 0 booked when all spots are remaining", () => {
    const tour = { ...mockTour, capacity: 10, remaining_spots: 10 };
    render(<TourCard tour={tour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("0 / 10 booked")).toBeInTheDocument();
  });

  test("renders the description when provided", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(
      screen.getByText("Walk the rows and taste five fresh peppers.")
    ).toBeInTheDocument();
  });

  test("does not render description when absent", () => {
    const tourNoDesc = { ...mockTour, description: "" };
    render(<TourCard tour={tourNoDesc} onEdit={() => {}} onDelete={() => {}} />);
    expect(
      screen.queryByText("Walk the rows and taste five fresh peppers.")
    ).not.toBeInTheDocument();
  });

  test("renders Edit and Delete buttons", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  test("calls onEdit with the full tour object when Edit is clicked", async () => {
    const mockEdit = vi.fn();
    render(<TourCard tour={mockTour} onEdit={mockEdit} onDelete={() => {}} />);
    await userEvent.click(screen.getByText("Edit"));
    expect(mockEdit).toHaveBeenCalledWith(mockTour);
  });

  test("calls onDelete with the tour id when Delete is clicked", async () => {
    const mockDelete = vi.fn();
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={mockDelete} />);
    await userEvent.click(screen.getByText("Delete"));
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  test("renders View bookings toggle button", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/View bookings/)).toBeInTheDocument();
  });

  test("shows booking count in toggle button", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/View bookings \(5\)/)).toBeInTheDocument();
  });

  test("fetches and shows bookings when toggle is clicked", async () => {
    const mockBookings = [
      { full_name: "Alice Cohen", phone: "0521234567", email: "alice@example.com", participants_count: 2, booking_reference: "ABC12345", created_at: "2026-05-01" },
    ];
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockBookings) })
    ));

    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    await userEvent.click(screen.getByText(/View bookings/));

    await waitFor(() => expect(screen.getByText("Alice Cohen")).toBeInTheDocument());
    expect(screen.getByText("0521234567")).toBeInTheDocument();
    expect(screen.getByText("ABC12345")).toBeInTheDocument();
  });

  test("shows empty message when tour has no bookings", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    ));

    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    await userEvent.click(screen.getByText(/View bookings/));

    await waitFor(() =>
      expect(screen.getByText("No bookings yet.")).toBeInTheDocument()
    );
  });
});
