/* 
* Usage:
<div id="website-subject" class="markdown-body">Loading website-subject...</div>
<script type="module">
    import { renderMarkdown } from '../scripts/markdownViewer.js';
    renderMarkdown('website-subject.md', 'website-subject');
</script>
*/

// Import Marked directly from an ESM-compliant CDN
import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

/**
 * Fetches a Markdown file and renders it into a specific HTML container.
 * @param {string} url - The path or URL to the .md file.
 * @param {string} elementId - The ID of the HTML element where the content should go.
 */
export async function renderMarkdown(url, elementId) {
    const container = document.getElementById(elementId);
    
    if (!container) {
        console.error(`Element with ID "${elementId}" not found.`);
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const markdownText = await response.text();

        // Use the imported 'marked' object safely here
        container.innerHTML = marked.parse(markdownText);
        
    } catch (error) {
        console.error('Failed to render markdown:', error);
        container.innerHTML = `<p style="color: red;">Error loading content.</p>`;
    }
}