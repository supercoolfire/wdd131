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

// NEW: Handle structured lists specifically and dynamically
if (config.type === "list" && config.items) {
    element.innerHTML = config.items
        .map(item => {
            // Start the anchor tag
            let attrs = "";
            for (const key in item) {
                if (key === "text") continue; // Skip 'text' as it goes inside the tag
                
                // Map 'url' to 'href' if necessary, otherwise use the key name
                const attrName = (key === "url") ? "href" : key;
                attrs += ` ${attrName}="${item[key]}"`;
            }
            return `<li><a${attrs}>${item.text}</a></li>`;
        })
        .join('');
    continue; 
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