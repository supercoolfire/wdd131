// lazyload.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Target all images with data-src attributes
    const lazyImages = document.querySelectorAll("img[data-src]");

    // 2. Configuration options for the IntersectionObserver
    const options = {
        root: null,         // Use the browser viewport as the container
        rootMargin: "0px 0px 200px 0px", // Trigger loading 200px before the image enters the viewport
        threshold: 0        // Trigger as soon as even one pixel is visible
    };

    // 3. Callback function when intersection happens
    const loadImage = (entries, observer) => {
        entries.forEach(entry => {
            // Check if the element is intersecting the viewport area
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // Swap the placeholder/src with the real image path from data-src
                img.src = img.dataset.src;
                
                // Optional: Remove data-src attribute once loaded
                img.removeAttribute("data-src");
                
                // Optional: Add a class to trigger CSS transition/fade-in effects
                img.classList.add("loaded");

                // Stop observing this specific image since it is now loaded
                observer.unobserve(img);
            }
        });
    };

    // 4. Initialize the IntersectionObserver
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(loadImage, options);
        
        // Start observing each lazy image
        lazyImages.forEach(img => observer.observe(img));
    } else {
        // Fallback for older browsers that do not support IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
        });
    }
});