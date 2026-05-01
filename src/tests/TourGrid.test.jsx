// Tests for TourGrid component (BSPMT10-3-usn3)
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TourGrid from "../components/TourGrid/TourGrid";

const mockTours = [
  { id: 1, title: "Field & Tasting Tour", description: "A walk.", date: "2026-06-15", time: "10:00", capacity: 12 },
  { id: 2, title: "Hot Sauce Workshop", description: "Make your own.", date: "2026-06-20", time: "14:00", capacity: 8 },
  { id: 3, title: "Harvest Day Experience", description: "Full morning.", date: "2026-06-25", time: "09:00", capacity: 6 },
];

describe("TourGrid", () => {
  test("renders all tour titles", () => {
    render(<TourGrid tours={mockTours} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Field & Tasting Tour")).toBeInTheDocument();
    expect(screen.getByText("Hot Sauce Workshop")).toBeInTheDocument();
    expect(screen.getByText("Harvest Day Experience")).toBeInTheDocument();
  });

  test("renders nothing when tours list is empty", () => {
    const { container } = render(
      <TourGrid tours={[]} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(container.querySelectorAll(".tour-card")).toHaveLength(0);
  });

  test("renders correct number of tour cards", () => {
    const { container } = render(
      <TourGrid tours={mockTours} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(container.querySelectorAll(".tour-card")).toHaveLength(3);
  });
});
