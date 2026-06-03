/*
 * SVG Scaler
 * Scales SVG files to a specified width and unit (px or %)
 * installation:
 * npm install xml2js fs-extra path
 * 
 * Usage: 
 * node scripts/svg-scaler.js
 */

const fs = require('fs-extra'); // Or standard fs if you prefer
const path = require('path');
const xml2js = require('xml2js');

// --- Your Configuration ---
const config = {
    sourceFiles: ["./project/images/wireframe-desktop-light-bak.svg", "./project/images/wireframe-desktop-dark-bak.svg"], // Add your source SVG file paths here
         rename: ["wireframe-desktop-light.svg", "wireframe-desktop-dark.svg"],
    destinationFolder: "./project/images/",        // Where scaled SVGs will be saved
    width: 315,                             // The target width value
    unit: "px"                              // "px" or "%"
};

// Parser and Builder for SVG XML
const parser = new xml2js.Parser();
const builder = new xml2js.Builder();

async function scaleSVG() {
    try {
        // Ensure destination folder exists
        if (!fs.existsSync(config.destinationFolder)) {
            fs.mkdirSync(config.destinationFolder, { recursive: true });
        }

        for (let i = 0; i < config.sourceFiles.length; i++) {
            const filePath = config.sourceFiles[i];
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File not found: ${filePath}`);
                continue;
            }

            // Read and parse XML
            const svgData = fs.readFileSync(filePath, 'utf-8');
            const result = await parser.parseStringPromise(svgData);
            
            // Extract root SVG attributes
            const svgAttributes = result.svg.$;
            
            // Get original dimensions to handle percentages or missing width/height
            let origWidth = parseFloat(svgAttributes.width);
            let origHeight = parseFloat(svgAttributes.height);

            // Fallback to viewBox if width/height aren't explicitly set
            if ((isNaN(origWidth) || isNaN(origHeight)) && svgAttributes.viewBox) {
                const viewBoxParts = svgAttributes.viewBox.split(' ').map(Number);
                if (viewBoxParts.length === 4) {
                    origWidth = viewBoxParts[2];
                    origHeight = viewBoxParts[3];
                }
            }

            if (!origWidth || !origHeight) {
                console.error(`❌ Could not determine original dimensions for ${filePath}`);
                continue;
            }

            let targetWidth;
            let targetHeight;

            // Calculate new dimensions based on unit
            if (config.unit === 'px') {
                targetWidth = config.width;
                // Maintain aspect ratio
                targetHeight = (origHeight / origWidth) * targetWidth;
            } else if (config.unit === '%') {
                const scaleFactor = config.width / 100;
                targetWidth = origWidth * scaleFactor;
                targetHeight = origHeight * scaleFactor;
            } else {
                throw new Error(`Invalid unit "${config.unit}". Use "px" or "%".`);
            }

            // Update attributes
            svgAttributes.width = `${Math.round(targetWidth)}px`;
            svgAttributes.height = `${Math.round(targetHeight)}px`;

            // Ensure viewBox is set so it scales beautifully without clipping
            if (!svgAttributes.viewBox) {
                svgAttributes.viewBox = `0 0 ${origWidth} ${origHeight}`;
            }

            // Rebuild XML and write file
            const updatedSvg = builder.buildObject(result);
            const fileName = path.basename(config.rename[i]);
            const destinationPath = path.join(config.destinationFolder, fileName);

            fs.writeFileSync(destinationPath, updatedSvg, 'utf-8');
            console.log(`✅ Scaled: ${fileName} -> ${destinationPath} (${Math.round(targetWidth)}x${Math.round(targetHeight)}px)`);
        }
    } catch (error) {
        console.error("❌ An error occurred during scaling:", error);
    }
}

scaleSVG();