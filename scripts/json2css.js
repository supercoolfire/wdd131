/**
 * Converts a JSON object back into a CSS string.
 * 
 * Example Input:
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
 * Example Output:
 * body {
 *   background-color: #fff;
 *   margin: 0;
 * }
 * .btn:hover {
 *   color: red;
 * }
 */

function jsonToCss(json) {
    let css = '';
    
    for (const selector in json) {
        if (json.hasOwnProperty(selector)) {
            css += `${selector} {\n`;
            const rules = json[selector];
            for (const property in rules) {
                if (rules.hasOwnProperty(property)) {
                    css += `  ${property}: ${rules[property]};\n`;
                }
            }
            css += `}\n\n`;
        }
    }
    
    return css.trim();
}

// If in Node.js environment, export the function
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { jsonToCss };
}

// Example usage (if running directly)
/*
const sampleJSON = {
    "body": {
        "font-family": "Arial, sans-serif",
        "color": "#333"
    },
    "h1": {
        "color": "blue"
    }
};
console.log(jsonToCss(sampleJSON));
*/
