/**
 * Requirements:
 * 1. nodejs >= 16.0.0
 * 2. npm
 * 
 * Installation:
 * npm install fs
 * 
 * Usage:
 * node experiment/object-merger.js
 * 
 */


import * as fs from 'fs/promises';

// Non-negotiable configuration parameters
const CONFIG = {
  file1: 'data/classmate.jsol',
  file2: 'experiment/scrape-output.json',  
  key: 'name',
  output: 'experiment/merged-output.json', // Handled fallback for the typo 'outout'
  output_format: 'json' // json or jsol
};

// Resilient parser that handles both strict JSON and loose JSOL format strings
async function parseJSOLOrJSON(filePath) {
  try {
    let rawData = (await fs.readFile(filePath, 'utf-8')).trim();
    
    try {
      // Attempt strict JSON processing first
      return JSON.parse(rawData);
    } catch {
      // Fallback for JSOL: strip out common JS modules patterns and evaluate safely as an expression
      const cleanBody = rawData.replace(/(module\.exports\s*=|export\s+default)/g, '');
      return Function(`return (${cleanBody})`)();
    }
  } catch (error) {
    console.error(`❌ Failed to read or parse file at ${filePath}:`, error.message);
    throw error;
  }
}

// Custom stringifier to convert native JS objects into unquoted JSOL structures
function stringifyToJSOL(data, format) {
  const standardJson = JSON.stringify(data, null, 2);
  
  if (format.toLowerCase() === 'jsol') {
    // Regex targets valid JavaScript identifiers used as keys and strips their double quotes
    return standardJson.replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:');
  }
  
  return standardJson;
}

async function startMerge() {
  try {
    console.log(`Loading inputs...`);
    const source1 = await parseJSOLOrJSON(CONFIG.file1);
    const source2 = await parseJSOLOrJSON(CONFIG.file2);

    if (!Array.isArray(source1) || !Array.isArray(source2)) {
      throw new Error('Data inside input files must resolve to arrays of objects.');
    }

    console.log(`Processing records matching on key: "${CONFIG.key}"...`);

    // Use a Map tracking the key for linear index lookups
    const registry = new Map();

    // Populate data from file 1
    source1.forEach(entry => {
      if (entry && entry[CONFIG.key] !== undefined) {
        registry.set(entry[CONFIG.key], entry);
      }
    });

    // Merge or append data from file 2
    source2.forEach(entry => {
      if (entry && entry[CONFIG.key] !== undefined) {
        const uniqueKeyValue = entry[CONFIG.key];
        if (registry.has(uniqueKeyValue)) {
          // Merge objects together; fields in input2.json overwrite input.jsol conflicts
          registry.set(uniqueKeyValue, { ...registry.get(uniqueKeyValue), ...entry });
        } else {
          // Unique entry from file 2, add it to the collection
          registry.set(uniqueKeyValue, entry);
        }
      }
    });

    const outputDataset = Array.from(registry.values());
    const finalPayload = stringifyToJSOL(outputDataset, CONFIG.output_format);

    // Save final formatted dataset to disk
    await fs.writeFile(CONFIG.output, finalPayload, 'utf-8');
    console.log(`\n🎉 Success! Combined output written to: ${CONFIG.output}`);

  } catch (err) {
    console.error('CRITICAL: Merging pipeline halted.', err.message);
  }
}

startMerge();