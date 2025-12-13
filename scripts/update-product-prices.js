#!/usr/bin/env node
/**
 * Update Product Prices Script
 * 
 * This script updates final-products.json with prices from the 
 * cockpit3d-pricing-clean.ts master pricing file.
 * 
 * Usage: node scripts/update-product-prices.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const PRODUCTS_FILE = path.join(__dirname, '../public/data/final-products.json');
const BACKUP_FILE = path.join(__dirname, '../public/data/final-products.backup.json');

// ============================================
// PRICING DATA (imported from TypeScript file)
// ============================================

const PRICING_DATA = {
  // ===== SERVICES & ADD-ONS =====
  'customer_text': { price: 5.00, cost: 2.95, category: 'services' },
  'custom_design': { price: 25.00, cost: 10.00, category: 'services' },
  'Face': { price: 8.00, cost: 8.00, category: 'services' },
  '2d_backdrop': { price: 8.00, cost: 8.00, category: 'services' },
  '3d_backdrop': { price: 12.00, cost: 12.00, category: 'services' },
  'queue_48': { price: 10.00, cost: 10.00, category: 'services' },
  'red_carpet': { price: 15.00, cost: 15.00, category: 'services' },
  'digi_preview': { price: 6.95, cost: 3.95, category: 'services' },
  'Digital_Reconstruction': { price: 20.00, cost: 10.00, category: 'services' },

  // ===== CUT CORNER DIAMONDS =====
  'Cut_Corner_Diamond_(5x5cm)': { price: 24.75, cost: 24.75, category: 'diamonds' },
  'Cut_Corner_Diamond_(6x6cm)': { price: 39.75, cost: 39.75, category: 'diamonds' },
  'Cut_Corner_Diamond_(8x8cm)': { price: 49.75, cost: 49.75, category: 'diamonds' },

  // ===== LIGHTBASES =====
  'Lightbase_Rectangle': { price: 25.00, cost: 8.75, category: 'lightbases' },
  'Lightbase_Square': { price: 25.00, cost: 8.75, category: 'lightbases' },
  'Lightbase_Wood_Small': { price: 35.00, cost: 19.75, category: 'lightbases' },
  'Lightbase_Wood_Medium': { price: 45.00, cost: 22.75, category: 'lightbases' },
  'Lightbase_Wood_Long': { price: 35.00, cost: 29.75, category: 'lightbases' },
  'Rotating_LED_Lightbase': { price: 19.99, cost: 9.75, category: 'lightbases' },
  'concave_lightbase': { price: 39.00, cost: 12.75, category: 'lightbases' },

  // ===== RECTANGLES =====
  'Rectangle_Small_(6x4cm)': { price: 59.00, cost: 19.75, category: 'rectangles' },
  'Rectangle_Medium_(8x5cm)': { price: 79.00, cost: 24.75, category: 'rectangles' },
  'Rectangle_Large_(9x6cm)': { price: 119.00, cost: 39.75, category: 'rectangles' },
  'Rectangle_XLarge_(12x8cm)': { price: 169.00, cost: 59.75, category: 'rectangles' },
  'Rectangle_Mantel_(18x12cm)': { price: 375.00, cost: 109.75, category: 'rectangles' },
  'Rectangle_Mini_Mantel_(15x10cm)': { price: 325.00, cost: 89.75, category: 'rectangles' },
  'Rectangle_Presidential_(27x18cm)': { price: 1000.00, cost: 349.75, category: 'rectangles' },
  'Rectangle_Mini_Presidential_(22x16cm)': { price: 595.00, cost: 149.75, category: 'rectangles' },

  // Wide Rectangles
  'RectangleWideMedium_(8x5cm)': { price: 100.00, cost: 24.75, category: 'rectangles' },
  'RectangleWideLarge_(9x6cm)': { price: 170.00, cost: 39.75, category: 'rectangles' },
  'RectangleWideXLarge_(12x8cm)': { price: 285.00, cost: 59.75, category: 'rectangles' },
  'RectangleWideMantel_(18x12cm)': { price: 375.00, cost: 109.75, category: 'rectangles' },
  'RectangleWidePresidential_(27x18cm)': { price: 1000.00, cost: 349.75, category: 'rectangles' },
  'RectangleWideMini_Presidential_(22x16cm)': { price: 595.00, cost: 149.75, category: 'rectangles' },
  'RectangleWideMini_Mantel_(15x10cm)': { price: 325.00, cost: 89.75, category: 'rectangles' },

  // ===== PRESTIGE SERIES =====
  'Prestige_Small_(13x9cm)': { price: 149.00, cost: 69.75, category: 'prestige' },
  'Prestige_Medium_(16x13cm)': { price: 199.00, cost: 99.75, category: 'prestige' },
  'Prestige_Large_(19x15cm)': { price: 399.00, cost: 124.75, category: 'prestige' },

  // ===== KEYCHAINS =====
  'Keychain_3D_Rectangle': { price: 28.00, cost: 9.75, category: 'keychains' },
  'Keychain_2D_Rectangle': { price: 25.00, cost: 9.75, category: 'keychains' },
  'KeychainPromo': { price: 15.00, cost: 9.75, category: 'keychains' },
  'Keychain_2D_Heart': { price: 30.00, cost: 14.75, category: 'keychains' },
  'Keychain_3D_Heart': { price: 45.00, cost: 14.75, category: 'keychains' },
  'Heart_Keychain_Promo': { price: 25.00, cost: 12.75, category: 'keychains' },
  'Cat_Keychain': { price: 45.00, cost: 15.75, category: 'keychains' },
  'Dog_Bone_Keychain': { price: 45.00, cost: 15.75, category: 'keychains' },

  // ===== NECKLACES =====
  'Necklace_Heart_2D': { price: 25.00, cost: 17.75, category: 'necklaces' },
  'Necklace_Rectangle_2D': { price: 75.00, cost: 17.50, category: 'necklaces' },
  'Cat_Necklace': { price: 49.00, cost: 20.50, category: 'necklaces' },

  // ===== ORNAMENTS =====
  'Ornament': { price: 35.00, cost: 19.75, category: 'ornaments' },
  'Ornament_with_Stand': { price: 50.00, cost: 29.75, category: 'ornaments' },
  'Heart_Ornament': { price: 45.00, cost: 24.75, category: 'ornaments' },
  'Flower_Ornament': { price: 45.00, cost: 25.75, category: 'ornaments' },
  'Cat_Ornament': { price: 45.00, cost: 25.75, category: 'ornaments' },
  'Dog_Bone_Ornament': { price: 45.00, cost: 25.75, category: 'ornaments' },
  'ornament_stand': { price: 25.00, cost: 15.00, category: 'ornaments' },

  // ===== WIDE HEARTS =====
  'Wide_Heart_small_(80x70x40)': { price: 89.00, cost: 39.75, category: 'hearts' },
  'Wide_Heart_Medium_(100x90x50)': { price: 119.00, cost: 69.75, category: 'hearts' },
  'Wide_Heart_Large_(125x110x60)': { price: 149.00, cost: 89.75, category: 'hearts' },

  // ===== CANDLES & URNS =====
  '3D-crystal-candle10x6x6cm': { price: 129.00, cost: 49.75, category: 'candles' },
  'Urn_12x12x6': { price: 256.00, cost: 109.75, category: 'urns' },

  // ===== WOODEN BASES =====
  'wooden_base_mini': { price: 60.00, cost: 17.75, category: 'bases' },

  // ===== NOTCHED CRYSTALS =====
  '3d_notched_crystal_tall': { price: 259.00, cost: 95.00, category: 'notched' },
  '2d_notched_crystal_tall': { price: 259.00, cost: 95.00, category: 'notched' },
  '3d_notched_crystal_wide': { price: 259.00, cost: 95.00, category: 'notched' },
  '2d_notched_crystal_wide': { price: 259.00, cost: 95.00, category: 'notched' },
  '2d_notched_small_crystal_tall': { price: 159.00, cost: 85.00, category: 'notched' },
  '2d_notched_small_crystal_wide': { price: 159.00, cost: 85.00, category: 'notched' },
  '3d_notched_small_crystal_tall': { price: 159.00, cost: 85.00, category: 'notched' },
  '3d_notched_small_crystal_wide': { price: 159.00, cost: 85.00, category: 'notched' },

  // ===== BALL CRYSTALS =====
  'ball_small_8cm': { price: 169.00, cost: 59.75, category: 'balls' },

  // ===== DOG BONES =====
  'dog_bone_vertical_one_size': { price: 129.00, cost: 89.75, category: 'dog' },
  'dog_bone_horizontal_one_size': { price: 129.00, cost: 89.75, category: 'dog' },
  'Dog_Bone_Tag': { price: 49.00, cost: 19.50, category: 'dog' },

  // ===== DESK LAMP =====
  '3d_desk_lamp': { price: 375.00, cost: 175.00, category: 'lamps' },

  // ===== BRACELETS =====
  'Heart_Bracelet': { price: 49.00, cost: 20.50, category: 'bracelets' },

  // ===== DOMES =====
  'Small_Crystal_Dome': { price: 249.00, cost: 79.75, category: 'domes' },
  'Dome_Medium': { price: 329.00, cost: 134.75, category: 'domes' },

  // ===== LARGE CAT =====
  'Large_Cat_Crystal': { price: 129.00, cost: 89.75, category: 'cat' },

  // ===== PLAQUES =====
  'Square_Crystal_Plaque': { price: 169.00, cost: 89.75, category: 'plaques' },
  '2D_Medium_Plaque_Vertical': { price: 169.00, cost: 49.75, category: 'plaques' },
  '2D_Medium_Plaque_Horizontal': { price: 169.00, cost: 49.75, category: 'plaques' },

  // ===== SPECIALTY SHAPES =====
  '3D_Crystal_Arch_size': { price: 299.00, cost: 74.75, category: 'specialty' },
  '3D_Crystal_Oval_size': { price: 359.00, cost: 89.75, category: 'specialty' },
  '3D_Crystal_Circle_Small_size': { price: 199.00, cost: 49.75, category: 'specialty' },
  '3D_Crystal_Circle_Medium_size': { price: 249.00, cost: 62.25, category: 'specialty' },
  '3D_Crystal_Monument_size': { price: 399.00, cost: 99.75, category: 'specialty' },
};

// SKU Mapping: Maps product SKUs in final-products.json to pricing SKUs
// Some products have bundled SKUs or different naming conventions
const SKU_MAPPING = {
  // Direct mappings
  'Lightbase_Rectangle': 'Lightbase_Rectangle',
  'Lightbase_Square': 'Lightbase_Square',
  'Lightbase_Wood_Small': 'Lightbase_Wood_Small',
  'Lightbase_Wood_Medium': 'Lightbase_Wood_Medium',
  'Lightbase_Wood_Long': 'Lightbase_Wood_Long',
  'Rotating_LED_Lightbase': 'Rotating_LED_Lightbase',
  'concave_lightbase': 'concave_lightbase',
  'wooden_base_mini': 'wooden_base_mini',
  'ornament_stand': 'ornament_stand',
  
  // Bundle mappings (product SKU -> pricing SKU)
  'Heart_Ornament_bundle': 'Heart_Ornament',
  'Flower_Ornament_bundle': 'Flower_Ornament',
  'Cat_Ornament_bundle': 'Cat_Ornament',
  'Dog_Bone_Ornament_bundle': 'Dog_Bone_Ornament',
  'Cat_Necklace_bundle': 'Cat_Necklace',
  'Cat_Keychain_bundle': 'Cat_Keychain',
  'Dog_Bone_Keychain_bundle': 'Dog_Bone_Keychain',
  'Heart_Bracelet_bundle': 'Heart_Bracelet',
  '2D_Medium_Plaque_Vertical_bundle': '2D_Medium_Plaque_Vertical',
  '2D_Medium_Plaque_Horizontal_bundle': '2D_Medium_Plaque_Horizontal',
  
  // Crystal products
  '3d_crystal_dome': 'Small_Crystal_Dome',
  '3d_crystal_large_cat': 'Large_Cat_Crystal',
  '3d_crystal_square': 'Square_Crystal_Plaque',
  '3D_Crystal_Monument': '3D_Crystal_Monument_size',
  '3D_Crystal_Arch': '3D_Crystal_Arch_size',
  '3D_Crystal_Circle': '3D_Crystal_Circle_Small_size',
  '3D_Crystal_Oval': '3D_Crystal_Oval_size',
  
  // Notched crystals
  'notched_crystal_tall_bundle': '3d_notched_crystal_tall',
  'notched_crystal_wide': '3d_notched_crystal_wide',
  
  // Ball
  '3d_ball_bundle': 'ball_small_8cm',
  
  // Dog bone
  'dog_bone_vertical': 'dog_bone_vertical_one_size',
  'dog_bone_horizontal': 'dog_bone_horizontal_one_size',
  
  // Desk lamp
  '3d_desk_lamp_bundle': '3d_desk_lamp',
  
  // Candles/Urns
  '3D_Crystal_Candle': '3D-crystal-candle10x6x6cm',
  'Urn_candles': 'Urn_12x12x6',
  
  // Additional product mappings
  'Cut_Corner_Diamond': 'Cut_Corner_Diamond_(6x6cm)', // Default to medium size
  'Rectangle_Vertical_Crystals': 'Rectangle_Medium_(8x5cm)', // Default to medium
  'Rectangle_Horizontal_Crystals': 'RectangleWideMedium_(8x5cm)', // Default to medium
  'Prestige_Crystal': 'Prestige_Medium_(16x13cm)', // Default to medium
  'Keychains_Vertical': 'Keychain_2D_Rectangle',
  'Keychain_Horizontal': 'Keychain_2D_Rectangle',
  'Heart_Keychain': 'Keychain_2D_Heart',
  'Heart_Necklace_2D': 'Necklace_Heart_2D',
  'Rectangle_Necklace_2D': 'Necklace_Rectangle_2D',
  'Ornament_Crystal': 'Ornament',
  'New_Wide_Heart': 'Wide_Heart_Medium_(100x90x50)',
};

// Size name mapping: Maps size names in products to pricing SKUs
const SIZE_NAME_TO_SKU = {
  // Rectangle sizes (Vertical)
  'Rectangle Small (6x4cm)': 'Rectangle_Small_(6x4cm)',
  'Rectangle Medium (8x5cm)': 'Rectangle_Medium_(8x5cm)',
  'Rectangle Large (9x6cm)': 'Rectangle_Large_(9x6cm)',
  'Rectangle XLarge (12x8cm)': 'Rectangle_XLarge_(12x8cm)',
  'Rectangle Mini Mantel (15x10cm)': 'Rectangle_Mini_Mantel_(15x10cm)',
  'Rectangle Mantel (18x12cm)': 'Rectangle_Mantel_(18x12cm)',
  'Rectangle Mini Presidential (22x16cm)': 'Rectangle_Mini_Presidential_(22x16cm)',
  'Rectangle Presidential (27x18cm)': 'Rectangle_Presidential_(27x18cm)',
  
  // Rectangle sizes (Wide/Horizontal)
  'Rectangle Wide Medium (8x5cm)': 'RectangleWideMedium_(8x5cm)',
  'Rectangle Wide Large (9x6cm)': 'RectangleWideLarge_(9x6cm)',
  'Rectangle Wide XLarge (12x8cm)': 'RectangleWideXLarge_(12x8cm)',
  'Rectangle Wide Mini Mantel (15x10cm)': 'RectangleWideMini_Mantel_(15x10cm)',
  'Rectangle Wide Mantel (18x12cm)': 'RectangleWideMantel_(18x12cm)',
  'Rectangle Wide Mini Presidential (22x16cm)': 'RectangleWideMini_Presidential_(22x16cm)',
  'Rectangle Wide Presidential (27x18cm)': 'RectangleWidePresidential_(27x18cm)',
  
  // Cut Corner Diamond sizes
  'Cut Corner Diamond (5x5cm)': 'Cut_Corner_Diamond_(5x5cm)',
  'Cut Corner Diamond (6x6cm)': 'Cut_Corner_Diamond_(6x6cm)',
  'Cut Corner Diamond (8x8cm)': 'Cut_Corner_Diamond_(8x8cm)',
  
  // Wide Heart sizes (multiple naming variations)
  'Wide Heart Small (80x70x40mm)': 'Wide_Heart_small_(80x70x40)',
  'Wide Heart Small 80x70x40mm': 'Wide_Heart_small_(80x70x40)',
  'Wide Heart small (80x70x40)': 'Wide_Heart_small_(80x70x40)',
  'Wide Heart Medium (100x90x50mm)': 'Wide_Heart_Medium_(100x90x50)',
  'Wide Heart Medium 100x90x50mm': 'Wide_Heart_Medium_(100x90x50)',
  'Wide Heart Medium (100x90x50)': 'Wide_Heart_Medium_(100x90x50)',
  'Wide Heart Large (125x110x60mm)': 'Wide_Heart_Large_(125x110x60)',
  'Wide Heart Large 125x110x60mm': 'Wide_Heart_Large_(125x110x60)',
  'Wide Heart Large (125x110x60)': 'Wide_Heart_Large_(125x110x60)',
  
  // Prestige sizes
  'Prestige Small (13x9cm)': 'Prestige_Small_(13x9cm)',
  'Prestige Medium (16x13cm)': 'Prestige_Medium_(16x13cm)',
  'Prestige Large (19x15cm)': 'Prestige_Large_(19x15cm)',
  
  // Keychain types
  '2D Rectangle Keychain': 'Keychain_2D_Rectangle',
  '3D Rectangle Keychain': 'Keychain_3D_Rectangle',
  '2D Heart Keychain': 'Keychain_2D_Heart',
  '3D Heart Keychain': 'Keychain_3D_Heart',
  
  // Necklace types
  '2D Heart Necklace': 'Necklace_Heart_2D',
  '2D Rectangle Necklace': 'Necklace_Rectangle_2D',
  
  // Ornament types
  'Circle Ornament': 'Ornament',
  'Circle Ornament with Stand': 'Ornament_with_Stand',
  
  // Notched Crystal sizes
  '2D Notched Small Crystal Tall 6x4x1.2\" / 15x10x3cm': '2d_notched_small_crystal_tall',
  '3D Notched Small Crystal Tall 6x4x1.2\" / 15x10x3cm': '3d_notched_small_crystal_tall',
  '2D Notched Crystal Tall  7x5x1.2\" / 18x13x3cm': '2d_notched_crystal_tall',
  '3D Notched Crystal Tall  7x5x1.2\" / 18x13x3cm': '3d_notched_crystal_tall',
  '2D Notched Small Crystal Wide 6x4x1.2\" / 15x10x3cm': '2d_notched_small_crystal_wide',
  '3D Notched Small Crystal Wide 6x4x1.2\" / 15x10x3cm': '3d_notched_small_crystal_wide',
  '2D Notched Crystal Wide 7x5x1.2\" / 18x13x3cm': '2d_notched_crystal_wide',
  '3D Notched Crystal Wide 7x5x1.2\" / 18x13x3cm': '3d_notched_crystal_wide',
  
  // Ball Crystal sizes
  'Ball Crystal Small 8cm': 'ball_small_8cm',
  'Ball Crystal Medium 10cm': 'ball_small_8cm', // Use same pricing as small (no medium in pricing)
  
  // Dome sizes
  '3D Small Crystal Dome': 'Small_Crystal_Dome',
  '3D Crystal Dome Medium': 'Dome_Medium',
  
  // Circle sizes
  '3D Crystal Circle Small l  4.75\" x 5 x 1.25 / 12 x 12.5 x 3cm': '3D_Crystal_Circle_Small_size',
  '3D Crystal Circle Medium  6\" x 5.75 x 1.25 / 15 x 14.5 x 3cm': '3D_Crystal_Circle_Medium_size',
};

// ============================================
// MAIN SCRIPT
// ============================================

function main() {
  console.log('🔄 Starting product price update...\n');
  
  // Read current products
  let products;
  try {
    const rawData = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    products = JSON.parse(rawData);
    console.log(`📁 Loaded ${products.length} products from final-products.json`);
  } catch (err) {
    console.error('❌ Failed to read products file:', err.message);
    process.exit(1);
  }
  
  // Create backup
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(products, null, 2));
    console.log('💾 Created backup at final-products.backup.json');
  } catch (err) {
    console.error('⚠️ Warning: Could not create backup:', err.message);
  }
  
  let updatedCount = 0;
  let sizeUpdatedCount = 0;
  let lightbaseUpdatedCount = 0;
  let skippedProducts = [];
  
  // Process each product
  products.forEach((product, index) => {
    const originalSku = product.sku;
    const mappedSku = SKU_MAPPING[originalSku] || originalSku;
    
    // Update base price if we have pricing data
    if (PRICING_DATA[mappedSku]) {
      const oldPrice = product.basePrice;
      const newPrice = PRICING_DATA[mappedSku].price;
      
      if (oldPrice !== newPrice) {
        product.basePrice = newPrice;
        product.cost = PRICING_DATA[mappedSku].cost;
        console.log(`  ✅ ${product.name}: $${oldPrice} → $${newPrice}`);
        updatedCount++;
      }
    } else {
      skippedProducts.push({ sku: originalSku, name: product.name });
    }
    
    // Update sizes if present
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach((size) => {
        const sizeSku = SIZE_NAME_TO_SKU[size.name];
        if (sizeSku && PRICING_DATA[sizeSku]) {
          const oldPrice = size.price;
          const newPrice = PRICING_DATA[sizeSku].price;
          
          if (oldPrice !== newPrice) {
            size.price = newPrice;
            size.cost = PRICING_DATA[sizeSku].cost;
            console.log(`    📐 Size "${size.name}": $${oldPrice} → $${newPrice}`);
            sizeUpdatedCount++;
          }
        }
      });
    }
    
    // Update lightBases if present
    if (product.lightBases && Array.isArray(product.lightBases)) {
      product.lightBases.forEach((base) => {
        // Map lightbase names to SKUs
        const lightbaseName = base.name;
        const lightbaseSku = lightbaseName.replace(/\s+/g, '_');
        
        if (PRICING_DATA[lightbaseSku]) {
          const oldPrice = base.price;
          const newPrice = PRICING_DATA[lightbaseSku].price;
          
          if (oldPrice !== newPrice && oldPrice !== null) {
            base.price = newPrice;
            console.log(`    💡 Lightbase "${base.name}": $${oldPrice} → $${newPrice}`);
            lightbaseUpdatedCount++;
          }
        }
      });
    }
    
    // Update background options if present
    if (product.backgroundOptions && Array.isArray(product.backgroundOptions)) {
      product.backgroundOptions.forEach((bg) => {
        if (bg.id === '2d' && PRICING_DATA['2d_backdrop']) {
          bg.price = PRICING_DATA['2d_backdrop'].price;
        } else if (bg.id === '3d' && PRICING_DATA['3d_backdrop']) {
          bg.price = PRICING_DATA['3d_backdrop'].price;
        }
      });
    }
    
    // Update text options if present
    if (product.textOptions && Array.isArray(product.textOptions)) {
      product.textOptions.forEach((text) => {
        if (text.id === 'customText' && PRICING_DATA['customer_text']) {
          text.price = PRICING_DATA['customer_text'].price;
        }
      });
    }
  });
  
  // Write updated products
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log('\n✅ Successfully updated final-products.json');
  } catch (err) {
    console.error('❌ Failed to write products file:', err.message);
    process.exit(1);
  }
  
  // Summary
  console.log('\n📊 Update Summary:');
  console.log(`   • Products updated: ${updatedCount}`);
  console.log(`   • Sizes updated: ${sizeUpdatedCount}`);
  console.log(`   • Lightbases updated: ${lightbaseUpdatedCount}`);
  
  if (skippedProducts.length > 0) {
    console.log(`\n⚠️ Products without pricing data (${skippedProducts.length}):`);
    skippedProducts.forEach(p => {
      console.log(`   • ${p.sku}: ${p.name}`);
    });
  }
  
  console.log('\n✨ Price update complete!');
}

// Run
main();
