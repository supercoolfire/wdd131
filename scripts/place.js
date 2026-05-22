// Keep a reference to the html element wrapper root
const htmlElement = document.documentElement;

// State tracking variables (initialized without hardcoded fallbacks)
let globalTemperature = null;
let globalSpeed = null;
let globalWindChill = null;
let valuesInitialized = false;
let shouldBeDark = null;
localStorage.setItem('tempDark', '5');
localStorage.setItem('windSpeedDark', '10');

/**
 * Updates the application theme state cleanly
 * @param {boolean} shouldBeDark 
 */
function applyTheme(shouldBeDark) {
    // Dynamically query the element in case it was recently injected by the JSON engine
    const themeCheckbox = document.getElementById('theme-slider');
    const tempElement = document.getElementById('temp');
    const speedElement = document.getElementById('windSpeed');
    const weatherConditionElement = document.getElementById('weatherCondition');
    const windChillElement = document.getElementById('windChill');

    // SAFE SEEDING: If our global memory is empty, capture the live numbers directly from the DOM 
    if (!valuesInitialized && tempElement && speedElement) {
        const rawTemp = tempElement.textContent.trim();
        const rawSpeed = speedElement.textContent.trim();
        
        // Only lock them in if they aren't placeholder texts like "Loading"
        if (rawTemp && !isNaN(parseFloat(rawTemp)) && rawSpeed && !isNaN(parseFloat(rawSpeed))) {
            globalTemperature = rawTemp;
            globalSpeed = rawSpeed;
            valuesInitialized = true;
        }
    }

    if (shouldBeDark == true) {
        htmlElement.classList.add('dark-theme');
        localStorage.setItem('theme-preference', 'dark');
        if (themeCheckbox) themeCheckbox.checked = true;

        if (weatherConditionElement) weatherConditionElement.innerHTML = "<a href=\"https://www.youtube.com/watch?v=27VXAOjpCnA\" class=\"figure-link\" target=\"_blank\"> Money Money</a>";
        
        tempDark = localStorage.getItem('tempDark');
        if (tempElement) tempElement.textContent = tempDark;

        speedy = localStorage.getItem('windSpeedDark');
        if (speedElement) speedElement.textContent = speedy;

        // alert(`applyTheme shouldBeDark true|t|s |${tempDark}|${speedy}`)
        calculateWindChill( tempDark, speedy);
    } else {
        htmlElement.classList.remove('dark-theme');
        localStorage.setItem('theme-preference', 'light');
        if (themeCheckbox) themeCheckbox.checked = false;

        if (weatherConditionElement) weatherConditionElement.innerHTML = "<a href=\"https://www.youtube.com/watch?v=jfQSp92L88I\" class=\"figure-link\" target=\"_blank\"> Sunny Day</a>";
        if (tempElement) tempElement.textContent = localStorage.getItem('tempDOM');
        if (speedElement) speedElement.textContent = localStorage.getItem('windSpeedDOM');
        calculateWindChill( localStorage.getItem('tempDOM'), localStorage.getItem('windSpeedDOM'));
        
        // alert(`applyTheme shouldBeDark false|t|s: ${shouldBeDark}|${tempElement.textContent}|${speedElement.textContent}`)
    }
}

// Fetch temp from data/place.json
// 1. Reusable helper to scan the JSON tree recursively for any key/value pair
function findDeep(object, key, value) {
    if (object[key] === value) return object;
    
    if (object.items && Array.isArray(object.items)) {
        for (const child of object.items) {
            const found = findDeep(child, key, value);
            if (found) return found;
        }
    }
    return null;
}

