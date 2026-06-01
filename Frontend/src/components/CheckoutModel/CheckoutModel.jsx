// src/components/CheckoutModel/CheckoutModel.jsx
import { useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Flame, AlertTriangle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./CheckoutModel.css";

export default function CheckoutModel({ isOpen, onClose, cart, onSuccess }) {
  const { t } = useTranslation();

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
    if (!form.customer_name.trim()) return t("checkout.errorName");
    if (!form.customer_email.trim()) return t("checkout.errorEmail");
    if (!form.customer_phone.trim()) return t("checkout.errorPhone");
    if (!form.shipping_address.trim()) return t("checkout.errorAddress");
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
          description: t("checkout.merchant"),
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
          <h2 className="cm-success-title">{t("checkout.successTitle")}</h2>
          <p className="cm-success-sub">
            {t("checkout.successDesc", { id: orderSuccess, email: form.customer_email })}
          </p>
          <button className="cm-success-btn" onClick={() => { onClose(); setOrderSuccess(null); }}>
            {t("checkout.backProducts")}
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
            <h2 className="cm-title">{t("checkout.title")}</h2>
            <p className="cm-subtitle">{t("checkout.subtitle")}</p>
          </div>
          <button className="cm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* order summary */}
        <div className="cm-summary">
          <p className="cm-summary-label">{t("checkout.orderSummary")}</p>
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
              <span>{t("checkout.discount", { code: promoCode, amount: discountAmount.toFixed(2) })}</span>
              <span>−₪{discountAmount.toFixed(2)}</span>
            </li>
          )}
          <div className="cm-summary-total">
            <span>{t("checkout.total", { total: discountedTotal.toFixed(2) })}</span>
            <span>₪{discountedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* customer form */}
        <div className="cm-form">
          <div className="cm-field">
            <label className="cm-label">{t("checkout.fullName")}</label>
            <input
              className="cm-input"
              name="customer_name"
              placeholder={t("checkout.namePlaceholder")}
              value={form.customer_name}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">{t("checkout.email")}</label>
            <input
              className="cm-input"
              name="customer_email"
              type="email"
              placeholder={t("checkout.emailPlaceholder")}
              value={form.customer_email}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">{t("checkout.phone")}</label>
            <input
              className="cm-input"
              name="customer_phone"
              placeholder={t("checkout.phonePlaceholder")}
              value={form.customer_phone}
              onChange={handleChange}
            />
          </div>
          <div className="cm-field">
            <label className="cm-label">{t("checkout.address")}</label>
            <input
              className="cm-input"
              name="shipping_address"
              placeholder={t("checkout.addressPlaceholder")}
              value={form.shipping_address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* error */}
        {formError && <p className="cm-error"><AlertTriangle size={14} style={{display:"inline",marginRight:4}} />{formError}</p>}

        {/* paypal button */}
        <div className="cm-paypal-wrap">
          <p className="cm-paypal-label">{t("checkout.paypalLabel")}</p>
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
