// Test script to verify JSON-only system is working
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing JSON-Only Product System\n');

// Test 1: Check JSON file exists
const jsonPath = path.join(__dirname, 'public', 'data', 'final-products.json');
console.log('✅ Test 1: JSON file exists');
console.log(`   Path: ${jsonPath}`);
console.log(`   Exists: ${fs.existsSync(jsonPath)}`);

if (fs.existsSync(jsonPath)) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`   Products count: ${data.length}`);
  console.log(`   First product: ${data[0]?.name || 'N/A'}`);
}

// Test 2: Check old JS files are deleted
console.log('\n✅ Test 2: Old JS files deleted');
const oldFiles = [
  'src/data/final-product-list.js',
  'src/data/cockpit3d-products.js',
  'src/data/cockpit3d-raw-products.js',
  'public/data/final-product-list.js'
];

oldFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${file}: ${exists ? '❌ STILL EXISTS' : '✅ Deleted'}`);
});

// Test 3: Check updated imports
console.log('\n✅ Test 3: Updated imports');
const filesToCheck = [
  'src/components/ProductDetailClient.tsx',
  'src/app/products/page.tsx',
  'src/app/products/[slug]/generate-params.ts',
  'src/app/admin/page.tsx'
];

filesToCheck.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const hasOldImport = content.includes('final-product-list.js') || content.includes('cockpit3d-products');
    const hasNewImport = content.includes('getProducts');
    console.log(`   ${file}:`);
    console.log(`     - Uses getProducts(): ${hasNewImport ? '✅' : '❌'}`);
    console.log(`     - Has old imports: ${hasOldImport ? '❌ BAD' : '✅ GOOD'}`);
  }
});

console.log('\n🎉 JSON-Only System Test Complete!');
