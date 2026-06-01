import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../../hooks/useCart";
import VisitorCart from "../VisitorCart/VisitorCart";
import "./VisitorCatalogue.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const SEARCH_DEBOUNCE_MS = 250;

function formatHeatRange(chilli, t) {
  if (chilli.shu_min && chilli.shu_max) {
    return `${Number(chilli.shu_min).toLocaleString()} - ${Number(
      chilli.shu_max
    ).toLocaleString()} SHU`;
  }

  return t("catalogue.shuUnavailable");
}

function formatAvailability(chilli, t) {
  if (!chilli.is_available) {
    return t("catalogue.unavailable");
  }

  if (typeof chilli.stock_quantity === "number") {
    return t("catalogue.availableStock", { quantity: chilli.stock_quantity });
  }

  return t("catalogue.available");
}

function VisitorCatalogue() {
  const { t } = useTranslation();

  const [chillies, setChillies] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [shuMinFilter, setShuMinFilter] = useState("");
  const [shuMaxFilter, setShuMaxFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompareItems, setSelectedCompareItems] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartFeedback, setCartFeedback] = useState({});
  const [addingToCart, setAddingToCart] = useState({});
  const [inventory, setInventory] = useState([]);

  const cart = useCart();
  const navigate = useNavigate();
  const debounceTimeoutRef = useRef(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (shuMinFilter !== "") {
      params.append("shu_min", shuMinFilter);
    }
    if (shuMaxFilter !== "") {
      params.append("shu_max", shuMaxFilter);
    }
    if (originFilter) {
      params.append("origin", originFilter);
    }

    return params.toString();
  }, [shuMinFilter, shuMaxFilter, originFilter]);

  const visibleChillies = useMemo(() => {
    const normalizedSearch = searchInput.trim().toLowerCase();

    if (!normalizedSearch) {
      return chillies;
    }

    return chillies.filter((chilli) => {
      const name = chilli.name?.toLowerCase() ?? "";
      const description = chilli.description?.toLowerCase() ?? "";
      const origin = chilli.origin?.toLowerCase() ?? "";
      const color = chilli.color?.toLowerCase() ?? "";
      const season = chilli.season?.toLowerCase() ?? "";

      return (
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        origin.includes(normalizedSearch) ||
        color.includes(normalizedSearch) ||
        season.includes(normalizedSearch)
      );
    });
  }, [chillies, searchInput]);

  const inventoryByName = useMemo(() => {
    const map = new Map();
    inventory.forEach((item) => {
      if (item.name) map.set(item.name.toLowerCase().trim(), item);
    });
    return map;
  }, [inventory]);

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    shuMinFilter !== "" ||
    shuMaxFilter !== "" ||
    originFilter !== "";

  const searchStatus = useMemo(() => {
    if (isError) {
      return t("catalogue.loadError");
    }

    if (visibleChillies.length === 0) {
      return hasActiveFilters
        ? t("catalogue.noFilters")
        : t("catalogue.noAvailable");
    }

    if (hasActiveFilters) {
      return t("catalogue.showing", { count: visibleChillies.length });
    }

    return t("catalogue.showingAll");
  }, [hasActiveFilters, isError, visibleChillies.length, t]);

  useEffect(() => {
    if (!isCompareOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCompareOpen]);

  useEffect(() => {
    async function fetchOrigins() {
      try {
        const response = await fetch(`${API_BASE_URL}/chillies`);
        if (!response.ok) {
          throw new Error("Failed to fetch origins.");
        }

        const data = await response.json();
        const uniqueOrigins = [
          ...new Set(
            data
              .map((item) => item.origin)
              .filter((origin) => origin && origin.trim() !== "")
          ),
        ].sort((a, b) => a.localeCompare(b));

        setOrigins(uniqueOrigins);
      } catch (error) {
        console.error(error);
      }
    }

    fetchOrigins();
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch(`${API_BASE_URL}/inventory`);
        if (res.ok) {
          const data = await res.json();
          setInventory(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchInventory();
  }, []);

  useEffect(() => {
    async function fetchChillies() {
      setIsLoading(true);
      setIsError(false);

      try {
        const endpoint = queryString
          ? `${API_BASE_URL}/chillies?${queryString}`
          : `${API_BASE_URL}/chillies`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch chillies.");
        }

        const data = await response.json();
        setChillies(data);
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchChillies();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [queryString]);

  function clearFilters() {
    setSearchInput("");
    setShuMinFilter("");
    setShuMaxFilter("");
    setOriginFilter("");
  }

  function toggleCompareItem(chilli) {
    setSelectedCompareItems((currentItems) => {
      const isSelected = currentItems.some((item) => item.id === chilli.id);

      if (isSelected) {
        return currentItems.filter((item) => item.id !== chilli.id);
      }

      return [...currentItems, chilli];
    });
  }

  function clearCompareItems() {
    setSelectedCompareItems([]);
  }

  async function handleAddToCart(chilli) {
    setAddingToCart((prev) => ({ ...prev, [chilli.id]: true }));
    setCartFeedback((prev) => ({ ...prev, [chilli.id]: "" }));

    const inventoryItem = inventoryByName.get(chilli.name?.toLowerCase().trim());
    const price = inventoryItem?.price;
    const inventoryId = inventoryItem?.id;
    const result = await cart.addToCart({ ...chilli, _type: "chilli", price, inventoryId });

    if (result.success) {
      setCartFeedback((prev) => ({ ...prev, [chilli.id]: t("catalogue.added") }));
    } else if (result.error === "out_of_stock") {
      setCartFeedback((prev) => ({ ...prev, [chilli.id]: t("catalogue.soldOut") }));
    } else if (result.error === "max_quantity") {
      setCartFeedback((prev) => ({ ...prev, [chilli.id]: t("catalogue.maxCart") }));
    } else {
      setCartFeedback((prev) => ({ ...prev, [chilli.id]: t("catalogue.tryAgain") }));
    }

    setAddingToCart((prev) => ({ ...prev, [chilli.id]: false }));
    setTimeout(() => {
      setCartFeedback((prev) => ({ ...prev, [chilli.id]: "" }));
    }, 2000);
  }

  const comparisonRows = [
    {
      label: t("catalogue.origin"),
      getValue: (chilli) => chilli.origin || t("catalogue.unknown"),
    },
    {
      label: t("catalogue.compareHeatLevel"),
      getValue: (chilli) => formatHeatRange(chilli, t),
    },
    {
      label: t("catalogue.compareColor"),
      getValue: (chilli) => chilli.color || t("catalogue.unknown"),
    },
    {
      label: t("catalogue.compareSeason"),
      getValue: (chilli) => chilli.season || t("catalogue.notListed"),
    },
    {
      label: t("catalogue.compareAvailability"),
      getValue: (chilli) => formatAvailability(chilli, t),
    },
    {
      label: t("catalogue.compareStockQty"),
      getValue: (chilli) =>
        typeof chilli.stock_quantity === "number"
          ? chilli.stock_quantity.toLocaleString()
          : t("catalogue.notListed"),
    },
    {
      label: t("catalogue.compareDescription"),
      getValue: (chilli) =>
        chilli.description && chilli.description.trim() !== ""
          ? chilli.description
          : t("catalogue.defaultDesc"),
    },
  ];

  return (
    <section className="visitor-catalogue">
      <div className="visitor-catalogue-inner">
        <div className="visitor-catalogue-heading">
          <p className="visitor-catalogue-kicker">{t("catalogue.kicker")}</p>
          <h2 className="visitor-catalogue-title">{t("catalogue.title")}</h2>
          <p className="visitor-catalogue-subtitle">
            {t("catalogue.subtitle")}
          </p>
        </div>

        <div className="visitor-catalogue-panel">
          <div className="visitor-catalogue-topbar">
            <div className="visitor-catalogue-topbar-text">
              <h3>{t("catalogue.helpTitle")}</h3>
              <p>{t("catalogue.helpText")}</p>
            </div>

            <div className="visitor-catalogue-actions">
              <button
                type="button"
                className="visitor-catalogue-cart-btn"
                onClick={() => setIsCartOpen(true)}
              >
                {t("catalogue.cart")}
                {cart.totalItems > 0 && (
                  <span className="visitor-catalogue-cart-count">
                    {cart.totalItems}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="visitor-catalogue-compare-btn"
                onClick={() => setIsCompareOpen(true)}
                disabled={selectedCompareItems.length === 0}
              >
                {t("catalogue.comparePeppers")}
                <span>{selectedCompareItems.length}</span>
              </button>

              <button
                type="button"
                className="visitor-catalogue-clear-btn"
                onClick={clearFilters}
              >
                {t("catalogue.clearFilters")}
              </button>
            </div>
          </div>

          <div className="visitor-catalogue-filters">
            <div className="visitor-filter-group visitor-filter-search">
              <label htmlFor="pepper-search">{t("catalogue.search")}</label>
              <input
                id="pepper-search"
                type="text"
                placeholder={t("catalogue.searchPlaceholder")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="pepper-origin">{t("catalogue.origin")}</label>
              <select
                id="pepper-origin"
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
              >
                <option value="">{t("catalogue.allOrigins")}</option>
                {origins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="shu-min">{t("catalogue.minShu")}</label>
              <input
                id="shu-min"
                type="number"
                placeholder={t("catalogue.shuPlaceholder")}
                value={shuMinFilter}
                onChange={(event) => setShuMinFilter(event.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="shu-max">{t("catalogue.maxShu")}</label>
              <input
                id="shu-max"
                type="number"
                placeholder={t("catalogue.maxShuPlaceholder")}
                value={shuMaxFilter}
                onChange={(event) => setShuMaxFilter(event.target.value)}
              />
            </div>
          </div>

          <div className={`visitor-catalogue-status ${isError ? "error" : ""}`}>
            {isLoading ? t("catalogue.loading") : searchStatus}
          </div>

          {!isLoading && !isError && visibleChillies.length > 0 && (
            <div className="visitor-catalogue-grid">
              {visibleChillies.map((chilli) => {
                const isSelectedForCompare = selectedCompareItems.some(
                  (item) => item.id === chilli.id
                );

                return (
                  <article
                    className={`visitor-chilli-card ${
                      isSelectedForCompare ? "is-selected-for-compare" : ""
                    }`}
                    key={chilli.id}
                  >
                    <div className="visitor-chilli-image-wrap">
                      <img
                        src={chilli.image_url}
                        alt={chilli.name}
                        className="visitor-chilli-image"
                      />

                      <span className="visitor-chilli-badge">
                        {formatHeatRange(chilli, t)}
                      </span>
                    </div>

                    <div className="visitor-chilli-card-body">
                      <div className="visitor-chilli-card-controls">
                        <button
                          type="button"
                          className={`visitor-compare-toggle ${
                            isSelectedForCompare ? "selected" : ""
                          }`}
                          onClick={() => toggleCompareItem(chilli)}
                        >
                          {isSelectedForCompare
                            ? t("catalogue.selectedCompare")
                            : t("catalogue.addCompare")}
                        </button>
                      </div>

                      <div className="visitor-chilli-card-top">
                        <h3 className="visitor-chilli-name">{chilli.name}</h3>
                        <p className="visitor-chilli-origin">{chilli.origin}</p>
                      </div>

                      <p className="visitor-chilli-description">
                        {chilli.description && chilli.description.trim() !== ""
                          ? chilli.description
                          : "A unique chilli with bold flavor and character from our collection."}
                      </p>

                      <div className="visitor-chilli-meta">
                        <div className="visitor-meta-pill">
                          {t("catalogue.heat", { value: formatHeatRange(chilli, t) })}
                        </div>

                        {chilli.color && (
                          <div className="visitor-meta-pill">{chilli.color}</div>
                        )}

                        {chilli.season && (
                          <div className="visitor-meta-pill">{chilli.season}</div>
                        )}
                      </div>

                      {inventoryByName.get(chilli.name?.toLowerCase().trim())?.price != null && (
                        <p className="visitor-chilli-price">
                          {t("catalogue.price", {
                            price: parseFloat(
                              inventoryByName.get(chilli.name?.toLowerCase().trim()).price
                            ).toFixed(2),
                          })}
                        </p>
                      )}

                      <div className="visitor-chilli-card-actions">
                        <button
                          type="button"
                          className={`visitor-chilli-btn visitor-cart-btn${
                            cartFeedback[chilli.id] === t("catalogue.added")
                              ? " visitor-cart-btn--added"
                              : cartFeedback[chilli.id] === t("catalogue.maxCart")
                              ? " visitor-cart-btn--max"
                              : ""
                          }`}
                          disabled={
                            !chilli.is_available ||
                            addingToCart[chilli.id]
                          }
                          onClick={() => handleAddToCart(chilli)}
                        >
                          {addingToCart[chilli.id]
                            ? "..."
                            : cartFeedback[chilli.id]
                            ? cartFeedback[chilli.id]
                            : chilli.is_available
                            ? t("catalogue.addToCart")
                            : t("catalogue.unavailable")}
                        </button>

                        <button
                          type="button"
                          className="visitor-chilli-btn"
                          onClick={() =>
                            navigate(`/pepper/${chilli.id}`, {
                              state: { pepper: chilli },
                            })
                          }
                        >
                          {t("catalogue.learnMore")}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && visibleChillies.length === 0 && (
            <div className="visitor-catalogue-empty">
              <h3>{t("catalogue.noMatch")}</h3>
              <p>{t("catalogue.noMatchSub")}</p>
            </div>
          )}

          {!isLoading && isError && (
            <div className="visitor-catalogue-empty error-box">
              <h3>{t("catalogue.errorTitle")}</h3>
              <p>{t("catalogue.errorSub")}</p>
            </div>
          )}
        </div>

        {isCompareOpen && (
          <div
            className="visitor-compare-overlay"
            onClick={() => setIsCompareOpen(false)}
          >
            <aside
              className="visitor-compare-drawer"
              onClick={(event) => event.stopPropagation()}
              aria-label="Pepper comparison"
            >
              <div className="visitor-compare-header">
                <div>
                  <p className="visitor-compare-kicker">{t("catalogue.compareTitle")}</p>
                  <h3>{t("catalogue.compareSubtitle")}</h3>
                  <p>{t("catalogue.compareDesc")}</p>
                </div>

                <button
                  type="button"
                  className="visitor-compare-close"
                  onClick={() => setIsCompareOpen(false)}
                  aria-label={t("catalogue.closeCompare")}
                >
                  ×
                </button>
              </div>

              <div className="visitor-compare-toolbar">
                <div className="visitor-compare-count">
                  {t("catalogue.selectedCount", { count: selectedCompareItems.length })}
                </div>

                <button
                  type="button"
                  className="visitor-compare-clear"
                  onClick={clearCompareItems}
                  disabled={selectedCompareItems.length === 0}
                >
                  {t("catalogue.clearSelection")}
                </button>
              </div>

              {selectedCompareItems.length > 0 ? (
                <div className="visitor-compare-table-wrap">
                  <table className="visitor-compare-table">
                    <thead>
                      <tr>
                        <th>{t("catalogue.details")}</th>
                        {selectedCompareItems.map((chilli) => (
                          <th key={chilli.id}>
                            <div className="visitor-compare-pepper-head">
                              <img src={chilli.image_url} alt={chilli.name} />
                              <div>
                                <strong>{chilli.name}</strong>
                                <span>{chilli.origin || t("catalogue.unknownOrigin")}</span>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.label}>
                          <th>{row.label}</th>
                          {selectedCompareItems.map((chilli) => (
                            <td key={`${row.label}-${chilli.id}`}>
                              {row.getValue(chilli)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="visitor-compare-empty">
                  <h4>{t("catalogue.noSelected")}</h4>
                  <p>{t("catalogue.noSelectedDesc")}</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      <VisitorCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
      />
    </section>
  );
}

export default VisitorCatalogue;
