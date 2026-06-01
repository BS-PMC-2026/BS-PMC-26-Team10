// src/hooks/useCart.test.js
import { renderHook, act } from "@testing-library/react";
import { vi, beforeEach, test, expect } from "vitest";
import { useCart } from "../hooks/useCart";

const mockProduct = {
  id: 1,
  name: "Red Habanero",
  price: 25,
  quantity: 10,
  image_url: "http://127.0.0.1:8000/product_images/habanero.jpg",
};

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
});

test("totalPrice calculates correctly", async () => {
  mockFetch(mockProduct);
  const { result } = renderHook(() => useCart());

  await act(async () => {
    await result.current.addToCart(mockProduct);
    await result.current.addToCart(mockProduct);
  });

  expect(result.current.totalPrice).toBe(50);
});
