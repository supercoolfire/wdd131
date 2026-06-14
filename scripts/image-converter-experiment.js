/*
* Image Converter Experiment
* (C) 2026 Jayser Pilapil
* Batch convert and optimize local source images into WebP formats.
*
* Requirements:
* 1. Node.js installed on your system (version >= 16.0.0).
* 2. "type": "module" added to your root package.json file.
*
* Installation:
* 1. Run the command in your project root: npm install sharp cli-progress
*
* Usage: 
* 1. Modify the CONFIG block below to match your targets.
* 2. Execute the script from your project root: node scripts/image-converter-experiment.js
*
*/

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // High-performance image processing engine
import cliProgress from 'cli-progress'; // Multi-bar CLI feedback engine

// Anchor absolute path lookups to this script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// INPUT CONFIGURATION
// ==========================================
const CONFIG = {
    // Comma-separated paths to source folders or individual explicit files
    // Example: './raw-assets/temples, ./backups/old-photo.jpg'
    sources: ['./project/images/raw/hero-dark.jpg'],
    
    // Base maximum quality ceiling (used as the highest bound for dynamicQuality scaling)
    // When dynamicQualityScaling is true, this value is the maximum quality for the largest crops
    // When dynamicQualityScaling is false, this value is used as the fixed quality for all output images
    baseQuality: 50, // Optimized to balance visual quality and file size for market competitiveness
    // If dynamicQualityScaling is on, baseQuality becomes the maximum quality ceiling, and quality scales proportionally to crop size down to 30
    // baseQuality is only used as a static global quality if dynamicQualityScaling is set to false
    dynamicQualityScaling: true,
    // Enable lossy compression for smallest possible file sizes (required to compete with leading optimization tools)
    lossy: true,
    
    // Suffix added to the image file name if cropped (Leave empty "" to ignore cropping)
    // If width and height are active, setting "-small" converts "pic.jpg" to "pic-small.webp"
    
    // Choose aspect ratio, width, orientation
    // Example landscape: 16:9, 1:1, 4:3, 3:4
    // Example portrait: 9:16, 3:4, 4:3, 1:1
    // Default is 16:9

    // hero
    aspectRatio: 16/9,
    crop: [
        {fileSuffix: "-small", width: 500},
        {fileSuffix: "-medium", width: 1000},
        {fileSuffix: "-large", width: 1500}
    ],

    // not hero
    // aspectRatio: 4/3,
    // crop: [
    //     {fileSuffix: "-small", width: 250},
    //     {fileSuffix: "-medium", width: 500},
    //     {fileSuffix: "-large", width: 750}
    // ],

    // If 'true', the folders with suffix will created in the output folder
    // Example: './images/place' -> './images/place-[fileSuffix].jpg'
    // If 'false', the files with suffix will created in the output folder
    // Example: './images/place/hero.jpg' -> './images/place/hero-webp-[fileSuffix].jpg'
    folderSuffix: 'false',
    outputFolder: './project/images'
};
// ==========================================

