async function loadPeppers() {
    const pepperContainer = document.getElementById("pepperContainer");

    try {
        const response = await fetch("http://127.0.0.1:8000/peppers");
        const peppers = await response.json();

        pepperContainer.innerHTML = "";

        peppers.forEach(pepper => {
            const card = document.createElement("div");
            card.className = "pepper-card";

            card.innerHTML = `
                <img src="http://127.0.0.1:8000${pepper.image_url}" alt="${pepper.name}">
                <div class="pepper-info">
                    <h3>${pepper.name}</h3>
                    <p>${pepper.description}</p>
                    <p><strong>Origin:</strong> ${pepper.origin}</p>
                    <p><strong>Color:</strong> ${pepper.color}</p>
                    <p><strong>SHU:</strong> ${pepper.shu_min} - ${pepper.shu_max}</p>
                    <p><strong>Season:</strong> ${pepper.season}</p>
                </div>
            `;

            pepperContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading peppers:", error);
        pepperContainer.innerHTML = "<p>Failed to load peppers.</p>";
    }
}

loadPeppers();