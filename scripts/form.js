// Product Array Data
const products = [{
		id: "fc-1020",
		name: "Flux Capacitor",
		averagerating: 4.5
	},
	{
		id: "bc-1985",
		name: "Power Cell",
		averagerating: 4.7
	},
	{
		id: "vm-2015",
		name: "Time Circuits",
		averagerating: 3.8
	},
	{
		id: "st-2026",
		name: "Hoverboard Engine",
		averagerating: 4.9
	}
];

document.addEventListener("DOMContentLoaded", () => {
	// ---- Page 1: Form View Logic ----
	const productSelect = document.getElementById("productName");
	const reviewForm = document.getElementById("reviewForm");
	const statusBanner = document.getElementById("status-banner");

	// Populate Products
	if (productSelect) {
		products.forEach(product => {
			const option = document.createElement("option");
			option.value = product.id;
			option.textContent = product.name;
			productSelect.appendChild(option);
		});
	}

	// Form Submission Logic
	if (reviewForm && statusBanner) {
		reviewForm.addEventListener("submit", (event) => {
			// Check if native HTML5 validation constraints pass
			if (!reviewForm.checkValidity()) {
				event.preventDefault(); // Stop form submission

				// 1. Show the banner
				statusBanner.removeAttribute("hidden");

				// 2. Find the first invalid element
				const firstInvalidInput = reviewForm.querySelector(":invalid");

				if (firstInvalidInput) {
					// 3. Calculate position with a 150px buffer (roughly "3 lines" above target)
					// You can adjust '150' to whatever pixel value gives you the perfect look
					const elementRect = firstInvalidInput.getBoundingClientRect().top;
					const absoluteElementTop = elementRect + window.scrollY;
					const offsetPosition = absoluteElementTop - 10; // scroll up more to show the current element

					window.scrollTo({
						top: offsetPosition,
						behavior: "smooth"
					});

					// 4. Focus the input so the user can type immediately
					firstInvalidInput.focus();
				}
			} else {
				// Form is valid
				statusBanner.setAttribute("hidden", "");
				let reviewCount = parseInt(localStorage.getItem("reviewCount")) || 0;
				localStorage.setItem("reviewCount", reviewCount + 1);
			}
		});

		// Banner Close Logic
		statusBanner.addEventListener("click", () => {
			statusBanner.setAttribute("hidden", "");
		});
	}

	// ---- Page 2: Confirmation View Logic ----
	const reviewCounter = document.getElementById("reviewCounter");
	if (reviewCounter) {
		const totalReviews = localStorage.getItem("reviewCount") || 0;
		reviewCounter.textContent = totalReviews;

		const urlParams = new URLSearchParams(window.location.search);
		const userNameParam = urlParams.get("userName");
		const reviewerNameSpan = document.getElementById("reviewerName");

		if (userNameParam && userNameParam.trim() !== "" && reviewerNameSpan) {
			reviewerNameSpan.textContent = userNameParam;
		}
	}

	// ---- Shared Global Components ----
	const currentYearSpan = document.getElementById("currentyear");
	if (currentYearSpan) {
		currentYearSpan.textContent = new Date().getFullYear();
	}

	const lastModifiedElement = document.getElementById("lastModified");
	if (lastModifiedElement) {
		lastModifiedElement.textContent = `Last Modified: ${document.lastModified}`;
	}
});