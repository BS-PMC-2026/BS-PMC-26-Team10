// Tests for AboutPage component (BSPMT10-1-usn1)
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AboutPage from "../pages/AboutPage";

function renderAbout() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>
  );
}

describe("AboutPage — hero section", () => {
  test("renders the main hero heading", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: /more than a farm/i })
    ).toBeInTheDocument();
  });

  test("renders the farm kicker label", () => {
    renderAbout();
    expect(screen.getByText(/Hadiners · House of Spicy/i)).toBeInTheDocument();
  });

  test("renders the intro paragraph", () => {
    renderAbout();
    expect(screen.getByText(/150 varieties of hot peppers/i)).toBeInTheDocument();
  });

  test("Back to Home link points to /", () => {
    renderAbout();
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  test("Book a Tour hero link points to /tours", () => {
    renderAbout();
    const links = screen.getAllByRole("link", { name: /book a tour/i });
    expect(links[0]).toHaveAttribute("href", "/tours");
  });

  test("Read Our Story button is present", () => {
    renderAbout();
    expect(
      screen.getByRole("button", { name: /read our story/i })
    ).toBeInTheDocument();
  });
});

describe("AboutPage — smooth scroll", () => {
  let mockScrollIntoView;

  beforeEach(() => {
    mockScrollIntoView = vi.fn();
    vi.spyOn(document, "getElementById").mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("clicking Read Our Story calls scrollIntoView with smooth behaviour", async () => {
    renderAbout();
    await userEvent.click(screen.getByRole("button", { name: /read our story/i }));
    expect(document.getElementById).toHaveBeenCalledWith("our-story");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});

describe("AboutPage — Our Story section", () => {
  test("renders the Our Story section heading", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: /from grief to growing/i })
    ).toBeInTheDocument();
  });

  test("renders the story about Kfir", () => {
    renderAbout();
    expect(screen.getByText(/Kfir/)).toBeInTheDocument();
  });

  test("renders the closing story highlight", () => {
    renderAbout();
    expect(screen.getByText(/built by hand/i)).toBeInTheDocument();
  });

  test("renders the pull quote", () => {
    renderAbout();
    expect(screen.getByText(/What started as a way to heal/i)).toBeInTheDocument();
  });

  test("renders the 3 farm stats", () => {
    renderAbout();
    expect(screen.getByText("150+")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("AboutPage — What We Offer section", () => {
  test("renders the section heading", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: /a full day of spicy discovery/i })
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
});

describe("AboutPage — Why Visit Us section", () => {
  test("renders the Why Visit section heading", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: /a place unlike any other/i })
    ).toBeInTheDocument();
  });

  test("renders all 5 reasons", () => {
    renderAbout();
    expect(screen.getByText(/one-of-a-kind destination/i)).toBeInTheDocument();
    expect(screen.getByText(/real farm, real people/i)).toBeInTheDocument();
    expect(screen.getByText(/sensory and hands-on/i)).toBeInTheDocument();
    expect(screen.getByText(/learn something/i)).toBeInTheDocument();
    expect(screen.getByText(/supporting a family-run farm/i)).toBeInTheDocument();
  });
});

describe("AboutPage — closing CTA section", () => {
  test("renders the closing heading", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: /you're welcome here/i })
    ).toBeInTheDocument();
  });

  test("closing CTA link points to /tours", () => {
    renderAbout();
    const link = screen.getByRole("link", { name: /view tours & book your visit/i });
    expect(link).toHaveAttribute("href", "/tours");
  });
});
