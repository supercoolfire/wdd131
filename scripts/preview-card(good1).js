/**
 * preview-card.js v1.4 (Deferred Mobile Anchor Fix)
 * (C) Jayser Pilapil 2026
 * Automatically loads content from href into .preview elements with "preview-" id prefix.
 */
(function initPreviewCards() {
    console.log("Preview Card script v4.4 loaded - Click Bubbling Fixed");

    // 1. Inject Styles
    const style = document.createElement('style');
    style.textContent = `
        .loading-dots {
            font-weight: bold;
        }
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
        div.card > a {
            text-decoration: none;
            color: inherit;
            display: inline-block;
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
                <div class="loading-indicator">Tap / Hover to preview</div>
            `;
            card.dataset.seoLoaded = "true";
            
            // Mouseenter logic for desktop
            card.addEventListener('mouseenter', () => {
                if (!card.classList.contains('active') && !card.dataset.transforming) {
                    transformToAnchorAndLoad(card, url);
                }
            });
            
            // Click interceptor for mobile / fallback desktop click
            card.addEventListener('click', (e) => handleClick(e, card, url));

        } catch (err) {
            card.innerHTML = '<p style="padding:10px; font-size:11px;">Meta preview unavailable</p>';
        }
    };

    // Swaps wrapper dynamically AFTER the current click event finishes executing
    const transformToAnchorAndLoad = (card, url) => {
        card.dataset.transforming = "true";
        card.classList.add('active');

        // First, append the visual iframe layout immediately
        loadFullPreview(card, url);

        // Defer the DOM structural change to the NEXT event cycle.
        // This prevents the ongoing click event from triggering the new <a> tag.
        setTimeout(() => {
            // Check if it hasn't been transformed already by a racing event
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
        const container = card.querySelector('.preview-iframe-container');
        if (!container) return;

        const data = cache.get(url);
        if (!data) return;

        const iframe = document.createElement('iframe');
        const baseUrl = new URL(url, window.location.origin).href;
        const baseTag = `<base href="${baseUrl}">`;
        const finalHtml = data.fullHtml.replace('<head>', `<head>${baseTag}`);
        
        iframe.srcdoc = finalHtml;
        container.appendChild(iframe);
        
        const indicator = card.querySelector('.loading-indicator');
        if (indicator) indicator.style.display = 'none';
    };

    const handleClick = (e, card, url) => {
        // If it isn't active yet, this is the 1st click (Mobile Layout)
        if (!card.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
            
            transformToAnchorAndLoad(card, url);
        }
        // If it IS active, but the anchor wrapping process is still inside the setTimeout timeout window:
        else if (card.dataset.transforming === "true") {
            e.preventDefault();
            e.stopPropagation();
        }
        // 2nd Click onwards: It is an active <a>, native browsing redirection proceeds automatically.
    };

    const initAll = () => {
        const targets = document.querySelectorAll('.preview[id^="preview-"]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadSEO(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        targets.forEach(target => observer.observe(target));
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