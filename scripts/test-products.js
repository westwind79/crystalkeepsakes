// scripts/test-products.js
// Quick test to verify products file works

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../src/data/cockpit3d-products.js');

console.log('🧪 Testing Products File\n');

// Step 1: Check existence
if (!fs.existsSync(PRODUCTS_FILE)) {
  console.error('❌ FAIL: Products file does not exist');
  console.error(`📂 Expected: ${PRODUCTS_FILE}`);
  console.error('\n💡 Fix: Run npm run products:fetch\n');
  process.exit(1);
}
console.log('✅ File exists');

// Step 2: Read content
const content = fs.readFileSync(PRODUCTS_FILE, 'utf8');
console.log(`✅ File readable (${(content.length / 1024).toFixed(2)} KB)`);

// Step 3: Parse as module
try {
  // Extract the array using regex (same as PHP does)
  const match = content.match(/export const cockpit3dProducts = (\[[\s\S]*?\]);/);
  
  if (!match) {
    throw new Error('Could not find cockpit3dProducts export');
  }
  
  const products = JSON.parse(match[1]);
  console.log(`✅ Valid JSON (${products.length} products)`);
  
  // Step 4: Verify structure
  if (products.length === 0) {
    console.warn('⚠️  WARNING: No products in array');
  } else {
    const firstProduct = products[0];
    const requiredFields = ['id', 'name', 'slug', 'basePrice', 'images'];
    const missingFields = requiredFields.filter(field => !(field in firstProduct));
    
    if (missingFields.length > 0) {
      console.error(`❌ FAIL: Missing fields in product: ${missingFields.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ Product structure valid');
    console.log(`\n📦 Sample Product:`);
    console.log(`   Name: ${firstProduct.name}`);
    console.log(`   Slug: ${firstProduct.slug}`);
    console.log(`   Price: $${firstProduct.basePrice}`);
    console.log(`   Images: ${firstProduct.images.length}`);
    
    // Test slug generation
    const slugs = products.map(p => p.slug);
    const uniqueSlugs = new Set(slugs);
    if (slugs.length !== uniqueSlugs.size) {
      console.warn('⚠️  WARNING: Duplicate slugs detected');
    } else {
      console.log(`✅ All slugs unique (${slugs.length})`);
    }
  }
  
  // Step 5: Check metadata
  const metadataMatch = content.match(/export const sourceInfo = \{([^}]+)\}/);
  if (metadataMatch) {
    console.log('\n📊 Source Info:');
    const staticMatch = content.match(/static_products:\s*(\d+)/);
    const cockpitMatch = content.match(/cockpit3d_products:\s*(\d+)/);
    if (staticMatch) console.log(`   Static: ${staticMatch[1]}`);
    if (cockpitMatch) console.log(`   Cockpit3D: ${cockpitMatch[1]}`);
  }
  
  console.log('\n✅ ALL TESTS PASSED\n');
  console.log('💡 Your Next.js app can now use these products!');
  console.log('💡 Try: npm run dev\n');
  
} catch (error) {
  console.error('❌ FAIL: Invalid JSON structure');
  console.error(error.message);
  process.exit(1);
}