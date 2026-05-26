/**
 * ============================================================================
 * AUTHOR  : Jayser Pilapil
 * COPYLEFT: 2026
 * PROJECT : Light/Dark Theme Switcher Boilerplate
 * ============================================================================
 * * ============================================================================
 * FEATURE & USAGE NOTES
 * ============================================================================
 * * FEATURES:
 * 1. Persistent Storage: Saves user theme preference to localStorage.
 * 2. System Preference Sync: Automatically respects OS/browser light/dark settings 
 * if no manual preference has been saved yet.
 * 3. Element Swapping: Provides seamless CSS hooks to swap UI elements 
 * conditionally depending on the active theme.
 * 4. Zero Flash (Anti-FOUC): Optimized to prevent a bright white flash on load 
 * when dark mode is active.
 * * * REQUIRED HTML STRUCTURE:
 * 1. The <html> element must include a `data-theme` attribute (defaulting to "light"):
  <html lang="en" data-theme="light">
 * * 2. The script must be included in the <head> with the `defer` attribute to 
 * ensure the DOM is ready without blocking initial HTML parsing:
  <script src="boilerplate.js" defer></script>
 * * 3. A toggle button with an internal structure showing the NEXT action:
  <button class="theme-toggle" aria-label="Switch to dark mode" title="Switch to dark mode">
  <span class="theme-icon">🌙</span>
  <span class="theme-text">Dark Mode</span>
  </button>
 * * 4. ALTERNATIVE: A minimalist icon-only toggle button:
  <button class="theme-toggle" aria-label="Switch to dark mode" title="Switch to dark mode">🌙</button>
 * * 5. For element swapping, apply matching contextual classes alongside your styles:
  <div class="foo bar light">Visible only in light mode</div>
  <div class="foo bar dark">Visible only in dark mode</div>
 * ============================================================================
 */

// Select all buttons using the shared class name
const themeToggleButtons = document.querySelectorAll('.theme-toggle');
const rootElement = document.documentElement;

/**
 * Initialization Logic
 * Evaluates the correct starting theme before rendering completes.
 */
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

// Apply theme immediately on script execution
setTheme(initialTheme);

/**
 * Click Event Handler
 * Loops through all elements with the class '.theme-toggle' and attaches the click handler.
 */
themeToggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        const currentTheme = rootElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
});

/**
 * State Management Helper
 * Updates DOM attributes, localStorage, and visual toggle states for all buttons.
 * @param {string} theme - Expects 'light' or 'dark'
 */
function setTheme(theme) {
    rootElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Dynamically update every toggle button to show the NEXT action
    themeToggleButtons.forEach(button => {
        const themeIcon = button.querySelector('.theme-icon');
        const themeText = button.querySelector('.theme-text');

        if (theme === 'dark') {
            // Current theme is DARK -> Show action to switch to LIGHT
            button.setAttribute('aria-label', 'Switch to light mode');
            button.setAttribute('title', 'Switch to light mode');
            
            if (themeIcon && themeText) {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light Mode';
            } else {
                button.textContent = '☀️';
            }
        } else {
            // Current theme is LIGHT -> Show action to switch to DARK
            button.setAttribute('aria-label', 'Switch to dark mode');
            button.setAttribute('title', 'Switch to dark mode');
            
            if (themeIcon && themeText) {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark Mode';
            } else {
                button.textContent = '🌙';
            }
        }
    });
}