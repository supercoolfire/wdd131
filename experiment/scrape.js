/*
* Requirements:
* 1. nodejs >= 16.0.0
* 2. npm
*
* Installations:
* npm install cheerio
*
* Usage:
* node experiment/scrape.js
*/

import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';

// Configuration: Add, remove, or change ANY selector here without touching the engine below!
const CONFIG = {
  url: 'experiment/list.html', 
  output: 'experiment/scrape-output.json',
  rowSelector: 'tr.rosterUser', // Dedicated property for the loop container
  
  // Define any data point you want. 
  // Format: 'fieldName': { selector: '...', type: 'text' | 'attr', targetAttr: '...' }
  schema: {
    id: { 
      selector: 'a[data-student_id]', 
      type: 'attr', 
      targetAttr: 'data-student_id',
      fallback: ($row) => $row.attr('id') // Custom logic fallback if needed
    },
    name: { 
      selector: '.roster_user_name', 
      type: 'text' 
    },
    avatar: { 
      selector: 'img', 
      type: 'attr', 
      targetAttr: 'src' 
    },
    section: {
        selector: 'td:nth-child(3) > div',
        type: 'text'
    },
    role: { 
      selector: 'td:nth-child(4) > div', 
      type: 'text' 
    },
    profile_link: {
        selector: 'td:nth-child(2) > a',
        type: 'attr',
        targetAttr: 'href'
    },
    // Example of how easy it is to add a new selector in the future:
    // email: { selector: '.user_email', type: 'text' }
  }
};

async function runScraper() {
  try {
    // 1. Read the local HTML file
    const html = await fs.readFile(CONFIG.url, 'utf-8');
    
    // 2. Load the HTML into Cheerio
    const wrappedHtml = html.includes('<tr') && !html.includes('<table') 
      ? `<table>${html}</table>` 
      : html;
    const $ = cheerio.load(wrappedHtml);
    
    // 3. Extract the data dynamically
    const results = [];

    $(CONFIG.rowSelector).each((_, el) => {
      const $row = $(el);
      const rowData = {};

      // Loop through the schema definitions dynamically
      Object.entries(CONFIG.schema).forEach(([fieldName, config]) => {
        let value = null;
        const $element = $row.find(config.selector).first();

        if ($element.length > 0) {
          if (config.type === 'text') {
            value = $element.text().trim();
          } else if (config.type === 'attr' && config.targetAttr) {
            value = $element.attr(config.targetAttr);
          }
        }

        // Apply a fallback function if processing failed to find a value
        if (!value && typeof config.fallback === 'function') {
          value = config.fallback($row);
        }

        // Assign the extracted value to the field name dynamically
        rowData[fieldName] = value || null;
      });

      results.push(rowData);
    });

    // 4. Output the results
    console.log('--- Scraped Data ---');
    console.log(results);
    
    // 5. Save to a JSON file
    await fs.writeFile(CONFIG.output, JSON.stringify(results, null, 2));
    console.log(`\nData successfully saved to ${CONFIG.output}`);

  } catch (error) {
    console.error('Error running the scraper:', error.message);
  }
}

runScraper();