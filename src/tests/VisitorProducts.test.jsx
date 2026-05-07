// src/pages/VisitorProducts.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach, test, expect } from "vitest";
import VisitorProducts from "../pages/VisitorProducts";

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

test("in stock product shows Add button on card", async () => {
  renderPage();
  await waitFor(() => {
    const addBtns = screen.getAllByText("Add");
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

// ── PRODUCT MODAL TESTS ───────────────────────────────────────────────────

test("clicking Details button opens the product modal", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  const detailsBtns = screen.getAllByText("Details");
  fireEvent.click(detailsBtns[0]);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("modal displays the product name", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getByLabelText("View details for Red Habanero"));

  expect(screen.getByRole("dialog")).toHaveTextContent("Red Habanero");
});

test("modal displays the product description", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getByLabelText("View details for Red Habanero"));

  expect(screen.getByRole("dialog")).toHaveTextContent("Very hot chili");
});

test("modal displays the product price", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getByLabelText("View details for Red Habanero"));

  expect(screen.getByRole("dialog")).toHaveTextContent("₪25.00");
});

test("clicking the X button closes the modal", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getAllByText("Details")[0]);
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Close"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("pressing Escape closes the modal", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getAllByText("Details")[0]);
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  fireEvent.keyDown(window, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clicking the backdrop closes the modal", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getAllByText("Details")[0]);
  const backdrop = document.querySelector(".vp-modal-backdrop");
  fireEvent.click(backdrop);

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("clicking the product image opens the modal", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  const imgBtn = screen.getByLabelText("View details for Red Habanero");
  fireEvent.click(imgBtn);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("modal shows Add to Cart button for in-stock product", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getAllByText("Details")[0]);

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Add to Cart");
});

test("modal shows Sold Out button for out-of-stock product", async () => {
  renderPage();
  await waitFor(() => screen.getByText("Mild Jalapeño"));

  const detailsBtns = screen.getAllByText("Details");
  fireEvent.click(detailsBtns[1]);

  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Sold Out");
});

// ── CATEGORY FILTER TESTS ─────────────────────────────────────────────────

const categoryProducts = [
  { id: 10, name: "Habanero Sauce", description: "Hot sauce", price: 20, quantity: 5, image_url: "" },
  { id: 11, name: "Ghost Powder", description: "Ghost pepper powder", price: 15, quantity: 3, image_url: "" },
  { id: 12, name: "Fresh Jalapeño", description: "Farm fresh", price: 8, quantity: 10, image_url: "" },
  { id: 13, name: "Pickled Chili", description: "Pickled variety", price: 12, quantity: 7, image_url: "" },
];

const renderWithCategoryProducts = () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => categoryProducts,
  });
  return render(<MemoryRouter><VisitorProducts /></MemoryRouter>);
};

test("category filter Sauce shows only sauce products", async () => {
  renderWithCategoryProducts();
  await waitFor(() => screen.getByText("Habanero Sauce"));

  fireEvent.click(screen.getByText("Sauce"));

  expect(screen.getByText("Habanero Sauce")).toBeInTheDocument();
  expect(screen.queryByText("Ghost Powder")).not.toBeInTheDocument();
});

test("category filter Powder shows only powder products", async () => {
  renderWithCategoryProducts();
  await waitFor(() => screen.getByText("Ghost Powder"));

  fireEvent.click(screen.getByText("Powder"));

  expect(screen.getByText("Ghost Powder")).toBeInTheDocument();
  expect(screen.queryByText("Habanero Sauce")).not.toBeInTheDocument();
});

test("category filter Pickled shows only pickled products", async () => {
  renderWithCategoryProducts();
  await waitFor(() => screen.getByText("Pickled Chili"));

  fireEvent.click(screen.getByText("Pickled"));

  expect(screen.getByText("Pickled Chili")).toBeInTheDocument();
  expect(screen.queryByText("Habanero Sauce")).not.toBeInTheDocument();
});

test("clicking All after category filter shows all products", async () => {
  renderWithCategoryProducts();
  await waitFor(() => screen.getByText("Habanero Sauce"));

  fireEvent.click(screen.getByText("Sauce"));
  expect(screen.queryByText("Ghost Powder")).not.toBeInTheDocument();

  fireEvent.click(screen.getByText("All"));
  expect(screen.getByText("Ghost Powder")).toBeInTheDocument();
  expect(screen.getByText("Habanero Sauce")).toBeInTheDocument();
});

test("results count shows active category name when filtered", async () => {
  renderWithCategoryProducts();
  await waitFor(() => screen.getByText("Habanero Sauce"));

  fireEvent.click(screen.getByText("Sauce"));

  expect(screen.getByText(/in "Sauce"/i)).toBeInTheDocument();
});