async function runImageConverter() {
    console.log('🚀 Initiating Batch WebP Image Conversion Experiment (Optimized for Minimal File Sizes)...');
    
    // Validate CONFIG structure first
    const configErrors = [];
    if (!Array.isArray(CONFIG.sources) || CONFIG.sources.length === 0) {
        configErrors.push("CONFIG.sources must be a non-empty array of file/folder paths");
    }
    if (typeof CONFIG.baseQuality !== 'number' || CONFIG.baseQuality < 1 || CONFIG.baseQuality > 100) {
        configErrors.push("CONFIG.baseQuality must be a number between 1 and 100");
    }
    if (typeof CONFIG.dynamicQualityScaling !== 'boolean') {
        configErrors.push("CONFIG.dynamicQualityScaling must be a boolean value (true/false)");
    }
    if (typeof CONFIG.lossy !== 'boolean') {
        configErrors.push("CONFIG.lossy must be a boolean value (true/false)");
    }
    if (typeof CONFIG.aspectRatio !== 'number' || CONFIG.aspectRatio <= 0) {
        configErrors.push("CONFIG.aspectRatio must be a positive number (e.g., 16/9)");
    }
    if (!Array.isArray(CONFIG.crop) || CONFIG.crop.length === 0) {
        configErrors.push("CONFIG.crop must be a non-empty array of crop configurations");
    } else {
        CONFIG.crop.forEach((crop, index) => {
            if (typeof crop.fileSuffix !== 'string' || crop.fileSuffix.trim().length === 0) {
                configErrors.push(`Crop config at index ${index} has invalid fileSuffix (must be non-empty string)`);
            }
            // MODIFIED: Only validate width here since height is now dynamically driven by aspectRatio
            if (typeof crop.width !== 'number' || crop.width < 1) {
                configErrors.push(`Crop config for ${crop.fileSuffix} has invalid width (must be a positive number)`);
            }
        });
    }
    if (typeof CONFIG.folderSuffix !== 'string' || !['true', 'false'].includes(CONFIG.folderSuffix.toLowerCase())) {
        configErrors.push("CONFIG.folderSuffix must be either 'true' or 'false'");
    }
    if (typeof CONFIG.outputFolder !== 'string' || CONFIG.outputFolder.trim().length === 0) {
        configErrors.push("CONFIG.outputFolder must be a valid non-empty path string");
    }

    if (configErrors.length > 0) {
        console.error('❌ Configuration errors detected:');
        configErrors.forEach(err => console.error(`  - ${err}`));
        return;
    }

    // 1. Sanitize and parse input source string targets array (fixed to handle array sources properly)
    const sourceInputs = CONFIG.sources
        .map(p => p.trim())
        .filter(p => p.length > 0);
        
    if (sourceInputs.length === 0) {
        console.error('❌ Error: No valid source folders or files detected in CONFIG.');
        return;
    }

    // Resolve target output directory path completely
    const baseOutputDir = path.resolve(__dirname, '..', CONFIG.outputFolder);

    // Verify base output directory is writable
    try {
        await fs.access(baseOutputDir, fs.constants.W_OK);
    } catch (err) {
        console.error(`❌ Output directory ${baseOutputDir} is not accessible or writable:`, err.message);
        return;
    }

    // Parse folderSuffix as boolean to handle string config value
    const useFolderSuffix = CONFIG.folderSuffix === 'true';

    let totalProcessed = 0;
    let totalFailed = 0;

    // MODIFIED: Calculate dynamic heights and pixel areas based on aspect ratio mapping before running sizing calculations
    const preparedCrops = CONFIG.crop.map(c => {
        const calculatedHeight = Math.round(c.width / CONFIG.aspectRatio);
        return {
            ...c,
            height: calculatedHeight,
            area: c.width * calculatedHeight
        };
    });

    // Calculate maximum possible area from crop configs to use for dynamic quality scaling
    const maxCropArea = Math.max(...preparedCrops.map(c => c.area));
    // Enforce non-zero max area to prevent division by zero in dynamic quality calculations
    if (maxCropArea === 0) {
        console.error('❌ Critical error: All crop configurations have zero area, cannot calculate dynamic quality');
        return;
    }

    // --- PHASE 1: PRE-DISCOVERY (Gather total tasks for accurate overall progress tracking) ---
    const discoveryTasks = [];
    for (const inputItem of sourceInputs) {
        const absoluteInputPath = path.resolve(__dirname, '..', inputItem);
        try {
            await fs.access(absoluteInputPath, fs.constants.R_OK);
            const stats = await fs.stat(absoluteInputPath);
            let filesToProcess = [];
            let currentSourceDir = '';

            if (stats.isDirectory()) {
                currentSourceDir = absoluteInputPath;
                const dirEntries = await fs.readdir(absoluteInputPath);
                filesToProcess = dirEntries.map(f => path.join(absoluteInputPath, f));
            } else if (stats.isFile()) {
                currentSourceDir = path.dirname(absoluteInputPath);
                filesToProcess = [absoluteInputPath];
            }

            const targetImages = filesToProcess.filter(f => 
                /\.(jpg|jpeg|png|webp|tiff|gif|avif)$/i.test(f)
            );

            if (targetImages.length > 0) {
                discoveryTasks.push({ absoluteInputPath, currentSourceDir, targetImages });
            } else {
                console.warn(`⚠️ No compatible image files found inside: "${inputItem}"`);
            }
        } catch (err) {
            console.error(`❌ Input path ${absoluteInputPath} is not accessible or readable:`, err.message);
            totalFailed++;
        }
    }

    // Multiply discovered images by the number of crop variations to get total operations
    const totalImageTasks = discoveryTasks.reduce((sum, t) => sum + t.targetImages.length, 0);
    const totalOperationsCount = totalImageTasks * preparedCrops.length;

    if (totalOperationsCount === 0) {
        console.log('⚠️ No images found to convert.');
        return;
    }

    // --- PHASE 2: INITIALIZE CLI-PROGRESS ENGINE ---
    const multibar = new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {percentage}% | {status} | {info}'
    }, cliProgress.Presets.shades_grey);

    // Global overall batch progress bar
    const globalBar = multibar.create(totalOperationsCount, 0, {
        status: 'Overall Progress',
        info: `0/${totalOperationsCount} variations completed`
    });

    // Sub-bar tracking individual pipeline steps for the current file
    const fileBar = multibar.create(100, 0, {
        status: 'Current File',
        info: 'Initializing...'
    });

    // --- PHASE 3: PROCESS LOOP ---
    try {
        for (const task of discoveryTasks) {
            const { currentSourceDir, targetImages } = task;

            // Process each crop configuration individually (using the mapped crops containing calculated heights)
            for (const cropConfig of preparedCrops) {
                // Determine final destination path based on folderSuffix setting
                let destinationFolderPath;
                if (useFolderSuffix) {
                    // Create subfolder with crop suffix if folderSuffix is true
                    const folderNameBase = path.basename(currentSourceDir);
                    const finalTargetDirName = `${folderNameBase}${cropConfig.fileSuffix}`;
                    destinationFolderPath = path.join(baseOutputDir, finalTargetDirName);
                } else {
                    // Use base output folder if folderSuffix is false
                    destinationFolderPath = baseOutputDir;
                }

                // Ensure the output folder structure tree exists safely
                await fs.mkdir(destinationFolderPath, { recursive: true });

                // Calculate dynamic quality for current crop size if enabled - ENFORCED COMPETITIVE SIZE RULES APPLIED
                let currentQuality = CONFIG.baseQuality;
                const minQuality = 30; // Minimum quality floor to maintain acceptable visual fidelity while minimizing file sizes
                if (CONFIG.dynamicQualityScaling) {
                    // Strict competitive dynamic quality calculation rules (never override these):
                    // 1. Calculate pixel area of current crop to use as scaling factor
                    const cropArea = cropConfig.area;
                    // 2. Scale current crop's area against the largest crop's area to get 0-1 ratio
                    const qualityScale = cropArea / maxCropArea;
                    // 3. Never allow quality to exceed baseQuality (largest crop = baseQuality, maximum allowed quality)
                    // 4. Never allow quality to drop below minQuality (smallest crop = minQuality, smallest possible file size with acceptable quality)
                    currentQuality = Math.round(minQuality + (CONFIG.baseQuality - minQuality) * qualityScale);
                    // 5. Clamp value to 1-100 range as an additional safety guard
                    currentQuality = Math.min(Math.max(currentQuality, 1), 100);
                }

                // Process each image for current crop configuration
                for (const fileAbsolutePath of targetImages) {
                    const fileParsed = path.parse(fileAbsolutePath);
                    
                    // Build target file name with crop suffix
                    const finalFileName = `${fileParsed.name}${cropConfig.fileSuffix}.webp`;
                    const destinationFilePath = path.join(destinationFolderPath, finalFileName);

                    // Update UI to show active target
                    fileBar.update(0, {
                        status: 'Processing File',
                        info: `${fileParsed.base} -> ${finalFileName} (Q: ${currentQuality})`
                    });

                    try {
                        // Initialize the sharp image processing pipeline stream
                        let pipeline = sharp(fileAbsolutePath);
                        fileBar.update(20);

                        // Validate source image metadata before processing
                        const metadata = await pipeline.metadata();
                        if (!metadata.width || !metadata.height) {
                            throw new Error("Invalid image file: could not read dimensions");
                        }
                        fileBar.update(40);

                        // Execute crop resizing rules for current crop config (using dynamic height calculated via aspect ratio)
                        if (cropConfig.width > 0 && cropConfig.height > 0) {
                            pipeline = pipeline.resize({
                                width: cropConfig.width,
                                height: cropConfig.height,
                                fit: 'cover', // Crops edges away automatically to maintain aspect ratio bounds
                                position: sharp.strategy.attention, // Focuses dynamically on the crispest details
                                kernel: sharp.kernel.lanczos3 // High-quality downsampling to preserve details while enabling lower quality settings
                            });
                        }
                        fileBar.update(60);

                        // Configure WebP encoding with maximum compression to compete with leading optimization tools
                        const webpOptions = {
                            quality: currentQuality,
                            lossless: !CONFIG.lossy, // Invert lossy flag for sharp's lossless parameter
                            nearLossless: false, // Disable near-lossless for maximum compression when using lossy
                            smartSubsample: true, // Force chroma subsampling for all lossy encodes to minimize file sizes
                            effort: 6, // Maximum compression effort (slowest processing, smallest possible file size to outperform competitors)
                            mixed: false // Disable mixed mode to ensure consistent aggressive compression
                        };
                        fileBar.update(80);

                        // Force encode pipeline output to WebP with target settings parameters
                        await pipeline
                            .webp(webpOptions)
                            .toFile(destinationFilePath);
                        
                        totalProcessed++;
                        fileBar.update(100);
                    } catch (processErr) {
                        totalFailed++;
                    }

                    // Update global progress bar values
                    globalBar.update(totalProcessed + totalFailed, {
                        info: `Processed: ${totalProcessed} | Errors: ${totalFailed}`
                    });
                }
            }
        }
        
        multibar.stop();
        console.log(`\n✨ Batch processing completed! Total processed: ${totalProcessed}, Total failed: ${totalFailed}`);

    } catch (globalErr) {
        multibar.stop();
        console.error('\n❌ Critical converter engine drop-out encountered:', globalErr.message);
    }
}

runImageConverter();