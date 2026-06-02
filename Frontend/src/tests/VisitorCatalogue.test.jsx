import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, afterEach, test, expect } from "vitest";
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

test("clicking the Cart button opens the cart drawer", async () => {
  renderComponent();
  await waitFor(() => screen.getByText("Red Habanero"));

  fireEvent.click(screen.getByText("Cart"));
  expect(screen.getByTestId("cart-drawer")).toBeInTheDocument();
});
