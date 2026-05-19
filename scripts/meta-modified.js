/**
 * SEO Meta-Modified Script
 */
(function () {
    const runSEO = () => {
        // --- CONFIGURATION ---
        // 1. First, check for the explicit data attribute
        // 2. Second, target the specific text inside <p id="lastModified">
        let baseDateString = document.querySelector('[data-modified-date]')?.getAttribute('data-modified-date');
        
        if (!baseDateString) {
            const footerElement = document.getElementById('lastModified');
            if (footerElement) {
                // Extracts the date/time string by removing the "Last Modified: " prefix
                baseDateString = footerElement.textContent.replace(/[lL]ast\s+[mM]odified:\s*/, '').trim();
            }
        }

        // If neither is found or available, log to console and stop execution entirely.
        if (!baseDateString) {
            console.log("SEO Meta-Modified Warning: Neither [data-modified-date] nor <p id='lastModified'> was found.");
            return;
        }
        
        // --- DATE CALCULATOR ---
        function getRelativeTimeString(dateInput) {
            const date = new Date(dateInput);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (isNaN(diffInSeconds)) return null;

            const minutes = Math.floor(diffInSeconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            const months = Math.floor(days / 30.44); 
            const years = Math.floor(days / 365.25); 

            if (diffInSeconds < 60) return "just now";
            if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
            return `${years} year${years > 1 ? 's' : ''} ago`;
        }

        const modifiedDate = new Date(baseDateString);
        if (isNaN(modifiedDate.getTime())) {
            console.log(`SEO Meta-Modified Error: Failed to parse date string "${baseDateString}"`);
            return;
        }

        const isoString = modifiedDate.toISOString();
        const relativeString = getRelativeTimeString(modifiedDate);

        // --- 1. OPEN GRAPH META TAG MANAGEMENT ---
        let metaTag = document.querySelector('meta[property="article:modified_time"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('property', 'article:modified_time');
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', isoString);

        // --- 2. STRUCTURED DATA (SCHEMA.ORG JSON-LD) ---
        let schemaScript = document.getElementById('seo-meta-modified-schema');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = 'seo-meta-modified-schema';
            schemaScript.type = 'application/ld+json';
            document.head.appendChild(schemaScript);
        }

        const schemaData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": window.location.href,
            "url": window.location.href,
            "dateModified": isoString,
            "description": `Updated ${relativeString}` 
        };

        schemaScript.textContent = JSON.stringify(schemaData, null, 2);
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', runSEO);
    } else {
        runSEO();
    }
})();