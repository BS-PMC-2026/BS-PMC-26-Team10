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

const mockInventoryItem = {
  id: 10,
  name: "Habanero",
  price: 12.99,
  quantity: 5,
  image_url: "https://example.com/habanero-product.jpg",
};

function makeFetch({ withInventoryMatch = false } = {}) {
  return vi.fn((url) => {
    if (/\/chillies\/\d+/.test(url)) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
    }
    if (url.includes("/inventory")) {
      const inv = withInventoryMatch ? [mockInventoryItem] : [];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(inv) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper]) });
  });
}

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
    vi.clearAllMocks();
  });

  test("shows loading state before data arrives", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    renderPage();
    expect(screen.getByText("Loading pepper details...")).toBeInTheDocument();
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

  test("shows error state when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false })
    ));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Pepper not found.")).toBeInTheDocument()
    );
  });

  test("shows price when inventory has a matching product", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: true }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByText("₪12.99")).toBeInTheDocument();
    expect(screen.getByText("/ pack")).toBeInTheDocument();
  });

  test("shows Add to Cart button when inventory match exists", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: true }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("button", { name: /Add to Cart/i })).toBeInTheDocument();
  });
});
