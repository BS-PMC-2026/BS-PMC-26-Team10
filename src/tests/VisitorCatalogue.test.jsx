import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach, test, expect, describe } from "vitest";
import VisitorCatalogue from "../components/VisitorCatalogue/VisitorCatalogue";

const mockAddToCart = vi.fn();

vi.mock("../hooks/useCart", () => ({
  useCart: () => ({
    cartItems: [],
    totalItems: 0,
    totalPrice: 0,
    isEmpty: true,
    stockErrors: {},
    isValidating: false,
    addToCart: mockAddToCart,
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    validateCart: vi.fn().mockResolvedValue({ isValid: true, errors: {} }),
    promoCode: "",
    discountAmount: 0,
    promoMessage: "",
    promoError: "",
    promoLoading: false,
    discountedTotal: 0,
    applyPromoCode: vi.fn(),
    removePromoCode: vi.fn(),
  }),
}));

vi.mock("../components/VisitorCart/VisitorCart", () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="cart-drawer">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const mockChillies = [
  {
    id: 1,
    name: "Red Habanero",
    description: "Fruity and fiery",
    origin: "Mexico",
    color: "Red",
    season: "Summer",
    shu_min: 100000,
    shu_max: 350000,
    is_available: true,
    stock_quantity: 20,
    image_url: "http://localhost/habanero.jpg",
    price: 20,
  },
  {
    id: 2,
    name: "Mild Jalapeño",
    description: "Classic mild pepper",
    origin: "Mexico",
    color: "Green",
    season: "Autumn",
    shu_min: 2500,
    shu_max: 8000,
    is_available: true,
    stock_quantity: 50,
    image_url: "http://localhost/jalapeno.jpg",
    price: 12,
  },
  {
    id: 3,
    name: "Ghost Pepper",
    description: "Extremely spicy",
    origin: "India",
    color: "Orange",
    season: "Spring",
    shu_min: 855000,
    shu_max: 1041427,
    is_available: false,
    stock_quantity: 0,
    image_url: "http://localhost/ghost.jpg",
    price: null,
  },
];

const renderComponent = () =>
  render(
    <MemoryRouter>
      <VisitorCatalogue />
    </MemoryRouter>
  );

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockChillies,
  });
  mockAddToCart.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── UNIT: rendering ──────────────────────────────────────────────────────────

describe("rendering", () => {
  test("shows loading state initially", () => {
    renderComponent();
    expect(screen.getByText(/loading peppers/i)).toBeInTheDocument();
  });

  test("renders chilli cards after fetch", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Red Habanero")).toBeInTheDocument();
      expect(screen.getByText("Mild Jalapeño")).toBeInTheDocument();
      expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
    });
  });

  test("shows 'Showing all peppers.' status after load", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/showing all peppers/i)).toBeInTheDocument();
    });
  });

  test("shows error state when fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/could not load the catalogue/i)).toBeInTheDocument();
    });
  });

  test("renders origin and color pills for each chilli", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText("Green")).toBeInTheDocument();
    });
  });

  test("renders season pills when present", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("Summer")).toBeInTheDocument();
      expect(screen.getByText("Autumn")).toBeInTheDocument();
    });
  });
});

// ── UNIT: price display ───────────────────────────────────────────────────────

describe("price display", () => {
  test("shows price with shekel symbol and /pack for chillies with a price", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("₪20.00")).toBeInTheDocument();
      expect(screen.getByText("₪12.00")).toBeInTheDocument();
    });
  });

  test("shows /pack unit label next to price", async () => {
    renderComponent();
    await waitFor(() => {
      const units = screen.getAllByText("/pack");
      expect(units.length).toBe(2); // only for chillies that have a price
    });
  });

  test("does not render price block when chilli.price is null", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Ghost Pepper"));
    // Ghost Pepper has price: null — only 2 price blocks should exist
    const prices = document.querySelectorAll(".visitor-chilli-price");
    expect(prices.length).toBe(2);
  });
});

// ── UNIT: filters ─────────────────────────────────────────────────────────────

describe("filters", () => {
  test("search filters chillies by name", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.change(screen.getByPlaceholderText(/search peppers/i), {
      target: { value: "ghost" },
    });

    expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
    expect(screen.queryByText("Red Habanero")).not.toBeInTheDocument();
    expect(screen.queryByText("Mild Jalapeño")).not.toBeInTheDocument();
  });

  test("search filters by origin", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.change(screen.getByPlaceholderText(/search peppers/i), {
      target: { value: "india" },
    });

    expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
    expect(screen.queryByText("Red Habanero")).not.toBeInTheDocument();
  });

  test("empty search result shows 'No peppers found' state", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.change(screen.getByPlaceholderText(/search peppers/i), {
      target: { value: "zzznomatch" },
    });

    expect(screen.getByText(/no peppers found/i)).toBeInTheDocument();
  });

  test("clear filters button resets search input", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const searchInput = screen.getByPlaceholderText(/search peppers/i);
    fireEvent.change(searchInput, { target: { value: "ghost" } });
    expect(searchInput.value).toBe("ghost");

    fireEvent.click(screen.getByText(/clear filters/i));
    expect(searchInput.value).toBe("");
  });

  test("shows filtered count in status when filter is active", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.change(screen.getByPlaceholderText(/search peppers/i), {
      target: { value: "habanero" },
    });

    expect(screen.getByText(/showing 1 pepper\./i)).toBeInTheDocument();
  });
});

