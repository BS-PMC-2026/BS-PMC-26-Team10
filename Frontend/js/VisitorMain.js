const API_BASE_URL = "http://127.0.0.1:8000";
const SEARCH_DEBOUNCE_MS = 250;

let latestRequestToken = 0;
let searchDebounceTimer = null;
let filterRequestTimer = null;

const chilliContainer = document.getElementById("chilliContainer");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const clearSearchButton = document.getElementById("clearSearchButton");
const searchStatus = document.getElementById("searchStatus");
const shuMinFilter = document.getElementById("shuMinFilter");
const shuMaxFilter = document.getElementById("shuMaxFilter");
const originFilter = document.getElementById("originFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const activeFilters = document.getElementById("activeFilters");

function setSearchStatus(message, isError = false) {
    if (!searchStatus) {
        return;
    }

    searchStatus.textContent = message;
    searchStatus.classList.toggle("error", isError);
}

function setBusyState(isBusy) {
    if (searchInput) {
        searchInput.setAttribute("aria-busy", String(isBusy));
    }

    if (searchButton) {
        searchButton.disabled = isBusy;
    }

    if (clearSearchButton && searchInput) {
        clearSearchButton.disabled = isBusy && !searchInput.value.trim();
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.disabled = isBusy;
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.disabled = isBusy;
    }
}

function getCurrentFilters() {
    return {
        query: searchInput ? searchInput.value.trim() : "",
        shuMin: shuMinFilter ? shuMinFilter.value.trim() : "",
        shuMax: shuMaxFilter ? shuMaxFilter.value.trim() : "",
        origin: originFilter ? originFilter.value.trim() : "",
    };
}

function hasInvalidRange() {
    const { shuMin, shuMax } = getCurrentFilters();

    if (!shuMin || !shuMax) {
        return false;
    }

    return Number(shuMin) > Number(shuMax);
}

function renderActiveFilters() {
    if (!activeFilters) {
        return;
    }

    const { query, shuMin, shuMax, origin } = getCurrentFilters();
    const filters = [];

    if (query) {
        filters.push(`Search: ${query}`);
    }

    if (shuMin) {
        filters.push(`Min SHU: ${shuMin}`);
    }

    if (shuMax) {
        filters.push(`Max SHU: ${shuMax}`);
    }

    if (origin) {
        filters.push(`Origin: ${origin}`);
    }

    activeFilters.innerHTML = "";

    if (filters.length === 0) {
        const placeholder = document.createElement("span");
        placeholder.className = "active-filter-placeholder";
        placeholder.textContent = "No active filters";
        activeFilters.appendChild(placeholder);
        return;
    }

    filters.forEach((filterText) => {
        const chip = document.createElement("span");
        chip.className = "filter-chip";
        chip.textContent = filterText;
        activeFilters.appendChild(chip);
    });
}

function formatSearchStatus(chillies, filters) {
    const appliedFilters = [];

    if (filters.query) {
        appliedFilters.push(`"${filters.query}"`);
    }

    if (filters.origin) {
        appliedFilters.push(`origin ${filters.origin}`);
    }

    if (filters.shuMin) {
        appliedFilters.push(`min SHU ${filters.shuMin}`);
    }

    if (filters.shuMax) {
        appliedFilters.push(`max SHU ${filters.shuMax}`);
    }

    if (appliedFilters.length === 0) {
        return `Showing all peppers (${chillies.length}).`;
    }

    if (chillies.length === 0) {
        return `No peppers found for ${appliedFilters.join(", ")}.`;
    }

    return `Found ${chillies.length} pepper${chillies.length === 1 ? "" : "s"} for ${appliedFilters.join(", ")}.`;
}

function renderChillies(chillies, filters) {
    if (!chilliContainer) {
        return;
    }

    chilliContainer.innerHTML = "";

    if (!Array.isArray(chillies) || chillies.length === 0) {
        chilliContainer.innerHTML = "<p>No peppers found.</p>";
        setSearchStatus(formatSearchStatus([], filters));
        return;
    }

    chillies.forEach((chilli) => {
        const card = document.createElement("div");
        card.className = "chilli-card";

        card.innerHTML = `
            <img src="${chilli.image_url}" alt="${chilli.name}">
            <div class="chilli-info">
                <h3>${chilli.name}</h3>
                <p>${chilli.description}</p>
                <p><strong>Origin:</strong> ${chilli.origin}</p>
                <p><strong>Color:</strong> ${chilli.color}</p>
                <p><strong>SHU:</strong> ${chilli.shu_min} - ${chilli.shu_max}</p>
                <p><strong>Season:</strong> ${chilli.season}</p>
            </div>
        `;

        chilliContainer.appendChild(card);
    });

    setSearchStatus(formatSearchStatus(chillies, filters));
}

async function loadOriginOptions() {
    if (!originFilter) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/chillies`);

        if (!response.ok) {
            throw new Error("Failed to load origins");
        }

        const chillies = await response.json();
        const uniqueOrigins = [...new Set(
            chillies
                .map((chilli) => chilli.origin)
                .filter((origin) => origin && origin.trim().length > 0)
        )].sort((first, second) => first.localeCompare(second));

        originFilter.innerHTML = '<option value="">All origins</option>';

        uniqueOrigins.forEach((origin) => {
            const option = document.createElement("option");
            option.value = origin;
            option.textContent = origin;
            originFilter.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading filter options:", error);
    }
}

function buildApiUrl(filters) {
    const params = new URLSearchParams();

    if (filters.query) {
        params.set("q", filters.query);
        return `${API_BASE_URL}/chillies/search?${params.toString()}`;
    }

    if (filters.shuMin) {
        params.set("shu_min", filters.shuMin);
    }

    if (filters.shuMax) {
        params.set("shu_max", filters.shuMax);
    }

    if (filters.origin) {
        params.set("origin", filters.origin);
    }

    const queryString = params.toString();
    return queryString ? `${API_BASE_URL}/chillies?${queryString}` : `${API_BASE_URL}/chillies`;
}

async function loadChillies() {
    const requestToken = ++latestRequestToken;
    const filters = getCurrentFilters();

    renderActiveFilters();

    if (hasInvalidRange()) {
        chilliContainer.innerHTML = "<p>Invalid SHU range.</p>";
        setSearchStatus("Minimum SHU cannot be greater than maximum SHU.", true);
        return;
    }

    setBusyState(true);

    if (filters.query) {
        setSearchStatus(`Searching for "${filters.query}"...`);
    } else {
        setSearchStatus("Loading peppers...");
    }

    try {
        const response = await fetch(buildApiUrl(filters));

        if (!response.ok) {
            throw new Error("Failed to load chillies");
        }

        const chillies = await response.json();

        if (requestToken !== latestRequestToken) {
            return;
        }

        renderChillies(chillies, filters);
    } catch (error) {
        console.error("Error loading chillies:", error);

        if (requestToken !== latestRequestToken) {
            return;
        }

        chilliContainer.innerHTML = "<p>Failed to load chillies.</p>";
        setSearchStatus("Failed to load peppers.", true);
    } finally {
        if (requestToken === latestRequestToken) {
            setBusyState(false);
        }
    }
}

function queueSearchReload() {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    searchDebounceTimer = setTimeout(() => {
        loadChillies();
    }, SEARCH_DEBOUNCE_MS);
}

function queueFilterReload() {
    if (filterRequestTimer) {
        clearTimeout(filterRequestTimer);
    }

    filterRequestTimer = setTimeout(() => {
        loadChillies();
    }, SEARCH_DEBOUNCE_MS);
}

function resetFilters() {
    if (shuMinFilter) {
        shuMinFilter.value = "";
    }

    if (shuMaxFilter) {
        shuMaxFilter.value = "";
    }

    if (originFilter) {
        originFilter.value = "";
    }

    loadChillies();
}

document.addEventListener("DOMContentLoaded", async () => {
    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
            loadChillies();
        });
    }

    if (searchButton) {
        searchButton.addEventListener("click", loadChillies);
    }

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (clearSearchButton) {
                clearSearchButton.disabled = searchInput.value.trim().length === 0;
            }

            queueSearchReload();
        });
    }

    if (clearSearchButton) {
        clearSearchButton.addEventListener("click", () => {
            if (!searchInput) {
                return;
            }

            searchInput.value = "";
            clearSearchButton.disabled = true;
            loadChillies();
            searchInput.focus();
        });

        clearSearchButton.disabled = true;
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", loadChillies);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", resetFilters);
    }

    if (shuMinFilter) {
        shuMinFilter.addEventListener("input", queueFilterReload);
    }

    if (shuMaxFilter) {
        shuMaxFilter.addEventListener("input", queueFilterReload);
    }

    if (originFilter) {
        originFilter.addEventListener("change", loadChillies);
    }

    await loadOriginOptions();
    renderActiveFilters();
    loadChillies();
});
