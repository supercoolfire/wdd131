/**
 * Click Modaler v1.1 - Plug & Play Image Expansion
* CSS Usage: This comes with modal-click-origin.css
*/

// Handle dynamic cursor styles for zoomable images
document.addEventListener('mouseover', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.card') || e.target.closest('figure'))) {
        e.target.style.cursor = 'zoom-in';
    }
});

document.addEventListener('click', (e) => {
    // 1. Identification Phase
    const isImage = e.target.tagName === 'IMG';
    const container = e.target.closest('.card') || e.target.closest('figure');

    // If it's an image but not in a valid container, help the developer
    if (isImage && !container) {
        console.warn(
            "Click Modaler: Image clicked but no valid container found.\n" +
            "Solution: Wrap your <img> in an element with class 'card' or a <figure> tag to enable the modal."
        );
        return;
    }

    // Only proceed if we have a valid image in a valid container
    if (isImage && container) {
        try {
            const img = e.target;
            const rect = img.getBoundingClientRect();
            
            // 2. Initialization Phase
            let modal = document.getElementById('img-modal');
            if (!modal) {
                console.info("Click Modaler: Initializing modal structure in DOM...");
                document.body.insertAdjacentHTML('beforeend', `
                    <div id="img-modal">
                        <img id="modal-content" src="" alt="Expanded view">
                    </div>
                `);
                modal = document.getElementById('img-modal');
            }

            const modalImg = document.getElementById('modal-content');
            if (!modalImg) throw new Error("Modal content element (#modal-content) is missing from the injected HTML.");

            // 3. Positioning Phase
            // Position the modal image EXACTLY over the original image for a seamless transition
            modalImg.src = img.src;
            modalImg.style.top = `${rect.top}px`;
            modalImg.style.left = `${rect.left}px`;
            modalImg.style.width = `${rect.width}px`;
            modalImg.style.height = `${rect.height}px`;
            modalImg.style.display = 'block';
            
            modal.style.display = 'block';
            modal.style.cursor = 'zoom-out'; // Set cursor to zoom-out when modal is open

            // 4. Animation Phase
            // Using requestAnimationFrame ensures the browser has painted the initial position before we animate
            requestAnimationFrame(() => {
                modal.classList.add('active');
            });

            // 5. Interaction Phase (Close Logic)
            modal.onclick = () => {
                modal.classList.remove('active');
                
                // Shrink back to the original spot (re-calculating in case of resize/scroll)
                const currentRect = img.getBoundingClientRect();
                modalImg.style.top = `${currentRect.top}px`;
                modalImg.style.left = `${currentRect.left}px`;
                modalImg.style.width = `${currentRect.width}px`;
                modalImg.style.height = `${currentRect.height}px`;

                // Clean up display after the CSS transition finishes (500ms)
                setTimeout(() => {
                    if (!modal.classList.contains('active')) {
                        modal.style.display = 'none';
                    }
                }, 500);
            };

        } catch (err) {
            console.error(
                "Click Modaler Error: Failed to trigger modal.\n" +
                "Details: " + err.message + "\n" +
                "Solution: Ensure your CSS includes the #img-modal and #modal-content styles."
            );
        }
    }
});
