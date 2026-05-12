/**
 * Rickster Egg - v1.1
 * Handles modal styling and toggle logic after hydration.
 */

(function injectRicksterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
            justify-content: center;
            align-items: center;
        }
        video#rick-video {
            max-width: 90%;
            max-height: 90%;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        header { cursor: pointer; }
    `;
    document.head.appendChild(style);
})();

const initRicksterEgg = () => {
    const header = document.querySelector('header');
    const modal = document.getElementById('video-container');
    const video = document.getElementById('rick-video');

    if (header && modal && video) {
        header.addEventListener('click', () => {
            // Using 'flex' to ensure centering from CSS works
            const isVisible = modal.style.display === 'flex';
            
            if (isVisible) {
                video.pause();
                modal.style.display = 'none';
            } else {
                modal.style.display = 'flex'; 
                video.play();
            }
        });

        // Close when clicking the dark background
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                video.pause();
                modal.style.display = 'none';
            }
        });

        // Close on 'Escape'
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                video.pause();
                modal.style.display = 'none';
            }
        });
    }
};

// Listen for the signal from hydrate-v3.js
document.addEventListener('hydrationComplete', initRicksterEgg);

// Fallback for non-dynamic pages
if (document.readyState !== 'loading') {
    initRicksterEgg();
} else {
    document.addEventListener('DOMContentLoaded', initRicksterEgg);
}