// 2. The async function to fetch and target just the temperature string
async function getTemperatureOnly() {
    try {
        const response = await fetch('data/place.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        // Find the node where id is "temp"
        const tempNode = findDeep(data, 'id', 'temp');
        
        if (tempNode) {
            return tempNode.textContent; 
        } else {
            throw new Error("Could not find element with id 'temp' in the JSON file.");
        }
    } catch (error) {
        // console.error("Error:", error);
    }
}

// Async function to fetch and target just the wind speed string
async function getWindSpeedOnly() {
    try {
        const response = await fetch('data/place.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const data = await response.json();
        
        // Find the node where id is "windSpeed"
        const windNode = findDeep(data, 'id', 'windSpeed');
        
        if (windNode) {
            return windNode.textContent; 
        } else {
            throw new Error("Could not find element with id 'windSpeed' in the JSON file.");
        }
    } catch (error) {
        // console.error("Error:", error);
    }
}

// Function to live-sync data from the JSON file on the fly
function syncWeatherData() {
    Promise.all([getTemperatureOnly(), getWindSpeedOnly()]).then(([temperature, windSpeed]) => {
        const tempElement = document.getElementById('temp');
        const speedElement = document.getElementById('windSpeed');
        const isDark = htmlElement.classList.contains('dark-theme');

        // Update memory references if the backend values changed
        if (temperature) globalTemperature = temperature;
        if (windSpeed) globalSpeed = windSpeed;

        // ONLY apply data updates to the actual UI layout elements if the user is in light mode
        if (!isDark) {
            if (tempElement && globalTemperature !== null) tempElement.textContent = globalTemperature;
            if (speedElement && globalSpeed !== null) speedElement.textContent = globalSpeed;
        }
    });
}

// Initial pull on execution boot (Initial state setup)
syncWeatherData();


// 1. EVALUATE PREFERENCE IMMEDIATELY ON CORE INITIALIZATION
const savedUserPreference = localStorage.getItem('theme-preference');
if (savedUserPreference === 'dark') {
    applyTheme(true);
} else {   
    applyTheme(false); // Default light theme fallback
}

// 2. EVENT DELEGATION: Catch change events bubbling up to the document level
document.addEventListener('change', (e) => {
    // Verify if the event target is our dynamically hydrated input slider element
    if (e.target && e.target.id === 'theme-slider') {
        applyTheme(e.target.checked);
    }
});

// 3. MUTATION OBSERVER TRACKING (Ensures checkbox matches state once injected)
const observer = new MutationObserver(() => {
    const themeCheckbox = document.getElementById('theme-slider');
    if (themeCheckbox) {
        // Synchronize the checkbox state to match the calculated HTML theme class
        const isDark = htmlElement.classList.contains('dark-theme');
        themeCheckbox.checked = isDark;
        observer.disconnect(); // Stop watching once synchronized successfully
    }
});

observer.observe(document.body || htmlElement, { childList: true, subtree: true });


// =========================================================================
// 4. BOUNDED DRAG & DROP ENGINE (Proximity Anchor Tracker with Sticky Boundaries)
// =========================================================================
let highestZIndex = 10;

/**
 * Standalone Card Dragging Engine
 * @param {string} cardSelector - The CSS selector for the draggable targets (e.g., '.card')
 * @param {string} containerSelector - The CSS selector for the boundary parent (e.g., '.hero')
 * @param {MediaQueryList} mediaQuery - A window.matchMedia() instance that dictates when dragging is allowed
 */
function initializeCardDragging(cardSelector, containerSelector, mediaQuery) {
    const cards = document.querySelectorAll(cardSelector);
    const hero = document.querySelector(containerSelector);
    
    if (!hero || cards.length === 0) return;

    cards.forEach(card => {
        let isDragging = false;
        let grabPercentX = 0;
        let grabPercentY = 0;

        // Named event handlers bound to the instance
        const onMouseDown = (e) => handleDragStart(e, 'mouse');
        const onTouchStart = (e) => handleDragStart(e, 'touch');

        function handleDragStart(e, type) {
            // Guard clause: Reject execution if the provided media query doesn't match
            if (mediaQuery && !mediaQuery.matches) return;

            if (e.target.closest('input') || e.target.closest('button') || e.target.closest('label') || e.target.closest('a')) {
                return; 
            }

            const clientX = type === 'touch' ? e.touches[0].clientX : e.clientX;
            const clientY = type === 'touch' ? e.touches[0].clientY : e.clientY;
            const cardRect = card.getBoundingClientRect();

            grabPercentX = (clientX - cardRect.left) / cardRect.width;
            grabPercentY = (clientY - cardRect.top) / cardRect.height;

            isDragging = true;
            card.style.cursor = 'grabbing';
            highestZIndex++;
            card.style.zIndex = highestZIndex;

            card.style.borderTop = '';
            card.style.borderRight = '';
            card.style.borderBottom = '';
            card.style.borderLeft = '';

            window.addEventListener('mousemove', dragging);
            window.addEventListener('touchmove', dragging, { passive: false });
            window.addEventListener('mouseup', dragEnd);
            window.addEventListener('touchend', dragEnd);

            if (e.cancelable) e.preventDefault();
        }

        function dragging(e) {
            if (!isDragging) return;
            
            // Runtime protection if screen resizes or flips mid-drag
            if (mediaQuery && !mediaQuery.matches) {
                dragEnd();
                return;
            }

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const heroRect = hero.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            let targetLeftPx = (clientX - heroRect.left) - (grabPercentX * cardRect.width);
            let targetTopPx = (clientY - heroRect.top) - (grabPercentY * cardRect.height);

            let targetLeftPercent = (targetLeftPx / heroRect.width) * 100;
            let targetTopPercent = (targetTopPx / heroRect.height) * 100;

            const maxLeftPercent = ((heroRect.width - cardRect.width) / heroRect.width) * 100;
            const maxTopPercent = ((heroRect.height - cardRect.height) / heroRect.height) * 100;

            card.style.borderTop = '';
            card.style.borderRight = '';
            card.style.borderBottom = '';
            card.style.borderLeft = '';

            if (targetLeftPercent <= 0) {
                targetLeftPercent = 0;
                card.style.borderLeft = '2px solid red';
            }
            if (targetLeftPercent >= maxLeftPercent) {
                targetLeftPercent = maxLeftPercent;
                card.style.borderRight = '2px solid red';
            }
            if (targetTopPercent <= 0) {
                targetTopPercent = 0;
                card.style.borderTop = '2px solid red';
            }
            if (targetTopPercent >= maxTopPercent) {
                targetTopPercent = maxTopPercent;
                card.style.borderBottom = '2px solid red';
            }

            card.style.left = `${targetLeftPercent}%`;
            card.style.top = `${targetTopPercent}%`;
            card.style.right = 'auto'; 
            card.style.bottom = 'auto'; 
            card.style.margin = '0'; 
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            card.style.cursor = (mediaQuery && mediaQuery.matches) ? 'grab' : 'unset';

            const heroRect = hero.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            const distanceToLeft = cardRect.left - heroRect.left;
            const distanceToTop = cardRect.top - heroRect.top;
            const distanceToRight = heroRect.right - cardRect.right;
            const distanceToBottom = heroRect.bottom - cardRect.bottom;

            if (distanceToLeft <= distanceToRight) {
                card.style.left = `${(distanceToLeft / heroRect.width) * 100}%`;
                card.style.right = 'auto';
            } else {
                card.style.right = `${(distanceToRight / heroRect.width) * 100}%`;
                card.style.left = 'auto';
            }

            if (distanceToTop <= distanceToBottom) {
                card.style.top = `${(distanceToTop / heroRect.height) * 100}%`;
                card.style.bottom = 'auto';
            } else {
                card.style.bottom = `${(distanceToBottom / heroRect.height) * 100}%`;
                card.style.top = 'auto';
            }

            window.removeEventListener('mousemove', dragging);
            window.removeEventListener('touchmove', dragging);
            window.removeEventListener('mouseup', dragEnd);
            window.removeEventListener('touchend', dragEnd);
        }

        // Handles cleanup and binding states toggled by changes in viewport size
        function evaluateListeners() {
            if (!mediaQuery || mediaQuery.matches) {
                card.addEventListener('mousedown', onMouseDown);
                card.addEventListener('touchstart', onTouchStart, { passive: false });
                card.style.cursor = 'grab';
            } else {
                card.removeEventListener('mousedown', onMouseDown);
                card.removeEventListener('touchstart', onTouchStart);
                
                // Reset styling properties so default responsive styles rule mobile layout
                card.style.cursor = 'unset';
                card.style.left = '';
                card.style.top = '';
                card.style.right = '';
                card.style.bottom = '';
                card.style.margin = '';
                card.style.zIndex = '';
                card.style.border = '';
            }
        }

        evaluateListeners();

        if (mediaQuery) {
            mediaQuery.addEventListener('change', evaluateListeners);
        }
    });
}



// 5. EXTEND OBSERVATION ENGINE: Trigger drag initialization once cards populate
const dragInitObserver = new MutationObserver(() => {
    const cards = document.querySelectorAll('.card');
    const hero = document.querySelector('.hero');
    
    if (cards.length > 0 && hero) {
        // Create the media query parameter context here
        const desktopBreakpoint = window.matchMedia('(min-width: 800px)');
        
        // Pass the query along to the standalone engine initialization
        initializeCardDragging('.card', '.hero', desktopBreakpoint);
        
        dragInitObserver.disconnect();
    }
});

dragInitObserver.observe(document.body || htmlElement, { childList: true, subtree: true });

document.getElementById('currentyear').textContent = new Date().getFullYear();
document.getElementById('lastModified').textContent = `Last Modified: ${document.lastModified}`;


// =========================================================================
// 6. WEATHER ENGINE: WIND CHILL CALCULATOR LAYER
// =========================================================================

function displayWindChill() {
    // Get DOM elements first and validate they exist
    const tempElement = document.querySelector("#temp");
    const windSpeedElement = document.querySelector("#windSpeed");

    
    // alert(`displayWindChill tempElement | windSpeedElement | hotChileElement ${tempElement.textContent} ${windSpeedElement.textContent} ${hotChileElement.textContent}`)
    // Guard clause to exit if any required element is missing
    if (!tempElement || !windSpeedElement) {
        // alert(`displayWindChill missing required elements`)
        return;
    }

    // Parse text content to numbers (critical for mathematical operations)
    const temp = parseFloat(tempElement.textContent);
    const speed = parseFloat(windSpeedElement.textContent);
    
    // Validate parsed numbers before calculations
    if (isNaN(temp) || isNaN(speed)) {
        hotChileElement.textContent = "N/A";
        hotChileElement.classList.remove("loading-dots");
        return;
    }

    // Wind chill formula requirements (per US/Canada meteorological standards: temp <=10°C, wind speed >4.8km/h)
     calculateWindChill(temp, speed);
}

function calculateWindChill(temp, speed) {
    // alert(`calculateWindChill temp|speed: ${temp}|${speed}`)
    const hotChileElement = document.getElementById("hotChile");
    if (temp <= 10 && speed > 4.8) {
     let calculatedChill = 13.12 + (0.6215 * temp) - (11.37 * Math.pow(speed, 0.16)) + (0.3965 * temp * Math.pow(speed, 0.16));
     let chills = `${Math.round(calculatedChill)}°C`;
        if (hotChileElement) {
            hotChileElement.classList.remove("loading-dots");
            hotChileElement.textContent = chills;
        }
    } else {
        if (hotChileElement) {
            hotChileElement.classList.remove("loading-dots");
            hotChileElement.textContent = "N/A";
        }
    }

    return
}

// Run calculation after DOM is fully loaded
document.addEventListener("hydrationFinished", function() {
    // Attempt dynamic state capture when hydration settles safely
    const tempElement = document.getElementById('temp');
    const speedElement = document.getElementById('windSpeed');
    const windChill = null;

    if (!valuesInitialized && tempElement && speedElement) {
        globalTemperature = tempElement.textContent.trim();
        globalSpeed = speedElement.textContent.trim();
        globalWindChill = windChill;
        valuesInitialized = true;
    }
    
    temp = tempElement.textContent.trim();
    speed = speedElement.textContent.trim();

    if (tempElement) localStorage.setItem('tempDOM', temp);
    if (speedElement) localStorage.setItem('windSpeedDOM', speed);

    if (temp && speed) {
        // alert(`hydrationFinished temp|speed: ${temp}|${speed}`)
        calculateWindChill( temp, speed);
        localStorage.setItem('windChill', windChill);
    }

    // alert(`addEventListener hydrationFinished t|s|w: ${tempElement.textContent}|${speedElement.textContent}|${windChill}`)
    displayWindChill(); 
});

