/**
 * Hydra Showcase Platform - View Route Controller
 * Exclusively manages single-page layout navigation mapping transitions.
 * Operational IDE synchronization logic is safely isolated within index.js.
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeShowcaseRouter();
});

/**
 * Single Page Architecture Client Router
 * Cycles active layout blocks seamlessly without triggering standard window refetches.
 */
function initializeShowcaseRouter() {
    const navigationLinks = document.querySelectorAll('.nav-btn');
    
    navigationLinks.forEach(buttonLink => {
        buttonLink.addEventListener('click', (event) => {
            const targetPageIdentifier = event.target.getAttribute('data-target');
            navigateToPage(targetPageIdentifier);
        });
    });
}

/**
 * Globally transitions visible layout elements cleanly.
 * @param {string} pageId - Target view code parameter identifier.
 */
function navigateToPage(pageId) {
    // 1. Terminate visibility metrics across viewport elements and header tab anchors
    document.querySelectorAll('.page-view').forEach(viewCard => viewCard.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btnElement => btnElement.classList.remove('active'));
    
    // 2. Identify and activate target DOM components
    const targetSection = document.getElementById(`page-${pageId}`);
    const activeNavAnchor = document.querySelector(`.nav-btn[data-target="${pageId}"]`);
    
    if (targetSection) {
        targetSection.classList.add('active');
        // Push state alignment parameter to top body level rule
        document.body.setAttribute('data-active-page', pageId);
    }
    
    if (activeNavAnchor) {
        activeNavAnchor.classList.add('active');
    }

    // Scroll window smoothly to the top of the interface framework boundary
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
