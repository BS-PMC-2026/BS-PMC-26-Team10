// src/pages/VisitorProducts.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import VisitorProducts from "./VisitorProducts";

// mock useCart hook
vi.mock("../hooks/useCart", () => ({
  useCart: () => ({
    cartItems: [],
    totalItems: 0,
    totalPrice: 0,
    isEmpty: true,
    stockErrors: {},
    isValidating: false,
    addToCart: vi.fn().mockResolvedValue({ success: true }),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    validateCart: vi.fn().mockResolvedValue({ isValid: true, errors: {} }),
  }),
}));

// mock VisitorCart so it doesn't interfere
vi.mock("../components/VisitorCart/VisitorCart", () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="cart-drawer">Cart</div> : null,
}));

// mock owner image
vi.mock("../assets/owner.png", () => ({ default: "owner.png" }));

const mockProducts = [
  {
    id: 1,
    name: "Red Habanero",
    description: "Very hot chili",
    price: 25,
    quantity: 10,
    image_url: "http://127.0.0.1:8000/product_images/habanero.jpg",
  },
  {
    id: 2,
    name: "Mild Jalapeño",
    description: "Mild chili",
    price: 8,
    quantity: 0,
    image_url: "http://127.0.0.1:8000/product_images/jalapeno.jpg",
  },
  {
    id: 3,
    name: "Ghost Pepper",
    description: "Extremely hot",
    price: 50,
    quantity: 5,
    image_url: "",
  },
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <VisitorProducts />
    </MemoryRouter>
  );

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockProducts,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── TESTS ────────────────────────────────────────

test("shows loading spinner initially", () => {
  renderPage();
  expect(screen.getByText(/harvesting products/i)).toBeInTheDocument();
});

test("renders product cards after fetch", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText("Red Habanero")).toBeInTheDocument();
    expect(screen.getByText("Mild Jalapeño")).toBeInTheDocument();
    expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
  });
});

test("shows results count after fetch", async () => {
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/3 products found/i)).toBeInTheDocument();
  });
});

test("shows error message when fetch fails", async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/could not load products/i)).toBeInTheDocument();
  });
});

test("out of stock product shows Sold Out button", async () => {
  renderPage();
  await waitFor(() => {
    const soldOutBtns = screen.getAllByText("Sold Out");
    expect(soldOutBtns.length).toBeGreaterThan(0);
  });
});

test("in stock product shows Add to Cart button", async () => {
  renderPage();
  await waitFor(() => {
    const addBtns = screen.getAllByText("Add to Cart");
    expect(addBtns.length).toBeGreaterThan(0);
  });
});

test("search filters products by name", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.change(screen.getByPlaceholderText(/search products/i), {
    target: { value: "ghost" },
  });

  expect(screen.getByText("Ghost Pepper")).toBeInTheDocument();
  expect(screen.queryByText("Red Habanero")).not.toBeInTheDocument();
  expect(screen.queryByText("Mild Jalapeño")).not.toBeInTheDocument();
});

test("search with no match shows empty state", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.change(screen.getByPlaceholderText(/search products/i), {
    target: { value: "zzznomatch" },
  });

  expect(screen.getByText(/no products found/i)).toBeInTheDocument();
});

test("sort by price ascending works", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: "price-asc" },
  });

  const cards = screen.getAllByRole("article");
  expect(cards[0]).toHaveTextContent("Mild Jalapeño"); // ₪8 cheapest
});

test("cart drawer opens when cart button clicked", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getByText("🛒"));
  expect(screen.getByTestId("cart-drawer")).toBeInTheDocument();
});

test("placeholder shown when product has no image", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Ghost Pepper"));
  // Ghost Pepper has empty image_url so placeholder renders
  const placeholders = document.querySelectorAll(".vp-card-img-placeholder");
  expect(placeholders.length).toBeGreaterThan(0);
});