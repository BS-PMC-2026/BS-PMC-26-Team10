import { useEffect, useState } from "react";
import { ShoppingCart, ShoppingBag, Flame, X, AlertTriangle, Tag } from "lucide-react";
import "./VisitorCart.css";
import CheckoutModel from "../CheckoutModel/CheckoutModel";

export default function VisitorCart({ isOpen, onClose, cart }) {
  const {
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
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCart,
    applyPromoCode,
    removePromoCode,
  } = cart;

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCheckout = async () => {
    const { isValid } = await validateCart();
    if (!isValid) return;
    setIsCheckoutOpen(true);
  };

  return (
    <>
      {/* backdrop */}
      <div
        className={`vc-backdrop${isOpen ? " vc-backdrop--open" : ""}`}
        onClick={onClose}
      />

      {/* drawer */}
      <aside className={`vc-drawer${isOpen ? " vc-drawer--open" : ""}`}>

        {/* header */}
        <div className="vc-header">
          <div className="vc-header-left">
            <ShoppingCart size={22} className="vc-header-icon" />
            <div>
              <h2 className="vc-header-title">Your Cart</h2>
              <p className="vc-header-count">
                {totalItems === 0
                  ? "No items yet"
                  : `${totalItems} item${totalItems > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button className="vc-close-btn" onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="vc-body">
          {isEmpty ? (
            <div className="vc-empty">
              <ShoppingBag size={48} className="vc-empty-icon" />
              <p className="vc-empty-title">Your cart is empty</p>
              <p className="vc-empty-sub">
                Add some fiery products and come back!
              </p>
              <button className="vc-empty-btn" onClick={onClose}>
                Browse Products
              </button>
            </div>
          ) : (
            <ul className="vc-item-list">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className={`vc-item${item.outOfStock ? " vc-item--error" : ""}`}
                >
                  <div className="vc-item-img-wrap">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="vc-item-img"
                      />
                    ) : (
                      <div className="vc-item-img-placeholder"><Flame size={24} /></div>
                    )}
                  </div>

                  <div className="vc-item-details">
                    <div className="vc-item-top">
                      <p className="vc-item-name">{item.name}</p>
                      <button
                        className="vc-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <p className="vc-item-price">
                      ₪{parseFloat(item.price).toFixed(2)}
                      {item.quantity > 1 && (
                        <span className="vc-item-price-each"> each</span>
                      )}
                    </p>

                    {stockErrors[item.id] && (
                      <p className="vc-item-error">{stockErrors[item.id]}</p>
                    )}

                    <div className="vc-item-footer">
                      <div className="vc-qty">
                        <button
                          className="vc-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={isValidating}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="vc-qty-value">{item.quantity}</span>
                        <button
                          className="vc-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={
                            isValidating ||
                            item.outOfStock ||
                            item.quantity >= item.maxQuantity
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <p className="vc-item-subtotal">
                        ₪{(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        {!isEmpty && (
          <div className="vc-footer">
            {Object.keys(stockErrors).length > 0 && (
              <div className="vc-footer-errors">
                <p><AlertTriangle size={14} style={{display:"inline",marginRight:4}} /> Some items have stock issues — please review above.</p>
              </div>
            )}

            {/* promo code section */}
            {promoCode ? (
              <div className="vc-promo-applied">
                <span className="vc-promo-applied-text">
                  <Tag size={14} style={{display:"inline",marginRight:4}} /><strong>{promoCode}</strong> — {promoMessage}
                </span>
                <button className="vc-promo-remove" onClick={removePromoCode} aria-label="Remove promo">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="vc-promo-row">
                <input
                  className="vc-promo-input"
                  placeholder="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyPromoCode(promoInput, totalPrice)}
                />
                <button
                  className="vc-promo-btn"
                  onClick={() => applyPromoCode(promoInput, totalPrice)}
                  disabled={promoLoading || !promoInput.trim()}
                >
                  {promoLoading ? <span className="vc-btn-spinner" /> : "Apply"}
                </button>
              </div>
            )}
            {promoError && <p className="vc-promo-error">{promoError}</p>}

            <div className="vc-totals">
              <div className="vc-totals-row">
                <span>Subtotal</span>
                <span>₪{totalPrice.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="vc-totals-row vc-totals-row--discount">
                  <span>Discount</span>
                  <span className="vc-discount-value">−₪{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="vc-totals-row vc-totals-row--shipping">
                <span>Shipping</span>
                <span className="vc-shipping-note">calculated at checkout</span>
              </div>
              <div className="vc-totals-row vc-totals-row--total">
                <span>Total</span>
                <span>₪{discountedTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="vc-checkout-btn"
              onClick={handleCheckout}
              disabled={isValidating}
            >
              {isValidating ? (
                <span className="vc-btn-spinner" />
              ) : (
                "Proceed to Checkout →"
              )}
            </button>

            <button className="vc-clear-btn" onClick={clearCart}>
              Clear cart
            </button>
          </div>
        )}
      </aside>

      {/* checkout model */}
      <CheckoutModel
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          setTimeout(() => onClose(), 2500); // let success screen show first
        }}
      />
    </>
  );
}