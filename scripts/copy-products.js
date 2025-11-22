// scripts/copy-products.js
// JSON-ONLY SYSTEM: Verifies final-products.json exists for build

const fs = require('fs-extra');
const path = require('path');

const jsonFile = path.join(__dirname, '..', 'public', 'data', 'final-products.json');

async function checkProducts() {
  try {
    console.log('📦 Checking products JSON file...');
    
    // Check if JSON file exists
    if (!await fs.pathExists(jsonFile)) {
      console.error('❌ Error: final-products.json not found in /public/data/');
      console.error('   This file is required for the build to succeed.');
      console.error('   Run the admin panel and save products to generate it.');
      process.exit(1);
    }
    
    // Verify it's valid JSON
    const content = await fs.readFile(jsonFile, 'utf-8');
    const products = JSON.parse(content);
    
    console.log(`✅ Products JSON verified: ${products.length} products found`);
    console.log('📌 Ready for build!');
    
  } catch (error) {
    console.error('❌ Error checking products:', error.message);
    process.exit(1);
  }
}

checkProducts();
