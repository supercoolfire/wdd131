const production = true;
const dataFile = production ? "data/production.json" : "data/placeholder.json";

async function hydrate() {
    try {
        const response = await fetch(dataFile);
        const data = await response.json();

        for (const id in data) {
            const element = document.getElementById(id);
            if (!element) continue;

            const config = data[id];

            // NEW: Handle structured lists specifically
            if (config.type === "list" && config.items) {
                element.innerHTML = config.items
                    .map(item => `<li><a href="${item.url}">${item.text}</a></li>`)
                    .join('');
                continue; // Move to the next ID
            }

            // Standard attribute/content injection
            for (const key in config) {
                if (key === "innerHTML" || key === "textContent") {
                    element[key] = config[key];
                } else {
                    element.setAttribute(key, config[key]);
                }
            }
        }
    } catch (err) {
        console.error("Hydration error:", err);
    }
}

document.addEventListener("DOMContentLoaded", hydrate);