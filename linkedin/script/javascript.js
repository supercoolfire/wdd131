document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('login-modal');
    const openBtn = document.getElementById('open-modal');
    const closeBtn = document.querySelector('.close-btn');
    const loginForm = document.getElementById('login-form');
    const modalContent = document.querySelector('.modal-content');
    const footer = document.getElementById('footer');
    const aboutSection = document.getElementById('about');
    const videoContainer = document.getElementById('video-container');
    const rickVideo = document.getElementById('rick-video');

    // Close modal function
    const closeModal = () => {
        modal.classList.add('hidden');
        // "remove anything below" - interpreted as hiding the footer to focus on the content
        if (footer) footer.style.display = 'none';
        
        console.log("Modal closed. Easter egg active.");
    };

    // Close on X
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeModal();
        });
    }

    // Modal behavior: "any interaction will close this modal"
    if (modal) {
        // Close on ANY click within the modal overlay (including content)
        modal.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });

        // Close on ANY keypress while modal is focused/active
        modal.addEventListener('keydown', (e) => {
            closeModal();
        });

        // Specific focus for inputs to ensure they also trigger closure on interaction
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                closeModal();
            });
        });
    }

    // Easter egg video on hover in About section
    if (aboutSection) {
        aboutSection.addEventListener('mouseenter', () => {
            if (videoContainer) {
                videoContainer.classList.remove('hidden');
                if (rickVideo) {
                    rickVideo.play().catch(error => {
                        console.log("Auto-play blocked by browser. User interaction needed.");
                    });
                }
            }
        });
    }
});
