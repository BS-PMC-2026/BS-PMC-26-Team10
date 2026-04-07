import { useEffect, useMemo, useRef, useState } from "react";
import "./VisitorCatalogue.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const SEARCH_DEBOUNCE_MS = 250;

function VisitorCatalogue() {
  const [chillies, setChillies] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [shuMinFilter, setShuMinFilter] = useState("");
  const [shuMaxFilter, setShuMaxFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [searchStatus, setSearchStatus] = useState("Showing all peppers.");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const debounceTimeoutRef = useRef(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (searchInput.trim()) {
      params.append("search", searchInput.trim());
    }
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
  }, [searchInput, shuMinFilter, shuMaxFilter, originFilter]);

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
          ? `${API_BASE_URL}/chillies/filter?${queryString}`
          : `${API_BASE_URL}/chillies`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error("Failed to fetch chillies.");
        }

        const data = await response.json();
        setChillies(data);

        if (data.length === 0) {
          setSearchStatus("No peppers matched your search.");
        } else if (queryString) {
          setSearchStatus(`Found ${data.length} pepper${data.length > 1 ? "s" : ""}.`);
        } else {
          setSearchStatus("Showing all peppers.");
        }
      } catch (error) {
        console.error(error);
        setIsError(true);
        setSearchStatus("Something went wrong while loading peppers.");
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
              <p>Search by name, filter by origin, or browse by heat level.</p>
            </div>

            <button
              type="button"
              className="visitor-catalogue-clear-btn"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>

          <div className="visitor-catalogue-filters">
            <div className="visitor-filter-group visitor-filter-search">
              <label htmlFor="pepper-search">Search</label>
              <input
                id="pepper-search"
                type="text"
                placeholder="Search peppers..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="pepper-origin">Origin</label>
              <select
                id="pepper-origin"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
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
                onChange={(e) => setShuMinFilter(e.target.value)}
              />
            </div>

            <div className="visitor-filter-group">
              <label htmlFor="shu-max">Max SHU</label>
              <input
                id="shu-max"
                type="number"
                placeholder="e.g. 50000"
                value={shuMaxFilter}
                onChange={(e) => setShuMaxFilter(e.target.value)}
              />
            </div>
          </div>

          <div className={`visitor-catalogue-status ${isError ? "error" : ""}`}>
            {isLoading ? "Loading peppers..." : searchStatus}
          </div>

          {!isLoading && !isError && chillies.length > 0 && (
            <div className="visitor-catalogue-grid">
              {chillies.map((chilli) => (
                <article className="visitor-chilli-card" key={chilli.id}>
                  <div className="visitor-chilli-image-wrap">
                    <img
                      src={chilli.image_url}
                      alt={chilli.name}
                      className="visitor-chilli-image"
                    />

                    {/* ✅ FIXED SHU */}
                    <span className="visitor-chilli-badge">
                      {chilli.shu_min && chilli.shu_max
                        ? `${Number(chilli.shu_min).toLocaleString()} - ${Number(chilli.shu_max).toLocaleString()} SHU`
                        : "SHU unavailable"}
                    </span>
                  </div>

                  <div className="visitor-chilli-card-body">
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
                      {/* ✅ FIXED SHU */}
                      <div className="visitor-meta-pill">
                        {chilli.shu_min && chilli.shu_max
                          ? `Heat: ${Number(chilli.shu_min).toLocaleString()} - ${Number(chilli.shu_max).toLocaleString()}`
                          : "Heat unavailable"}
                      </div>

                      {chilli.color && (
                        <div className="visitor-meta-pill">{chilli.color}</div>
                      )}
                    </div>

                    <button type="button" className="visitor-chilli-btn">
                      Learn More
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!isLoading && !isError && chillies.length === 0 && (
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
      </div>
    </section>
  );
}

export default VisitorCatalogue;