#!/usr/bin/env node
/**
 * Test Script for Static Products Loading Fix
 * @description Simulates the PHP loadStaticProducts() method to verify the fix works
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Static Products Loading Fix\n');
console.log('=' .repeat(60));

const STATIC_PRODUCTS_PATH = path.join(__dirname, 'src', 'data', 'static-products.js');

console.log('\n📁 File Path:', STATIC_PRODUCTS_PATH);
console.log('   Exists:', fs.existsSync(STATIC_PRODUCTS_PATH) ? '✅ YES' : '❌ NO');

if (!fs.existsSync(STATIC_PRODUCTS_PATH)) {
    console.log('\n❌ File not found! Exiting...');
    process.exit(1);
}

// Read file
const content = fs.readFileSync(STATIC_PRODUCTS_PATH, 'utf8');
console.log('\n📄 File Info:');
console.log('   Size:', content.length, 'bytes');
console.log('   Lines:', content.split('\n').length);

// Test Pattern 1: Original broken pattern (for comparison)
console.log('\n' + '='.repeat(60));
console.log('🔍 Test 1: Original Pattern (potentially broken)');
console.log('   Pattern: /export\\s+const\\s+staticProducts\\s*=\\s*(\\[.*?\\]);/s');

const pattern1 = /export\s+const\s+staticProducts\s*=\s*(\[.*?\]);/s;
const match1 = content.match(pattern1);

if (match1) {
    console.log('   ✅ Pattern matched');
    console.log('   Captured:', match1[1].length, 'bytes');
    
    // Try to parse without cleanup
    try {
        const products1 = JSON.parse(match1[1]);
        console.log('   ✅ JSON parsed:', products1.length, 'products');
    } catch (err) {
        console.log('   ❌ JSON parse failed:', err.message);
    }
} else {
    console.log('   ❌ Pattern did not match');
}

// Test Pattern 2: Fixed pattern with cleanup
console.log('\n' + '='.repeat(60));
console.log('🔍 Test 2: Fixed Pattern with Cleanup (NEW)');
console.log('   Pattern: /export\\s+const\\s+staticProducts\\s*=\\s*(\\[[\\s\\S]*?\\]);/s');

const pattern2 = /export\s+const\s+staticProducts\s*=\s*(\[[\s\S]*?\]);/s;
const match2 = content.match(pattern2);

if (match2) {
    console.log('   ✅ Pattern matched');
    console.log('   Captured:', match2[1].length, 'bytes');
    
    // Apply cleanup (remove trailing commas)
    let jsonString = match2[1]
        .replace(/,\s*\]/g, ']')  // Remove trailing commas before ]
        .replace(/,\s*\}/g, '}'); // Remove trailing commas before }
    
    console.log('   After cleanup:', jsonString.length, 'bytes');
    
    try {
        const products2 = JSON.parse(jsonString);
        console.log('   ✅ JSON parsed successfully!');
        console.log('   Products:', products2.length);
        
        // Show product details
        if (products2.length > 0) {
            console.log('\n📦 Product Details:');
            products2.forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.name}`);
                console.log(`      - ID: ${product.id}`);
                console.log(`      - SKU: ${product.sku}`);
                console.log(`      - Price: $${product.basePrice}`);
                console.log(`      - Slug: ${product.slug}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ SUCCESS! Static products can be loaded correctly');
        console.log('='.repeat(60));
        console.log('\n✅ The PHP fix should work correctly!');
        console.log('   The loadStaticProducts() method will now:');
        console.log('   1. Match the export pattern correctly');
        console.log('   2. Clean up trailing commas');
        console.log('   3. Parse JSON successfully');
        console.log('   4. Return', products2.length, 'static products');
        
        console.log('\n📋 Next Step:');
        console.log('   Run: npm run build');
        console.log('   (Requires PHP server at localhost:8888)');
        console.log('\n   Then check: tail -10 src/data/cockpit3d-products.js');
        console.log('   Expected: static_products: 2 (not 0)');
        
        process.exit(0);
        
    } catch (err) {
        console.log('   ❌ JSON parse failed:', err.message);
        console.log('\n   Saving problematic JSON to debug file...');
        fs.writeFileSync('debug-json.txt', jsonString);
        console.log('   Saved to: debug-json.txt');
        process.exit(1);
    }
} else {
    console.log('   ❌ Pattern did not match');
    process.exit(1);
}
