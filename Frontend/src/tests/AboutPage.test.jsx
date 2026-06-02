// Tests for AboutPage component (BSPMT10-1-usn1)
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "../pages/AboutPage";

function renderAbout() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
}

test("renders the main hero heading", () => {
  renderAbout();
  expect(
    screen.getByRole("heading", { name: /more than a farm/i })
  ).toBeInTheDocument();
});

test("renders all 6 offer cards", () => {
  renderAbout();
  const offerTitles = [
    "150+ Pepper Varieties",
    "Guided Farm Tours",
    "Handcrafted Products",
    "Tasting & Education",
    "Seeds & Seedlings",
    "Family-Friendly Experience",
  ];
  offerTitles.forEach((title) => {
    expect(screen.getByText(title)).toBeInTheDocument();
  });
});

test("closing CTA link points to /tours", () => {
  renderAbout();
  const link = screen.getByRole("link", { name: /view tours & book your visit/i });
  expect(link).toHaveAttribute("href", "/tours");
});
