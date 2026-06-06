/*
* Object to CSV Converter
* Requirements:
* 1. nodejs >= 16.0.0
* 2. npm
*
* Installations:
* npm install fs
*
* Usage:
* node experiment/object-scv.js
*/

// config:
import * as fs from 'fs/promises';

// Your non-negotiable configuration
const CONFIG = {
  file: 'experiment/merged-output.json',
  output: 'experiment/csv-output.csv'   
};

// Resilient parser to safely handle both strict JSON and loose JSOL data arrays
async function parseInputFile(filePath) {
  try {
    let rawData = (await fs.readFile(filePath, 'utf-8')).trim();
    
    try {
      return JSON.parse(rawData);
    } catch {
      // Fallback for JSOL structures (unquoted keys, single quotes)
      const cleanBody = rawData.replace(/(module\.exports\s*=|export\s+default)/g, '');
      return Function(`return (${cleanBody})`)();
    }
  } catch (error) {
    console.error(`❌ Failed to read or parse input file at ${filePath}:`, error.message);
    throw error;
  }
}

// Fixed function: Prevents [object Object] by converting them to literal stringified text
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue;

  // FIX: If the value is an object or an array, turn it into its raw literal string format
  if (typeof value === 'object') {
    stringValue = JSON.stringify(value);
  } else {
    stringValue = String(value);
  }
  
  // Standard CSV escaping rules: handle commas, quotes, and line breaks safely
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape internal quotes by duplicating them
    stringValue = stringValue.replace(/"/g, '""');
    return `"${stringValue}"`;
  }
  
  return stringValue;
}

async function convertToCSV() {
  try {
    console.log(`Reading input data from ${CONFIG.file}...`);
    const data = await parseInputFile(CONFIG.file);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Input data must be a non-empty array of objects.');
    }

    // 1. Gather all unique object keys to dynamically build the headers
    const headers = Array.from(
      new Set(data.flatMap(item => Object.keys(item || {})))
    );

    console.log(`Generating CSV with columns: [${headers.join(', ')}]...`);

    const csvRows = [];

    // 2. Add the header row
    csvRows.push(headers.join(','));

    // 3. Map each object to its corresponding CSV line
    for (const item of data) {
      const rowValues = headers.map(header => escapeCSVValue(item[header]));
      csvRows.push(rowValues.join(','));
    }

    // 4. Save to disk
    const csvContent = csvRows.join('\r\n');
    await fs.writeFile(CONFIG.output, csvContent, 'utf-8');

    console.log(`\n🎉 Success! Converted ${data.length} items without [object Object] errors.`);
    console.log(`Saved CSV output to: ${CONFIG.output}`);

  } catch (error) {
    console.error('CRITICAL: CSV conversion pipeline failed.', error.message);
  }
}

convertToCSV();