// ── UNIT: compare feature ─────────────────────────────────────────────────────

describe("compare feature", () => {
  test("compare button is disabled when no items are selected", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const compareBtn = screen.getByText(/compare peppers/i);
    expect(compareBtn).toBeDisabled();
  });

  test("clicking 'Add to compare' selects a card", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const toggleBtns = screen.getAllByText(/add to compare/i);
    fireEvent.click(toggleBtns[0]);

    expect(screen.getByText(/selected for compare/i)).toBeInTheDocument();
  });

  test("compare button becomes enabled after selecting a chilli", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/add to compare/i)[0]);
    const compareBtn = screen.getByText(/compare peppers/i).closest("button");
    expect(compareBtn).not.toBeDisabled();
  });

  test("compare drawer opens when compare button is clicked", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/add to compare/i)[0]);
    fireEvent.click(screen.getByText(/compare peppers/i).closest("button"));

    expect(screen.getByRole("complementary", { name: /pepper comparison/i })).toBeInTheDocument();
  });
});

// ── INTEGRATION: add to cart ──────────────────────────────────────────────────

describe("add to cart", () => {
  test("renders '+ Add to Cart' button for each available chilli", async () => {
    renderComponent();
    await waitFor(() => {
      const addBtns = screen.getAllByText(/\+ add to cart/i);
      expect(addBtns.length).toBe(2); // Ghost Pepper is unavailable
    });
  });

  test("unavailable chilli shows disabled 'Unavailable' button", async () => {
    renderComponent();
    await waitFor(() => {
      const unavailableBtn = screen.getByText(/unavailable/i);
      expect(unavailableBtn).toBeDisabled();
    });
  });

  test("clicking '+ Add to Cart' calls addToCart with the chilli", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const addBtns = screen.getAllByText(/\+ add to cart/i);
    fireEvent.click(addBtns[0]);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: "Red Habanero" })
      );
    });
  });

  test("shows 'Added!' feedback after successful add", async () => {
    mockAddToCart.mockResolvedValue({ success: true });
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/\+ add to cart/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("Added!")).toBeInTheDocument();
    });
  });

  test("shows 'Sold out!' feedback when item is out of stock", async () => {
    mockAddToCart.mockResolvedValue({ success: false, error: "out_of_stock" });
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/\+ add to cart/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("Sold out!")).toBeInTheDocument();
    });
  });

  test("passes _type:'chilli' to addToCart so stock checks hit the right endpoint", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/\+ add to cart/i)[0]);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ _type: "chilli" })
      );
    });
  });

  test("shows 'Try again' feedback on network error", async () => {
    mockAddToCart.mockResolvedValue({ success: false, error: "network_error" });
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/\+ add to cart/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });

  test("two cards can have independent feedback states", async () => {
    mockAddToCart
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: "out_of_stock" });

    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const addBtns = screen.getAllByText(/\+ add to cart/i);
    fireEvent.click(addBtns[0]);
    fireEvent.click(addBtns[1]);

    await waitFor(() => {
      expect(screen.getByText("Added!")).toBeInTheDocument();
      expect(screen.getByText("Sold out!")).toBeInTheDocument();
    });
  });
});

  test("shows 'Max in cart' feedback when cart is already at stock limit", async () => {
    mockAddToCart.mockResolvedValue({ success: false, error: "max_quantity" });
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getAllByText(/\+ add to cart/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("Max in cart")).toBeInTheDocument();
    });
  });

  test("passes inventoryId from name-matched inventory item to addToCart", async () => {
    const mockInventory = [
      { id: 201, name: "Red Habanero", price: 20, quantity: 5 },
      { id: 202, name: "Mild Jalapeño", price: 12, quantity: 10 },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes("/inventory")) {
        return Promise.resolve({ ok: true, json: async () => mockInventory });
      }
      return Promise.resolve({ ok: true, json: async () => mockChillies });
    });

    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    const addBtns = screen.getAllByText(/\+ add to cart/i);
    fireEvent.click(addBtns[0]);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith(
        expect.objectContaining({ inventoryId: 201 })
      );
    });
  });

  test("price shown on card comes from inventory, not chilli object", async () => {
    const mockInventory = [
      { id: 201, name: "Red Habanero", price: 99, quantity: 5 },
    ];

    global.fetch = vi.fn((url) => {
      if (url.includes("/inventory")) {
        return Promise.resolve({ ok: true, json: async () => mockInventory });
      }
      return Promise.resolve({ ok: true, json: async () => mockChillies });
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText("₪99.00")).toBeInTheDocument();
    });
  });

// ── INTEGRATION: cart drawer ──────────────────────────────────────────────────

describe("cart drawer", () => {
  test("cart button is visible in the topbar", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));
    expect(screen.getByText("Cart")).toBeInTheDocument();
  });

  test("cart drawer is not shown initially", () => {
    renderComponent();
    expect(screen.queryByTestId("cart-drawer")).not.toBeInTheDocument();
  });

  test("clicking the Cart button opens the cart drawer", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getByText("Cart"));
    expect(screen.getByTestId("cart-drawer")).toBeInTheDocument();
  });

  test("cart drawer can be closed", async () => {
    renderComponent();
    await waitFor(() => screen.getByText("Red Habanero"));

    fireEvent.click(screen.getByText("Cart"));
    expect(screen.getByTestId("cart-drawer")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("cart-drawer")).not.toBeInTheDocument();
  });
});
