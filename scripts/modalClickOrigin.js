// this comes with css /* Click Modaler */

document.addEventListener('click', (e) => {
    // Check if we clicked an image inside a card
    if (e.target.tagName === 'IMG' && e.target.closest('.card')) {
        const img = e.target;
        const rect = img.getBoundingClientRect();
        
        // Create the modal container if it doesn't exist yet
        let modal = document.getElementById('img-modal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', `
                <div id="img-modal">
                    <img id="modal-content" src="">
                </div>
            `);
            modal = document.getElementById('img-modal');
        }

        const modalImg = document.getElementById('modal-content');
        
        // 1. Position the modal image EXACTLY over the original image
        modalImg.src = img.src;
        modalImg.style.top = `${rect.top}px`;
        modalImg.style.left = `${rect.left}px`;
        modalImg.style.width = `${rect.width}px`;
        modalImg.style.height = `${rect.height}px`;
        modalImg.style.display = 'block';
        
        modal.style.display = 'block';

        // 2. Animate to the center (85% size)
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // 3. The Close Logic
        modal.onclick = () => {
            modal.classList.remove('active');
            
            // Shrink back to the original spot
            const currentRect = img.getBoundingClientRect();
            modalImg.style.top = `${currentRect.top}px`;
            modalImg.style.left = `${currentRect.left}px`;
            modalImg.style.width = `${currentRect.width}px`;
            modalImg.style.height = `${currentRect.height}px`;

            // Hide the whole thing after the transition (500ms)
            setTimeout(() => {
                if (!modal.classList.contains('active')) {
                    modal.style.display = 'none';
                }
            }, 500);
        };
    }
});