/**
 * ============================================================================
 * AUTHOR  : Jayser Pilapil
 * COPYLEFT: 2026
 * ============================================================================
 */

/**
 * Navigation Event Handlers & Hydration
 */
function bindNavEvents() {
    const carousel = document.getElementById('carousel');
    const stalkmate = document.getElementById('stalkmate');
    const carouselMen = document.getElementById('carouselMen');
    const stalkmateMen = document.getElementById('stalkmateMen');

    if (carouselMen && stalkmateMen) {
        carouselMen.addEventListener('click', (e) => {
            e.preventDefault();
            if (stalkmate) stalkmate.innerHTML = '';
            if (carousel) carousel.style.display = 'block';

            const userNavBtn = document.getElementById('userNavBtn');
            if (userNavBtn) userNavBtn.classList.remove('show');
        });

        stalkmateMen.addEventListener('click', async (e) => {
            e.preventDefault();
            if (carousel) carousel.style.display = 'none';
            if (stalkmate) stalkmate.style.display = 'block';
            await generateStalkmate();
            const userNavBtn = document.getElementById('userNavBtn');
            if (userNavBtn) userNavBtn.classList.add('show');
        });
        
        console.log("Stalkyard navigation events successfully bound!");
    } else {
        console.warn("Target menu elements not found in DOM yet.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const stalkmate = document.getElementById('stalkmate');
    if (stalkmate) stalkmate.style.display = 'none'; 
    if (window.navIsHydrated) bindNavEvents();
});

document.addEventListener('hydrationFinished', () => {
    window.navIsHydrated = true; 
    bindNavEvents();
    // stalkmateMen.click(); // test temporary
});

/**
 * Core Data Fetching and Dynamic UI Injection
 */
let isStalkmateLoading = false;

async function generateStalkmate() {
    const header = document.querySelector('header');
    const stalkmate = document.getElementById('stalkmate');
    const jsonFile = './data/classmate.json';
    
    if (!stalkmate || isStalkmateLoading) return;
    isStalkmateLoading = true;

    // Flush existing markup immediately
    stalkmate.innerHTML = '';

    try {
        // --- PHASE 0: Global Navigation Collapse Observers ---
        // Runs in parallel with Phase 1 logic
        const mainnav = document.querySelector('.navigation'); // Adjust selectors if your DOM layout differs
        const hambutton = document.querySelector('#menu');
        
        if (mainnav && hambutton) {
            const navLinks = mainnav.querySelectorAll('a');
            navLinks.forEach(item => {
                item.addEventListener('click', () => {
                    mainnav.classList.remove('show');
                    hambutton.classList.remove('show');
                });
            });
        }

        // --- FETCH RAW SOURCE DATA ---
        const response = await fetch(jsonFile);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const rawData = (await response.text()).trim();
        let items = [];

        try {
            items = JSON.parse(rawData);
        } catch {
            try {
                items = Function(`"use strict"; return (${rawData})`)();
            } catch (jsolErr) {
                throw new Error(`Failed parsing data structure. Details: ${jsolErr.message}`);
            }
        }

        if (!Array.isArray(items)) throw new Error("Target root format structure must parse as an Array.");

        const cache = new Map();

        // Data Deduplication Guard
        const uniqueItems = [];
        const seenUsernames = new Set();
        
        for (const item of items) {
            if (item.username && !seenUsernames.has(item.username)) {
                seenUsernames.add(item.username);
                uniqueItems.push(item);
            }
        }
        
        uniqueItems.sort((a, b) => a.name.localeCompare(b.name));

        // --- PHASE 1: Scaffold Skeleton and Base Component UI Styles First ---
        injectPreviewStyles();

        // Sticky Name Navigation Trigger Element setup
        let userNavBtn = document.getElementById('userNavBtn');
        if (!userNavBtn) {
            userNavBtn = document.createElement('button');
            userNavBtn.textContent = 'Names';
            userNavBtn.id = 'userNavBtn';
            header.appendChild(userNavBtn);
        }

        const userNavUl = document.createElement('ul');
        userNavUl.id = "userNavList";
        stalkmate.appendChild(userNavUl);

        userNavBtn.onclick = (e) => {
            e.preventDefault();
            userNavUl.classList.toggle('show');
            userNavBtn.classList.toggle('active');
        };

        // Construct quick navigation layout
        for (const item of uniqueItems) {
            const innerHtml = `<li><a href="#${item.username}">${item.name}</a></li>`;
            userNavUl.innerHTML += innerHtml;
        }

        // Also bind the Phase 0 behavior to the newly generated stalkmate inner navigation elements
        const localNavLinks = userNavUl.querySelectorAll('a');
        localNavLinks.forEach(item => {
            item.addEventListener('click', () => {
                if (mainnav) mainnav.classList.remove('show');
                if (hambutton) hambutton.classList.remove('show');
            });
        });

        // Track cards needing SEO data retrieval downstream
        const pendingSeoTasks = [];

        // Structural Skeleton Layout injection loop
        for (const item of uniqueItems) {
            const username = item.username ? item.username.trim().replace(/\s+/g, '') : '';
            const name = item.name;
            const links = [
                { link: `https://github.com/${username}/wdd131/`, text: `${username}'s Repository` },
                { link: `https://${username}.github.io/wdd131/week01/basic-layout.html`, text: "W01 Learning Activity: HTML and CSS Review" },
                { link: `https://${username}.github.io/wdd131/index.html`, text: "W01 Assignment: Home Page" },
                { link: `https://${username}.github.io/wdd131/week02/media-query.html`, text: "W02 Learning Activities: CSS Media Queries" },
                { link: `https://${username}.github.io/wdd131/temples.html`, text: "W02 Assignment: Picture Album" },
                { link: `https://${username}.github.io/wdd131/week03/design.html`, text: "W03 Learning Activity: Design Principles" },
                { link: `https://${username}.github.io/wdd131/week03/pseudo.html`, text: "W03 Learning Activity: CSS Pseudo-Selectors" },
                { link: `https://${username}.github.io/wdd131/week03/responsive-images.html`, text: "W03 Learning Activity: Responsive Images" },
                { link: `https://${username}.github.io/wdd131/place.html`, text: "W03 Assignment: Country Page" },
                { link: `https://${username}.github.io/wdd131/week04/lazyload.html`, text: "W04 Learning Activity: Lazyloading Images" },
                { link: `https://${username}.github.io/wdd131/filtered-temples.html`, text: "W04 Assignment: Picture Album Enhancement" },
                { link: `https://${username}.github.io/wdd131/project/siteplan.html`, text: "W05 Project: Website Planning Document" },
                { link: `https://${username}.github.io/wdd131/week05/Form-start/index.html`, text: "W05 Learning Activity: Building a Web Form" },
                { link: `https://${username}.github.io/wdd131/week05/form.html`, text: "W05 Learning Activity: Building a Web Form" },
                { link: `https://${username}.github.io/wdd131/bom.html`, text: "W05 Learning Activity: bom" },
                { link: `https://${username}.github.io/wdd131/week05/bom.html`, text: "W05 Learning Activity: bom" },
                { link: `https://${username}.github.io/wdd131/week05/book_of_mormon.html`, text: "W05 Learning Activity: book_of_mormon" },
                { link: `https://${username}.github.io/wdd131/book_of_mormon.html`, text: "W05 Learning Activity: book_of_mormon" },
                { link: `https://${username}.github.io/wdd131/form.html`, text: "W05 Assignment: Product Review Form" },
                { link: `https://${username}.github.io/wdd131/review.html`, text: "W05 Assignment: Product Review Form" },
            ];

            if (item.other_links && Array.isArray(item.other_links)) {
                links.push(...item.other_links);
            }

            const userDiv = document.createElement('div');
            userDiv.className = 'users';
            stalkmate.appendChild(userDiv);

            const userDivh2 = document.createElement('h2');
            userDivh2.id = `${username}`;
            userDivh2.textContent = `${name} - ${username}`;
            userDiv.appendChild(userDivh2);

            const cardsDiv = document.createElement('div');
            cardsDiv.className = 'cards';
            userDiv.appendChild(cardsDiv);

            links.forEach((link, index) => {
                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';

                const uniqueId = `preview-${username}-${index}`;
                
                cardDiv.innerHTML = `
                    <a class="anchor" href="${link.link}" target="_blank" rel="noopener">
                        <div id="${uniqueId}" class="preview" data-href="${link.link}">
                            <div class="preview-content">
                                <p class="loading-dots">Loading preview</p>
                            </div>
                        </div>
                        <span class="link-label">${link.text}</span>
                    </a>
                `;

                cardsDiv.appendChild(cardDiv);

                const previewContainer = cardDiv.querySelector(`#${uniqueId}`);
                
                // Track dynamic task context for Phase 2 processing step
                pendingSeoTasks.push({ element: previewContainer, url: link.link });
            });
        }

        // --- PHASE 2: Load Meta SEO Content Asynchronously in Background ---
        pendingSeoTasks.forEach(task => {
            fetchAndRenderSEO(task.element, task.url, cache);
        });

    } catch (err) {
        console.error(`❌ Script configuration break: ${err.message}`);
    } finally {
        isStalkmateLoading = false;
    }
}

/**
 * Filter and retain live/reachable endpoints via HEAD validation requests
 */
async function getValidLinks(urlArray) {
    const linkChecks = urlArray.map(async (item) => {
        const formattedLink = item.link.startsWith('http') ? item.link : `https://${item.link}`;
        try {
            const response = await fetch(formattedLink, { method: 'HEAD' });
            return response.ok ? item : null;
        } catch {
            return null;
        }
    });

    const results = await Promise.all(linkChecks);
    return results.filter(item => item !== null);
}

/**
 * Fetches dynamic parameters out of external target documents
 */
async function fetchAndRenderSEO(cardElement, url, cache) {
    if (!cardElement) return;
    const contentWrapper = cardElement.querySelector('.preview-content');

    try {
        let seoData;

        if (cache.has(url)) {
            seoData = cache.get(url);
        } else {
            const response = await fetch(url);
            if (!response.ok) {
                renderFallback(contentWrapper);
                return;
            }

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            const metadataTitle = doc.title || "";
            const metadataDesc = doc.querySelector('meta[name="description"]')?.content || "";

            if (!metadataTitle && !metadataDesc) {
                renderFallback(contentWrapper);
                return;
            }

            seoData = {
                title: metadataTitle || "Untitled Resource Assignment",
                description: metadataDesc || "No document meta description available for layout parsing.",
                fullHtml: htmlText
            };

            cache.set(url, seoData);
        }

        contentWrapper.innerHTML = `
            <div class="preview-seo">
                <strong>${seoData.title}</strong>
                <p>${seoData.description}</p>
            </div>
            <div class="preview-iframe-container"></div>
            <div class="loading-indicator">Hover to load frame</div>
        `;
        cardElement.dataset.seoLoaded = "true";

        // --- PHASE 3: Listen for mouseenter, Compile Live View Frame and Append Isolated Encapsulated Styles ---
        cardElement.addEventListener('mouseenter', () => {
            handleFrameCompilation(cardElement, url, seoData.fullHtml);
        });

    } catch (err) {
        renderFallback(contentWrapper);
    }
}

/**
 * Reusable layout injector for missing or unreachable resources
 */
function renderFallback(contentWrapper) {
    contentWrapper.innerHTML = `
        <div class="preview-fallback">
            <p class="loading-dots">No activity or assignment yet</p>
        </div>
    `;
}

/**
 * Compiles preview frames asynchronously only when requested via user interaction
 */
function handleFrameCompilation(cardElement, url, fullHtml) {
    if (cardElement.classList.contains('active') || cardElement.dataset.loadingFrame === "true") return;
    cardElement.dataset.loadingFrame = "true";

    const container = cardElement.querySelector('.preview-iframe-container');
    if (!container) return;

    const iframe = document.createElement('iframe');
    const absoluteUrl = new URL(url, document.baseURI).href;
    const baseTag = `<base href="${absoluteUrl}">`;
    
    let finalHtml = fullHtml;
    const headMatch = finalHtml.match(/<head[^>]*>/i);
    if (headMatch) {
        finalHtml = finalHtml.replace(headMatch[0], `${headMatch[0]}\n    ${baseTag}`);
    } else {
        finalHtml = baseTag + finalHtml;
    }
    
    iframe.srcdoc = finalHtml;
    container.appendChild(iframe);

    iframe.onload = () => {
        cardElement.classList.add('active');
        const indicator = cardElement.querySelector('.loading-indicator');
        if (indicator) indicator.style.display = 'none';
        delete cardElement.dataset.loadingFrame;
    };
}

/**
 * Shared Style Sheet Initialization Tool
 */
function injectPreviewStyles() {
    if (document.getElementById('preview-card-styles')) return;
    const style = document.createElement('style');
    style.id = 'preview-card-styles';
    style.textContent = `
        .loading-dots { font-weight: bold; margin: 0; padding: 12px; font-size: 12px; color: #777; }
        .loading-dots::after { content: ''; animation: dots 1.5s infinite steps(4); }
        @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }
        
        .preview[id^="preview-"] { width: 200px; aspect-ratio: 3 / 4; overflow: hidden; border: 1px solid #ccc; border-radius: 8px; background: #fdfdfd; position: relative; display: flex; flex-direction: column; font-family: sans-serif; transition: transform 0.2s ease; }
        .preview[id^="preview-"]:hover { transform: scale(1.02); z-index: 10; cursor: pointer; }
        
        .preview-content { width: 100%; height: 100%; display: flex; flex-direction: column; }
        .preview-seo { padding: 12px; font-size: 13px; color: #333; height: 100%; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
        .preview-seo strong { font-size: 14px; color: #000; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .preview-seo p { margin: 0; font-size: 11px; color: #666; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        
        .preview-fallback { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; background: #f7f7f7; }
        .preview-fallback .loading-dots { font-weight: normal; color: #999; }

        .preview-iframe-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; }
        .preview[id^="preview-"].active .preview-iframe-container { opacity: 1; }
        .preview[id^="preview-"] iframe { width: 400%; height: 400%; transform: scale(0.25); transform-origin: 0 0; border: none; }
        
        .loading-indicator { position: absolute; bottom: 5px; right: 8px; font-size: 10px; color: #999; font-style: italic; }
        div.card { margin-bottom: 15px; display: inline-block; vertical-align: top; }
        div.card > a { text-decoration: none; color: inherit; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .link-label { max-width: 200px; text-align: center; font-size: 12px; padding: 0 4px; }
    `;
    document.head.appendChild(style);
}