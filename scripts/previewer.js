/**
 * Page Previewer v1.0
 * Feature:
 * - Hover any standard link to preview the page content.
 * - Preview window follows the mouse cursor.
 * - Preview window is cached for quick loading.
 * 
 * Requirements:
 * - Previewer must be loaded after the page content is fully loaded.
 * - Previewer must be loaded after any other scripts that modify the DOM.
 * 
 * Usage:
 * - Add this script to your HTML file after all other scripts.
 * - Ensure the script is loaded after the page content is fully loaded.
 * - Previewer will work on any standard link on the page.
 * <script src="/scripts/previewer.js" defer></script>
 * 
 */
document.addEventListener("DOMContentLoaded", () => {
    /**
     * 1. Inject Styles
     */
    const style = document.createElement('style');
    style.textContent = `
    #page-preview {
      display: none;
      position: absolute;
      /* Use the variables passed from JS, defaulting to 0px */
      left: var(--mouse-x, 0px);
      top: var(--mouse-y, 0px);
      
      /* Your preview window styling */
      width: 350px;
      height: 250px;
      overflow: hidden; /* Keeps the preview contained */
      background: white;
      border: 1px solid #ccc;
      box-shadow: 0px 4px 12px rgba(0,0,0,0.15);
      border-radius: 4px;
      padding: 10px;
      pointer-events: none; /* Prevents the preview from flickering when mouse hits it */
      z-index: 9999;
    }
    `;
    document.head.appendChild(style);


    /**
     * 1. Create the floating preview container dynamically (keeps HTML clean)
     */
  const previewBox = document.createElement("div");
  previewBox.id = "page-preview"; // You can style this ID in your CSS
    document.body.appendChild(previewBox);

    /**
     * 2. Cache to store already fetched pages so we don't spam requests
     */
  const cache = new Map();

  // 2. Attach hover events to all standard links
  document.querySelectorAll("a").forEach(link => {
    // Skip anchor links (e.g., #section) or external links if desired
    /**
     * 2.1 Attach hover events to all standard links
     */
    if (link.getAttribute("href").startsWith("#")) return;

    link.addEventListener("mouseenter", async (e) => {
      const url = link.href;
      
      // Show the box immediately and position it
      previewBox.style.display = "block";
      previewBox.innerHTML = "Loading preview...";

      try {
        if (cache.has(url)) {
          previewBox.innerHTML = cache.get(url);
        } else {
          // Fetch the page content
          const response = await fetch(url);
          if (!response.ok) throw new Error("Could not fetch page");
          
          const htmlText = await response.text();
          
          // Parse the HTML text so we can grab just the body (or specific parts)
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");
          const bodyContent = doc.body.innerHTML;

          // Cache it and display it
          cache.set(url, bodyContent);
          previewBox.innerHTML = bodyContent;
        }
      } catch (error) {
        previewBox.innerHTML = "Preview unavailable";
      }
    });

    /**
     * 2. Move the preview box with the mouse cursor
     */
    link.addEventListener("mousemove", (e) => {
      // You mentioned you use CSS for positioning, but JS handles the coordinates.
      // These custom CSS variables can be read by your stylesheet!
      previewBox.style.setProperty("--mouse-x", `${e.pageX + 15}px`);
      previewBox.style.setProperty("--mouse-y", `${e.pageY + 15}px`);
    });

    /**
     * 3. Hide the preview when the mouse leaves the link
     */
    link.addEventListener("mouseleave", () => {
      previewBox.style.display = "none";
      previewBox.innerHTML = "";
    });
  });
});