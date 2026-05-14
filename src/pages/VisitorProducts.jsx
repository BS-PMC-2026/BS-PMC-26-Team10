import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/VisitorProducts.css";
import { useCart } from "../hooks/useCart";
import VisitorCart from "../components/VisitorCart/VisitorCart";
import ownerImg from "../assets/owner.png";

const HEAT_LABELS = ["Mild", "Medium", "Hot", "Fierce", "Inferno"];
const HEAT_COLORS = ["#e8a838", "#e07b30", "#cc4d1f", "#b52a10", "#7a0a0a"];

function getHeatLevel(price) {
  if (price < 10) return 0;
  if (price < 20) return 1;
  if (price < 35) return 2;
  if (price < 55) return 3;
  return 4;
}

function HeatMeter({ level }) {
  return (
    <div className="vp-heat" aria-label={`Heat level: ${HEAT_LABELS[level]}`}>
      <div className="vp-heat-flames">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="vp-heat-flame"
            style={{ opacity: i <= level ? 1 : 0.18, color: HEAT_COLORS[level] }}
          >
            🌶
          </span>
        ))}
      </div>
      <span className="vp-heat-label" style={{ color: HEAT_COLORS[level] }}>
        {HEAT_LABELS[level]}
      </span>
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart }) {
  const heat = getHeatLevel(product.price);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAdd = async () => {
    setAdding(true);
    const result = await onAddToCart(product);
    setFeedback(result.success ? "Added to cart!" : result.error === "out_of_stock" ? "Sold out!" : "Try again");
    setAdding(false);
    setTimeout(() => setFeedback(""), 2500);
  };

  return (
    <div className="vp-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vp-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="vp-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="vp-modal-body">
          <div className="vp-modal-img-side">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="vp-modal-img" />
            ) : (
              <div className="vp-modal-img-placeholder">🌶</div>
            )}
            <div className="vp-modal-img-overlay" />
            <div className="vp-modal-img-badge">
              {product.quantity > 0 ? (
                <span className="vp-badge in-stock">In Stock</span>
              ) : (
                <span className="vp-badge out-stock">Out of Stock</span>
              )}
            </div>
          </div>

          <div className="vp-modal-info">
            <HeatMeter level={heat} />

            <h2 className="vp-modal-name">{product.name}</h2>

            <p className="vp-modal-desc">
              {product.description || "A ChiliLand original — crafted with love from our farm to your table."}
            </p>

            <div className="vp-modal-meta">
              <div className="vp-modal-meta-row">
                <span className="vp-modal-meta-icon">📦</span>
                <span className="vp-modal-meta-label">Available</span>
                <span className="vp-modal-meta-value">
                  {product.quantity > 0 ? `${product.quantity} units` : "Out of stock"}
                </span>
              </div>
              {product.restock_date && product.quantity === 0 && (
                <div className="vp-modal-meta-row">
                  <span className="vp-modal-meta-icon">🗓</span>
                  <span className="vp-modal-meta-label">Restock</span>
                  <span className="vp-modal-meta-value">{product.restock_date}</span>
                </div>
              )}
              {product.last_updated && (
                <div className="vp-modal-meta-row">
                  <span className="vp-modal-meta-icon">🕐</span>
                  <span className="vp-modal-meta-label">Last updated</span>
                  <span className="vp-modal-meta-value">{product.last_updated}</span>
                </div>
              )}
            </div>

            <div className="vp-modal-footer">
              <div className="vp-modal-price-block">
                <span className="vp-modal-price-label">Price</span>
                <span className="vp-modal-price">₪{parseFloat(product.price).toFixed(2)}</span>
              </div>
              <button
                className={`vp-modal-btn${feedback === "Added to cart!" ? " vp-modal-btn--added" : ""}`}
                disabled={product.quantity === 0 || adding}
                onClick={handleAdd}
              >
                {adding ? "Adding…" : feedback || (product.quantity > 0 ? "🛒 Add to Cart" : "Sold Out")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ item, index, onAddToCart, onViewDetails }) {
  const heat = getHeatLevel(item.price);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showIngredients, setShowIngredients] = useState(false);

  const hasIngredients = !!(item.ingredients || item.ingredients_image_url);

  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    setFeedback("");
    const result = await onAddToCart(item);
    if (result.success) {
      setFeedback("Added!");
    } else if (result.error === "out_of_stock") {
      setFeedback("Sold out!");
    } else {
      setFeedback("Try again");
    }
    setAdding(false);
    setTimeout(() => setFeedback(""), 2000);
  };

  return (
    <article className="vp-card" style={{ animationDelay: `${index * 0.07}s` }}>
      <button className="vp-card-img-wrap" onClick={() => onViewDetails(item)} aria-label={`View details for ${item.name}`}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="vp-card-img" loading="lazy" />
        ) : (
          <div className="vp-card-img-placeholder"><span>🌶</span></div>
        )}
        <div className="vp-card-img-fade" />
        <div className="vp-card-badge">
          {item.quantity > 0 ? (
            <span className="vp-badge in-stock">In Stock</span>
          ) : (
            <span className="vp-badge out-stock">Out of Stock</span>
          )}
        </div>
        <div className="vp-card-img-hover-hint">View details</div>
      </button>

      <div className="vp-card-body">
        <HeatMeter level={heat} />
        <h2 className="vp-card-name">{item.name}</h2>
        <p className="vp-card-desc">{item.description || "A ChiliLand original."}</p>

        {hasIngredients && (
          <div className="vp-ingredients-wrap">
            <button
              className="vp-ingredients-toggle"
              onClick={() => setShowIngredients((prev) => !prev)}
            >
              {showIngredients ? "Hide ingredients ▲" : "View ingredients ▼"}
            </button>
            {showIngredients && (
              <div className="vp-ingredients-body">
                {item.ingredients_image_url ? (
                  <img
                    src={item.ingredients_image_url}
                    alt={`${item.name} ingredients`}
                    className="vp-ingredients-img"
                  />
                ) : (
                  <p className="vp-ingredients-text">{item.ingredients}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="vp-card-divider" />
        <div className="vp-card-footer">
          <span className="vp-card-price">₪{parseFloat(item.price).toFixed(2)}</span>
          <div className="vp-card-actions">
            <button className="vp-card-details-btn" onClick={() => onViewDetails(item)}>
              Details
            </button>
            <button
              className={`vp-card-btn${feedback === "Added!" ? " vp-card-btn--added" : ""}`}
              disabled={item.quantity === 0 || adding}
              onClick={handleAdd}
            >
              {adding ? "…" : feedback ? feedback : item.quantity > 0 ? "Add" : "Sold Out"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const CATEGORIES = ["All", "Sauce", "Powder", "Fresh", "Pickled"];

export default function VisitorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const cart = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/inventory");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setError("Could not load products. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        p.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, sortBy, activeCategory]);

  return (
    <div className="vp-root">
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={cart.addToCart}
        />
      )}

      <VisitorCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />

      <section className="vp-hero">
        <Link to="/" className="vp-back-btn">&#8592; Back to home</Link>
        <div className="vp-hero-watermark">🌶</div>
        <div className="vp-hero-text">
          <p className="vp-hero-kicker">Straight from the field</p>
          <h1 className="vp-hero-title">Our <span>Products</span></h1>
          <p className="vp-hero-sub">
            Every jar, bag, and bottle is born on our farm — fiery, honest, and packed with flavour.
          </p>
          <div className="vp-hero-stats">
            <div className="vp-hero-stat">
              <span className="vp-hero-stat-number">12+</span>
              <span className="vp-hero-stat-label">Varieties</span>
            </div>
            <div className="vp-hero-stat">
              <span className="vp-hero-stat-number">100%</span>
              <span className="vp-hero-stat-label">Farm Fresh</span>
            </div>
            <div className="vp-hero-stat">
              <span className="vp-hero-stat-number">🔥</span>
              <span className="vp-hero-stat-label">All heat levels</span>
            </div>
          </div>
        </div>
        <div className="vp-hero-owner">
          <img src={ownerImg} alt="ChiliLand owner" />
        </div>
      </section>

      <div className="vp-toolbar">
        <div className="vp-search-wrap">
          <span className="vp-search-icon">🔍</span>
          <input
            className="vp-search"
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="vp-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`vp-cat-btn${activeCategory === cat ? " active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <select
          className="vp-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort: A–Z</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
        </select>

        <button className="vp-cart-trigger" onClick={() => setIsCartOpen(true)}>
          🛒
          {cart.totalItems > 0 && (
            <span className="vp-cart-badge">{cart.totalItems}</span>
          )}
        </button>
      </div>

      {!loading && !error && (
        <p className="vp-results-count">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
          {activeCategory !== "All" && ` in "${activeCategory}"`}
        </p>
      )}

      {loading && (
        <div className="vp-state">
          <div className="vp-spinner" />
          <p>Harvesting products…</p>
        </div>
      )}
      {!loading && error && (
        <div className="vp-state vp-state-error">
          <span>🌶</span>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="vp-state">
          <span className="vp-empty-icon">🫙</span>
          <p>No products found — try a different search or category.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <section className="vp-grid">
          {filtered.map((item, i) => (
            <ProductCard
              key={item.id}
              item={item}
              index={i}
              onAddToCart={cart.addToCart}
              onViewDetails={setSelectedProduct}
            />
          ))}
        </section>
      )}

      <div className="vp-footer-strip">
        <p>
          Questions?{" "}
          <Link to="/tours" className="vp-footer-link">
            Book a farm tour
          </Link>{" "}
          and meet us in person.
        </p>
      </div>
    </div>
  );
}
