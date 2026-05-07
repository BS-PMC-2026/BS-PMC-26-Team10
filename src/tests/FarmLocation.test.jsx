import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FarmLocation from "../pages/FarmLocation";

describe("FarmLocation Page", () => {
  test("renders main content", () => {
    render(
      <MemoryRouter>
        <FarmLocation />
      </MemoryRouter>
    );

    expect(screen.getByText("Visit ChiliLand Farm")).toBeInTheDocument();
    expect(screen.getByText("Open in Google Maps")).toBeInTheDocument();
    expect(screen.getByText("Navigate with Waze")).toBeInTheDocument();
    expect(screen.getByText("How to Get Here")).toBeInTheDocument();
    expect(screen.getByText("Need Help?")).toBeInTheDocument();
  });

  test("renders map iframe", () => {
    render(
      <MemoryRouter>
        <FarmLocation />
      </MemoryRouter>
    );

    expect(screen.getByTitle("Farm Location")).toBeInTheDocument();
  });

  test("map section appears before gallery section in the page", () => {
    render(
      <MemoryRouter>
        <FarmLocation />
      </MemoryRouter>
    );

    const headings = screen.getAllByRole("heading", { level: 2 });
    const texts = headings.map((h) => h.textContent);
    const mapIdx = texts.indexOf("Find Us Easily");
    const galleryIdx = texts.indexOf("Chili Experience");

    expect(mapIdx).toBeGreaterThanOrEqual(0);
    expect(galleryIdx).toBeGreaterThanOrEqual(0);
    expect(mapIdx).toBeLessThan(galleryIdx);
  });
});