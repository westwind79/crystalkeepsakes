// scripts/copy-products.js
// Copies final-product-list.js to /public/data for easy FTP updates

const fs = require('fs-extra');
const path = require('path');

const sourceFile = path.join(__dirname, '..', 'src', 'data', 'final-product-list.js');
const publicDataDir = path.join(__dirname, '..', 'public', 'data');
const destFile = path.join(publicDataDir, 'final-product-list.js');

async function copyProducts() {
  try {
    console.log('📦 Copying final-product-list.js to /public/data...');
    
    // Check if source file exists
    if (!await fs.pathExists(sourceFile)) {
      console.warn('⚠️ Warning: final-product-list.js not found in src/data/');
      console.warn('   Run admin panel to generate it first');
      process.exit(0);
    }
    
    // Ensure public/data directory exists
    await fs.ensureDir(publicDataDir);
    
    // Copy the file
    await fs.copy(sourceFile, destFile, { overwrite: true });
    
    console.log('✅ Products copied to /public/data/final-product-list.js');
    console.log('📌 You can now FTP this file to update production products!');
    
  } catch (error) {
    console.error('❌ Error copying products:', error);
    process.exit(1);
  }
}

copyProducts();
