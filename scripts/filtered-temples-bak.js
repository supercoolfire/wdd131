// --- DOM Elements ---
const mainnav = document.querySelector('nav');
const hambutton = document.querySelector('#menu');
const h1 = document.querySelector("h1");
const anchor = document.querySelectorAll("nav ul li a");
const searchInput = document.querySelector("#search-input");

// --- Temple Data Array ---
const temples = [
  {
    templeName: "Aba Nigeria",
    location: "Aba, Nigeria",
    dedicated: "2005, August, 7",
    area: 11500,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/aba-nigeria/400x250/aba-nigeria-temple-lds-273999-wallpaper.jpg"
  },
  {
    templeName: "Manti Utah",
    location: "Manti, Utah, United States",
    dedicated: "1888, May, 21",
    area: 74792,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/manti-utah/400x250/manti-temple-768192-wallpaper.jpg"
  },
  {
    templeName: "Payson Utah",
    location: "Payson, Utah, United States",
    dedicated: "2015, June, 7",
    area: 96630,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/payson-utah/400x225/payson-utah-temple-exterior-1416671-wallpaper.jpg"
  },
  {
    templeName: "Yigo Guam",
    location: "Yigo, Guam",
    dedicated: "2020, May, 2",
    area: 6861,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/yigo-guam/400x250/yigo_guam_temple_2.jpg"
  },
  {
    templeName: "Washington D.C.",
    location: "Kensington, Maryland, United States",
    dedicated: "1974, November, 19",
    area: 156558,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/washington-dc/400x250/washington_dc_temple-exterior-2.jpeg"
  },
  {
    templeName: "Lima Perú",
    location: "Lima, Perú",
    dedicated: "1986, January, 10",
    area: 9600,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/lima-peru/400x250/lima-peru-temple-evening-1075606-wallpaper.jpg"
  },
  {
    templeName: "Mexico City Mexico",
    location: "Mexico City, Mexico",
    dedicated: "1983, December, 2",
    area: 116642,
    imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/mexico-city-mexico/400x250/mexico-city-temple-exterior-1518361-wallpaper.jpg"
  },
  {
    templeName: "Urdaneta City Philippines",
    location: "Urdaneta City, Philippines",
    dedicated: "2024, April, 28",
    area: 32604,
    imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/urdaneta-philippines-temple/urdaneta-philippines-temple-45874-main.jpg"
  },
  {
    templeName: "Manila Philippines",
    location: "Manila, Philippines",
    dedicated: "1984, September, 25-27",
    area: 32604,
    imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/_temp/029-Manila-Philippines-Temple.jpg"
  },
  {
    templeName: "Alabang Philippines",
    location: "Alabang, Philippines",
    dedicated: "2026, January, 18",
    area: 32604,
    imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/alabang-philippines-temple/alabang-philippines-temple-67738.jpg"
  },
  {
    templeName: "Buenos Aires Argentina",
    location: "Buenos Aires, Argentina",
    dedicated: "1986, September, 9",
    area: 32604,
    imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/buenos-aires-argentina-temple/buenos-aires-argentina-temple-4087-main.jpg"
  },
  {
    templeName: "Santiago Chile",
    location: "Santiago, Chile",
    dedicated: "1983, September, 15-17",
    area: 32604,
    imageUrl: "https://churchofjesuschristtemples.org/assets/img/temples/_temp/024-Santiago-Chile-Temple.jpg"
  }
];

// --- Navigation UI Helpers ---
function navReset() {
  anchor.forEach(item => item.classList.remove("active"));
}

hambutton.addEventListener('click', () => {
  mainnav.classList.toggle('show');
  hambutton.classList.toggle('show');
});

// --- Pure Data Filtering ---
function getFilteredTemples(filterType) {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  let results = temples;

  // 1. Filter by Category State
  switch (filterType) {
    case 'old':
      results = temples.filter(t => parseInt(t.dedicated.split(',')[0]) < 1900);
      break;
    case 'new':
      results = temples.filter(t => parseInt(t.dedicated.split(',')[0]) >= 2000);
      break;
    case 'large':
      results = temples.filter(t => t.area >= 90000);
      break;
    case 'small':
      results = temples.filter(t => t.area < 10000);
      break;
    default:
      results = temples; // 'home' or fallback
  }

  // 2. Filter by Live Search Input (supports multiple search terms)
  if (searchTerm) {
    // Split search query into individual words, remove empty strings from extra spaces
    const searchTerms = searchTerm.split(/\s+/).filter(term => term.length > 0);
    
    results = results.filter(temple => {
      const templeNameLower = temple.templeName.toLowerCase();
      const templeLocationLower = temple.location.toLowerCase();
      
      // All search terms must match either the temple name or location
      return searchTerms.every(term => 
        templeNameLower.includes(term) || templeLocationLower.includes(term)
      );
    });
  }

  return results;
}

