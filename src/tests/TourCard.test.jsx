// Tests for TourCard component
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

  test("shows capacity booked when remaining_spots is undefined", () => {
    const tour = { ...mockTour, capacity: 8, remaining_spots: undefined };
    render(<TourCard tour={tour} onEdit={() => {}} onDelete={() => {}} />);
    // remaining_spots ?? capacity → capacity, so booked = capacity - capacity = 0
    expect(screen.getByText("0 / 8 booked")).toBeInTheDocument();
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

  test("does not render a 'View bookings' toggle (moved to Booking Requests tab)", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText(/view bookings/i)).not.toBeInTheDocument();
  });

  test("renders thumbnail image when picture is set", () => {
    const tour = { ...mockTour, picture: "https://example.com/tour.jpg" };
    render(<TourCard tour={tour} onEdit={() => {}} onDelete={() => {}} />);
    const img = screen.getByRole("img", { name: mockTour.title });
    expect(img).toHaveAttribute("src", "https://example.com/tour.jpg");
  });

  test("does not render image when picture is absent", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("does not render image when picture is null", () => {
    const tour = { ...mockTour, picture: null };
    render(<TourCard tour={tour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
