// Keep a reference to the html element wrapper root
const htmlElement = document.documentElement;

// State tracking variables (initialized without hardcoded fallbacks)
let globalTemperature = null;
let globalSpeed = null;
let valuesInitialized = false;

/**
 * Updates the application theme state cleanly
 * @param {boolean} shouldBeDark 
 */
function applyTheme(shouldBeDark) {
    // Dynamically query the element in case it was recently injected by the JSON engine
    const themeCheckbox = document.getElementById('theme-slider');
    const tempElement = document.getElementById('temp');
    const speedElement = document.getElementById('windSpeed');

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

    if (shouldBeDark) {
        htmlElement.classList.add('dark-theme');
        localStorage.setItem('theme-preference', 'dark');
        if (themeCheckbox) themeCheckbox.checked = true;
        if (tempElement) tempElement.textContent = "5";
        if (speedElement) speedElement.textContent = "10";
        displayWindChill();
    } else {
        htmlElement.classList.remove('dark-theme');
        localStorage.setItem('theme-preference', 'light');
        if (themeCheckbox) themeCheckbox.checked = false;
        
        // Restore from our clean memory bank, otherwise leave whatever the JSON engine naturally put there
        if (tempElement && globalTemperature !== null) tempElement.textContent = globalTemperature;
        if (speedElement && globalSpeed !== null) speedElement.textContent = globalSpeed;
        displayWindChill();
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
        let valuesChanged = false;
        const isDark = htmlElement.classList.contains('dark-theme');

        if (temperature && temperature !== globalTemperature) {
            globalTemperature = temperature;
            valuesChanged = true;
        }
        if (windSpeed && windSpeed !== globalSpeed) {
            globalSpeed = windSpeed;
            valuesChanged = true;
        }

        // Only update UI if values changed, and we aren't currently overwriting them in dark mode
        if (valuesChanged && !isDark) {
            const savedUserPreference = localStorage.getItem('theme-preference');
            applyTheme(savedUserPreference === 'dark');
        } else if (valuesChanged && isDark) {
            // If in dark mode, just recalculate windchill in case data changed in the background
            displayWindChill();
        }
    });
}

// Initial pull on execution boot
syncWeatherData();

// Check for live simulated API changes every 2000ms (2 seconds)
setInterval(syncWeatherData, 5000);


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
// 4. BOUNDED DRAG & DROP ENGINE (Percentage-Based Constraint Tracker)
// =========================================================================
let highestZIndex = 10;

function initializeCardDragging() {
    const cards = document.querySelectorAll('.card');
    const rapper = document.querySelector('.rapper');
    const hero = document.querySelector('.hero');
    
    if (!rapper || !hero || cards.length === 0) return;

    cards.forEach(card => {
        let isDragging = false;
        
        // Track the offset grab position in percentages relative to the card itself
        let grabPercentX = 0;
        let grabPercentY = 0;

        card.addEventListener('mousedown', dragStart);
        card.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.closest('input') || e.target.closest('button') || e.target.closest('label') || e.target.closest('a')) {
                return; 
            }

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            const cardRect = card.getBoundingClientRect();

            // Calculate precisely where the user clicked inside the card layout as a factor (0 to 1)
            grabPercentX = (clientX - cardRect.left) / cardRect.width;
            grabPercentY = (clientY - cardRect.top) / cardRect.height;

            isDragging = true;
            card.style.cursor = 'grabbing';

            highestZIndex++;
            card.style.zIndex = highestZIndex;

            window.addEventListener('mousemove', dragging);
            window.addEventListener('touchmove', dragging, { passive: false });
            window.addEventListener('mouseup', dragEnd);
            window.addEventListener('touchend', dragEnd);

            if (e.cancelable) e.preventDefault();
        }

        function dragging(e) {
            if (!isDragging) return;

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const heroRect = hero.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            // Find the target top-left position of the card relative to the hero container bounds
            const targetLeftPx = (clientX - heroRect.left) - (grabPercentX * cardRect.width);
            const targetTopPx = (clientY - heroRect.top) - (grabPercentY * cardRect.height);

            // Convert pixel coordinates to pure percentage ratios of the hero's space
            let targetLeftPercent = (targetLeftPx / heroRect.width) * 100;
            let targetTopPercent = (targetTopPx / heroRect.height) * 100;

            // Calculate maximum allowed percentages based on the card's relative size
            const maxLeftPercent = ((heroRect.width - cardRect.width) / heroRect.width) * 100;
            const maxTopPercent = ((heroRect.height - cardRect.height) / heroRect.height) * 100;

            // Reset dynamic collision indicator configurations
            card.style.borderTop = '';
            card.style.borderRight = '';
            card.style.borderBottom = '';
            card.style.borderLeft = '';

            // Apply strict fluid clamping boundary checks
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

            // Write updates to inline properties using % units
            card.style.left = `${targetLeftPercent}%`;
            card.style.top = `${targetTopPercent}%`;
            card.style.right = 'auto'; 
            card.style.bottom = 'auto'; 
            card.style.margin = '0'; 
        }

        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            card.style.cursor = 'grab';

            card.style.borderTop = '';
            card.style.borderRight = '';
            card.style.borderBottom = '';
            card.style.borderLeft = '';

            window.removeEventListener('mousemove', dragging);
            window.removeEventListener('touchmove', dragging);
            window.removeEventListener('mouseup', dragEnd);
            window.removeEventListener('touchend', dragEnd);
        }
    });
}

