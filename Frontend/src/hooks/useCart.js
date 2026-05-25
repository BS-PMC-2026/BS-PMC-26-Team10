import { useState, useEffect, useCallback } from "react";

const CART_KEY = "chililand_cart";
const CART_EXPIRY_HOURS = 24;
const BASE_URL = import.meta.env.VITE_API_URL;

function getStoredCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const { items, timestamp } = JSON.parse(raw);
    const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursPassed > CART_EXPIRY_HOURS) {
      localStorage.removeItem(CART_KEY);
      return [];
    }
    return items || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(
    CART_KEY,
    JSON.stringify({ items, timestamp: Date.now() })
  );
}

export function useCart() {
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [stockErrors, setStockErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // persist to localStorage on every change
  useEffect(() => {
    saveCart(cartItems);
  }, [cartItems]);

  // ── ADD TO CART ──────────────────────────────────────────
  // checks live stock before adding so user can't add more than available
  const addToCart = useCallback(async (product) => {
    try {
      const isChilli = product._type === "chilli";
      // Chilli stock lives in the inventory table, not the chilli table.
      // inventoryId is passed from the catalogue's name-matched inventory item.
      const endpoint = (isChilli && product.inventoryId)
        ? `${BASE_URL}/inventory/${product.inventoryId}`
        : isChilli
        ? `${BASE_URL}/chillies/${product.id}`
        : `${BASE_URL}/inventory/${product.id}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Could not verify stock");
      const liveItem = await res.json();

      const rawQty = (isChilli && product.inventoryId)
        ? liveItem.quantity
        : isChilli
        ? liveItem.stock_quantity
        : liveItem.quantity;
      const availableQty = typeof rawQty === "number" && rawQty >= 0
        ? rawQty
        : product.stock_quantity;
      const isAvailable = (isChilli && product.inventoryId)
        ? availableQty > 0
        : isChilli
        ? liveItem.is_available
        : availableQty > 0;

      if (!isAvailable || availableQty === 0) {
        setStockErrors((prev) => ({
          ...prev,
          [product.id]: "Sorry, this item just sold out.",
        }));
        return { success: false, error: "out_of_stock" };
      }

      const existing = cartItems.find((i) => i.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;

      if (currentQtyInCart >= availableQty) {
        setStockErrors((prev) => ({
          ...prev,
          [product.id]: `Only ${availableQty} available.`,
        }));
        return { success: false, error: "max_quantity" };
      }

      setStockErrors((prev) => {
        const cleared = { ...prev };
        delete cleared[product.id];
        return cleared;
      });

      setCartItems((prev) => {
        const existingInCart = prev.find((i) => i.id === product.id);
        if (existingInCart) {
          return prev.map((i) =>
            i.id === product.id
              ? { ...i, quantity: i.quantity + 1, maxQuantity: availableQty }
              : i
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1,
            maxQuantity: availableQty,
            _type: product._type,
            inventoryId: product.inventoryId,
          },
        ];
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: "network_error" };
    }
  }, [cartItems]);

  // ── REMOVE FROM CART ─────────────────────────────────────
  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((i) => i.id !== productId));
    setStockErrors((prev) => {
      const cleared = { ...prev };
      delete cleared[productId];
      return cleared;
    });
  }, []);

  // ── UPDATE QUANTITY ───────────────────────────────────────
  const updateQuantity = useCallback(async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return { success: true };
    }

    try {
      const cartItem = cartItems.find((i) => i.id === productId);
      const isChilli = cartItem?._type === "chilli";
      const endpoint = (isChilli && cartItem?.inventoryId)
        ? `${BASE_URL}/inventory/${cartItem.inventoryId}`
        : isChilli
        ? `${BASE_URL}/chillies/${productId}`
        : `${BASE_URL}/inventory/${productId}`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error();
      const liveItem = await res.json();

      const rawQty = (isChilli && cartItem?.inventoryId)
        ? liveItem.quantity
        : isChilli
        ? liveItem.stock_quantity
        : liveItem.quantity;
      const availableQty = typeof rawQty === "number" && rawQty >= 0
        ? rawQty
        : cartItem?.maxQuantity;

      if (typeof availableQty === "number" && newQuantity > availableQty) {
        setStockErrors((prev) => ({
          ...prev,
          [productId]: `Only ${availableQty} available.`,
        }));
        setCartItems((prev) =>
          prev.map((i) =>
            i.id === productId
              ? { ...i, quantity: availableQty, maxQuantity: availableQty }
              : i
          )
        );
        return { success: false, error: "max_quantity" };
      }

      setStockErrors((prev) => {
        const cleared = { ...prev };
        delete cleared[productId];
        return cleared;
      });

      setCartItems((prev) =>
        prev.map((i) =>
          i.id === productId
            ? { ...i, quantity: newQuantity, maxQuantity: availableQty ?? i.maxQuantity }
            : i
        )
      );
      return { success: true };
    } catch {
      setStockErrors((prev) => ({
        ...prev,
        [productId]: "Could not verify stock. Try again.",
      }));
      return { success: false, error: "network_error" };
    }
  }, [cartItems, removeFromCart]);

  // ── CLEAR CART ───────────────────────────────────────────
  const clearCart = useCallback(() => {
    setCartItems([]);
    setStockErrors({});
    setPromoCode("");
    setDiscountAmount(0);
    setPromoMessage("");
    setPromoError("");
    localStorage.removeItem(CART_KEY);
  }, []);

  // ── PROMO CODE ───────────────────────────────────────────
  const applyPromoCode = useCallback(async (code, currentTotal) => {
    if (!code.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoMessage("");
    try {
      const res = await fetch(`${BASE_URL}/promo/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), order_amount: currentTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoCode(data.code);
        setDiscountAmount(data.discount_amount);
        setPromoMessage(data.message);
      } else {
        setPromoCode("");
        setDiscountAmount(0);
        setPromoError(data.message || "Invalid promo code.");
      }
    } catch {
      setPromoError("Could not validate promo code. Try again.");
    } finally {
      setPromoLoading(false);
    }
  }, []);

  const removePromoCode = useCallback(() => {
    setPromoCode("");
    setDiscountAmount(0);
    setPromoMessage("");
    setPromoError("");
  }, []);

  // ── VALIDATE ENTIRE CART ─────────────────────────────────
  // call this right before checkout — checks every item against live stock
  // handles the "two people buying last item simultaneously" case
  const validateCart = useCallback(async () => {
    setIsValidating(true);
    const errors = {};
    const updatedItems = [];
    let isValid = true;

    await Promise.all(
      cartItems.map(async (item) => {
        try {
          const isChilli = item._type === "chilli";
          const endpoint = isChilli
            ? `${BASE_URL}/chillies/${item.id}`
            : `${BASE_URL}/inventory/${item.id}`;

          const res = await fetch(endpoint);
          if (!res.ok) throw new Error();
          const liveItem = await res.json();
          const availableQty = isChilli ? liveItem.stock_quantity : liveItem.quantity;
          const isAvailable = isChilli ? liveItem.is_available : availableQty > 0;

          if (!isAvailable || availableQty === 0) {
            errors[item.id] = `"${item.name}" is now out of stock.`;
            isValid = false;
            updatedItems.push({ ...item, maxQuantity: 0, outOfStock: true });
          } else if (item.quantity > availableQty) {
            errors[item.id] =
              `Only ${availableQty} left of "${item.name}". Quantity adjusted.`;
            isValid = false;
            updatedItems.push({
              ...item,
              quantity: availableQty,
              maxQuantity: availableQty,
              outOfStock: false,
            });
          } else {
            updatedItems.push({
              ...item,
              maxQuantity: availableQty,
              outOfStock: false,
            });
          }
        } catch {
          errors[item.id] = `Could not verify "${item.name}". Check your connection.`;
          isValid = false;
          updatedItems.push(item);
        }
      })
    );

    setCartItems(updatedItems);
    setStockErrors(errors);
    setIsValidating(false);

    return { isValid, errors };
  }, [cartItems]);

  // ── DERIVED VALUES ────────────────────────────────────────
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, i) => sum + parseFloat(i.price) * i.quantity,
    0
  );
  const discountedTotal = Math.max(0, totalPrice - discountAmount);
  const isEmpty = cartItems.length === 0;

  return {
    cartItems,
    totalItems,
    totalPrice,
    discountedTotal,
    isEmpty,
    stockErrors,
    isValidating,
    promoCode,
    discountAmount,
    promoMessage,
    promoError,
    promoLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCart,
    applyPromoCode,
    removePromoCode,
  };
}