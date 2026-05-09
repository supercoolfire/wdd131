/* 
Usage:
1. Add the script tag to your HTML <head> element, with the appropriate data attributes:
    <script 
        src="scripts/hydrate-v2.js" 
        data-production-file="data/production-project1.json" 
        data-placeholder-file="data/placeholder-project1.json" 
        data-production="true" 
        defer>
    </script>

*/


/**
 * Just-In-Time Universal Hydrator v2.6
 * Strictly follows the <selector> : {tag: <tag name>, <attribute>: <value>} pattern.
 */

const startJITHydration = async () => {
    // document.currentScript is null if the script is deferred or a module.
    // We fall back to finding the script by its filename.
    const scriptEl = document.currentScript || document.querySelector('script[src*="hydrate-v2.js"]');
    
    if (!scriptEl) {
        console.error("Hydration script element not found.");
        return;
    }

    const config = scriptEl.dataset;
    const dataFile = config.production === "true" ? config.productionFile : config.placeholderFile;

    console.log(`Hydrating from: ${dataFile}`);

    if (!dataFile) return;

    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        Object.keys(data).forEach(selector => {
            const target = document.querySelector(selector);
            if (target) {
                // Clear placeholder text like "Loading..."
                target.innerHTML = '';
                
                // If the top-level selector matches an existing element (like #course-title),
                // we merge the children/attributes rather than nesting the tag inside itself.
                if (target.tagName.toLowerCase() === data[selector].tag.toLowerCase()) {
                    appendChildrenAndAttributes(target, data[selector]);
                } else {
                    const element = renderNode(data[selector]);
                    target.appendChild(element);
                }
            }
        });
    } catch (err) {
        console.error("Hydration failure:", err);
    }
};

/**
 * Creates a DOM node and recursively builds its structure
 */
function renderNode(nodeData) {
    const el = document.createElement(nodeData.tag);
    appendChildrenAndAttributes(el, nodeData);
    return el;
}

/**
 * Helper to apply attributes and handle the 'items' array recursion
 */
function appendChildrenAndAttributes(element, data) {
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'tag') return; // Already handled by createElement

        if (key === 'items' && Array.isArray(value)) {
            // Recursively build child nodes
            value.forEach(itemData => {
                element.appendChild(renderNode(itemData));
            });
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            // Treat everything else as a standard HTML5 attribute
            // (href, src, loading, target, class, id, etc.)
            element.setAttribute(key, value);
        }
    });
}

startJITHydration();