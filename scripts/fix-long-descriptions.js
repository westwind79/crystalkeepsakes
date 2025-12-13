#!/usr/bin/env node
/**
 * Fix Long Descriptions Script
 * 
 * Adds proper HTML formatting to product longDescriptions that are plain text.
 * 
 * Usage: node scripts/fix-long-descriptions.js
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../public/data/final-products.json');

// Products that need HTML formatting added
const DESCRIPTION_TEMPLATES = {
  // Lightbases - standard template
  lightbase_default: (name) => `
<div class="product-description">
  <h3>Premium ${name}</h3>
  <p>Illuminate your crystal with our beautifully designed ${name.toLowerCase()}. This premium LED light base creates a stunning display that brings your 3D crystal photo to life.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Multi-color LED illumination</li>
    <li>USB powered for convenience</li>
    <li>Touch-activated controls</li>
    <li>Low heat, energy efficient</li>
  </ul>
  
  <h4>Specifications:</h4>
  <ul>
    <li>Compatible with most crystal sizes</li>
    <li>Premium build quality</li>
    <li>1-year warranty included</li>
  </ul>
  
  <p><strong>Note:</strong> Light base is sold separately or as an add-on to your crystal purchase.</p>
</div>
`.trim(),

  // Keychains template
  keychain_default: (name, type) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Carry your precious memories everywhere with our stunning ${type || '3D'} crystal keychain. Each piece is individually laser-engraved with your custom photo, creating a beautiful keepsake you can take anywhere.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>High-quality K9 optical crystal</li>
    <li>Precision laser engraving</li>
    <li>Durable metal keyring included</li>
    <li>Perfect gift for any occasion</li>
  </ul>
  
  <h4>Dimensions:</h4>
  <ul>
    <li>Crystal size: Compact and portable</li>
    <li>Includes premium metal keyring attachment</li>
  </ul>
  
  <p><strong>Personalization:</strong> Upload your photo and we'll transform it into a stunning 3D engraved keepsake.</p>
</div>
`.trim(),

  // Necklace template
  necklace_default: (name) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Wear your memories close to your heart with our elegant crystal necklace pendant. Each piece features your custom photo laser-engraved into beautiful optical crystal.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Premium K9 optical crystal pendant</li>
    <li>Precision 2D laser engraving</li>
    <li>Sterling silver chain included</li>
    <li>Elegant gift packaging</li>
  </ul>
  
  <h4>Details:</h4>
  <ul>
    <li>Chain length: 18 inches (adjustable)</li>
    <li>Crystal pendant: Heart or rectangle shape</li>
    <li>Hypoallergenic materials</li>
  </ul>
  
  <p><strong>Perfect for:</strong> Anniversaries, memorials, Mother's Day, or any special occasion.</p>
</div>
`.trim(),

  // Wide Heart template  
  wide_heart_default: (name) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Express your love with our stunning Wide Heart crystal. This beautiful heart-shaped keepsake features your custom photo laser-engraved in stunning 3D detail.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Premium K9 optical crystal</li>
    <li>Precision 3D laser engraving</li>
    <li>Wide heart shape for excellent photo display</li>
    <li>Multiple sizes available</li>
  </ul>
  
  <h4>Available Sizes:</h4>
  <ul>
    <li>Small: 80x70x40mm - Perfect for desk display</li>
    <li>Medium: 100x90x50mm - Ideal centerpiece</li>
    <li>Large: 125x110x60mm - Statement piece</li>
  </ul>
  
  <p><strong>Pairs beautifully with:</strong> Our LED light bases to create a stunning illuminated display.</p>
</div>
`.trim(),

  // Dog Bone template
  dog_bone_default: (name, orientation) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Honor your beloved furry friend with our unique dog bone shaped crystal. This special keepsake features your pet's photo laser-engraved in stunning 3D detail.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Premium K9 optical crystal</li>
    <li>Precision 3D laser engraving</li>
    <li>Unique dog bone shape</li>
    <li>${orientation === 'vertical' ? 'Vertical orientation - perfect for portraits' : 'Horizontal orientation - ideal for action shots'}</li>
  </ul>
  
  <h4>Perfect For:</h4>
  <ul>
    <li>Pet memorial tributes</li>
    <li>Celebrating your furry family member</li>
    <li>Gift for pet lovers</li>
  </ul>
  
  <h4>Dimensions:</h4>
  <p>One size: 129mm - Perfect display piece that captures your pet beautifully.</p>
  
  <p><strong>Pairs perfectly with:</strong> Our LED light bases to create a glowing tribute to your beloved pet.</p>
</div>
`.trim(),

  // Urn/Candle template
  urn_candle_default: (name) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Create a meaningful memorial with our 3D Crystal Urn. This beautiful piece serves both as a stunning display and a dignified vessel for preserving ashes of loved ones.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Premium optical crystal construction</li>
    <li>Precision 3D laser engraving of your photo</li>
    <li>Secure urn compartment</li>
    <li>Elegant memorial design</li>
  </ul>
  
  <h4>Dimensions:</h4>
  <ul>
    <li>Size: 6" x 5" x 2.5" (15x12x6cm)</li>
    <li>Suitable for a small portion of cremated remains</li>
  </ul>
  
  <h4>Memorial Options:</h4>
  <ul>
    <li>Custom photo engraving</li>
    <li>Optional text inscription</li>
    <li>Compatible with LED light bases</li>
  </ul>
  
  <p><strong>A lasting tribute:</strong> Honor your loved one with this beautiful combination of art and remembrance.</p>
</div>
`.trim(),

  // Notched Crystal template
  notched_crystal_default: (name, orientation) => `
<div class="product-description">
  <h3>${name}</h3>
  <p>Our elegant notched crystal design features a distinctive beveled edge that adds sophistication to your personalized photo keepsake. Available in both 2D and 3D engraving styles.</p>
  
  <h4>Features:</h4>
  <ul>
    <li>Premium K9 optical crystal</li>
    <li>Distinctive notched/beveled edge design</li>
    <li>Available in 2D or 3D engraving</li>
    <li>${orientation === 'tall' ? 'Tall orientation - ideal for portraits' : 'Wide orientation - perfect for groups'}</li>
  </ul>
  
  <h4>Available Sizes:</h4>
  <ul>
    <li>Small: 6" x 4" x 1.2" (15x10x3cm) - $159</li>
    <li>Large: 7" x 5" x 1.2" (18x13x3cm) - $259</li>
  </ul>
  
  <h4>Engraving Options:</h4>
  <ul>
    <li><strong>2D:</strong> Classic flat engraving - best for portraits</li>
    <li><strong>3D:</strong> Dimensional depth - brings photos to life</li>
  </ul>
  
  <p><strong>Display tip:</strong> Add an LED light base for stunning illumination effect.</p>
</div>
`.trim(),

  // Static/Placeholder products
  static_product: () => `
<div class="product-description">
  <h3>Custom Crystal Product</h3>
  <p>This is a placeholder for custom product configuration. Contact us for special orders or custom requirements.</p>
  
  <h4>Custom Services Available:</h4>
  <ul>
    <li>Custom sizing and shapes</li>
    <li>Bulk/wholesale orders</li>
    <li>Corporate gifts and awards</li>
    <li>Special memorial projects</li>
  </ul>
  
  <p><strong>Contact us</strong> to discuss your custom crystal needs.</p>
</div>
`.trim(),
};

function needsFormatting(longDescription) {
  if (!longDescription || longDescription.length === 0) return true;
  // Check if it already has HTML tags
  return !longDescription.includes('<') || !longDescription.includes('>');
}

function getFormattedDescription(product) {
  const name = product.name;
  const sku = product.sku?.toLowerCase() || '';
  
  // Determine which template to use
  if (sku.includes('static')) {
    return DESCRIPTION_TEMPLATES.static_product();
  }
  
  if (sku.includes('lightbase') || sku.includes('light_base')) {
    return DESCRIPTION_TEMPLATES.lightbase_default(name);
  }
  
  if (sku.includes('keychain')) {
    const type = sku.includes('2d') ? '2D' : '3D';
    return DESCRIPTION_TEMPLATES.keychain_default(name, type);
  }
  
  if (sku.includes('necklace')) {
    return DESCRIPTION_TEMPLATES.necklace_default(name);
  }
  
  if (sku.includes('wide_heart') || sku.includes('new_wide_heart')) {
    return DESCRIPTION_TEMPLATES.wide_heart_default(name);
  }
  
  if (sku.includes('dog_bone')) {
    const orientation = sku.includes('vertical') ? 'vertical' : 'horizontal';
    return DESCRIPTION_TEMPLATES.dog_bone_default(name, orientation);
  }
  
  if (sku.includes('urn') || (sku.includes('candle') && !sku.includes('3d_crystal_candle'))) {
    return DESCRIPTION_TEMPLATES.urn_candle_default(name);
  }
  
  if (sku.includes('notched')) {
    const orientation = sku.includes('tall') ? 'tall' : 'wide';
    return DESCRIPTION_TEMPLATES.notched_crystal_default(name, orientation);
  }
  
  // For other products, wrap existing text in HTML if it exists
  if (product.longDescription && product.longDescription.length > 0) {
    // Convert plain text to HTML paragraphs
    const paragraphs = product.longDescription
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');
    
    return `<div class="product-description">\n<h3>${name}</h3>\n${paragraphs}\n</div>`;
  }
  
  return null;
}

function main() {
  console.log('🔄 Fixing long descriptions...\n');
  
  // Read products
  let products;
  try {
    products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    console.log(`📁 Loaded ${products.length} products`);
  } catch (err) {
    console.error('❌ Failed to read products:', err.message);
    process.exit(1);
  }
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  products.forEach((product, index) => {
    if (needsFormatting(product.longDescription)) {
      const formatted = getFormattedDescription(product);
      
      if (formatted) {
        console.log(`✅ ${product.name}: Added HTML formatting`);
        product.longDescription = formatted;
        updatedCount++;
      } else {
        console.log(`⚠️ ${product.name}: No template available, skipping`);
        skippedCount++;
      }
    } else {
      // Already has HTML
      skippedCount++;
    }
  });
  
  // Write updated products
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    console.log(`\n✅ Updated ${updatedCount} products`);
    console.log(`⏭️ Skipped ${skippedCount} products (already have HTML)`);
  } catch (err) {
    console.error('❌ Failed to write products:', err.message);
    process.exit(1);
  }
}

main();
