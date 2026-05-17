// src/hooks/useCart.test.js
import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, describe, test, expect } from "vitest";
import { useCart } from "../hooks/useCart";

const mockProduct = {
  id: 1,
  name: "Red Habanero",
  price: 25,
  quantity: 10,
  image_url: "http://127.0.0.1:8000/product_images/habanero.jpg",
};

const mockProductLowStock = {
  id: 2,
  name: "Ghost Pepper",
  price: 50,
  quantity: 1,
  image_url: "",
};

// mock fetch to return live stock
const mockFetch = (product) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => product,
  });
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ── TESTS ────────────────────────────────────────

test("cart starts empty", () => {
  const { result } = renderHook(() => useCart());
  expect(result.current.cartItems).toEqual([]);
  expect(result.current.isEmpty).toBe(true);
  expect(result.current.totalItems).toBe(0);
  expect(result.current.totalPrice).toBe(0);
});

test("addToCart adds a product", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  expect(result.current.cartItems).toHaveLength(1);
  expect(result.current.cartItems[0].name).toBe("Red Habanero");
  expect(result.current.totalItems).toBe(1);
});

test("addToCart increments quantity if product already in cart", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
    await result.current.addToCart(mockProduct);
  });

  expect(result.current.cartItems).toHaveLength(1);
  expect(result.current.cartItems[0].quantity).toBe(2);
  expect(result.current.totalItems).toBe(2);
});

test("addToCart returns out_of_stock error when quantity is 0", async () => {
  mockFetch({ ...mockProduct, quantity: 0 });
  const { result } = renderHook(() => useCart());

  let response;
  await act(async () => {
    response = await result.current.addToCart(mockProduct);
  });

  expect(response.success).toBe(false);
  expect(response.error).toBe("out_of_stock");
  expect(result.current.cartItems).toHaveLength(0);
});

test("addToCart won't exceed available stock", async () => {
  mockFetch(mockProductLowStock); // only 1 in stock
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProductLowStock);
    await result.current.addToCart(mockProductLowStock); // try to add second
  });

  expect(result.current.cartItems[0].quantity).toBe(1);
  expect(result.current.stockErrors[mockProductLowStock.id]).toBeTruthy();
});

test("removeFromCart removes a product", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  act(() => {
    result.current.removeFromCart(mockProduct.id);
  });

  expect(result.current.cartItems).toHaveLength(0);
  expect(result.current.isEmpty).toBe(true);
});

test("updateQuantity changes item quantity", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  await act(async () => {
    await result.current.updateQuantity(mockProduct.id, 5);
  });

  expect(result.current.cartItems[0].quantity).toBe(5);
});

test("updateQuantity to 0 removes the item", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  await act(async () => {
    await result.current.updateQuantity(mockProduct.id, 0);
  });

  expect(result.current.cartItems).toHaveLength(0);
});

test("clearCart empties everything", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  act(() => {
    result.current.clearCart();
  });

  expect(result.current.cartItems).toHaveLength(0);
  expect(result.current.isEmpty).toBe(true);
  
  // after clear, localStorage either has empty items or is null — both are fine
  const stored = localStorage.getItem("chililand_cart");
  if (stored) {
    expect(JSON.parse(stored).items).toHaveLength(0);
  } else {
    expect(stored).toBeNull();
  }
});

test("totalPrice calculates correctly", async () => {
  mockFetch(mockProduct); // price 25
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
    await result.current.addToCart(mockProduct);
  });

  expect(result.current.totalPrice).toBe(50); // 25 * 2
});

test("cart persists to localStorage", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  const stored = JSON.parse(localStorage.getItem("chililand_cart"));
  expect(stored.items).toHaveLength(1);
  expect(stored.items[0].name).toBe("Red Habanero");
  expect(stored.timestamp).toBeTruthy();
});

test("cart loads from localStorage on mount", async () => {
  // pre-populate localStorage
  localStorage.setItem(
    "chililand_cart",
    JSON.stringify({
      items: [{ ...mockProduct, quantity: 3, maxQuantity: 10 }],
      timestamp: Date.now(),
    })
  );

  const { result } = renderHook(() => useCart());

  expect(result.current.cartItems).toHaveLength(1);
  expect(result.current.cartItems[0].quantity).toBe(3);
});

test("expired cart is cleared on mount", async () => {
  // timestamp 25 hours ago
  const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000;
  localStorage.setItem(
    "chililand_cart",
    JSON.stringify({
      items: [{ ...mockProduct, quantity: 2, maxQuantity: 10 }],
      timestamp: expiredTimestamp,
    })
  );

  const { result } = renderHook(() => useCart());
  expect(result.current.cartItems).toHaveLength(0);
});

test("validateCart catches out of stock items", async () => {
  // first add succeeds with stock=10
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  // now stock drops to 0 before checkout
  mockFetch({ ...mockProduct, quantity: 0 });

  let validation;
  await act(async () => {
    validation = await result.current.validateCart();
  });

  expect(validation.isValid).toBe(false);
  expect(validation.errors[mockProduct.id]).toBeTruthy();
});

test("validateCart passes when stock is sufficient", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
  });

  let validation;
  await act(async () => {
    validation = await result.current.validateCart();
  });

  expect(validation.isValid).toBe(true);
  expect(Object.keys(validation.errors)).toHaveLength(0);
});