// 5. EXTEND OBSERVATION ENGINE: Trigger drag initialization once cards populate
const dragInitObserver = new MutationObserver(() => {
    const cards = document.querySelectorAll('.card');
    const hero = document.querySelector('.hero');
    
    if (cards.length > 0 && hero) {
        initializeCardDragging();
        dragInitObserver.disconnect(); // Unbind tracking once setup completes safely
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
    console.log(`tempElement ${tempElement ? tempElement.textContent.trim() : 'missing'}`);
    const windSpeedElement = document.querySelector("#windSpeed");
    console.log(`windSpeedElement ${windSpeedElement ? windSpeedElement.textContent.trim() : 'missing'}`);
    const hotChileElement = document.querySelector("#hotChile");
    console.log(`hotChileElement ${hotChileElement ? hotChileElement.textContent.trim() : 'missing'}`);

    // Guard clause to exit if any required element is missing
    if (!tempElement || !windSpeedElement || !hotChileElement) {
        // console.error("Missing required DOM elements for wind chill calculation");
        return;
    }

    // Parse text content to numbers (critical for mathematical operations)
    const currentTempC = parseFloat(tempElement.textContent);
    const speed = parseFloat(windSpeedElement.textContent);
    
    console.log(`currentTempC ${currentTempC}`);
    console.log(`speed ${speed}`);

    // Validate parsed numbers before calculations
    if (isNaN(currentTempC) || isNaN(speed)) {
        console.error("Invalid temperature or wind speed values");
        hotChileElement.textContent = "N/A";
        hotChileElement.classList.remove("loading-dots");
        return;
    }

    // Wind chill formula requirements (per US/Canada meteorological standards: temp <=10°C, wind speed >4.8km/h)
    if (currentTempC <= 10 && speed > 4.8) {
        console.log("Calculating wind chill");
        // Official wind chill formula for Celsius (°C) and km/h
        const calculatedChill = 13.12 + (0.6215 * currentTempC) - (11.37 * Math.pow(speed, 0.16)) + (0.3965 * currentTempC * Math.pow(speed, 0.16));
        const displayValue = `${Math.round(calculatedChill)}°C`;
        console.log(`displayValue ${displayValue}`);
        
        hotChileElement.classList.remove("loading-dots");
        hotChileElement.textContent = displayValue;
    } else {
        console.log("Conditions not met for wind chill calculation");
        hotChileElement.classList.remove("loading-dots");
        hotChileElement.textContent = "N/A";
    }
}

displayWindChill(); // just in case hydrationFinished event is not triggered, most of the time.
// Run calculation after DOM is fully loaded
document.addEventListener("hydrationFinished", function() {
    // Attempt dynamic state capture when hydration settles safely
    const tempElement = document.getElementById('temp');
    const speedElement = document.getElementById('windSpeed');
    if (!valuesInitialized && tempElement && speedElement) {
        globalTemperature = tempElement.textContent.trim();
        globalSpeed = speedElement.textContent.trim();
        valuesInitialized = true;
    }
    displayWindChill(); 
});