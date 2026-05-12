/**
 * Just-In-Time Universal Hydrator v3.1
 * Usage:
 * <script src="../scripts/hydrate-v3.js" data-production-file="../data/week02.json"
 *     data-placeholder-file="../data/week02.json" data-production="false" defer>
 * </script>
 * Example JSON structure for hydration: <div class="sample"></div> is injected as first child of <main>
 * {
 *   "main": {
 *     "insertion": "prepend",
 *     "tag": "div",
 *     "class": "sample",
 *     "items": [
 *       {
 *         "tag": "p",
 *         "id": "welcome",
 *         "textContent": "Hello hydrators!"
 *       },
 *       {
 *         "tag": "a",
 *         "href": "#",
 *         "target": "_blank",
 *         "textContent": "nothing here"
 *       }
 *     ]
 *   }
 * }
 */

const startJITHydration = async () => {
    // Falls back to finding the script by its filename if currentScript is null
    const scriptEl = document.currentScript || document.querySelector('script[src*="hydrate-v3.js"]');
    
    if (!scriptEl) {
        console.error("Hydration script element not found.");
        return;
    }

    const config = scriptEl.dataset;
    const dataFile = config.production === "true" ? config.productionFile : config.placeholderFile;

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

            if (insertion === 'replace') {
                target.innerHTML = '';
                if (target.tagName.toLowerCase() === nodeData.tag.toLowerCase()) {
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

        // DISPATCH EVENT: This allows rickster-egg.js to know the elements now exist
        document.dispatchEvent(new CustomEvent('hydrationComplete'));

    } catch (err) {
        console.error("Hydration failure:", err);
    }
};

function renderNode(nodeData) {
    const el = document.createElement(nodeData.tag);
    appendChildrenAndAttributes(el, nodeData);
    return el;
}

function appendChildrenAndAttributes(element, data) {
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'tag' || key === 'insertion') return;

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