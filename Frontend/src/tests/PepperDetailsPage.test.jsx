import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Routes fetch responses by URL pattern
function makeFetch({ withInventoryMatch = false } = {}) {
  return vi.fn((url) => {
    if (/\/chillies\/\d+/.test(url)) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
    }
    if (url.includes("/inventory")) {
      const inv = withInventoryMatch ? [mockInventoryItem] : [];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(inv) });
    }
    // /chillies (all peppers)
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

  // ── existing tests ─────────────────────────────────────────────────────────

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

  // ── spec grid ──────────────────────────────────────────────────────────────

  test("renders all six spec labels", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    // Some labels (Heat Level, Color, Season) also appear as filter labels,
    // so use getAllByText and assert at least one match exists.
    for (const label of ["Origin", "Heat Level", "Color", "Season", "Size", "Best Use"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  test("shows pepper origin, color, and season values", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    // "Mexico" is unique; "Orange" and "Summer" also appear as filter options
    expect(screen.getByText("Mexico")).toBeInTheDocument();
    expect(screen.getAllByText("Orange").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Summer").length).toBeGreaterThan(0);
  });

  test("shows formatted SHU heat range in spec grid", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    // Appears in both the image badge and the Heat Level spec card
    expect(screen.getAllByText("100,000 - 350,000 SHU").length).toBeGreaterThan(0);
  });

  test("derives Best Use from SHU range", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    // shu_max 350,000 → "Spice Blends, Extreme Heat"
    expect(screen.getByText("Spice Blends, Extreme Heat")).toBeInTheDocument();
  });

  // ── price ──────────────────────────────────────────────────────────────────

  test("shows price when inventory has a matching product", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: true }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByText("₪12.99")).toBeInTheDocument();
    expect(screen.getByText("/ pack")).toBeInTheDocument();
  });

  test("hides price when no inventory match exists", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: false }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.queryByText(/₪/)).not.toBeInTheDocument();
  });

  // ── cart button ────────────────────────────────────────────────────────────

  test("shows Add to Cart button when inventory match exists", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: true }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("button", { name: /Add to Cart/i })).toBeInTheDocument();
  });

  test("shows View in Shop button when no inventory match", async () => {
    vi.stubGlobal("fetch", makeFetch({ withInventoryMatch: false }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("button", { name: /View in Shop/i })).toBeInTheDocument();
  });

  // ── filter section ─────────────────────────────────────────────────────────

  test("renders Filter Similar Peppers heading", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("heading", { name: /Filter Similar Peppers/i })).toBeInTheDocument();
  });

  test("renders Color, Heat Level, and Season filter labels", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    expect(screen.getByLabelText("Heat Level")).toBeInTheDocument();
    expect(screen.getByLabelText("Season")).toBeInTheDocument();
  });

  test("renders Apply Filters button", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("button", { name: /Apply Filters/i })).toBeInTheDocument();
  });

  test("populates Color filter options from catalogue data", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    const colorSelect = screen.getByLabelText("Color");
    // mockPepper has color "Orange" — should appear as an option
    expect(colorSelect.querySelector('option[value="Orange"]')).not.toBeNull();
  });

  // ── info cards ─────────────────────────────────────────────────────────────

  test("renders Culinary Uses section with bullet points", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("heading", { name: "Culinary Uses" })).toBeInTheDocument();
    expect(screen.getByText(/Perfect for stir-fries/i)).toBeInTheDocument();
    expect(screen.getByText(/Can be used fresh or dried/i)).toBeInTheDocument();
  });

  test("renders Growing Tips section with bullet points", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.getByRole("heading", { name: "Growing Tips" })).toBeInTheDocument();
    expect(screen.getByText(/Requires full sun/i)).toBeInTheDocument();
    expect(screen.getByText(/Regular watering/i)).toBeInTheDocument();
  });

  // ── filter results ────────────────────────────────────────────────────────

  test("results are not shown before Apply Filters is clicked", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    expect(screen.queryByText(/pepper(s)? found/i)).not.toBeInTheDocument();
  });

  test("clicking Apply Filters with no selection shows all other peppers", async () => {
    const secondPepper = { ...mockPepper, id: 2, name: "Ghost Pepper", origin: "India" };
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (/\/chillies\/\d+/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
      if (url.includes("/inventory")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper, secondPepper]) });
    }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));
    // current pepper excluded; secondPepper should appear
    expect(screen.getByText("1 pepper found")).toBeInTheDocument();
    expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
  });

  test("clicking Apply Filters excludes the current pepper from results", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));
    // allPeppers only has the current pepper; after excluding it, results = 0
    expect(screen.getByText("No peppers match your filters.")).toBeInTheDocument();
  });

  test("Apply Filters filters by color", async () => {
    const redPepper   = { ...mockPepper, id: 2, name: "Red One",  color: "Red"    };
    const greenPepper = { ...mockPepper, id: 3, name: "Green One", color: "Green" };
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (/\/chillies\/\d+/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
      if (url.includes("/inventory")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper, redPepper, greenPepper]) });
    }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));

    await userEvent.selectOptions(screen.getByLabelText("Color"), "Red");
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));

    expect(screen.getByText("Red One")).toBeInTheDocument();
    expect(screen.queryByText("Green One")).not.toBeInTheDocument();
  });

  test("Apply Filters filters by season", async () => {
    const summerPepper = { ...mockPepper, id: 2, name: "Summer Pepper", season: "Summer" };
    const winterPepper = { ...mockPepper, id: 3, name: "Winter Pepper", season: "Winter" };
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (/\/chillies\/\d+/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
      if (url.includes("/inventory")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper, summerPepper, winterPepper]) });
    }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));

    await userEvent.selectOptions(screen.getByLabelText("Season"), "Winter");
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));

    expect(screen.getByText("Winter Pepper")).toBeInTheDocument();
    expect(screen.queryByText("Summer Pepper")).not.toBeInTheDocument();
  });

  test("Apply Filters filters by heat level band", async () => {
    const mildPepper = { ...mockPepper, id: 2, name: "Mild One",  shu_min: 100,    shu_max: 500    };
    const hotPepper  = { ...mockPepper, id: 3, name: "Hot One",   shu_min: 50000,  shu_max: 80000  };
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (/\/chillies\/\d+/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
      if (url.includes("/inventory")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper, mildPepper, hotPepper]) });
    }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));

    await userEvent.selectOptions(screen.getByLabelText("Heat Level"), "Mild (0 – 1,000 SHU)");
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));

    expect(screen.getByText("Mild One")).toBeInTheDocument();
    expect(screen.queryByText("Hot One")).not.toBeInTheDocument();
  });

  test("result cards link to the correct pepper detail page", async () => {
    const secondPepper = { ...mockPepper, id: 7, name: "Serrano", origin: "Mexico" };
    vi.stubGlobal("fetch", vi.fn((url) => {
      if (/\/chillies\/\d+/.test(url)) return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPepper) });
      if (url.includes("/inventory")) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve([mockPepper, secondPepper]) });
    }));
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    await userEvent.click(screen.getByRole("button", { name: /Apply Filters/i }));

    const link = screen.getByRole("link", { name: /Serrano/i });
    expect(link).toHaveAttribute("href", "/pepper/7");
  });

  // ── navigation ─────────────────────────────────────────────────────────────

  test("renders Back to catalogue link pointing to /", async () => {
    vi.stubGlobal("fetch", makeFetch());
    renderPage();
    await waitFor(() => screen.getByRole("heading", { name: "Habanero" }));
    const link = screen.getByRole("link", { name: /Back to catalogue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
