/**
 * Migration Script: Convert Single Image to Multi-Image Format
 * 
 * This script helps convert existing products with single images
 * to the new multi-image array format.
 * 
 * Usage: node scripts/migrate-to-multi-images.js
 */

const fs = require('fs');
const path = require('path');

// Load the current products
const productsPath = path.join(__dirname, '../src/data/cockpit3d-products.js');
const productsContent = fs.readFileSync(productsPath, 'utf-8');

console.log('🔄 Starting migration to multi-image format...\n');

// This is a helper script - the actual products are already in the correct format
// But we'll verify the structure

try {
  // Check if products have the correct image structure
  const imageCheck = productsContent.match(/images:\s*\[/g);
  
  if (imageCheck) {
    console.log('✅ Products already use image arrays!');
    console.log(`   Found ${imageCheck.length} products with image arrays`);
  }
  
  // Check for isMain flags
  const mainImageCheck = productsContent.match(/isMain:\s*true/g);
  
  if (mainImageCheck) {
    console.log(`✅ Found ${mainImageCheck.length} products with main image flags`);
  } else {
    console.log('⚠️  Warning: No isMain flags found. Consider adding them in admin panel.');
  }
  
  console.log('\n✨ Migration check complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Open admin panel: http://localhost:3000/admin/products');
  console.log('   3. Upload additional images for products');
  console.log('   4. Generate final-product-list.js');
  console.log('   5. Replace src/data/cockpit3d-products.js with final-product-list.js (or use it separately)\n');
  
} catch (error) {
  console.error('❌ Error during migration check:', error);
  process.exit(1);
}
