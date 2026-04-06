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

    chillies.forEach(chilli => {
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

    setSearchStatus(formatSearchStatus(chillies, query));
}

async function loadChillies() {
    setSearchBusy(true);

    try {
        const response = await fetch(`${API_BASE_URL}/chillies`);
        const chillies = await response.json();
        displayChillies(chillies, "");
    } catch (error) {
        console.error("Error loading chillies:", error);
        document.getElementById("chilliContainer").innerHTML = "<p>Failed to load chillies.</p>";
        setSearchStatus("Failed to load peppers.", true);
    } finally {
        setSearchBusy(false);
    }
}

async function searchChillies(query) {
    const trimmedQuery = query.trim();
    const currentToken = ++latestSearchToken;

    if (!trimmedQuery) {
        loadChillies();
        return;
    }

    setSearchBusy(true);
    setSearchStatus(`Searching for "${trimmedQuery}"...`);

    try {
        const response = await fetch(`${API_BASE_URL}/chillies/search?q=${encodeURIComponent(trimmedQuery)}`);
        const chillies = await response.json();

        if (currentToken !== latestSearchToken) {
            return;
        }

        displayChillies(chillies, trimmedQuery);
    } catch (error) {
        console.error("Error searching chillies:", error);

        if (currentToken !== latestSearchToken) {
            return;
        }

        document.getElementById("chilliContainer").innerHTML = "<p>Failed to search chillies.</p>";
        setSearchStatus("Failed to search peppers.", true);
    } finally {
        if (currentToken === latestSearchToken) {
            setSearchBusy(false);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("searchButton");
    const clearSearchButton = document.getElementById("clearSearchButton");

    function submitSearch() {
        const query = searchInput.value.trim();

        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = null;
        }

        if (query) {
            searchChillies(query);
        } else {
            latestSearchToken += 1;
            loadChillies();
        }
    }

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        submitSearch();
    });

    searchButton.addEventListener("click", submitSearch);

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        clearSearchButton.disabled = query.length === 0;

        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        if (!query) {
            latestSearchToken += 1;
            setSearchStatus("Showing all peppers.");
            loadChillies();
            return;
        }

        searchDebounceTimer = setTimeout(() => {
            searchChillies(query);
        }, SEARCH_DEBOUNCE_MS);
    });

    clearSearchButton.addEventListener("click", () => {
        searchInput.value = "";
        clearSearchButton.disabled = true;
        latestSearchToken += 1;
        searchInput.focus();
        loadChillies();
    });

    clearSearchButton.disabled = true;
    loadChillies();
});
