// scripts/enrich-product-prices.js
// Adds missing prices to product options from manual pricing map

const fs = require('fs');
const path = require('path');

// Manual pricing data (from cockpit3d-pricing-map.ts)
const PRICING_MAP = {
  // Light bases
  '207': { name: 'Lightbase Rectangle', price: 25 },
  '476': { name: 'Rotating LED Lightbase', price: 35 },
  '857': { name: 'Wooden Premium Base Mini', price: 20 },
  '206': { name: 'Lightbase Square', price: 25 },
  '858': { name: 'Wooden Base Small', price: 25 },
  '859': { name: 'Wooden Base Medium', price: 30 },
  '860': { name: 'Wooden Base Long', price: 35 },
  
  // Size options (these REPLACE base price, not add)
  '202': { name: 'Cut Corner Diamond (5x5cm)', price: 70 },
  '549': { name: 'Cut Corner Diamond (6x6cm)', price: 85 },
  '550': { name: 'Cut Corner Diamond (8x8cm)', price: 110 },
  
  // Backgrounds
  '154': { name: '2D Backdrop', price: 12 },  // Fixed from 15
  '155': { name: '3D Backdrop', price: 15 },  // Fixed from 25
  
  // Custom text
  '199': { name: 'Custom Text', price: 9.50 },
  '198': { name: 'No Text', price: 0 },
  
  // Gift stands
  '279': { name: 'Ornament Stand', price: 25 },
  
  // Special items (no base)
  'none': { name: 'No Base', price: 0 },
  'rm': { name: 'Remove Backdrop', price: 0 }
};

console.log('🔧 Enriching product data with prices...\n');

// Read the products file
const productsPath = path.join(__dirname, '../src/data/cockpit3d-products.js');
const productsModule = require(productsPath);
const products = productsModule.cockpit3dProducts;

console.log(`📦 Found ${products.length} products\n`);

let updatesCount = 0;

// Process each product
products.forEach((product, index) => {
  let productUpdated = false;
  
  // Fix lightbase prices
  if (product.lightBases && Array.isArray(product.lightBases)) {
    product.lightBases.forEach(lb => {
      if (lb.price === null || lb.price === undefined) {
        const priceData = PRICING_MAP[lb.id] || PRICING_MAP['none'];
        if (priceData) {
          lb.price = priceData.price;
          productUpdated = true;
        }
      }
    });
  }
  
  // Fix size prices (if needed)
  if (product.sizes && Array.isArray(product.sizes)) {
    product.sizes.forEach(size => {
      if (size.price === null || size.price === undefined || size.price === 0) {
        const priceData = PRICING_MAP[size.id];
        if (priceData) {
          size.price = priceData.price;
          productUpdated = true;
        }
      }
    });
  }
  
  // Fix background prices
  if (product.backgroundOptions && Array.isArray(product.backgroundOptions)) {
    product.backgroundOptions.forEach(bg => {
      if (bg.price === null || bg.price === undefined) {
        const priceData = PRICING_MAP[bg.id] || PRICING_MAP['rm'];
        if (priceData) {
          bg.price = priceData.price;
          productUpdated = true;
        }
      }
    });
  }
  
  // Fix text option prices
  if (product.textOptions && Array.isArray(product.textOptions)) {
    product.textOptions.forEach(text => {
      if (text.price === null || text.price === undefined) {
        const priceData = PRICING_MAP[text.id];
        if (priceData) {
          text.price = priceData.price;
          productUpdated = true;
        }
      }
    });
  }
  
  if (productUpdated) {
    updatesCount++;
    console.log(`✓ Updated: ${product.name} (ID: ${product.id})`);
  }
});

// Write back to file
const output = `export const cockpit3dProducts = ${JSON.stringify(products, null, 2)}`;
fs.writeFileSync(productsPath, output, 'utf8');

console.log(`\n✅ Done! Updated ${updatesCount} products`);
console.log(`💾 Saved to: ${productsPath}`);
console.log('\n🎯 Prices added:');
console.log('   - Lightbase Rectangle: $25');
console.log('   - Rotating LED: $35');
console.log('   - Wooden bases: $20-$35');
console.log('   - 2D Backdrop: $12');
console.log('   - 3D Backdrop: $15');
console.log('   - Custom Text: $9.50');
console.log('\n🔄 Restart your dev server: npm run dev');
