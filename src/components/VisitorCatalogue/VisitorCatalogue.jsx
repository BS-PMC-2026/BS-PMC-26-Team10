import { useEffect, useMemo, useRef, useState } from "react";
import "./VisitorCatalogue.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const SEARCH_DEBOUNCE_MS = 250;

function formatHeatRange(chilli) {
  if (chilli.shu_min && chilli.shu_max) {
    return `${Number(chilli.shu_min).toLocaleString()} - ${Number(
      chilli.shu_max
    ).toLocaleString()} SHU`;
  }

  return "SHU unavailable";
}

function formatAvailability(chilli) {
  if (!chilli.is_available) {
    return "Currently unavailable";
  }

  if (typeof chilli.stock_quantity === "number") {
    return `Available (${chilli.stock_quantity} in stock)`;
  }

  return "Available";
}

function VisitorCatalogue() {
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

  const hasActiveFilters =
    searchInput.trim() !== "" ||
    shuMinFilter !== "" ||
    shuMaxFilter !== "" ||
    originFilter !== "";

  const searchStatus = useMemo(() => {
    if (isError) {
      return "Something went wrong while loading peppers.";
    }

    if (visibleChillies.length === 0) {
      return hasActiveFilters
        ? "No peppers matched your filters."
        : "No peppers are available right now.";
    }

    if (hasActiveFilters) {
      return `Showing ${visibleChillies.length} pepper${
        visibleChillies.length > 1 ? "s" : ""
      }.`;
    }

    return "Showing all peppers.";
  }, [hasActiveFilters, isError, visibleChillies.length]);

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

  const comparisonRows = [
    {
      label: "Origin",
      getValue: (chilli) => chilli.origin || "Unknown",
    },
    {
      label: "Heat level",
      getValue: (chilli) => formatHeatRange(chilli),
    },
    {
      label: "Color",
      getValue: (chilli) => chilli.color || "Unknown",
    },
    {
      label: "Season",
      getValue: (chilli) => chilli.season || "Not listed",
    },
    {
      label: "Availability",
      getValue: (chilli) => formatAvailability(chilli),
    },
    {
      label: "Stock quantity",
      getValue: (chilli) =>
        typeof chilli.stock_quantity === "number"
          ? chilli.stock_quantity.toLocaleString()
          : "Not listed",
    },
    {
      label: "Description",
      getValue: (chilli) =>
        chilli.description && chilli.description.trim() !== ""
          ? chilli.description
          : "A unique chilli with bold flavor and character from our collection.",
    },
  ];

  return (
    <section className="visitor-catalogue">
      <div className="visitor-catalogue-inner">
        <div className="visitor-catalogue-heading">
          <p className="visitor-catalogue-kicker">From our farm collection</p>
          <h2 className="visitor-catalogue-title">Explore our chillies</h2>
          <p className="visitor-catalogue-subtitle">
            Discover peppers from different origins, compare heat levels, and
            find the flavors that fit your taste.
          </p>
        </div>

        <div className="visitor-catalogue-panel">
          <div className="visitor-catalogue-topbar">
            <div className="visitor-catalogue-topbar-text">
              <h3>Find your perfect pepper</h3>
              <p>
                Search by name, filter by origin, browse by heat level, then
                compare selected peppers without leaving the page.
              </p>
            </div>

            <div className="visitor-catalogue-actions">
              <button
                type="button"
                className="visitor-catalogue-compare-btn"
                onClick={() => setIsCompareOpen(true)}
                disabled={selectedCompareItems.length === 0}
              >
                Compare peppers
                <span>{selectedCompareItems.length}</span>
              </button>

              <button
                type="button"
                className="visitor-catalogue-clear-btn"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </div>

          <div className="visitor-catalogue-filters">
            <div className="visitor-filter-group visitor-filter-search">
              <label htmlFor="pepper-search">Search</label>
              <input
                id="pepper-search"
                type="text"
                placeholder="Search peppers..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="pepper-origin">Origin</label>
              <select
                id="pepper-origin"
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value)}
              >
                <option value="">All origins</option>
                {origins.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="shu-min">Min SHU</label>
              <input
                id="shu-min"
                type="number"
                placeholder="e.g. 1000"
                value={shuMinFilter}
                onChange={(event) => setShuMinFilter(event.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="shu-max">Max SHU</label>
              <input
                id="shu-max"
                type="number"
                placeholder="e.g. 50000"
                value={shuMaxFilter}
                onChange={(event) => setShuMaxFilter(event.target.value)}
              />
            </div>
          </div>

          <div className={`visitor-catalogue-status ${isError ? "error" : ""}`}>
            {isLoading ? "Loading peppers..." : searchStatus}
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
                        {formatHeatRange(chilli)}
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
                            ? "Selected for compare"
                            : "Add to compare"}
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
                        <div className="visitor-meta-pill">{`Heat: ${formatHeatRange(
                          chilli
                        )}`}</div>

                        {chilli.color && (
                          <div className="visitor-meta-pill">{chilli.color}</div>
                        )}

                        {chilli.season && (
                          <div className="visitor-meta-pill">{chilli.season}</div>
                        )}
                      </div>

                      <button type="button" className="visitor-chilli-btn">
                        Learn More
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && visibleChillies.length === 0 && (
            <div className="visitor-catalogue-empty">
              <h3>No peppers found</h3>
              <p>Try changing the filters or searching for something else.</p>
            </div>
          )}

          {!isLoading && isError && (
            <div className="visitor-catalogue-empty error-box">
              <h3>Could not load the catalogue</h3>
              <p>Please check the backend connection and try again.</p>
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
                  <p className="visitor-compare-kicker">On-page comparison</p>
                  <h3>Compare selected peppers</h3>
                  <p>
                    Review every selected pepper side by side without leaving
                    the homepage.
                  </p>
                </div>

                <button
                  type="button"
                  className="visitor-compare-close"
                  onClick={() => setIsCompareOpen(false)}
                  aria-label="Close comparison"
                >
                  ×
                </button>
              </div>

              <div className="visitor-compare-toolbar">
                <div className="visitor-compare-count">
                  {selectedCompareItems.length} selected
                </div>

                <button
                  type="button"
                  className="visitor-compare-clear"
                  onClick={clearCompareItems}
                  disabled={selectedCompareItems.length === 0}
                >
                  Clear selection
                </button>
              </div>

              {selectedCompareItems.length > 0 ? (
                <div className="visitor-compare-table-wrap">
                  <table className="visitor-compare-table">
                    <thead>
                      <tr>
                        <th>Details</th>
                        {selectedCompareItems.map((chilli) => (
                          <th key={chilli.id}>
                            <div className="visitor-compare-pepper-head">
                              <img src={chilli.image_url} alt={chilli.name} />
                              <div>
                                <strong>{chilli.name}</strong>
                                <span>{chilli.origin || "Unknown origin"}</span>
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
                  <h4>No peppers selected yet</h4>
                  <p>
                    Use the cards on this page to add peppers, then open this
                    panel to compare them.
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

export default VisitorCatalogue;
