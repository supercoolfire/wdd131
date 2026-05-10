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
 * Just-In-Time Universal Hydrator v3.0
 * Features:
 * - Precise selector logic (IDs, Classes, Tags)
 * - Support for 'insertion' attribute (replace, append, prepend, before, after)
 * - Robust script configuration detection (handles defer/async attributes)
 * - Optimized recursive rendering for complex nested structures
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
            if (!target) return;

            const nodeData = data[selector];
            const insertion = nodeData.insertion || 'replace';

            // Handle the 'replace' logic with tag matching
            if (insertion === 'replace') {
                target.innerHTML = '';
                if (target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
                    appendChildrenAndAttributes(target, nodeData);
                    return;
                }
            }

            // Create the new node and insert it according to the specified method
            const element = renderNode(nodeData);
            switch (insertion) {
                case 'prepend':
                    target.prepend(element);
                    break;
                case 'append':
                    target.appendChild(element);
                    break;
                case 'before':
                    target.before(element);
                    break;
                case 'after':
                    target.after(element);
                    break;
                case 'replace':
                default:
                    target.appendChild(element);
                    break;
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
        if (key === 'tag' || key === 'insertion') return; // Metadata for the hydrator

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