// --- Pure DOM Renderer ---
function renderTemples(filteredTemples) {
  const grid = document.querySelector("#figure-grid");
  if (!grid) return;
  
  grid.innerHTML = "";

  filteredTemples.forEach((temple, index) => {
    // Create main card container
    const card = document.createElement("section");
    card.classList.add("card");
    
    // 1. Heading (h2)
    const h2 = document.createElement("h2");
    h2.textContent = temple.templeName;
    card.appendChild(h2);

    // Helper function to create metadata paragraphs
    function createMetaParagraph(labelName, textValue) {
      const p = document.createElement("p");
      const span = document.createElement("span");
      span.classList.add("label");
      span.textContent = labelName + ": ";
      p.appendChild(span);
      p.appendChild(document.createTextNode(textValue));
      return p;
    }

    // 2. Metadata details
    card.appendChild(createMetaParagraph("Location", temple.location));
    card.appendChild(createMetaParagraph("Dedicated", temple.dedicated));
    card.appendChild(createMetaParagraph("Size", temple.area + " sq ft"));

    // 3. Image Path Generation
    // Generate a consistent file slug from the temple name (e.g., "aba-nigeria")
    const fileSlug = temple.templeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters like punctuation
      .trim()
      .replace(/\s+/g, '-');        // Replace spaces with dashes

    const basePath = "images/filtered-temples/webp/";
    const srcSmall = basePath + fileSlug + "-small.webp";
    const srcMedium = basePath + fileSlug + "-medium.webp";
    const srcLarge = basePath + fileSlug + "-large.webp";

    // Performance optimization: Priority hint 'high' for the first card above the fold, 'low' for others
    const fetchPriority = index === 0 ? "high" : "low";

    // 4. Figure Assembly
    const figure = document.createElement("figure");
    figure.classList.add("fig-temple");

    const img = document.createElement("img");
    img.setAttribute("src", srcSmall);
    img.setAttribute("srcset", srcSmall + " 500w, " + srcMedium + " 1000w, " + srcLarge + " 1500w");
    img.setAttribute("sizes", "(max-width: 640px) 500px, 1000px");
    img.setAttribute("alt", temple.templeName);
    img.setAttribute("width", "500");
    img.setAttribute("height", "250");
    img.setAttribute("loading", "lazy");
    img.setAttribute("fetchpriority", fetchPriority);
    img.style.cursor = "zoom-in";

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = temple.templeName;

    figure.appendChild(img);
    // figure.appendChild(figcaption); // according to assignment this does not exist
    card.appendChild(figure);

    // Append completed card to the main grid
    grid.appendChild(card); // TROUBLESHOOTING GRID
  });
}

// --- Central Navigation Controller ---
function setNavigationState(elementId) {
  // Fallback default state if nothing is set or element is missing
  if (!elementId) elementId = "home"; 
  
  const activeElement = document.getElementById(elementId);
  if (!activeElement) return;

  // Update UI Nav classes
  navReset();
  activeElement.classList.add("active");

  // Dynamic header text update
  if (elementId === "home") {
    h1.textContent = "All Temples";
  } else {
    h1.textContent = activeElement.textContent + " Temples";
  }

  // Save state to localStorage
  localStorage.setItem("activeElement", elementId);

  // Filter and display the data matching the current state
  const dataToDisplay = getFilteredTemples(elementId);
  renderTemples(dataToDisplay);
}

// --- Event Listeners ---
document.querySelector("#home")?.addEventListener("click", () => setNavigationState("home"));
document.querySelector("#old")?.addEventListener("click", () => setNavigationState("old"));
document.querySelector("#new")?.addEventListener("click", () => setNavigationState("new"));
document.querySelector("#large")?.addEventListener("click", () => setNavigationState("large"));
document.querySelector("#small")?.addEventListener("click", () => setNavigationState("small"));

// Single Live Search Input listener
searchInput?.addEventListener("input", () => {
  const currentFilter = localStorage.getItem("activeElement") || "home";
  const filteredData = getFilteredTemples(currentFilter);
  renderTemples(filteredData);
});

// --- Initialization Lifecycle ---
// Read local storage immediately upon script compilation/load.
const savedState = localStorage.getItem("activeElement");
setNavigationState(savedState);