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

function ProductCard({ item, index, onAddToCart }) {
  const heat = getHeatLevel(item.price);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleAdd = async () => {
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
    <article
      className="vp-card"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="vp-card-img-wrap">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="vp-card-img"
            loading="lazy"
          />
        ) : (
          <div className="vp-card-img-placeholder">
            <span>🌶</span>
          </div>
        )}
        <div className="vp-card-img-fade" />
        <div className="vp-card-badge">
          {item.quantity > 0 ? (
            <span className="vp-badge in-stock">In Stock</span>
          ) : (
            <span className="vp-badge out-stock">Out of Stock</span>
          )}
        </div>
      </div>

      <div className="vp-card-body">
        <HeatMeter level={heat} />
        <h2 className="vp-card-name">{item.name}</h2>
        <p className="vp-card-desc">{item.description || "A ChiliLand original."}</p>
        <div className="vp-card-divider" />
        <div className="vp-card-footer">
          <span className="vp-card-price">
            ₪{parseFloat(item.price).toFixed(2)}
          </span>
          <button
            className={`vp-card-btn${feedback === "Added!" ? " vp-card-btn--added" : ""}`}
            disabled={item.quantity === 0 || adding}
            onClick={handleAdd}
          >
            {adding ? "..." : feedback ? feedback : item.quantity > 0 ? "Add to Cart" : "Sold Out"}
          </button>
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

  const cart = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/inventory");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Could not load products. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sortBy === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, search, sortBy]);

  return (
    <div className="vp-root">

      {/* cart drawer */}
      <VisitorCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
      />

      {/* hero */}
      <section className="vp-hero">
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

      {/* sticky toolbar */}
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
          <option value="price-asc">Sort: Price ↑</option>
          <option value="price-desc">Sort: Price ↓</option>
        </select>

        {/* cart trigger */}
        <button
          className="vp-cart-trigger"
          onClick={() => setIsCartOpen(true)}
        >
          🛒
          {cart.totalItems > 0 && (
            <span className="vp-cart-badge">{cart.totalItems}</span>
          )}
        </button>
      </div>

      {/* results count */}
      {!loading && !error && (
        <p className="vp-results-count">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* states */}
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
          <p>No products found — try a different search.</p>
        </div>
      )}

      {/* grid */}
      {!loading && !error && filtered.length > 0 && (
        <section className="vp-grid">
          {filtered.map((item, i) => (
            <ProductCard
              key={item.id}
              item={item}
              index={i}
              onAddToCart={cart.addToCart}
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