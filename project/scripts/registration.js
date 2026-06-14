document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registrationForm");
    const statusBanner = document.getElementById("status-banner");

form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) {
        event.preventDefault();
        statusBanner.removeAttribute("hidden");

        // Use a selector that targets form fields specifically
        // Filter by offsetParent to ensure we are only looking at visible elements
        const invalidFields = Array.from(form.querySelectorAll("input:required, select:required, textarea:required"))
            .filter(field => !field.validity.valid);

        if (invalidFields.length > 0) {
            const firstInvalidInput = invalidFields[0];
            
            const elementRect = firstInvalidInput.getBoundingClientRect().top;
            const absoluteElementTop = elementRect + window.scrollY;
            
            window.scrollTo({
                top: absoluteElementTop - 60, 
                behavior: "smooth"
            });

            // Use a small timeout to ensure scrolling is near completion before focusing
            setTimeout(() => {
                firstInvalidInput.focus();
            }, 500);
        }
    } else {
        statusBanner.setAttribute("hidden", "");
        let count = parseInt(localStorage.getItem("registrationCount")) || 0;
        count += 1;
        localStorage.setItem("registrationCount", count.toString());
    }
});

    // Banner Close Logic
    statusBanner.addEventListener("click", () => {
        statusBanner.setAttribute("hidden", "");
    });
});
