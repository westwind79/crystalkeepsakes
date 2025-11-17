#!/usr/bin/env node
/**
 * Price Diagnostic Tool
 * Shows what prices exist in raw Cockpit3D data
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Cockpit3D Price Diagnostic\n');
console.log('=' .repeat(70));

// Load raw products
const rawProductsPath = path.join(__dirname, 'src/data/cockpit3d-raw-products.js');
const rawProductsContent = fs.readFileSync(rawProductsPath, 'utf8');
const match = rawProductsContent.match(/export\s+const\s+cockpit3dRawProducts\s*=\s*(\[[\s\S]*?\]);/);

if (!match) {
    console.log('❌ Could not parse raw products');
    process.exit(1);
}

const rawProducts = JSON.parse(match[1]);

console.log(`\n✅ Loaded ${rawProducts.length} raw products\n`);

// Find products that might be options (lightbases, sizes, etc.)
const lightbaseProducts = rawProducts.filter(p => 
    p.name.toLowerCase().includes('lightbase') ||
    p.name.toLowerCase().includes('base') ||
    p.sku.toLowerCase().includes('lightbase')
);

const sizeProducts = rawProducts.filter(p => 
    p.name.includes('Diamond') || 
    p.name.includes('Rectangle') ||
    p.name.includes('cm')
);

console.log('📦 LIGHTBASE PRODUCTS (should be used as options):');
console.log('-'.repeat(70));
lightbaseProducts.forEach(p => {
    console.log(`  ID: ${p.id.padEnd(5)} | ${p.name.padEnd(40)} | $${p.price}`);
});

console.log('\n\n📏 SIZE VARIATION PRODUCTS:');
console.log('-'.repeat(70));
sizeProducts.slice(0, 10).forEach(p => {
    console.log(`  ID: ${p.id.padEnd(5)} | ${p.name.padEnd(50)} | $${p.price}`);
});

// Check one product's options
const diamondProduct = rawProducts.find(p => p.name.includes('Cut Corner Diamond'));

if (diamondProduct) {
    console.log('\n\n🔬 DETAILED ANALYSIS: Cut Corner Diamond');
    console.log('-'.repeat(70));
    console.log(`  Product ID: ${diamondProduct.id}`);
    console.log(`  Base Price: $${diamondProduct.price}`);
    console.log(`\n  Options:`);
    
    diamondProduct.options.forEach(opt => {
        console.log(`\n    ${opt.name} (ID: ${opt.id}, Required: ${opt.required})`);
        
        if (opt.values && Array.isArray(opt.values)) {
            opt.values.forEach(val => {
                const hasPrice = val.price !== undefined;
                const changeQty = val.change_qty === true;
                
                console.log(`      - ${val.name.padEnd(40)} | ID: ${val.id.padEnd(5)} | Price: ${hasPrice ? '$' + val.price : 'MISSING'} | change_qty: ${changeQty ? '✅' : '❌'}`);
                
                // If change_qty=true, try to find it as a product
                if (changeQty) {
                    const linkedProduct = rawProducts.find(p => p.id === val.id || p.sku === val.name.replace(/\s+/g, '_'));
                    if (linkedProduct) {
                        console.log(`        └─> Found as product: $${linkedProduct.price}`);
                    } else {
                        console.log(`        └─> ⚠️  NOT found as separate product`);
                    }
                }
            });
        } else {
            console.log(`      (No values - custom field or boolean)`);
        }
    });
}

// Summary
console.log('\n\n📊 SUMMARY:');
console.log('-'.repeat(70));
console.log(`  Total products in raw data: ${rawProducts.length}`);
console.log(`  Lightbase products found: ${lightbaseProducts.length}`);
console.log(`  Products with 'change_qty' options: ${rawProducts.filter(p => {
    if (!p.options) return false;
    return p.options.some(opt => 
        opt.values && 
        Array.isArray(opt.values) && 
        opt.values.some(v => v.change_qty === true)
    );
}).length}`);

// Check what's currently in final products file
console.log('\n\n📁 CURRENT cockpit3d-products.js:');
console.log('-'.repeat(70));
try {
    const finalProductsPath = path.join(__dirname, 'src/data/cockpit3d-products.js');
    const finalContent = fs.readFileSync(finalProductsPath, 'utf8');
    const sourceInfoMatch = finalContent.match(/sourceInfo\s*=\s*\{[\s\S]*?\}/);
    if (sourceInfoMatch) {
        console.log(sourceInfoMatch[0]);
    }
} catch (e) {
    console.log('  Could not read final products file');
}

console.log('\n\n💡 RECOMMENDATIONS:');
console.log('-'.repeat(70));
console.log('  1. Run PHP data fetcher to transform raw data');
console.log('  2. Implement price lookup for change_qty=true options');
console.log('  3. Verify prices match your Cockpit3D portal');
console.log('  4. Consider creating price override file for manual control');
console.log('\n');
