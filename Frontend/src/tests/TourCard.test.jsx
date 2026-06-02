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
});
