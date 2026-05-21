// Keep a reference to the html element wrapper root
const htmlElement = document.documentElement;

/**
 * Updates the application theme state cleanly
 * @param {boolean} shouldBeDark 
 */
function applyTheme(shouldBeDark) {
    // Dynamically query the element in case it was recently injected by the JSON engine
    const themeCheckbox = document.getElementById('theme-slider');

    if (shouldBeDark) {
        htmlElement.classList.add('dark-theme');
        localStorage.setItem('theme-preference', 'dark');
        if (themeCheckbox) themeCheckbox.checked = true;
    } else {
        htmlElement.classList.remove('dark-theme');
        localStorage.setItem('theme-preference', 'light');
        if (themeCheckbox) themeCheckbox.checked = false;
    }
}

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


// 4. BOUNDED DRAG & DROP ENGINE (Absolute Bounds Constraint Tracker)
let highestZIndex = 10;

function initializeCardDragging() {
    const cards = document.querySelectorAll('.card');
    // Track against the container parent wrapper element
    const rapper = document.querySelector('.rapper');
    const hero = document.querySelector('.hero');
    
    if (!rapper || !hero || cards.length === 0) return;

    cards.forEach(card => {
        let isDragging = false;
        
        // Accurate coordinate distance between mouse tip and card top-left corner
        let grabX = 0;
        let grabY = 0;

        card.addEventListener('mousedown', dragStart);
        card.addEventListener('touchstart', dragStart, { passive: false });

        function dragStart(e) {
            if (e.target.closest('input') || e.target.closest('button') || e.target.closest('label') || e.target.closest('a')) {
                return; 
            }

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            // Get the bounding rect of the wrapper parent container
            const rapperRect = rapper.getBoundingClientRect();

            // offsetLeft/Top are measured relative to .rapper container
            const currentCardLeft = card.offsetLeft;
            const currentCardTop = card.offsetTop;

            // Pinpoint cursor placement coordinates inside the wrapper context box
            const mouseXInRapper = clientX - rapperRect.left;
            const mouseYInRapper = clientY - rapperRect.top;

            // Capture precise layout offsets
            grabX = mouseXInRapper - currentCardLeft;
            grabY = mouseYInRapper - currentCardTop;

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

            const rapperRect = rapper.getBoundingClientRect();

            // Track target movement relative to the wrapper boundaries context
            let targetLeft = (clientX - rapperRect.left) - grabX;
            let targetTop = (clientY - rapperRect.top) - grabY;

            // Bound constraint rules checking limits inside the hero canvas layout boundaries
            // Note: If hero matches rapper width/height, these values remain accurate
            const maxLeft = hero.clientWidth - card.offsetWidth;
            const maxTop = hero.clientHeight - card.offsetHeight;

            // Reset dynamic collision indicator configurations
            card.style.borderTop = '';
            card.style.borderRight = '';
            card.style.borderBottom = '';
            card.style.borderLeft = '';

            // Apply clamping checks
            if (targetLeft <= 0) {
                targetLeft = 0;
                card.style.borderLeft = '2px solid red';
            }
            if (targetLeft >= maxLeft) {
                targetLeft = maxLeft;
                card.style.borderRight = '2px solid red';
            }
            if (targetTop <= 0) {
                targetTop = 0;
                card.style.borderTop = '2px solid red';
            }
            if (targetTop >= maxTop) {
                targetTop = maxTop;
                card.style.borderBottom = '2px solid red';
            }

            // Write updates to inline elements
            card.style.left = `${targetLeft}px`;
            card.style.top = `${targetTop}px`;
            card.style.right = 'auto'; // Break CSS media alignment engines
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


// 6. WEATHER ENGINE: WIND CHILL CALCULATOR LAYER

// Define static values referencing current UI elements (21°C and 20 km/h)
const currentTempC = 21;
const currentWindSpeedKm = 20;

/**
 * Calculates the metric Wind Chill factor based on Celsius and km/h
 * Uses a single-line expression to run mathematical calculations.
 * @param {number} temp - Temperature in Celsius
 * @param {number} speed - Wind speed in kilometers per hour
 * @returns {number} Calculated wind chill factor
 */
function calculateWindChill(temp, speed) {
    return 13.12 + (0.6215 * temp) - (11.37 * Math.pow(speed, 0.16)) + (0.3965 * temp * Math.pow(speed, 0.16));
}

/**
 * Initializes and appends wind chill parameters to the HTML layout DOM structure
 */
function displayWindChill() {
    const dataList = document.querySelector('#weather .card__data-list');
    if (!dataList) return;

    let displayValue = "N/A";

    // Enforce condition validation rules: Temperature <= 10°C AND Wind Speed > 4.8 km/h
    if (currentTempC <= 10 && currentWindSpeedKm > 4.8) {
        const calculatedChill = calculateWindChill(currentTempC, currentWindSpeedKm);
        displayValue = `${Math.round(calculatedChill)}°C`;
    }

    // Generate row matching your design criteria
    const row = document.createElement('div');
    row.className = 'card__row';
    row.innerHTML = `
        <dt class="card__label">Wind Chill:</dt>
        <dd class="card__value">${displayValue}</dd>
    `;

    // Safely append the final generated row markup inside the data block element
    dataList.appendChild(row);
}

// Run the operation automatically on script parsing loop execution
displayWindChill();