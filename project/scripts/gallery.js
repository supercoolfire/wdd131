document.addEventListener("DOMContentLoaded", () => {
    const SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201000%20667%22%3E%3C%2Fsvg%3E";

    async function loadGallery() {
        const grid = document.querySelector("#gallery-grid");
        const response = await fetch("data/images.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const images = await response.json();

        images.forEach(image => {
            const figure = document.createElement("figure");
            figure.classList.add("gallery-item");

            const img = document.createElement("img");
            img.src = SVG_PLACEHOLDER;
            img.setAttribute("data-src", image.src);
            img.setAttribute("data-srcset", image.srcset);
            img.setAttribute("data-sizes", image.sizes);
            img.setAttribute("alt", image.alt);
            img.setAttribute("width", image.width);
            img.setAttribute("height", image.height);
            img.setAttribute("loading", "lazy");

            const figcaption = document.createElement("figcaption");
            figcaption.textContent = image.caption;

            figure.appendChild(img);
            figure.appendChild(figcaption);
            grid.appendChild(figure);
        });

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute("data-srcset");
                    }
                    if (img.dataset.sizes) {
                        img.sizes = img.dataset.sizes;
                        img.removeAttribute("data-sizes");
                    }
                    img.removeAttribute("data-src");
                    img.classList.add("loaded");
                    obs.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 200px 0px" });

        grid.querySelectorAll("img[data-src]").forEach(img => observer.observe(img));
    }

    loadGallery().catch(err => console.error(`Gallery load failed: ${err.message}`));
});
