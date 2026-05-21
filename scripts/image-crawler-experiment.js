/*
* Image Crawler Experiment
* (C) 2026 Jayser Pilapil
* Crawl images from specified local directories and generate a JSON database.
* This script is fully optimized for modern Node.js (v22+) and WebP layouts.
*
* Requirements:
* 1. Node.js installed on your system (version >= 16.0.0).
* 2. "type": "module" added to your root package.json file.
*
* Installation:
* 1. Run the command in your project root: npm install image-size
*
* Usage: 
* 1. Open your terminal in the project root folder.
* 2. Run the file: node scripts/image-crawler-experiment.js
*
* 🛠️ DETAILED ARCHITECTURE & TYPE ERROR RESOLUTION EXPLANATION:
*
* 1. Resolution of the 'SharedArrayBuffer/ArrayBuffer' Type Error:
*    Older versions of this script ran imageSize() synchronously by passing raw file path strings.
*    In newer Node.js runtimes (like v24), doing this can trigger internal buffer mapping errors 
*    because the engine expects modern binary typing streams (like Uint8Array) when reading sync data.
*    To fix this safely, we now import { imageSizeFromFile } from 'image-size/fromFile'. This uses 
*    Node's native async fs.open streams behind the scenes, bypassing the type checking restrictions completely.
*
* 2. Absolute Directory Anchor mapping:
*    We calculate paths using `import.meta.url` + `path.resolve()`. This prevents the execution terminal 
*    from breaking the path logic if you launch the script from a directory outside your project root.
*/

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { imageSizeFromFile } from 'image-size/fromFile'; // Safe modern async file stream parser

// Get the absolute path of the directory containing this script file (/scripts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// INPUT CONFIGURATION (Calculated relative to this script file)
// ==========================================
const CONFIG = {
    directories: {
        small: {
            // Absolute local path where Node reads file attributes off your hard disk:
            diskPath: path.resolve(__dirname, '../images/place'),
            // Relative Web URL injected directly into the final front-end JSON schema:
            webUrl: 'images/place',
            // Suffix added to filename for this size variant (used when all diskPaths are identical)
            suffix: '-small'
        },
        medium: {
            diskPath: path.resolve(__dirname, '../images/place'),
            webUrl: 'images/place',
            suffix: '-medium'
        },
        large: {
            diskPath: path.resolve(__dirname, '../images/place'),
            webUrl: 'images/place',
            suffix: '-large'
        }
    },
    // Target image formats to search for (case-insensitive regex)
    fileTypes: /\.(webp)$/i,
    
    // Target output location for your processed client-side image database
    destinationFile: path.resolve(__dirname, '../data/images-place.json')
};
// ==========================================

