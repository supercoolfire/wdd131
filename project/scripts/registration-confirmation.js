document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("userName");

    if (name && name.trim()) {
        document.getElementById("reviewer-name").textContent = name.trim();
    }

    const count = parseInt(localStorage.getItem("registrationCount")) || 0;
    document.getElementById("registration-count").textContent = count;
});
