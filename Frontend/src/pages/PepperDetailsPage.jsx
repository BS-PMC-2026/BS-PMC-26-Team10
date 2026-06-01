import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../hooks/useCart";
import "../styles/pepperDetailsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const FALLBACK_DESCRIPTION =
  "A unique chilli variety from our farm collection.";

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
  const { t } = useTranslation();
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
        <div className="pdp-state-card">{t("pepperDetail.loading")}</div>
      </div>
    );
  }

  if (isError || !pepper) {
    return (
      <div className="pdp-page">
        <div className="pdp-state-card">{t("pepperDetail.notFound")}</div>
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
    { label: t("pepperDetail.heatMild"), min: 0, max: 1000 },
    { label: t("pepperDetail.heatMedium"), min: 1000, max: 25000 },
    { label: t("pepperDetail.heatHot"), min: 25000, max: 100000 },
    { label: t("pepperDetail.heatVeryHot"), min: 100000, max: 9999999 },
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
      setCartFeedback(t("pepperDetail.outOfStock"));
    } else {
      setCartFeedback(t("pepperDetail.addedToCart"));
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
    { label: t("pepperDetail.origin"),     value: pepper.origin  || t("pepperDetail.unknown")    },
    { label: t("pepperDetail.heatLevel"),  value: formatHeatRange(pepper)                        },
    { label: t("pepperDetail.color"),      value: pepper.color   || t("pepperDetail.unknown")    },
    { label: t("pepperDetail.season"),     value: pepper.season  || t("pepperDetail.yearRound")  },
    { label: t("pepperDetail.size"),       value: t("pepperDetail.varies")                       },
    { label: t("pepperDetail.bestUse"),    value: deriveBestUse(pepper)                          },
  ];

  const priceDisplay = matchedProduct
    ? `₪${parseFloat(matchedProduct.price).toFixed(2)}`
    : null;

  const culinaryUses = t("pepperDetail.culinaryUses", { returnObjects: true });
  const growingTips = t("pepperDetail.growingTips", { returnObjects: true });

  return (
    <div className="pdp-page">
      <div className="pdp-card">

        {/* ── Top nav ── */}
        <div className="pdp-topnav">
          <Link to="/" className="pdp-back-link">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="#364153" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("pepperDetail.backCatalogue")}
          </Link>
          <button className="pdp-close-btn" onClick={() => navigate(-1)} aria-label={t("pepperDetail.close")}>
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
              <span className="pdp-spotlight-label">{t("pepperDetail.spotlight")}</span>
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
                  <span className="pdp-price-unit">{t("pepperDetail.perPack")}</span>
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
                  {isAddingToCart
                    ? t("pepperDetail.adding")
                    : matchedProduct
                    ? t("pepperDetail.addToCart")
                    : t("pepperDetail.viewShop")}
                </button>
              </div>

              {cartFeedback && (
                <div className={`pdp-cart-feedback${cartFeedback === t("pepperDetail.outOfStock") ? " pdp-cart-feedback--error" : ""}`}>
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
              {t("pepperDetail.filterTitle")}
            </h2>
            <div className="pdp-filter-row">
              <div className="pdp-filter-group">
                <label htmlFor="pdp-color-filter">{t("pepperDetail.filterColor")}</label>
                <select id="pdp-color-filter" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                  <option value=""></option>
                  {uniqueColors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pdp-filter-group">
                <label htmlFor="pdp-heat-filter">{t("pepperDetail.filterHeatLevel")}</label>
                <select id="pdp-heat-filter" value={heatFilter} onChange={(e) => setHeatFilter(e.target.value)}>
                  <option value=""></option>
                  {heatOptions.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
                </select>
              </div>
              <div className="pdp-filter-group">
                <label htmlFor="pdp-season-filter">{t("pepperDetail.filterSeason")}</label>
                <select id="pdp-season-filter" value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}>
                  <option value=""></option>
                  {uniqueSeasons.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button className="pdp-apply-btn" onClick={handleApplyFilters}>{t("pepperDetail.applyFilters")}</button>
          </div>

          {/* ── Filter results ── */}
          {hasFiltered && (
            <div className="pdp-results-section">
              <p className="pdp-results-count">
                {filteredPeppers.length === 0
                  ? t("pepperDetail.noMatch")
                  : t("pepperDetail.resultsCount", { count: filteredPeppers.length })}
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
                        <p className="pdp-result-origin">{p.origin || t("pepperDetail.unknownOrigin")}</p>
                        <h4 className="pdp-result-name">{p.name}</h4>
                        {p.color && (
                          <p className="pdp-result-meta">{p.color}{p.season ? ` · ${p.season}` : ""}</p>
                        )}
                        <span className="pdp-result-link">{t("pepperDetail.learnMore")}</span>
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
              <h3>{t("pepperDetail.culinaryTitle")}</h3>
              <ul>
                {Array.isArray(culinaryUses)
                  ? culinaryUses.map((item, i) => <li key={i}>{item}</li>)
                  : (
                    <>
                      <li>Perfect for stir-fries and Asian cuisine</li>
                      <li>Can be used fresh or dried</li>
                      <li>Great for pickling and preserving</li>
                      <li>Adds sweet heat to sauces</li>
                    </>
                  )}
              </ul>
            </div>
            <div className="pdp-info-card pdp-info-card--growing">
              <h3>{t("pepperDetail.growingTitle")}</h3>
              <ul>
                {Array.isArray(growingTips)
                  ? growingTips.map((item, i) => <li key={i}>{item}</li>)
                  : (
                    <>
                      <li>Requires full sun and warm temperatures</li>
                      <li>Plant spacing: 18-24 inches apart</li>
                      <li>Harvest when peppers reach desired color</li>
                      <li>Regular watering for best production</li>
                    </>
                  )}
              </ul>
            </div>
          </div>

          {/* ── Disclaimer ── */}
          <p className="pdp-disclaimer">{t("pepperDetail.disclaimer")}</p>

        </div>
      </div>
    </div>
  );
}

export default PepperDetailsPage;
