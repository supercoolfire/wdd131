/**
 * Just-In-Time Universal Hydrator v5.1.2
 * Features:
 * - Support for unique identifiers as keys
 * - Optional 'querySelector' property for explicit targeting
 * - Backward compatible: defaults to key-as-selector if querySelector is missing
 * - Precise selector logic (IDs, Classes, Tags)
 * - Support for 'insertion' attribute (replace, append, prepend, before, after)
 * - Support for 'innerHTML' attribute for raw HTML injection (v4.1)
 * - Support for text-only nodes in 'items' (removes <undefined> tag) (v4.2)
 * - v5.0 Upgrade: Support for complex, multi-type array properties (e.g., srcset/sizes arrays)
 * - v5.1 Upgrade: Support for fetching and inlining external file contents (CSS, JS, TXT) inside 'items'
 * - v5.1.2 Patch: Path resolution targeting Document-Relative paths for direct workspace matching
 * * Usage: 
 * <script src="../scripts/hydrate-v5.1.js" data-file="../data/por-nav.json"></script>
 */

const startJITHydration = async () => {
    // Falls back to finding the script by its filename if currentScript is null
    const scriptEl = document.currentScript || document.querySelector('script[src*="/scripts/hydrate-v5.js"], script[src*="/scripts/hydrate-v5.1.js"]');
    
    if (!scriptEl) {
        console.error("Hydration script element not found.");
        return;
    }

    const config = scriptEl.dataset;
    const dataFile = (config.production === "true" ? config.productionFile : config.placeholderFile) || config.file;

    if (!dataFile) return;

    try {
        const response = await fetch(dataFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // Using for...of loop to handle async processing properly
        for (const key of Object.keys(data)) {
            const nodeData = data[key];
            
            // Use querySelector if provided, otherwise fallback to the key
            const selector = nodeData.querySelector || key;
            const target = document.querySelector(selector);
            
            if (!target) continue;

            const insertion = nodeData.insertion || 'replace';

            // Handle 'replace' logic
            if (insertion === 'replace') {
                target.innerHTML = '';
                if (nodeData.tag && target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
                    await appendChildrenAndAttributes(target, nodeData);
                    continue;
                }
            }

            const element = await renderNode(nodeData);
            switch (insertion) {
                case 'prepend': target.prepend(element); break;
                case 'append': target.appendChild(element); break;
                case 'before': target.before(element); break;
                case 'after': target.after(element); break;
                case 'replace':
                default: target.appendChild(element); break;
            }
        }

        // Notify other scripts that hydration is complete
        document.dispatchEvent(new CustomEvent('hydrationComplete'));

    } catch (err) {
        console.error("Hydration failure:", err);
    }
};

/**
 * Creates a DOM node and recursively builds its structure (Asynchronous)
 */
async function renderNode(nodeData) {
    // Support for string file paths that fetch and inline text data
    if (typeof nodeData === 'string') {
        const trimmedPath = nodeData.trim();
        
        // Detect paths matching file asset profiles
        if (trimmedPath.endsWith('.css') || trimmedPath.endsWith('.js') || trimmedPath.endsWith('.txt') || trimmedPath.includes('/')) {
            try {
                // v5.1.2: Evaluates paths directly relative to the active HTML document location
                const res = await fetch(trimmedPath);
                if (!res.ok) throw new Error(`Could not fetch file: ${trimmedPath}`);
                const fileContent = await res.text();
                return document.createTextNode(fileContent);
            } catch (fileErr) {
                console.error("Inlining asset failed:", fileErr);
                return document.createTextNode(`/* Failed to load: ${trimmedPath} */`);
            }
        }
        // Fallback if it's just plain text, not a file path
        return document.createTextNode(nodeData);
    }

    // Support for raw text nodes if 'tag' is missing
    if (!nodeData.tag && nodeData.textContent) {
        return document.createTextNode(nodeData.textContent);
    }
    const el = document.createElement(nodeData.tag || 'span'); // Default to span if tag is missing and no text
    await appendChildrenAndAttributes(el, nodeData);
    return el;
}

/**
 * Helper to apply attributes and handle recursion (Asynchronous)
 */
async function appendChildrenAndAttributes(element, data) {
    for (const [key, value] of Object.entries(data)) {
        // Skip hydrator-specific metadata
        if (key === 'tag' || key === 'insertion' || key === 'querySelector') continue;

        if (key === 'items' && Array.isArray(value)) {
            for (const itemData of value) {
                element.appendChild(await renderNode(itemData));
            }
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            const attributeValue = Array.isArray(value) ? value.join(', ') : value;
            element.setAttribute(key, attributeValue);
        }
    }
}

startJITHydration();