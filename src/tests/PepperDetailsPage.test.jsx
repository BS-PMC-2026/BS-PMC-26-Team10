import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PepperDetailsPage from "../pages/PepperDetailsPage";

const mockPepper = {
  id: 1,
  name: "Habanero",
  description: "A hot pepper",
  full_description: "The Habanero is one of the hottest chilli peppers in the world.",
  image_url: "https://example.com/habanero.jpg",
  shu_min: 100000,
  shu_max: 350000,
  origin: "Mexico",
  color: "Orange",
  is_available: true,
  stock_quantity: 10,
  season: "Summer",
};

function renderPage(id = "1") {
  return render(
    <MemoryRouter initialEntries={[`/pepper/${id}`]}>
      <Routes>
        <Route path="/pepper/:id" element={<PepperDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PepperDetailsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("shows loading state before data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    renderPage();
    expect(screen.getByText("Loading pepper details...")).toBeInTheDocument();
  });

  test("fetches pepper by ID from the dedicated endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) })
    ));
    renderPage("1");
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:8000/chillies/1"));
  });

  test("displays pepper name after loading", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) })
    ));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Habanero" })).toBeInTheDocument()
    );
  });

  test("displays full description when set", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) })
    ));
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText("The Habanero is one of the hottest chilli peppers in the world.")
      ).toBeInTheDocument()
    );
  });

  test("shows fallback text when full_description is empty", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...mockPepper, full_description: "" }),
      })
    ));
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText(/curated from reliable reference sources/i)
      ).toBeInTheDocument()
    );
  });

  test("shows fallback text when full_description is null", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...mockPepper, full_description: null }),
      })
    ));
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText(/curated from reliable reference sources/i)
      ).toBeInTheDocument()
    );
  });

  test("shows error state when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false })
    ));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Pepper not found.")).toBeInTheDocument()
    );
  });

  test("shows error state when network throws", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Pepper not found.")).toBeInTheDocument()
    );
  });
});
