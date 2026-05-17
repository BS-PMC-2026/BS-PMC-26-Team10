import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import "../styles/pepperDetailsPage.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const FALLBACK_DESCRIPTION =
  "This content is curated from reliable reference sources to provide a richer and more informative overview of each pepper variety.";

function formatHeatRange(pepper) {
  if (pepper.shu_min && pepper.shu_max) {
    return `${Number(pepper.shu_min).toLocaleString()} - ${Number(pepper.shu_max).toLocaleString()} SHU`;
  }
  return "Unknown";
}

function deriveBestUse(pepper) {
  const max = Number(pepper.shu_max) || 0;
  if (max <= 1000) return "Fresh, Salads";
  if (max <= 10000) return "Cooking, Fresh";
  if (max <= 50000) return "Cooking, Sauces";
  if (max <= 150000) return "Hot Sauces, Pickling";
  return "Spice Blends, Extreme Heat";
}

function PepperDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pepper, setPepper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [allPeppers, setAllPeppers] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [colorFilter, setColorFilter] = useState("");
  const [heatFilter, setHeatFilter] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartFeedback, setCartFeedback] = useState("");
  const [filteredPeppers, setFilteredPeppers] = useState([]);
  const [hasFiltered, setHasFiltered] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setIsError(false);
      try {
        const [pepperRes, allRes, inventoryRes] = await Promise.all([
          fetch(`${API_BASE_URL}/chillies/${id}`),
          fetch(`${API_BASE_URL}/chillies`),
          fetch(`${API_BASE_URL}/inventory`),
        ]);
        if (!pepperRes.ok) throw new Error("Pepper not found");
        const pepperData = await pepperRes.json();
        const allData = allRes.ok ? await allRes.json() : [];
        const invData = inventoryRes.ok ? await inventoryRes.json() : [];
        setPepper(pepperData);
        setAllPeppers(Array.isArray(allData) ? allData : []);
        setInventory(Array.isArray(invData) ? invData : []);
      } catch (err) {
        console.error(err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="pdp-page">
        <div className="pdp-state-card">Loading pepper details...</div>
      </div>
    );
  }

  if (isError || !pepper) {
    return (
      <div className="pdp-page">
        <div className="pdp-state-card">Pepper not found.</div>
      </div>
    );
  }

  const description = pepper.full_description || FALLBACK_DESCRIPTION;

  const matchedProduct = inventory.find(
    (p) => p.name?.toLowerCase().trim() === pepper.name?.toLowerCase().trim()
  );

  const uniqueColors = [...new Set(allPeppers.map((p) => p.color).filter(Boolean))].sort();
  const uniqueSeasons = [...new Set(allPeppers.map((p) => p.season).filter(Boolean))].sort();

  const heatOptions = [
    { label: "Mild (0 – 1,000 SHU)", min: 0, max: 1000 },
    { label: "Medium (1,000 – 25,000 SHU)", min: 1000, max: 25000 },
    { label: "Hot (25,000 – 100,000 SHU)", min: 25000, max: 100000 },
    { label: "Very Hot (100,000+ SHU)", min: 100000, max: 9999999 },
  ];

  async function handleAddToCart() {
    if (!matchedProduct) {
      navigate("/products");
      return;
    }
    setIsAddingToCart(true);
    const result = await addToCart(matchedProduct);
    setIsAddingToCart(false);
    if (result?.error === "out_of_stock") {
      setCartFeedback("Out of stock!");
    } else {
      setCartFeedback("Added to cart!");
    }
    setTimeout(() => setCartFeedback(""), 2500);
  }

  function handleApplyFilters() {
    const selectedHeat = heatOptions.find((o) => o.label === heatFilter);

    const results = allPeppers.filter((p) => {
      if (p.id === pepper.id) return false;

      if (colorFilter && p.color?.toLowerCase() !== colorFilter.toLowerCase()) return false;

      if (selectedHeat) {
        const pMin = Number(p.shu_min) || 0;
        const pMax = Number(p.shu_max) || 0;
        // pepper's SHU range must overlap with the selected band
        if (pMax < selectedHeat.min || pMin > selectedHeat.max) return false;
      }

      if (seasonFilter && p.season?.toLowerCase() !== seasonFilter.toLowerCase()) return false;

      return true;
    });

    setFilteredPeppers(results);
    setHasFiltered(true);
  }

  const specs = [
    { label: "Origin",     value: pepper.origin  || "Unknown"    },
    { label: "Heat Level", value: formatHeatRange(pepper)        },
    { label: "Color",      value: pepper.color   || "Unknown"    },
    { label: "Season",     value: pepper.season  || "Year-round" },
    { label: "Size",       value: "Varies by variety"            },
    { label: "Best Use",   value: deriveBestUse(pepper)          },
  ];

  const priceDisplay = matchedProduct
    ? `₪${parseFloat(matchedProduct.price).toFixed(2)}`
    : null;

  return (
    <div className="pdp-page">
      <div className="pdp-card">

        {/* ── Top nav ── */}
        <div className="pdp-topnav">
          <Link to="/" className="pdp-back-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="#364153" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to catalogue
          </Link>
          <button className="pdp-close-btn" onClick={() => navigate(-1)} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#6A7282" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Main content ── */}
        <div className="pdp-content">

          {/* ── Hero ── */}
          <div className="pdp-hero">

            {/* Left: image */}
            <div className="pdp-image-col">
              <div className="pdp-image-wrap">
                <img src={pepper.image_url} alt={pepper.name} className="pdp-image" />
                <span className="pdp-shu-badge">{formatHeatRange(pepper)}</span>
              </div>
            </div>

            {/* Right: details */}
            <div className="pdp-detail-col">
              <span className="pdp-spotlight-label">Pepper Spotlight</span>
              <h1 className="pdp-title">{pepper.name}</h1>
              <p className="pdp-description">{description}</p>

              <div className="pdp-specs-grid">
                {specs.map(({ label, value }) => (
                  <div key={label} className="pdp-spec-card">
                    <span className="pdp-spec-label">{label}</span>
                    <span className="pdp-spec-value">{value}</span>
                  </div>
                ))}
              </div>

              {priceDisplay && (
                <div className="pdp-price-row">
                  <span className="pdp-price">{priceDisplay}</span>
                  <span className="pdp-price-unit">/ pack</span>
                </div>
              )}

              <div className="pdp-cart-row">
                <button
                  className={`pdp-add-to-cart${isAddingToCart ? " pdp-add-to-cart--loading" : ""}`}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {isAddingToCart ? "Adding…" : matchedProduct ? "Add to Cart" : "View in Shop"}
                </button>
              </div>

              {cartFeedback && (
                <div className={`pdp-cart-feedback${cartFeedback.includes("stock") ? " pdp-cart-feedback--error" : ""}`}>
                  {cartFeedback}
                </div>
              )}
            </div>
          </div>

          {/* ── Filter Similar Peppers ── */}
          <div className="pdp-filter-section">
            <h2 className="pdp-filter-title">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="pdp-filter-icon">
                <path d="M2.5 3.75h15l-6 7.5v4.375l-3-1.25V11.25l-6-7.5Z" stroke="#F54900" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filter Similar Peppers
            </h2>
            <div className="pdp-filter-row">
              <div className="pdp-filter-group">
                <label htmlFor="pdp-color-filter">Color</label>
                <select id="pdp-color-filter" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                  <option value=""></option>
                  {uniqueColors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pdp-filter-group">
                <label htmlFor="pdp-heat-filter">Heat Level</label>
                <select id="pdp-heat-filter" value={heatFilter} onChange={(e) => setHeatFilter(e.target.value)}>
                  <option value=""></option>
                  {heatOptions.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
                </select>
              </div>
              <div className="pdp-filter-group">
                <label htmlFor="pdp-season-filter">Season</label>
                <select id="pdp-season-filter" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}>
                  <option value=""></option>
                  {uniqueSeasons.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button className="pdp-apply-btn" onClick={handleApplyFilters}>Apply Filters</button>
          </div>

          {/* ── Filter results ── */}
          {hasFiltered && (
            <div className="pdp-results-section">
              <p className="pdp-results-count">
                {filteredPeppers.length === 0
                  ? "No peppers match your filters."
                  : `${filteredPeppers.length} pepper${filteredPeppers.length !== 1 ? "s" : ""} found`}
              </p>
              {filteredPeppers.length > 0 && (
                <div className="pdp-results-grid">
                  {filteredPeppers.map((p) => (
                    <Link key={p.id} to={`/pepper/${p.id}`} className="pdp-result-card">
                      <div className="pdp-result-image-wrap">
                        <img src={p.image_url} alt={p.name} className="pdp-result-image" />
                        <span className="pdp-result-shu-badge">{formatHeatRange(p)}</span>
                      </div>
                      <div className="pdp-result-body">
                        <p className="pdp-result-origin">{p.origin || "Unknown origin"}</p>
                        <h4 className="pdp-result-name">{p.name}</h4>
                        {p.color && (
                          <p className="pdp-result-meta">{p.color}{p.season ? ` · ${p.season}` : ""}</p>
                        )}
                        <span className="pdp-result-link">Learn More →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Info cards ── */}
          <div className="pdp-info-cards">
            <div className="pdp-info-card pdp-info-card--culinary">
              <h3>Culinary Uses</h3>
              <ul>
                <li>Perfect for stir-fries and Asian cuisine</li>
                <li>Can be used fresh or dried</li>
                <li>Great for pickling and preserving</li>
                <li>Adds sweet heat to sauces</li>
              </ul>
            </div>
            <div className="pdp-info-card pdp-info-card--growing">
              <h3>Growing Tips</h3>
              <ul>
                <li>Requires full sun and warm temperatures</li>
                <li>Plant spacing: 18-24 inches apart</li>
                <li>Harvest when peppers reach desired color</li>
                <li>Regular watering for best production</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PepperDetailsPage;
