// Tests for WelcomeStrip swiper (BSPMT10-9-usn9)
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import WelcomeStrip from "../components/WelcomeStrip/WelcomeStrip";

function renderStrip() {
  return render(
    <MemoryRouter>
      <WelcomeStrip />
    </MemoryRouter>
  );
}

describe("WelcomeStrip — swiper structure", () => {
  test("renders 7 image slides", () => {
    renderStrip();
    expect(document.querySelectorAll(".swiper-slide")).toHaveLength(7);
  });

  test("first slide is active on mount", () => {
    renderStrip();
    const slides = document.querySelectorAll(".swiper-slide");
    expect(slides[0]).toHaveClass("swiper-slide--active");
  });

  test("only one slide is active at a time on mount", () => {
    renderStrip();
    expect(document.querySelectorAll(".swiper-slide--active")).toHaveLength(1);
  });

  test("renders 7 navigation dots", () => {
    renderStrip();
    expect(document.querySelectorAll(".swiper-dot")).toHaveLength(7);
  });

  test("first dot is active on mount", () => {
    renderStrip();
    const dots = document.querySelectorAll(".swiper-dot");
    expect(dots[0]).toHaveClass("swiper-dot--active");
  });

  test("each slide has an accessible alt attribute", () => {
    renderStrip();
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveAttribute("alt");
      expect(img.getAttribute("alt").length).toBeGreaterThan(0);
    });
  });
});

describe("WelcomeStrip — dot navigation", () => {
  test("clicking the third dot makes the third slide active", async () => {
    renderStrip();
    const dots = document.querySelectorAll(".swiper-dot");
    await userEvent.click(dots[2]);
    const slides = document.querySelectorAll(".swiper-slide");
    expect(slides[2]).toHaveClass("swiper-slide--active");
    expect(slides[0]).not.toHaveClass("swiper-slide--active");
  });

  test("clicking a dot marks only that dot as active", async () => {
    renderStrip();
    const dots = document.querySelectorAll(".swiper-dot");
    await userEvent.click(dots[4]);
    expect(dots[4]).toHaveClass("swiper-dot--active");
    expect(dots[0]).not.toHaveClass("swiper-dot--active");
  });

  test("clicking the last dot activates the last slide", async () => {
    renderStrip();
    const dots = document.querySelectorAll(".swiper-dot");
    const slides = document.querySelectorAll(".swiper-slide");
    await userEvent.click(dots[6]);
    expect(slides[6]).toHaveClass("swiper-slide--active");
  });
});

describe("WelcomeStrip — auto-advance", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("advances to the second slide after 3500 ms", () => {
    renderStrip();
    act(() => { vi.advanceTimersByTime(3500); });
    const slides = document.querySelectorAll(".swiper-slide");
    expect(slides[1]).toHaveClass("swiper-slide--active");
    expect(slides[0]).not.toHaveClass("swiper-slide--active");
  });

  test("wraps back to the first slide after all 7 intervals", () => {
    renderStrip();
    act(() => { vi.advanceTimersByTime(3500 * 7); });
    const slides = document.querySelectorAll(".swiper-slide");
    expect(slides[0]).toHaveClass("swiper-slide--active");
  });

  test("active dot follows the auto-advance", () => {
    renderStrip();
    act(() => { vi.advanceTimersByTime(3500 * 2); });
    const dots = document.querySelectorAll(".swiper-dot");
    expect(dots[2]).toHaveClass("swiper-dot--active");
    expect(dots[0]).not.toHaveClass("swiper-dot--active");
  });
});

describe("WelcomeStrip — CTA buttons", () => {
  test("renders the heading", () => {
    renderStrip();
    expect(
      screen.getByRole("heading", { name: /more than a farm visit/i })
    ).toBeInTheDocument();
  });

  test("View Tours link points to /tours", () => {
    renderStrip();
    expect(
      screen.getByRole("link", { name: /view tours/i })
    ).toHaveAttribute("href", "/tours");
  });

  test("About the Farm link points to /about", () => {
    renderStrip();
    expect(
      screen.getByRole("link", { name: /about the farm/i })
    ).toHaveAttribute("href", "/about");
  });

  test("Farm Location link points to /farm-location", () => {
    renderStrip();
    expect(
      screen.getByRole("link", { name: /farm location/i })
    ).toHaveAttribute("href", "/farm-location");
  });
});
