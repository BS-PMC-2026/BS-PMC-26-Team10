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

// ── Gallery (BSPMT10-10-usn10) ──────────────────────────────────────────────

test("gallery section renders", () => {
  renderAbout();
  expect(document.querySelector(".about-gallery")).toBeInTheDocument();
});

test("gallery renders 6 images", () => {
  renderAbout();
  const images = document.querySelectorAll(".about-gallery-item img");
  expect(images).toHaveLength(6);
});

test("gallery renders 3 YouTube iframes", () => {
  renderAbout();
  const iframes = document.querySelectorAll(".about-gallery-item--video iframe");
  expect(iframes).toHaveLength(3);
});

test("YouTube iframes use youtube.com/embed URLs", () => {
  renderAbout();
  const iframes = document.querySelectorAll(".about-gallery-item--video iframe");
  iframes.forEach((iframe) => {
    expect(iframe.getAttribute("src")).toContain("youtube.com/embed");
  });
});

test("gallery images use Unsplash URLs", () => {
  renderAbout();
  const images = document.querySelectorAll(".about-gallery-item img");
  images.forEach((img) => {
    expect(img.getAttribute("src")).toContain("unsplash.com");
  });
});

// ── Social links in About (BSPMT10-10-usn10) ───────────────────────────────

test("social links section renders in closing section", () => {
  renderAbout();
  expect(document.querySelector(".about-social")).toBeInTheDocument();
});

test("closing section has 3 social links", () => {
  renderAbout();
  const socialSection = document.querySelector(".about-social");
  const links = socialSection.querySelectorAll("a");
  expect(links).toHaveLength(3);
});
