/**
 * preview-card.js v3.0 (Pure Static Mapping Mode)
 * (C) Jayser Pilapil 2026
 * Automatically loads content from href into .preview elements with "preview-" id prefix.
 * * Features:
 * - 200px width, 3:4 aspect ratio.
 * - Replaces initial innerHTML (loading state) with fetched content.
 * - Handles hydration sync (waits for hydrationComplete if necessary).
 * - Defer: SEO content loads only when scrolled into view (IntersectionObserver).
 * - Bandwidth: SEO loads first; full visual preview loads only on hover.
 * - Compatibility: Uses <base> tag in iframes to fix relative paths for sub-directory pages (GitHub Pages).
 * * Requirements:
 * - Preview cards must have a unique id starting with "preview-".
 * - Preview cards must have a href attribute pointing to the page to preview. 
 * - Preview cards must have a loading-dots element as the initial innerHTML.
 * * Import:
 <script src="scripts/preview-card.js" defer></script>
 * * Usage:
<a class="preview" id="preview-home" href="/">
    <p class="loading-dots">Loading home preview</p>
</a>
 */
(function initPreviewCards() {
    console.log("Preview Card script v5.2 loaded - Clean Static Mapping Architecture Active");

    // --- DATE CALCULATOR ---
    function getRelativeTimeString(dateInput) {
        const date = new Date(dateInput);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (isNaN(diffInSeconds)) return null;

        const minutes = Math.floor(diffInSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30.44); // Average month length
        const years = Math.floor(days / 365.25); // Account for leap years

        if (diffInSeconds < 60) return "just now";
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }

    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-dots { font-weight: bold; }
        .loading-dots::after { content: ''; animation: dots 1.5s infinite steps(4); }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        .preview[id^="preview-"] { width: 200px; aspect-ratio: 3 / 4; overflow: hidden; border: 1px solid #ccc; border-radius: 8px; background: #fdfdfd; position: relative; display: flex; flex-direction: column; font-family: sans-serif; transition: transform 0.2s ease; }
        .preview[id^="preview-"]:hover { transform: scale(1.02); z-index: 10; cursor: pointer; }
        .preview-seo { padding: 12px; font-size: 13px; color: #333; height: 100%; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .preview-seo strong { font-size: 14px; color: #000; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-seo p { margin: 0; font-size: 11px; color: #666; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-seo .preview-date { font-size: 10px; color: #006621; margin-top: auto; }
        .preview-iframe-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
        .preview[id^="preview-"].active .preview-iframe-container { opacity: 1; }
        .preview[id^="preview-"] iframe { width: 400%; height: 400%; transform: scale(0.25); transform-origin: 0 0; border: none; }
        .loading-indicator { position: absolute; bottom: 5px; right: 8px; font-size: 10px; color: #999; font-style: italic; }
        div.card > a { text-decoration: none; color: inherit; display: inline-block; }
    `;
    document.head.appendChild(style);

    const cache = new Map();

    const loadSEO = async (card) => {
        const url = card.getAttribute('href');
        console.log(`[preview-card] Attempting to load SEO for URL: ${url}`);
        if (!url || card.dataset.seoLoaded === "true") return;

        try {
            let seoData;
            if (cache.has(url)) {
                seoData = cache.get(url).seo;
                console.log(`[preview-card] Using cached SEO data for ${url}`);
            } else {
                console.log(`[preview-card] Fetching raw HTML template: ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for URL: ${url}`);
                
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, "text/html");
                
                seoData = {
                    title: doc.title || "No title found",
                    description: doc.querySelector('meta[name="description"]')?.content || "No description available.",
                    dateModified: null,
                    fullHtml: htmlText
                };

                // Strategy 1: Map from clean static JSON-LD blocks explicitly structured in file source
                const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
                for (const script of jsonLdScripts) {
                    try {
                        const data = JSON.parse(script.textContent);
                        if (data.dateModified && !isNaN(new Date(data.dateModified).getTime())) {
                            seoData.dateModified = data.dateModified;
                            console.log(`[preview-card] Found static dateModified in JSON-LD for ${url}: ${seoData.dateModified}`);
                            break;
                        }
                    } catch (e) {
                        console.error(`[preview-card] Error reading JSON-LD block syntax for ${url}:`, e);
                    }
                }

                // Strategy 2: Map from hardcoded article metadata parameters 
                if (!seoData.dateModified) {
                    const metaTimestamp = doc.querySelector('meta[property="article:modified_time"]')?.content;
                    if (metaTimestamp && !isNaN(new Date(metaTimestamp).getTime())) {
                        seoData.dateModified = metaTimestamp;
                        console.log(`[preview-card] Found static dateModified in meta element property for ${url}: ${seoData.dateModified}`);
                    }
                }

                cache.set(url, { seo: seoData, fullHtml: htmlText });
            }

            let dateDisplay = '';
            if (seoData.dateModified) {
                const relativeTime = getRelativeTimeString(seoData.dateModified);
                if (relativeTime) {
                    dateDisplay = `<span class="preview-date">${relativeTime}</span>`;
                }
            }

            card.innerHTML = `
                <div class="preview-seo">
                    <strong>${seoData.title}</strong>
                    <p>${seoData.description}</p>
                    ${dateDisplay}
                </div>
                <div class="preview-iframe-container"></div>
                <div class="loading-indicator">Tap/Hover to load</div>
            `;
            card.dataset.seoLoaded = "true";
            console.log(`[preview-card] SEO content rendered for ${url}`);
            
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('active') && !card.dataset.transforming) {
                    transformToAnchorAndLoad(card, url);
                }
            });
            card.addEventListener('click', (e) => handleClick(e, card, url));

        } catch (err) {
            console.error(`[preview-card] Fatal fetching exception for ${url}:`, err);
            card.innerHTML = '<p style="padding:10px; font-size:11px;">Meta preview unavailable</p>';
        }
    };

    const transformToAnchorAndLoad = (card, url) => {
        if (card.dataset.transforming === "true") return;
        
        card.dataset.transforming = "true";
        card.classList.add('active');

        loadFullPreview(card, url);

        setTimeout(() => {
            if (card.parentNode && card.parentNode.tagName !== 'A') {
                const linkWrapper = document.createElement('a');
                linkWrapper.href = url;
                card.classList.remove('anchor');
                card.parentNode.insertBefore(linkWrapper, card);
                linkWrapper.appendChild(card);
            }
            delete card.dataset.transforming;
        }, 50); 
    };

    const loadFullPreview = (card, url) => {
        console.log(`[preview-card] Attempting to load full preview for URL: ${url}`);
        const container = card.querySelector('.preview-iframe-container');
        if (!container) return;

        const data = cache.get(url);
        if (!data || !data.fullHtml) return;

        const iframe = document.createElement('iframe');
        const absoluteUrl = new URL(url, document.baseURI).href;
        const baseTag = `<base href="${absoluteUrl}">`;
        
        let finalHtml = data.fullHtml;
        const headMatch = finalHtml.match(/<head[^>]*>/i);
        if (headMatch) {
            finalHtml = finalHtml.replace(headMatch[0], `${headMatch[0]}\n    ${baseTag}`);
        } else {
            finalHtml = baseTag + finalHtml;
        }
        
        iframe.srcdoc = finalHtml;
        container.appendChild(iframe);
        
        const indicator = card.querySelector('.loading-indicator');
        if (indicator) indicator.style.display = 'none';
        console.log(`[preview-card] Full preview rendered for ${url} with base: ${absoluteUrl}`);
    };

    const handleClick = (e, card, url) => {
        if (!card.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
            transformToAnchorAndLoad(card, url);
        } else if (card.dataset.transforming === "true") {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const initAll = () => {
        console.log("[preview-card] Initializing all preview cards.");
        const targets = document.querySelectorAll('.preview[id^="preview-"]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log(`[preview-card] Card intersecting: ${entry.target.getAttribute('href')}`);
                    loadSEO(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        targets.forEach(target => observer.observe(target));
        console.log(`[preview-card] Observing ${targets.length} preview cards.`);
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            console.log("[preview-card] DOMContentLoaded event fired.");
            document.addEventListener('hydrationComplete', initAll);
            initAll();
        });
    } else {
        console.log("[preview-card] DOM already loaded.");
        document.addEventListener('hydrationComplete', initAll);
        initAll();
    }
})();