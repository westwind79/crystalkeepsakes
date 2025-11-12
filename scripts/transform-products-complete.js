#!/usr/bin/env node
/**
 * Complete Product Transformer (Node.js version)
 * @description Transforms raw Cockpit3D products with price lookup
 * @version 2.0.0
 * @date 2025-01-14
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Complete Product Transformation Starting...\n');

// Paths
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const STATIC_PRODUCTS_PATH = path.join(DATA_DIR, 'static-products.js');
const RAW_PRODUCTS_PATH = path.join(DATA_DIR, 'cockpit3d-raw-products.js');
const RAW_CATALOG_PATH = path.join(DATA_DIR, 'cockpit3d-raw-catalog.js');
const OUTPUT_PATH = path.join(DATA_DIR, 'cockpit3d-products.js');

/**
 * Load and parse JavaScript export file
 */
function loadJSExport(filePath, exportName) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const pattern = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`, 's');
    const match = content.match(pattern);
    
    if (!match) return null;
    
    // Clean trailing commas
    let jsonString = match[1]
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*\}/g, '}');
    
    try {
        return JSON.parse(jsonString);
    } catch (err) {
        console.error(`❌ Failed to parse ${exportName}:`, err.message);
        return null;
    }
}

/**
 * Look up price for option with change_qty=true
 */
function lookupOptionPrice(valueId, valueName, allProducts) {
    // Try to find by ID
    const productById = allProducts.find(p => p.id === valueId);
    if (productById) {
        console.log(`  ✅ Found price for "${valueName}" by ID: $${productById.price}`);
        return parseFloat(productById.price);
    }
    
    // Try by SKU/name
    const searchName = valueName.replace(/\s+/g, '_');
    const productBySku = allProducts.find(p => 
        p.sku === searchName || 
        p.sku.toLowerCase() === searchName.toLowerCase()
    );
    
    if (productBySku) {
        console.log(`  ✅ Found price for "${valueName}" by SKU: $${productBySku.price}`);
        return parseFloat(productBySku.price);
    }
    
    console.log(`  ⚠️  No price found for "${valueName}" (ID: ${valueId})`);
    return null;
}

/**
 * Extract lightbase options with price lookup
 */
function extractLightbases(productOptions, allProducts) {
    const lightbases = [{
        id: 'none',
        name: 'No Base',
        price: null,
        cockpit3d_id: null
    }];
    
    const lightBaseOption = productOptions.find(opt => opt.name === 'Light Base');
    if (!lightBaseOption || !lightBaseOption.values) {
        return lightbases;
    }
    
    lightBaseOption.values.forEach(value => {
        const hasChangeQty = value.change_qty === true;
        let price = null;
        
        if (hasChangeQty) {
            price = lookupOptionPrice(value.id, value.name, allProducts);
        } else if (value.price && !isNaN(value.price)) {
            price = parseFloat(value.price);
        }
        
        lightbases.push({
            id: String(value.id),
            name: value.name,
            price: price,
            cockpit3d_id: String(value.id)
        });
    });
    
    return lightbases;
}

/**
 * Extract size options with price lookup
 */
function extractSizes(productOptions, allProducts, basePrice) {
    const sizeOption = productOptions.find(opt => opt.name === 'Size');
    if (!sizeOption || !sizeOption.values) {
        return [];
    }
    
    return sizeOption.values.map(value => {
        const hasChangeQty = value.change_qty === true;
        let price = basePrice;
        
        if (hasChangeQty) {
            const lookedUpPrice = lookupOptionPrice(value.id, value.name, allProducts);
            if (lookedUpPrice !== null) {
                price = lookedUpPrice;
            }
        } else if (value.price && !isNaN(value.price)) {
            price = parseFloat(value.price);
        }
        
        return {
            id: String(value.id),
            name: value.name,
            price: price,
            cockpit3d_id: String(value.id)
        };
    });
}

/**
 * Extract background options
 */
function extractBackgrounds() {
    return [
        {
            id: 'rm',
            name: 'Remove Backdrop',
            price: 0,
            cockpit3d_option_id: null
        },
        {
            id: '2d',
            name: '2D Backdrop',
            price: 12,
            cockpit3d_option_id: '154'
        },
        {
            id: '3d',
            name: '3D Backdrop',
            price: 15,
            cockpit3d_option_id: '155'
        }
    ];
}

/**
 * Extract text options
 */
function extractTextOptions() {
    return [
        {
            id: 'none',
            name: 'No Text',
            price: 0,
            cockpit3d_option_id: null
        },
        {
            id: 'customText',
            name: 'Custom Text',
            price: 9.5,
            cockpit3d_option_id: '199'
        }
    ];
}

/**
 * Transform a single Cockpit3D product
 */
function transformProduct(rawProduct, allProducts) {
    const isLightbase = rawProduct.name.toLowerCase().includes('lightbase') || 
                       rawProduct.name.toLowerCase().includes('base');
    const isKeychain = rawProduct.name.toLowerCase().includes('keychain');
    const isOrnament = rawProduct.name.toLowerCase().includes('ornament');
    
    const slug = rawProduct.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    const transformed = {
        id: String(rawProduct.id),
        cockpit3d_id: String(rawProduct.id),
        name: rawProduct.name,
        slug: slug,
        sku: rawProduct.sku,
        basePrice: parseFloat(rawProduct.price),
        description: rawProduct.name,
        longDescription: '',
        images: [],
        requiresImage: !isLightbase
    };
    
    // Handle images
    if (rawProduct.photo) {
        const cleanName = rawProduct.name.replace(/[^a-zA-Z0-9\-_]/g, '_').replace(/_+/g, '_').substring(0, 50);
        transformed.images.push({
            src: `/img/products/cockpit3d/${rawProduct.id}/cockpit3d_${rawProduct.id}_${cleanName}.jpg`,
            isMain: true
        });
    } else {
        transformed.images.push({
            src: 'https://placehold.co/600x400',
            isMain: true
        });
    }
    
    // Extract options (only for non-lightbase products)
    if (!isLightbase && rawProduct.options) {
        // Sizes
        transformed.sizes = extractSizes(rawProduct.options, allProducts, transformed.basePrice);
        
        // Lightbases (only for crystals, not keychains/ornaments)
        if (!isKeychain && !isOrnament) {
            transformed.lightBases = extractLightbases(rawProduct.options, allProducts);
        } else {
            transformed.lightBases = [];
        }
        
        // Backgrounds
        transformed.backgroundOptions = extractBackgrounds();
        
        // Text
        transformed.textOptions = extractTextOptions();
    } else {
        transformed.sizes = [];
        transformed.lightBases = [];
        transformed.backgroundOptions = [];
        transformed.textOptions = [];
    }
    
    return transformed;
}

/**
 * Main transformation
 */
function main() {
    console.log('📂 Loading data files...\n');
    
    // Load static products
    const staticProducts = loadJSExport(STATIC_PRODUCTS_PATH, 'staticProducts') || [];
    console.log(`✅ Loaded ${staticProducts.length} static products`);
    
    // Load raw Cockpit3D products
    const rawProducts = loadJSExport(RAW_PRODUCTS_PATH, 'cockpit3dRawProducts') || [];
    console.log(`✅ Loaded ${rawProducts.length} raw Cockpit3D products`);
    
    // Load raw catalog (for future use)
    const rawCatalog = loadJSExport(RAW_CATALOG_PATH, 'cockpit3dRawCatalog') || [];
    console.log(`✅ Loaded catalog with ${rawCatalog.length} categories\n`);
    
    console.log('🔄 Transforming Cockpit3D products...\n');
    console.log('='.repeat(70));
    
    // Transform each product
    const transformedProducts = [];
    rawProducts.forEach((rawProduct, index) => {
        console.log(`\n[${index + 1}/${rawProducts.length}] Transforming: ${rawProduct.name} (ID: ${rawProduct.id})`);
        const transformed = transformProduct(rawProduct, rawProducts);
        transformedProducts.push(transformed);
    });
    
    console.log('\n' + '='.repeat(70));
    
    // Combine with static products
    const allProducts = [...staticProducts, ...transformedProducts];
    
    console.log('\n📊 Transformation Summary:');
    console.log(`  Static products: ${staticProducts.length}`);
    console.log(`  Cockpit3D products: ${transformedProducts.length}`);
    console.log(`  Total products: ${allProducts.length}`);
    
    // Generate output file
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const output = `// Combined processed products (static + CockPit3D) - ${timestamp}

