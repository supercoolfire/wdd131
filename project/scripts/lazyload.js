// 1. Centralized Configuration
const options = {
    root: null,
    rootMargin: "0px 0px 200px 0px",
    threshold: 0
};

// 2. Helper to reveal the image
function swapDataAttributes(img) {
    if (img.dataset.src) img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    if (img.dataset.sizes) img.sizes = img.dataset.sizes;
    
    img.removeAttribute("data-src");
    img.removeAttribute("data-srcset");
    img.removeAttribute("data-sizes");
    img.classList.add("loaded");
}

// 3. Callback for the observer
const loadImage = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            swapDataAttributes(entry.target);
            observer.unobserve(entry.target);
        }
    });
};

// 4. Initialization function
function initLazyLoading() {
    const lazyImages = document.querySelectorAll("img[data-src]");
    
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(loadImage, options);
        lazyImages.forEach(img => {
            // Only observe if not already processed
            if (img.dataset.src) {
                observer.observe(img);
            }
        });
    } else {
        // Fallback for older browsers
        lazyImages.forEach(swapDataAttributes);
    }
}

// 5. Listeners
document.addEventListener("DOMContentLoaded", initLazyLoading);
document.addEventListener("hydrationFinished", initLazyLoading);