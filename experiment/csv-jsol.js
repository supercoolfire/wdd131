/*
* Requirements:
* 1. nodejs >= 16.0.0
* 2. npm
*
* Installations:
* npm install csv-parser fs path
*
* Usage:
* node experiment/csv-jsol.js
*/

import * as fs from 'fs/promises';
import csvParser from 'csv-parser';

// Configuration parameters
const CONFIG = {
  source: 'experiment/csv-output-fixed.csv',
  output: 'experiment/csv-jsol-output.json',
  output_format: 'json' // 'json' or 'jsol'
};

// Helper function to handle complex CSV row splitting (respects commas inside quotes)
function parseCSVLine(line) {
  const result = [];
  let currentToken = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      // If we see two double-quotes together, it's an escaped quote ""
      if (insideQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote block status
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Split on comma only if we aren't inside a bounded string block
      result.push(currentToken);
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  result.push(currentToken); // Push final cell item
  return result;
}

// Safely attempts to map literal items (objects, arrays, numbers) instead of keeping them plain text
function castValue(val) {
  const trimmed = val.trim();
  
  if (trimmed === '') return null;
  if (trimmed.toLowerCase() === 'null') return null;
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  if (!isNaN(trimmed) && trimmed !== '') return Number(trimmed);

  // If the cell appears to be a stringified object or array literal, parse it out safely
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Fallback if parsing fails (keeps it as a regular text string)
      return trimmed;
    }
  }

  return trimmed;
}

// Formatter to stringify objects based on strict JSON or unquoted JSOL specifications
function stringifyData(data, format) {
  const standardJson = JSON.stringify(data, null, 2);
  
  if (format.toLowerCase() === 'jsol') {
    // Regex matches valid JS identity keys and strips out the quotes surrounding them
    return standardJson.replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:');
  }
  
  return standardJson;
}

async function convertCsvToObject() {
  try {
    console.log(`Reading CSV data from: ${CONFIG.source}...`);
    const rawContent = await fs.readFile(CONFIG.source, 'utf-8');

    // Split rows on standard newline characters and remove completely empty rows
    const rows = rawContent.split(/\r?\n/).filter(row => row.trim() !== '');
    
    if (rows.length < 1) {
      throw new Error('The source CSV file is empty.');
    }

    // 1. Process header row to extract keys
    const headers = parseCSVLine(rows[0]).map(h => h.trim());
    console.log(`Extracted field keys: [${headers.join(', ')}]`);

    const records = [];

    // 2. Parse data lines
    for (let i = 1; i < rows.length; i++) {
      const fieldValues = parseCSVLine(rows[i]);
      const record = {};

      headers.forEach((header, index) => {
        const rawValue = fieldValues[index] !== undefined ? fieldValues[index] : '';
        // Map keys to their structural value, converting text literals back to active objects/arrays
        record[header] = castValue(rawValue);
      });

      records.push(record);
    }

    // 3. Stringify structural content into custom output notation
    const payload = stringifyData(records, CONFIG.output_format);

    // 4. Write data back to file system
    await fs.writeFile(CONFIG.output, payload, 'utf-8');
    
    console.log(`\n🎉 Success! Processed ${records.length} database entries.`);
    console.log(`Saved structured file to: ${CONFIG.output} in [${CONFIG.output_format.toUpperCase()}] layout.`);

  } catch (error) {
    console.error('CRITICAL: CSV conversion pipeline failed.', error.message);
  }
}

convertCsvToObject();