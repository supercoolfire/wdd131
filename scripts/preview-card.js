/**
 * preview-card.js v1.0
 * (C) Jayser Pilapil 2026
 * Automatically loads content from href into .preview elements with "preview-" id prefix.
 * 
 * Features:
 * - 200px width, 3:4 aspect ratio.
 * - Replaces initial innerHTML (loading state) with fetched content.
 * - Handles hydration sync (waits for hydrationComplete if necessary).
 * 
 * Requirements:
 * - Preview cards must have a unique id starting with "preview-".
 * - Preview cards must have a href attribute pointing to the page to preview. 
 * - Preview cards must have a loading-dots element as the initial innerHTML.
 * 
 * Usage:
 * <div class="preview" id="preview-home" href="/">
 *     <p class="loading-dots">Loading home preview</p>
 * </div>
 */
(function initPreviewCards() {
    console.log("Preview Card script v4.2 loaded - Bandwidth Optimized");

    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        
        .loading-dots {
                font-weight: bold;
            }
            /* Create the dots dynamically */
        .loading-dots::after {
            content: '';
            animation: dots 1.5s infinite steps(4);
        }

        @keyframes dots {
            0%   { content: ''; }
            25%  { content: '.'; }
            50%  { content: '..'; }
            75%  { content: '...'; }
        }

        .preview[id^="preview-"] {
            width: 200px;
            aspect-ratio: 3 / 4;
            overflow: hidden;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #fdfdfd;
            position: relative;
            display: flex;
            flex-direction: column;
            font-family: sans-serif;
            transition: transform 0.2s ease;
        }
        .preview[id^="preview-"]:hover {
            transform: scale(1.02);
            z-index: 10;
            cursor: pointer;
        }
        .preview-seo {
            padding: 12px;
            font-size: 13px;
            color: #333;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
        }
        .preview-seo strong {
            font-size: 14px;
            color: #000;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .preview-seo p {
            margin: 0;
            font-size: 11px;
            color: #666;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .preview-iframe-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        .preview[id^="preview-"].active .preview-iframe-container {
            opacity: 1;
        }
        .preview[id^="preview-"] iframe {
            width: 400%;
            height: 400%;
            transform: scale(0.25);
            transform-origin: 0 0;
            border: none;
        }
        .loading-indicator {
            position: absolute;
            bottom: 5px;
            right: 8px;
            font-size: 10px;
            color: #999;
            font-style: italic;
        }
    `;
    document.head.appendChild(style);

    const cache = new Map();

    const loadSEO = async (card) => {
        const url = card.getAttribute('href');
        if (!url || card.dataset.seoLoaded === "true") return;

        try {
            let seoData;
            if (cache.has(url)) {
                seoData = cache.get(url).seo;
            } else {
                const response = await fetch(url);
                const htmlText = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, "text/html");
                
                seoData = {
                    title: doc.title || "No title found",
                    description: doc.querySelector('meta[name="description"]')?.content || "No description available.",
                    fullHtml: htmlText
                };
                cache.set(url, { seo: seoData, fullHtml: htmlText });
            }

            card.innerHTML = `
                <div class="preview-seo">
                    <strong>${seoData.title}</strong>
                    <p>${seoData.description}</p>
                </div>
                <div class="preview-iframe-container"></div>
                <div class="loading-indicator">Hover to load</div>
            `;
            card.dataset.seoLoaded = "true";
            
            // Attach hover to load full preview
            card.addEventListener('mouseenter', () => loadFullPreview(card, url));
        } catch (err) {
            card.innerHTML = '<p style="padding:10px; font-size:11px;">Meta preview unavailable</p>';
        }
    };

    const loadFullPreview = (card, url) => {
        const container = card.querySelector('.preview-iframe-container');
        if (!container || card.classList.contains('active')) return;

        const data = cache.get(url);
        if (!data) return;

        card.classList.add('active');
        const iframe = document.createElement('iframe');
        iframe.srcdoc = data.fullHtml;
        container.appendChild(iframe);
        
        const indicator = card.querySelector('.loading-indicator');
        if (indicator) indicator.style.display = 'none';
    };

    const initAll = () => {
        const targets = document.querySelectorAll('.preview[id^="preview-"]');
        targets.forEach(loadSEO);
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => {
            document.addEventListener('hydrationComplete', initAll);
            initAll();
        });
    } else {
        document.addEventListener('hydrationComplete', initAll);
        initAll();
    }
})();
