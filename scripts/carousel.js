export default class Carousel {
    constructor(options) {
        // Enforce the parameters we need
        if (!options.target || !options.images || !options.dataSource) {
            throw new Error("Carousel requires 'target', 'images', and 'dataSource' parameters.");
        }

        this.target = document.querySelector(options.target);
        this.baseLocation = options.images.replace(/\/$/, ''); 
        this.dataSource = options.dataSource; // Path to your JSON file
        this.imageNames = []; 

        if (!this.target) return;

        this.injectCSS();
        this.iterateFolder();
    }

    injectCSS() {
        if (document.getElementById('carousel-styles')) return;
        const style = document.createElement('style');
        style.id = 'carousel-styles';
        style.textContent = `
            .carousel-container { position: relative; width: 100%; overflow: hidden; border-radius: 8px; }
            .carousel-track { display: flex; transition: transform 0.5s ease-in-out; width: 100%; }
            .carousel-slide { min-width: 100%; box-sizing: border-box; }
            
            /* Adjust aspect ratio to control height of the image */
            .carousel-slide picture img { width: 100%; height: auto; display: block; aspect-ratio: 3 / 1; object-fit: cover; object-position: center top; background: #e0e0e0; }
            
            /* 5-second total scrolling animation timeline */
            .carousel-slide picture img.animating { animation: scrollImage 5s linear infinite; }

            @keyframes scrollImage { 0%   { object-position: center top; } 20%  { object-position: center top; } 80%  { object-position: center bottom; } 100% { object-position: center bottom; } }

            .carousel-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.6); color: #fff; border: none; padding: 12px 16px; cursor: pointer; z-index: 10; font-size: 20px; }
            .carousel-prev { left: 10px; } .carousel-next { right: 10px; }
            
            /* Dots Navigation Styles */
            .carousel-dots { display: flex; justify-content: center; gap: 8px; margin-top: 10px; }
            .carousel-dot { width: 12px; height: 12px; border-radius: 50%; background: #ccc; cursor: pointer; border: none; padding: 0; transition: background 0.3s; }
            .carousel-dot.active { background: #333; }
        `;
        document.head.appendChild(style);
    }

    async iterateFolder() {
        try {
            // Fetch the static JSON file containing filenames (Works flawlessly on GitHub Pages)
            const response = await fetch(this.dataSource);
            if (!response.ok) throw new Error(`Failed to load ${this.dataSource}`);
            
            this.imageNames = await response.json();

            // Render once the images are successfully mapped
            if (this.imageNames.length > 0) {
                this.render();
            } else {
                console.error(`No image filenames found in JSON source.`);
            }
        } catch (error) {
            console.error("Failed to load carousel images from JSON:", error);
        }
    }

    render() {
        const container = document.createElement('div');
        container.className = 'carousel-container';

        const track = document.createElement('div');
        track.className = 'carousel-track';

        // Loop through the iterated images to build the responsive markup
        this.imageNames.forEach((imgName) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            const basePath = `${this.baseLocation}/${imgName}`;

            slide.innerHTML = `
                <picture>
                    <source media="(max-width: 500px)" srcset="${basePath}-small.webp" width="500" height="281">
                    <source media="(max-width: 1000px)" srcset="${basePath}-medium.webp" width="1000" height="563">
                    <source media="(min-width: 1001px)" srcset="${basePath}-large.webp" width="1500" height="844">
                    <img src="${basePath}-large.webp" alt="Carousel Image" loading="lazy" width="1500" height="844">
                </picture>
            `;
            track.appendChild(slide);
        });

        container.appendChild(track);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn carousel-prev';
        prevBtn.innerHTML = '&#10094;';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn carousel-next';
        nextBtn.innerHTML = '&#10095;';

        container.appendChild(prevBtn);
        container.appendChild(nextBtn);
        this.target.appendChild(container);

        // Create dots navigation container below the main carousel container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots';

        this.imageNames.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            if (index === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            dotsContainer.appendChild(dot);
        });
        
        this.target.appendChild(dotsContainer);

        this.setupCarouselLogic(track, prevBtn, nextBtn, dotsContainer);
    }

    setupCarouselLogic(track, prevBtn, nextBtn, dotsContainer) {
        let currentIndex = 0;
        const slidesCount = this.imageNames.length;
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        const images = track.querySelectorAll('picture img');

        const updatePosition = () => { 
            track.style.transform = `translateX(-${currentIndex * 100}%)`; 
            
            dots.forEach((dot, index) => {
                const img = images[index];
                if (index === currentIndex) {
                    dot.classList.add('active');
                    img.classList.remove('animating');
                    void img.offsetWidth; 
                    img.classList.add('animating');
                } else {
                    dot.classList.remove('active');
                    img.classList.remove('animating');
                }
            });
        };

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % slidesCount;
            updatePosition();
        };

        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + slidesCount) % slidesCount;
            updatePosition();
        };

        let autoplayInterval = setInterval(nextSlide, 5000);

        const resetAutoplay = () => {
            clearInterval(autoplayInterval);
            autoplayInterval = setInterval(nextSlide, 5000);
        };

        nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });
        prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                updatePosition();
                resetAutoplay();
            });
        });

        if (images[0]) images[0].classList.add('animating');
    }
}