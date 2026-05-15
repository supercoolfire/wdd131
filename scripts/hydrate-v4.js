/**
 * Just-In-Time Universal Hydrator v4.0
 * Features:
 * - Support for unique identifiers as keys
 * - Optional 'querySelector' property for explicit targeting
 * - Backward compatible: defaults to key-as-selector if querySelector is missing
 * - Precise selector logic (IDs, Classes, Tags)
 * - Support for 'insertion' attribute (replace, append, prepend, before, after)
 * 
 * Usage: 
 * <script src="/scripts/hydrate-v4.js" data-production="true" data-production-file="/data/production.json" data-placeholder-file="/data/placeholder.json"></script>
 * or
 * <script src="/scripts/hydrate-v4.js" data-file="/data/production.json"></script>
 * 
 * JSON Format: production.json
 {
    "unique-id-key": { 
        "querySelector": "CSS-selector", 
        "tag": "HTML-tag-to-create",
        "insertion": "after | before | append | prepend | replace",
        "id": "optional-id",
        "class": "optional-class",
        "textContent": "optional-text",
        "items": [
            {
                "tag": "child-tag",
                "src": "attribute-value",
                "textContent": "child-text"
            }
        ]
    }
}
* 
* Plug-and-Play Example
{
    "sample-file": { 
        "querySelector": "title",
        "tag": "title",
        "insertion": "after",
        "items": [
            { "tag": "script", "src": "/scripts/sample-file.js", "defer": "true"  }
        ]
    }
}
*
* Backward compatibility 
{
"body": {
   "tag": "title", 
   "insertion": "after",
   "items": [
      { "tag": "script", "src": "/scripts/sample-file.js", "defer": "true" }
   ]
}
 */

const startJITHydration = async () => {
    // Falls back to finding the script by its filename if currentScript is null
    const scriptEl = document.currentScript || document.querySelector('script[src*="/scripts/hydrate-v4.js"]');
    
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

        Object.keys(data).forEach(key => {
            const nodeData = data[key];
            
            // v4.0 Logic: Use querySelector if provided, otherwise fallback to the key (v3 behavior)
            const selector = nodeData.querySelector || key;
            const target = document.querySelector(selector);
            
            if (!target) return;

            const insertion = nodeData.insertion || 'replace';

            // Handle 'replace' logic
            if (insertion === 'replace') {
                target.innerHTML = '';
                if (nodeData.tag && target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
                    appendChildrenAndAttributes(target, nodeData);
                    return;
                }
            }

            const element = renderNode(nodeData);
            switch (insertion) {
                case 'prepend': target.prepend(element); break;
                case 'append': target.appendChild(element); break;
                case 'before': target.before(element); break;
                case 'after': target.after(element); break;
                case 'replace':
                default: target.appendChild(element); break;
            }
        });

        // Notify other scripts that hydration is complete
        document.dispatchEvent(new CustomEvent('hydrationComplete'));

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
 * Helper to apply attributes and handle recursion
 */
function appendChildrenAndAttributes(element, data) {
    Object.entries(data).forEach(([key, value]) => {
        // Skip hydrator-specific metadata
        if (key === 'tag' || key === 'insertion' || key === 'querySelector') return;

        if (key === 'items' && Array.isArray(value)) {
            value.forEach(itemData => {
                element.appendChild(renderNode(itemData));
            });
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });
}

startJITHydration();
