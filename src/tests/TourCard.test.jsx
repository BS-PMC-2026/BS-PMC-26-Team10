// Tests for TourCard component (BSPMT10-3-usn3)
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
};

describe("TourCard", () => {
  test("renders the tour title", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Field & Tasting Tour")).toBeInTheDocument();
  });

  test("renders the capacity with 'spots' label", () => {
    render(<TourCard tour={mockTour} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("12 spots")).toBeInTheDocument();
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
});
