/**
 * * Image Downloader Experiment
 * (C) 2026 Jayser Pilapil
 *
 * Requirements:
 * 1. Node.js installed on your system (version >= 16.0.0).
 * 2. "type": "module" added to your root package.json file.
 * 
 * Installation:
 * 1. project root: npm install axios cli-progress
 * 
 * Usage:
 *  node scripts/image-downloader-experiment.js
 * 
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

async function downloadImage(url, destPath, currentBar, fileIndex, totalFiles) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        const totalLength = parseInt(response.headers['content-length'], 10) || 0;
        
        // Reset and start individual progress bar for the incoming file stream
        currentBar.start(totalLength, 0, { currentFile: path.basename(destPath) });

        const writer = fs.createWriteStream(destPath);
        
        response.data.on('data', (chunk) => {
            currentBar.increment(chunk.length);
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                currentBar.stop();
                resolve();
            });
            writer.on('error', (err) => {
                currentBar.stop();
                reject(err);
            });
        });

    } catch (error) {
        currentBar.stop();
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
            items = JSON.parse(rawData);
        } catch (jsonErr) {
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

    // Create container for multi-bar display
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        noTTYOutput: false
    }, cliProgress.Presets.shades_classic);

    // 1. Overall Batch Progress Bar (Top)
    const overallBar = multibar.create(items.length, 0, {}, {
        format: 'Overall Progress | {bar} | {value}/{total} Files ({percentage}%)'
    });

    // 2. Individual Stream Progress Bar (Bottom)
    const currentBar = multibar.create(100, 0, { currentFile: 'Initializing...' }, {
        format: 'Current Download | {bar} | {percentage}% | {currentFile}'
    });

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const imageUrl = item[CONFIG.urlKey];
        const rawName = item[CONFIG.nameKey];

        if (!imageUrl || !rawName) {
            overallBar.increment(); // Step over invalid entry
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

        // Check if file exists and config permits skipping
        if (CONFIG.skip_existing && fs.existsSync(destinationPath)) {
            currentBar.update(100, { currentFile: `${finalFilename} (Skipped - Existing)` });
            overallBar.increment();
            continue;
        }

        // Run the dynamic download stream
        await downloadImage(imageUrl, destinationPath, currentBar, i + 1, items.length);
        
        // Update global counter
        overallBar.increment();
    }

    multibar.stop();
    console.log('\n✅ Task synchronization operations completed successfully.');
}

startBatchDownload();