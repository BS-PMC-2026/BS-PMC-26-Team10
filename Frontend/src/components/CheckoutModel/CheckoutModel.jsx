// src/components/CheckoutModel/CheckoutModel.jsx
import { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Flame, AlertTriangle, X } from "lucide-react";
import "./CheckoutModel.css";

export default function CheckoutModel({ isOpen, onClose, cart, onSuccess }) {
  const { cartItems, discountedTotal, discountAmount, promoCode, clearCart } = cart;

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
  });
  const [formError, setFormError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const validateForm = () => {
    if (!form.customer_name.trim()) return "Please enter your name.";
    if (!form.customer_email.trim()) return "Please enter your email.";
    if (!form.customer_phone.trim()) return "Please enter your phone number.";
    if (!form.shipping_address.trim()) return "Please enter your shipping address.";
    return "";
  };

  // called by PayPal to create the order on PayPal's side
  const createPayPalOrder = (data, actions) => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return Promise.reject(new Error(error));
    }
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: discountedTotal.toFixed(2),
            currency_code: "ILS",
          },
          description: "ChiliLand Farm Products",
        },
      ],
    });
  };

  // called by PayPal after successful payment
const onApprove = async (data, actions) => {
  const paypalOrder = await actions.order.capture();

  const orderPayload = {
    customer_name: form.customer_name,
    customer_email: form.customer_email,
    customer_phone: form.customer_phone,
    shipping_address: form.shipping_address,
    status: "confirmed",
    payment_method: "paypal",
    payment_status: "paid",
    delivery_status: "pending",
    paypal_order_id: paypalOrder.id,
    promo_code: promoCode || null,
    items: cartItems.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    })),
  };

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.detail || "Order failed");
    }

    // show success screen FIRST
    clearCart();
    setOrderSuccess(result.order_id);
    
    // THEN notify parent after a delay so user sees the thank you
    setTimeout(() => {
      onSuccess?.(result.order_id);
    }, 3000);

  } catch (err) {
    console.error("Order save error:", err);
    setFormError(`Payment succeeded but order failed: ${err.message}. Please contact us.`);
  }
};

  const onError = (err) => {
    setFormError("PayPal encountered an error. Please try again.");
    console.error("PayPal error:", err);
  };

  // success screen
  if (orderSuccess) {
    return (
      <div className="cm-overlay">
        <div className="cm-modal cm-modal--success">
          <div className="cm-success-icon"><Flame size={40} /></div>
          <h2 className="cm-success-title">Order Confirmed!</h2>
          <p className="cm-success-sub">
            Thank you! Your order <strong>#{orderSuccess}</strong> is on its way.
            We'll be in touch at <strong>{form.customer_email}</strong>.
          </p>
          <button className="cm-success-btn" onClick={() => { onClose(); setOrderSuccess(null); }}>
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="cm-header">
          <div>
            <h2 className="cm-title">Checkout</h2>
            <p className="cm-subtitle">Almost there — fill in your details</p>
          </div>
          <button className="cm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* order summary */}
        <div className="cm-summary">
          <p className="cm-summary-label">Order Summary</p>
          <ul className="cm-summary-list">
            {cartItems.map((item) => (
              <li key={item.id} className="cm-summary-item">
                <span>{item.name} × {item.quantity}</span>
                <span>₪{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {discountAmount > 0 && (
            <li className="cm-summary-item cm-summary-item--discount">
              <span>Discount ({promoCode})</span>
              <span>−₪{discountAmount.toFixed(2)}</span>
            </li>
          )}
          <div className="cm-summary-total">
            <span>Total</span>
            <span>₪{discountedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* customer form */}
        <div className="cm-form">
          <div className="cm-field">
            <label className="cm-label">Full Name</label>
            <input
              className="cm-input"
              name="customer_name"
              placeholder="John Smith"
              value={form.customer_name}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">Email</label>
            <input
              className="cm-input"
              name="customer_email"
              type="email"
              placeholder="john@email.com"
              value={form.customer_email}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">Phone</label>
            <input
              className="cm-input"
              name="customer_phone"
              placeholder="+972 50 000 0000"
              value={form.customer_phone}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">Shipping Address</label>
            <input
              className="cm-input"
              name="shipping_address"
              placeholder="123 Main St, Tel Aviv"
              value={form.shipping_address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* error */}
        {formError && <p className="cm-error"><AlertTriangle size={14} style={{display:"inline",marginRight:4}} />{formError}</p>}

        {/* paypal button */}
        <div className="cm-paypal-wrap">
          <p className="cm-paypal-label">Pay securely with PayPal</p>
          <PayPalButtons
            style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
            createOrder={createPayPalOrder}
            onApprove={onApprove}
            onError={onError}
          />
        </div>

      </div>
    </div>
  );
}