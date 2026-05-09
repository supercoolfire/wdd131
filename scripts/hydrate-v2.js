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

// Grab configuration JIT from the script tag attributes
const config = document.currentScript.dataset;

// Determine which file to use based on the 'data-production' string
const dataFile = config.production === "true" 
    ? config.productionFile 
    : config.placeholderFile;

async function hydrate() {
    if (!dataFile) return; // Guard clause
    
    try {
        const response = await fetch(dataFile);
        const data = await response.json();
        
        // ... your existing hydration loop ...
        console.log(`Hydrated successfully using: ${dataFile}`);
    } catch (err) {
        console.error("Hydration failed:", err);
    }
}

document.addEventListener("DOMContentLoaded", hydrate);