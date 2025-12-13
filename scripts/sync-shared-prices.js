#!/usr/bin/env node
/**
 * Sync Shared Prices Script
 * 
 * Syncs prices for shared options (lightbases, backgrounds, text options)
 * across ALL products that use them.
 * 
 * Usage: node scripts/sync-shared-prices.js
 * 
 * This ensures that when you update a lightbase price, ALL products
 * with that lightbase get the updated price automatically.
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../public/data/final-products.json');

// ============================================
// MASTER PRICING FOR SHARED OPTIONS
// Edit these prices and run the script to update all products
// ============================================

const SHARED_PRICING = {
  // Light Bases - prices sync to all products that have these options
  lightBases: {
    'none': null,  // No base option
    'lightbase-rectangle': 25.00,
    'lightbase-square': 25.00,
    'lightbase-wood-small': 35.00,
    'lightbase-wood-medium': 45.00,
    'lightbase-wood-long': 35.00,
    'rotating-led-lightbase': 19.99,
    'wooden-premium-base-mini': 60.00,
    'concave-lightbase': 39.00,
    'ornament-stand': 25.00,
  },
  
  // Background Options
  backgroundOptions: {
    'rm': 0,       // Remove Backdrop
    '2d': 8.00,    // 2D Backdrop
    '3d': 12.00,   // 3D Backdrop
  },
  
  // Text Options
  textOptions: {
    'none': 0,           // No Text
    'customText': 5.00,  // Custom Text
  },
  
  // Preview Options
  previewOptions: {
    'no-preview': 0,
    'digital-preview': 6.95,
  },
  
  // Rush Options  
  rushOptions: {
    'none': 0,
    'queue-48': 10.00,    // Jump the Queue 48hr
    'red-carpet': 15.00,  // Red Carpet 24hr
  }
};

// Alternative ID mappings (some products use different IDs)
const ID_ALIASES = {
  'lightBase_Rectangle': 'lightbase-rectangle',
  'Lightbase_Rectangle': 'lightbase-rectangle',
  'lightBase_Square': 'lightbase-square',
  'Lightbase_Square': 'lightbase-square',
  'lightBase_Wood_Small': 'lightbase-wood-small',
  'Lightbase_Wood_Small': 'lightbase-wood-small',
  'lightBase_Wood_Medium': 'lightbase-wood-medium',
  'Lightbase_Wood_Medium': 'lightbase-wood-medium',
  'lightBase_Wood_Long': 'lightbase-wood-long',
  'Lightbase_Wood_Long': 'lightbase-wood-long',
  'rotating_led': 'rotating-led-lightbase',
  'Rotating_LED_Lightbase': 'rotating-led-lightbase',
  'wooden_base_mini': 'wooden-premium-base-mini',
  'concave': 'concave-lightbase',
  'ornament_stand': 'ornament-stand',
};

function normalizeId(id) {
  if (!id) return id;
  return ID_ALIASES[id] || id.toLowerCase().replace(/_/g, '-');
}

function syncOptions(product, optionType, masterPricing) {
  const options = product[optionType];
  if (!Array.isArray(options)) return 0;
  
  let updated = 0;
  
  options.forEach(opt => {
    const normalizedId = normalizeId(opt.id);
    
    if (normalizedId in masterPricing) {
      const newPrice = masterPricing[normalizedId];
      
      if (opt.price !== newPrice) {
        console.log(`    💡 ${optionType}/${opt.name}: $${opt.price} → $${newPrice}`);
        opt.price = newPrice;
        updated++;
      }
    }
  });
  
  return updated;
}

function main() {
  console.log('🔄 Syncing shared prices across all products...\n');
  
  // Read products
  let products;
  try {
    products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    console.log(`📁 Loaded ${products.length} products\n`);
  } catch (err) {
    console.error('❌ Failed to read products:', err.message);
    process.exit(1);
  }
  
  let totalLightbases = 0;
  let totalBackgrounds = 0;
  let totalText = 0;
  
  products.forEach((product, index) => {
    const updates = [];
    
    // Sync lightBases
    const lbUpdates = syncOptions(product, 'lightBases', SHARED_PRICING.lightBases);
    if (lbUpdates > 0) {
      totalLightbases += lbUpdates;
      updates.push(`${lbUpdates} lightbases`);
    }
    
    // Sync backgroundOptions
    const bgUpdates = syncOptions(product, 'backgroundOptions', SHARED_PRICING.backgroundOptions);
    if (bgUpdates > 0) {
      totalBackgrounds += bgUpdates;
      updates.push(`${bgUpdates} backgrounds`);
    }
    
    // Sync textOptions
    const txtUpdates = syncOptions(product, 'textOptions', SHARED_PRICING.textOptions);
    if (txtUpdates > 0) {
      totalText += txtUpdates;
      updates.push(`${txtUpdates} text options`);
    }
    
    if (updates.length > 0) {
      console.log(`  ✅ ${product.name}: Updated ${updates.join(', ')}`);
    }
  });
  
  // Write updated products
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log('\n📊 Sync Summary:');
    console.log(`   • Lightbase prices updated: ${totalLightbases}`);
    console.log(`   • Background prices updated: ${totalBackgrounds}`);
    console.log(`   • Text option prices updated: ${totalText}`);
    console.log('\n✅ Price sync complete!');
  } catch (err) {
    console.error('❌ Failed to write products:', err.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { SHARED_PRICING, syncOptions };

// Run if called directly
if (require.main === module) {
  main();
}
