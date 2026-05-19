/**
 * Converts a CSS string into a JSON object.
 * 
 * Example Input:
 * body {
 *   background-color: #fff;
 *   margin: 0;
 * }
 * .btn:hover {
 *   color: red;
 * }
 * 
 * Example Output:
 * {
 *   "body": {
 *     "background-color": "#fff",
 *     "margin": "0"
 *   },
 *   ".btn:hover": {
 *     "color": "red"
 *   }
 * }
 * 
 * 
 */

function cssToJson(css) {
    const json = {};
    
    // Remove comments
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Match each block: selector { rules }
    const blockRegex = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = blockRegex.exec(css)) !== null) {
        const selector = match[1].trim();
        const rulesString = match[2].trim();
        
        if (!json[selector]) {
            json[selector] = {};
        }
        
        // Split rules by semicolon
        const rules = rulesString.split(';');
        
        rules.forEach(rule => {
            if (rule.trim()) {
                const [property, ...valueParts] = rule.split(':');
                if (property && valueParts.length > 0) {
                    const value = valueParts.join(':').trim();
                    json[selector][property.trim()] = value;
                }
            }
        });
    }
    
    return json;
}

// If in Node.js environment, export the function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cssToJson };
}

// Example usage (if running directly)

const sampleCSS = `
/* ***************** 90's Neon Navigation Bar start ***************** */
nav {
    /* 90's Neon Navigation Bar */
    background-color: var(--retro-purple);
    /* padding: 10px; */
    margin-bottom: 20px;
    border: 3px solid var(--neon-magenta);
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

nav.show {
    display: block;
}

nav ul {
    list-style: none;
    display: flex;
    margin: 0;
    /* gap: 15px; */
}


nav ul li {
    /* Neon Button Style for Navigation Links */
    background-color: var(--neon-cyan);
    padding: 8px 12px;
    border-radius: 4px;
    border: 2px solid var(--neon-magenta);
    box-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
    margin: 5px 0;
}

nav ul li:hover {
    background-color: var(--neon-magenta);
    color: var(--classic-white);
    cursor: pointer;
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
}

nav ul li a {
    color: var(--jet-black);
    font-weight: bold;
}

nav ul li a:hover {
    color: var(--deep-forest);
    text-shadow: 0 0 5px rgba(255, 255, 51, 0.8);
}

/* ***************** 90's Neon Navigation Bar end ***************** */
`;
console.log(JSON.stringify(cssToJson(sampleCSS), null, 2));