export const cockpit3dProducts = ${JSON.stringify(allProducts, null, 2)};

export const generatedAt = "${new Date().toISOString()}";

export const isRealTimeData = false;

export const sourceInfo = {
  static_products: ${staticProducts.length},
  cockpit3d_products: ${transformedProducts.length},
  total: ${allProducts.length}
};
`;
    
    fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
    
    console.log(`\n✅ Successfully generated: ${OUTPUT_PATH}`);
    console.log(`   File size: ${(output.length / 1024).toFixed(2)} KB`);
    
    // Show sample prices
    console.log('\n📋 Sample Product Prices:');
    const diamond = transformedProducts.find(p => p.name.includes('Cut Corner Diamond'));
    if (diamond) {
        console.log(`\n  ${diamond.name}:`);
        console.log(`    Base Price: $${diamond.basePrice}`);
        if (diamond.sizes && diamond.sizes.length > 0) {
            console.log(`    Sizes:`);
            diamond.sizes.forEach(size => {
                console.log(`      - ${size.name}: $${size.price}`);
            });
        }
        if (diamond.lightBases && diamond.lightBases.length > 0) {
            console.log(`    Light Bases:`);
            diamond.lightBases.slice(0, 4).forEach(lb => {
                console.log(`      - ${lb.name}: ${lb.price !== null ? '$' + lb.price : 'N/A'}`);
            });
        }
    }
    
    console.log('\n✅ Product generation complete!\n');
    return 0;
}

// Run
try {
    process.exit(main());
} catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
}
