window.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById("lastModified");
    if (element) {
        element.innerHTML = new Date(document.lastModified);
    }
});