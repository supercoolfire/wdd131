/**
 * * Image Downloader Experiment
* (C) 2026 Jayser Pilapil
 *
 * Requirements:
 * 1. Node.js installed on your system (version >= 16.0.0).
 * 2. "type": "module" added to your root package.json file.
 * 
 * Installation:
 * 1. Run the command in your project root: npm install axios cli-progress
 * 
 * Usage:
 * 1. Prepare your destination folder (e.g., `images/downloads`) where you want to store the downloaded images.
 * 2. modify the CONFIG block directly below to match your dataset keys and paths.
 * 3. execute the script from your project root: node scripts/image-downloader-experiment.js
 * 
 * * FEATURES:
 * - Reads external configuration JSON/JSOL array dynamically.
 * - Auto-sanitizes target filename strings (converts spaces to dashes, strips illegal symbols).
 * - Self-extracts original extension markers (.jpg, .jpeg, .png) from dynamic assets.
 * - Auto-creates nested path directory systems if they don't exist.
 * - Visualizes live byte-by-byte feedback logs via an interactive CLI terminal progress bar UI.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cliProgress = require('cli-progress');

// ==========================================
// CONFIGURATION REQUIREMENTS
// ==========================================
const CONFIG = {
    jsonFile: 'data/test.jsol',  // Path to target JSON or JSOL file
    nameKey: 'templeName',       // Key used to rename file (spaces become dashes)
    urlKey: 'imageUrl',          // Key containing the image url link id
    destDirectory: 'images/test' // Relative or absolute destination directory path
};

function sanitizeFilename(name) {
    return String(name)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
}

async function downloadImage(url, destPath, progressBar, fileIndex, totalFiles) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const totalLength = parseInt(response.headers['content-length'], 10) || 0;
        progressBar.start(totalLength, 0, { fileIndex, totalFiles, currentFile: path.basename(destPath) });

        const writer = fs.createWriteStream(destPath);
        
        response.data.on('data', (chunk) => {
            progressBar.increment(chunk.length);
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                progressBar.stop();
                resolve();
            });
            writer.on('error', (err) => {
                progressBar.stop();
                reject(err);
            });
        });

    } catch (error) {
        progressBar.stop();
        console.error(`\n❌ Error downloading URL: ${url} | ${error.message}`);
    }
}

async function startBatchDownload() {
    if (!fs.existsSync(CONFIG.destDirectory)) {
        fs.mkdirSync(CONFIG.destDirectory, { recursive: true });
    }

    let items = [];
    try {
        if (!fs.existsSync(CONFIG.jsonFile)) {
            throw new Error(`Target file metadata missing at path: ${CONFIG.jsonFile}`);
        }
        const rawData = fs.readFileSync(CONFIG.jsonFile, 'utf8').trim();
        
        // --- COMPATIBILITY FALLBACK HANDLER ---
        try {
            // 1. Attempt standard strict JSON compilation
            items = JSON.parse(rawData);
        } catch (jsonErr) {
            // 2. If it fails, compile it safely as a JavaScript Object Literal (JSOL)
            // Wrapping it in parentheses ensures the runtime treats it as an expression
            try {
                items = Function(`"use strict"; return (${rawData})`)();
            } catch (jsolErr) {
                throw new Error(`Failed parsing data structure as JSON or JSOL. Error details: ${jsolErr.message}`);
            }
        }
        // --------------------------------------

        if (!Array.isArray(items)) {
            throw new Error("Target root format structure must parse as an Array.");
        }
    } catch (err) {
        console.error(`\n❌ Script configuration break: ${err.message}`);
        process.exit(1);
    }

    console.log(`🚀 Processing data payload pool targeting ${items.length} items...\n`);

    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: '[{fileIndex}/{totalFiles}] Downloading {currentFile} | {bar} | {percentage}%'
    }, cliProgress.Presets.shades_classic);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const imageUrl = item[CONFIG.urlKey];
        const rawName = item[CONFIG.nameKey];

        if (!imageUrl || !rawName) {
            continue; 
        }

        let ext = '.jpg';
        try {
            const parsedUrl = new URL(imageUrl);
            const foundExt = path.extname(parsedUrl.pathname);
            if (foundExt) ext = foundExt.split('?')[0]; 
        } catch (e) {}

        const cleanName = sanitizeFilename(rawName);
        const finalFilename = `${cleanName}${ext}`;
        const destinationPath = path.join(CONFIG.destDirectory, finalFilename);

        const singleBar = multibar.create(100, 0); 
        await downloadImage(imageUrl, destinationPath, singleBar, i + 1, items.length);
    }

    multibar.stop();
    console.log('\n✅ Task synchronization operations completed successfully.');
}

startBatchDownload();