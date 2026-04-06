const API_BASE_URL = "http://127.0.0.1:8000";
const SEARCH_DEBOUNCE_MS = 250;

let latestSearchToken = 0;
let searchDebounceTimer = null;

function setSearchStatus(message, isError = false) {
    const searchStatus = document.getElementById("searchStatus");
    searchStatus.textContent = message;
    searchStatus.classList.toggle("error", isError);
}

function setSearchBusy(isBusy) {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const clearButton = document.getElementById("clearSearchButton");

    searchInput.setAttribute("aria-busy", String(isBusy));
    searchButton.disabled = isBusy;
    clearButton.disabled = isBusy && !searchInput.value.trim();
}

function formatSearchStatus(chillies, query) {
    if (!query) {
        return `Showing all peppers (${chillies.length}).`;
    }

    if (chillies.length === 0) {
        return `No peppers found for "${query}".`;
    }

    return `Found ${chillies.length} pepper${chillies.length === 1 ? "" : "s"} for "${query}".`;
}

function displayChillies(chillies, query = "") {
    const chilliContainer = document.getElementById("chilliContainer");
    chilliContainer.innerHTML = "";

    if (!Array.isArray(chillies) || chillies.length === 0) {
        chilliContainer.innerHTML = "<p>No peppers found.</p>";
        setSearchStatus(formatSearchStatus([], query));
        return;
    }
const API_BASE_URL = "http://127.0.0.1:8000";
const chilliContainer = document.getElementById("chilliContainer");
const shuMinFilter = document.getElementById("shuMinFilter");
const shuMaxFilter = document.getElementById("shuMaxFilter");
const originFilter = document.getElementById("originFilter");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const activeFilters = document.getElementById("activeFilters");

let filterRequestTimeout;

function getFilterValues() {
    return {
        shuMin: shuMinFilter.value.trim(),
        shuMax: shuMaxFilter.value.trim(),
        origin: originFilter.value.trim()
    };
}

function buildFilterQuery() {
    const params = new URLSearchParams();
    const { shuMin, shuMax, origin } = getFilterValues();

    if (shuMin) {
        params.append("shu_min", shuMin);
    }

    if (shuMax) {
        params.append("shu_max", shuMax);
    }

    if (origin) {
        params.append("origin", origin);
    }

    return params.toString();
}

function renderActiveFilters() {
    const { shuMin, shuMax, origin } = getFilterValues();
    const activeItems = [];

    if (shuMin || shuMax) {
        const minLabel = shuMin || "0";
        const maxLabel = shuMax || "Any";
        activeItems.push(`SHU: ${minLabel} - ${maxLabel}`);
    }

    if (origin) {
        activeItems.push(`Origin: ${origin}`);
    }

    if (activeItems.length === 0) {
        activeFilters.innerHTML = '<span class="active-filter-placeholder">Showing all chillies</span>';
        return;
    }

    activeFilters.innerHTML = activeItems
        .map((item) => `<span class="filter-chip">${item}</span>`)
        .join("");
}

function showStatusMessage(message) {
    chilliContainer.innerHTML = `<p class="status-message">${message}</p>`;
}

function hasInvalidRange() {
    const { shuMin, shuMax } = getFilterValues();

    if (!shuMin || !shuMax) {
        return false;
    }

    return Number(shuMin) > Number(shuMax);
}

function renderChillies(chillies) {
    chilliContainer.innerHTML = "";

    if (chillies.length === 0) {
        chilliContainer.innerHTML = `
            <div class="empty-state">
                <h3>No chillies match these filters.</h3>
                <p>Try a wider SHU range or choose another origin.</p>
            </div>
        `;
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
}

async function loadOriginOptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/chillies`);
        const chillies = await response.json();
        const uniqueOrigins = [...new Set(
            chillies
                .map((chilli) => chilli.origin)
                .filter((origin) => origin && origin.trim().length > 0)
        )].sort((first, second) => first.localeCompare(second));

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

async function loadChillies() {
    renderActiveFilters();

    if (hasInvalidRange()) {
        showStatusMessage("Minimum SHU cannot be greater than maximum SHU.");
        return;
    }

    showStatusMessage("Loading chillies...");

    try {
        const query = buildFilterQuery();
        const endpoint = query ? `${API_BASE_URL}/chillies?${query}` : `${API_BASE_URL}/chillies`;
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error("Failed to load chillies");
        }

        const chillies = await response.json();
        renderChillies(chillies);
    } catch (error) {
        console.error("Error loading chillies:", error);
        showStatusMessage("Failed to load chillies.");
    }
}

function queueDynamicReload() {
    clearTimeout(filterRequestTimeout);
    filterRequestTimeout = setTimeout(() => {
        loadChillies();
    }, 250);
}

function resetFilters() {
    shuMinFilter.value = "";
    shuMaxFilter.value = "";
    originFilter.value = "";
    loadChillies();
}

applyFiltersBtn.addEventListener("click", loadChillies);
resetFiltersBtn.addEventListener("click", resetFilters);
shuMinFilter.addEventListener("input", queueDynamicReload);
shuMaxFilter.addEventListener("input", queueDynamicReload);
originFilter.addEventListener("change", loadChillies);

loadOriginOptions().then(loadChillies);