async function generateImageDatabase() {
    console.log('🚀 Starting local image crawl process...');
    console.log(`📂 Scanning disk directory: ${CONFIG.directories.large.diskPath}`);
    const resultJson = {};

    // Detect if all directories share the same disk path (suffix mode is active)
    const allDiskPathsIdentical = new Set(
        Object.values(CONFIG.directories).map(dir => dir.diskPath)
    ).size === 1;

    console.log(`⚙️ Operating in ${allDiskPathsIdentical ? 'file-suffix' : 'separate-directories'} mode`);

    try {
        // Confirm the directory is accessible to produce clear descriptive warnings if missing
        try {
            await fs.access(CONFIG.directories.large.diskPath);
        } catch {
            throw new Error(`The target directory "${CONFIG.directories.large.diskPath}" could not be reached. Check that your folder layout accurately matches your setup.`);
        }

        // Read all filenames from the primary source directory
        const files = await fs.readdir(CONFIG.directories.large.diskPath);
        
        // Isolate file matches matching our format configuration regex
        let targetImages = files.filter(file => CONFIG.fileTypes.test(file));

        // In suffix mode, only process base filenames (without suffixes) to avoid duplicates
        if (allDiskPathsIdentical) {
            const sizeSuffixes = Object.values(CONFIG.directories).map(dir => dir.suffix);
            // Extract unique base filenames by stripping suffixes and extension
            const baseNames = new Set();
            targetImages.forEach(file => {
                const { name, ext } = path.parse(file);
                // Check if this file is a size variant, and extract its base name
                for (const suffix of sizeSuffixes) {
                    if (name.endsWith(suffix)) {
                        const baseName = name.slice(0, -suffix.length);
                        baseNames.add(baseName);
                        break;
                    }
                }
            });
            // Rebuild target files list with only base files (to avoid duplicate entries)
            targetImages = Array.from(baseNames).map(baseName => `${baseName}${path.parse(targetImages[0]).ext}`);
        }
        
        console.log(`📁 Found ${targetImages.length} matching image asset(s) for processing.`);

        if (targetImages.length === 0) {
            console.warn('⚠️ Process halted: No matching image files were found to populate the JSON layout.');
            return;
        }

        for (const file of targetImages) {
            const { name: baseName, ext } = path.parse(file);
            const id = baseName;
            
            try {
                // Generate size-appropriate filenames (add suffix if in suffix mode)
                const smallFilename = allDiskPathsIdentical ? `${baseName}${CONFIG.directories.small.suffix}${ext}` : file;
                const mediumFilename = allDiskPathsIdentical ? `${baseName}${CONFIG.directories.medium.suffix}${ext}` : file;
                const largeFilename = allDiskPathsIdentical ? `${baseName}${CONFIG.directories.large.suffix}${ext}` : file;

                // Generate absolute path links for each variance layout tier
                const smallImgPath = path.join(CONFIG.directories.small.diskPath, smallFilename);
                const mediumImgPath = path.join(CONFIG.directories.medium.diskPath, mediumFilename);
                const largeImgPath = path.join(CONFIG.directories.large.diskPath, largeFilename);

                // Fetch data async using imageSizeFromFile to safely resolve modern binary stream bindings
                const smallDims = await imageSizeFromFile(smallImgPath);
                const mediumDims = await imageSizeFromFile(mediumImgPath);
                const largeDims = await imageSizeFromFile(largeImgPath);

                // Ensure clean URL routing structures across platforms (converts Windows backslashes)
                const smallWebUrl = CONFIG.directories.small.webUrl.replace(/\\/g, '/');
                const mediumWebUrl = CONFIG.directories.medium.webUrl.replace(/\\/g, '/');
                const largeWebUrl = CONFIG.directories.large.webUrl.replace(/\\/g, '/');

                resultJson[id] = {
                    "tag": "picture",
                    "directories": {
                        "small": smallWebUrl,
                        "medium": mediumWebUrl,
                        "large": largeWebUrl
                    },
                    "filename": file,
                    "breakpoints": {
                        "w1": smallDims.width,
                        "w2": mediumDims.width,
                        "w3": largeDims.width
                    },
                    "dimensions": {
                        "width": largeDims.width,
                        "height": largeDims.height,
                        "aspectRatio": (largeDims.width / largeDims.height).toFixed(2)
                    },
                    "items": [
                        {
                            "tag": "source",
                            "media": `(max-width: ${smallDims.width}px)`,
                            "srcset": `${smallWebUrl}/${smallFilename}`
                        },
                        {
                            "tag": "source",
                            "media": `(max-width: ${mediumDims.width}px)`,
                            "srcset": `${mediumWebUrl}/${mediumFilename}`
                        },
                        {
                            "tag": "img",
                            "src": `${largeWebUrl}/${largeFilename}`,
                            "alt": baseName,
                            "width": "500",
                            "height": "250",
                            "loading": "lazy"
                        }
                    ]
                };
            } catch (err) {
                // Skips broken assets locally without causing the entire processing loop chain to drop out
                console.warn(`⚠️ Skipped entry [${file}]: Image tracking layout failed. Details:`, err.message);
            }
        }

        // Interrupt process before running file overrides if no datasets compiled successfully
        if (Object.keys(resultJson).length === 0) {
            console.error('❌ JSON generation blocked: Every crawled image processing task resulted in an execution error.');
            return;
        }

        // Build target destination directories recursively if they don't exist yet
        const destFolder = path.dirname(CONFIG.destinationFile);
        console.log(`\n🗂️ Ensuring target output directory structure exists: ${destFolder}`);
        await fs.mkdir(destFolder, { recursive: true });

        // Save pretty-formatted JSON dataset configuration back out onto the target file path
        console.log(`💾 Writing JSON database file to: ${CONFIG.destinationFile}`);
        await fs.writeFile(CONFIG.destinationFile, JSON.stringify(resultJson, null, 4), 'utf-8');
        console.log(`\n✨ Success! Compiled database exported straight to: ${CONFIG.destinationFile}`);

    } catch (mainErr) {
        console.error('\n❌ Critical crawl failure encountered:', mainErr.message);
    }
}

generateImageDatabase();