// ── PROMO CODE ────────────────────────────────────

test("applyPromoCode sets discount and message on valid code", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      valid: true,
      code: "SAVE10",
      discount_amount: 10.0,
      message: "10% discount applied!",
    }),
  });

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("SAVE10", 100);
  });

  expect(result.current.promoCode).toBe("SAVE10");
  expect(result.current.discountAmount).toBe(10.0);
  expect(result.current.promoMessage).toBe("10% discount applied!");
  expect(result.current.promoError).toBe("");
});

test("applyPromoCode sets error on invalid code", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: false, message: "This promo code has expired." }),
  });

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("OLD10", 100);
  });

  expect(result.current.promoCode).toBe("");
  expect(result.current.discountAmount).toBe(0);
  expect(result.current.promoError).toBe("This promo code has expired.");
});

test("applyPromoCode sets error on network failure", async () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("SAVE10", 100);
  });

  expect(result.current.promoError).toBeTruthy();
  expect(result.current.discountAmount).toBe(0);
});

test("removePromoCode clears discount state", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true, code: "SAVE10", discount_amount: 10, message: "10% off!" }),
  });

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("SAVE10", 100);
  });

  act(() => {
    result.current.removePromoCode();
  });

  expect(result.current.promoCode).toBe("");
  expect(result.current.discountAmount).toBe(0);
  expect(result.current.promoMessage).toBe("");
});

test("discountedTotal is totalPrice minus discountAmount", async () => {
  mockFetch(mockProduct); // price 25
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
    await result.current.addToCart(mockProduct); // totalPrice = 50
  });

  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true, code: "SAVE10", discount_amount: 10, message: "10% off!" }),
  });

  await act(async () => {
    await result.current.applyPromoCode("SAVE10", 50);
  });

  expect(result.current.totalPrice).toBe(50);
  expect(result.current.discountedTotal).toBe(40);
});

test("discountedTotal is never negative", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true, code: "BIG", discount_amount: 999, message: "Big discount!" }),
  });

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("BIG", 10);
  });

  expect(result.current.discountedTotal).toBe(0);
});

// ── UNIT: chilli-type stock validation ───────────────────────────────────────

const mockChilliItem = {
  id: 10,
  name: "Red Habanero",
  price: 25,
  image_url: "http://127.0.0.1:8000/chilli.jpg",
  _type: "chilli",
};

describe("chilli-type stock validation", () => {
  test("addToCart with _type:'chilli' calls /chillies/{id} not /inventory/{id}", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 15, is_available: true }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart(mockChilliItem);
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/chillies/10"));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/inventory/10"));
  });

  test("addToCart with _type:'chilli' uses stock_quantity and succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 15, is_available: true }),
    });

    const { result } = renderHook(() => useCart());

    let response;
    await act(async () => {
      response = await result.current.addToCart(mockChilliItem);
    });

    expect(response.success).toBe(true);
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].maxQuantity).toBe(15);
  });

  test("addToCart with _type:'chilli' returns out_of_stock when is_available is false", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 0, is_available: false }),
    });

    const { result } = renderHook(() => useCart());

    let response;
    await act(async () => {
      response = await result.current.addToCart(mockChilliItem);
    });

    expect(response.success).toBe(false);
    expect(response.error).toBe("out_of_stock");
    expect(result.current.cartItems).toHaveLength(0);
  });

  test("addToCart stores _type:'chilli' in the cart item", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 15, is_available: true }),
    });

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart(mockChilliItem);
    });

    expect(result.current.cartItems[0]._type).toBe("chilli");
  });

  test("addToCart with _type:'chilli' respects stock cap via stock_quantity", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 1, is_available: true }),
    });

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart(mockChilliItem);
      await result.current.addToCart(mockChilliItem);
    });

    expect(result.current.cartItems[0].quantity).toBe(1);
    expect(result.current.stockErrors[mockChilliItem.id]).toBeTruthy();
  });

  test("validateCart with chilli item calls /chillies/{id}", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 15, is_available: true }),
    });

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart(mockChilliItem);
    });

    const validateFetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 15, is_available: true }),
    });
    global.fetch = validateFetchMock;

    await act(async () => {
      await result.current.validateCart();
    });

    expect(validateFetchMock).toHaveBeenCalledWith(expect.stringContaining("/chillies/10"));
  });

  test("validateCart flags chilli item as out-of-stock when stock_quantity drops to 0", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 5, is_available: true }),
    });

    const { result } = renderHook(() => useCart());

    await act(async () => {
      await result.current.addToCart(mockChilliItem);
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 10, stock_quantity: 0, is_available: false }),
    });

    let validation;
    await act(async () => {
      validation = await result.current.validateCart();
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors[mockChilliItem.id]).toBeTruthy();
  });
});

test("clearCart also resets promo state", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ valid: true, code: "SAVE10", discount_amount: 10, message: "10% off!" }),
  });

  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.applyPromoCode("SAVE10", 100);
  });

  act(() => {
    result.current.clearCart();
  });

  expect(result.current.promoCode).toBe("");
  expect(result.current.discountAmount).toBe(0);
  expect(result.current.promoMessage).toBe("");
});