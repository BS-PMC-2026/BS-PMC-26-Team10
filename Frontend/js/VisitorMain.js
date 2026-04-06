async function loadChillies() {
    const chilliContainer = document.getElementById("chilliContainer");

    try {
        const response = await fetch("http://127.0.0.1:8000/chillies");
        const chillies = await response.json();

        chilliContainer.innerHTML = "";

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
    } catch (error) {
        console.error("Error loading chillies:", error);
        chilliContainer.innerHTML = "<p>Failed to load chillies.</p>";
    }
}

loadChillies();