// Tests for WelcomeStrip swiper (BSPMT10-9-usn9)
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WelcomeStrip from "../components/WelcomeStrip/WelcomeStrip";

function renderStrip() {
  return render(
    <MemoryRouter>
      <WelcomeStrip />
    </MemoryRouter>
  );
}

test("renders 7 image slides", () => {
  renderStrip();
  expect(document.querySelectorAll(".swiper-slide")).toHaveLength(7);
});

test("first slide is active on mount", () => {
  renderStrip();
  const slides = document.querySelectorAll(".swiper-slide");
  expect(slides[0]).toHaveClass("swiper-slide--active");
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
});
