/**
 * Test Order Payload Builder
 * Tests the complete order payload flow from cart -> checkout -> Cockpit3D
 * 
 * Usage: node tests/test-order-payload.js
 */

const fs = require('fs');
const path = require('path');

// Load product data
const productsPath = path.join(__dirname, '../public/data/final-products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Find a product with all options (sizes, lightBases, backgroundOptions, textOptions)
function findTestProduct() {
  return products.find(p => 
    p.sizes && p.sizes.length > 0 &&
    p.lightBases && p.lightBases.length > 0 &&
    p.backgroundOptions && p.backgroundOptions.length > 0 &&
    p.textOptions && p.textOptions.length > 0 &&
    p.requiresImage === true
  );
}

// Build options array like ProductDetailClient.buildProductOptions()
function buildProductOptions(product, selectedSize, selectedLightBase, selectedBackground, customText) {
  const options = [];
  
  if (selectedLightBase && selectedLightBase.id !== 'none') {
    options.push({
      category: 'lightBase',
      optionId: selectedLightBase.id,
      cockpit3d_option_id: selectedLightBase.cockpit3d_id, // This may be undefined!
      name: selectedLightBase.name,
      value: selectedLightBase.name,
      priceModifier: selectedLightBase.price || 0
    });
  }
  
  if (selectedBackground) {
    options.push({
      category: 'background',
      optionId: selectedBackground.id,
      cockpit3d_option_id: selectedBackground.cockpit3d_option_id,
      name: selectedBackground.name,
      value: selectedBackground.name,
      priceModifier: selectedBackground.price
    });
  }
  
  if (customText && (customText.line1 || customText.line2)) {
    const textOption = product.textOptions?.find(t => t.price > 0) || product.textOptions?.[1];
    options.push({
      category: 'customText',
      optionId: 'custom-text',
      cockpit3d_option_id: textOption?.cockpit3d_option_id,
      name: 'Custom Text',
      value: 'Custom Text Added',
      priceModifier: textOption?.price || 0,
      line1: customText.line1,
      line2: customText.line2
    });
  }
  
  return options;
}

// Build cart item like ProductDetailClient.handleAddToCart()
function buildCartItem(product, selectedSize, options, customImage, customText) {
  return {
    productId: String(product.id),
    cockpit3d_id: product.cockpit3d_id || String(product.id),
    name: product.name,
    sku: product.sku,
    basePrice: selectedSize.price || product.basePrice,
    optionsPrice: options.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0),
    price: selectedSize.price + options.reduce((sum, opt) => sum + (opt.priceModifier || 0), 0),
    quantity: 1,
    sizeDetails: {
      sizeId: selectedSize.id,
      sizeName: selectedSize.name,
      cockpit3d_id: selectedSize.cockpit3d_id,
      basePrice: selectedSize.price
    },
    options: options,
    customImage: customImage,
    customText: customText ? { text: `${customText.line1}\n${customText.line2}`.trim() } : undefined,
    dateAdded: new Date().toISOString()
  };
}

// Build checkout payload like checkout/page.tsx
function buildCheckoutPayload(cartItem, orderNumber) {
  return {
    productId: cartItem.productId,
    cockpit3d_id: cartItem.cockpit3d_id,
    name: cartItem.name,
    sku: cartItem.sku,
    price: cartItem.price,
    quantity: cartItem.quantity,
    
    // Size & Options for Cockpit3D
    sizeDetails: cartItem.sizeDetails,
    options: cartItem.options,
    customText: cartItem.customText,
    
    // Image URLs (simulated)
    maskedImageUrl: cartItem.customImage?.serverUrl,
    rawImageUrl: cartItem.customImage?.originalServerUrl,
    tempOrderRef: cartItem.customImage?.tempOrderRef,
    
    productImage: null
  };
}

// Test the order payload
function testOrderPayload() {
  console.log('='.repeat(60));
  console.log('ORDER PAYLOAD TEST');
  console.log('='.repeat(60));
  console.log('');
  
  // 1. Find test product
  const product = findTestProduct();
  if (!product) {
    console.error('❌ No product found with all required options');
    return;
  }
  
  console.log(`✅ Test Product: ${product.name} (ID: ${product.id})`);
  console.log(`   SKU: ${product.sku}`);
  console.log(`   Cockpit3D ID: ${product.cockpit3d_id || 'NOT SET'}`);
  console.log('');
  
  // 2. Select options
  const selectedSize = product.sizes[0];
  const selectedLightBase = product.lightBases.find(lb => lb.id !== 'none') || product.lightBases[1];
  const selectedBackground = product.backgroundOptions.find(bg => bg.id === '2d' || bg.id === '3d') || product.backgroundOptions[1];
  const customText = { line1: 'In Loving Memory', line2: 'Forever in Our Hearts' };
  
  console.log('Selected Options:');
  console.log(`  Size: ${selectedSize.name}`);
  console.log(`    - cockpit3d_id: ${selectedSize.cockpit3d_id || 'NOT SET'}`);
  console.log(`  Light Base: ${selectedLightBase.name}`);
  console.log(`    - cockpit3d_id: ${selectedLightBase.cockpit3d_id || 'NOT SET'}`);
  console.log(`  Background: ${selectedBackground.name}`);
  console.log(`    - cockpit3d_option_id: ${selectedBackground.cockpit3d_option_id || 'NOT SET'}`);
  console.log(`  Custom Text: ${customText.line1} / ${customText.line2}`);
  console.log('');
  
  // 3. Build options array
  const options = buildProductOptions(product, selectedSize, selectedLightBase, selectedBackground, customText);
  console.log('Built Options Array:');
  console.log(JSON.stringify(options, null, 2));
  console.log('');
  
  // 4. Simulate custom image
  const customImage = {
    serverUrl: 'https://crystalkeepsakes.com/crystal-data/orders/CK_0000001_1766640024369/masked.jpg',
    originalServerUrl: 'https://crystalkeepsakes.com/crystal-data/orders/CK_0000001_1766640024369/original.jpg',
    tempOrderRef: 'CK_0000001_1766640024369',
    filename: 'test-image.png',
    mimeType: 'image/png'
  };
  
  // 5. Build cart item
  const cartItem = buildCartItem(product, selectedSize, options, customImage, customText);
  console.log('Cart Item (for addToCart):');
  console.log(JSON.stringify({
    ...cartItem,
    customImage: cartItem.customImage ? {
      serverUrl: cartItem.customImage.serverUrl,
      originalServerUrl: cartItem.customImage.originalServerUrl,
      tempOrderRef: cartItem.customImage.tempOrderRef
    } : undefined
  }, null, 2));
  console.log('');
  
  // 6. Build checkout payload
  const orderNumber = `CK_TEST_${Date.now()}`;
  const checkoutItem = buildCheckoutPayload(cartItem, orderNumber);
  console.log('Checkout Payload (for PHP backend):');
  console.log(JSON.stringify(checkoutItem, null, 2));
  console.log('');
  
  // 7. Validate payload
  console.log('='.repeat(60));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(60));
  console.log('');
  
  const issues = [];
  const warnings = [];
  
  // Check sizeDetails.cockpit3d_id
  if (!checkoutItem.sizeDetails?.cockpit3d_id) {
    issues.push('❌ CRITICAL: sizeDetails.cockpit3d_id is missing - Cockpit3D won\'t know which size!');
  } else {
    console.log(`✅ sizeDetails.cockpit3d_id: ${checkoutItem.sizeDetails.cockpit3d_id}`);
  }
  
  // Check lightBase cockpit3d_option_id
  const lightBaseOption = checkoutItem.options?.find(o => o.category === 'lightBase');
  if (lightBaseOption) {
    if (!lightBaseOption.cockpit3d_option_id) {
      warnings.push(`⚠️  WARNING: lightBase option missing cockpit3d_option_id (value: ${lightBaseOption.optionId})`);
    } else {
      console.log(`✅ lightBase.cockpit3d_option_id: ${lightBaseOption.cockpit3d_option_id}`);
    }
  }
  
  // Check background cockpit3d_option_id
  const backgroundOption = checkoutItem.options?.find(o => o.category === 'background');
  if (backgroundOption) {
    if (!backgroundOption.cockpit3d_option_id) {
      warnings.push(`⚠️  WARNING: background option missing cockpit3d_option_id (value: ${backgroundOption.optionId})`);
    } else {
      console.log(`✅ background.cockpit3d_option_id: ${backgroundOption.cockpit3d_option_id}`);
    }
  }
  
  // Check customText cockpit3d_option_id
  const textOption = checkoutItem.options?.find(o => o.category === 'customText');
  if (textOption) {
    if (!textOption.cockpit3d_option_id) {
      warnings.push(`⚠️  WARNING: customText option missing cockpit3d_option_id`);
    } else {
      console.log(`✅ customText.cockpit3d_option_id: ${textOption.cockpit3d_option_id}`);
    }
  }
  
  // Check image URLs
  if (!checkoutItem.maskedImageUrl) {
    issues.push('❌ CRITICAL: maskedImageUrl is missing - Cockpit3D won\'t have the customer image!');
  } else {
    console.log(`✅ maskedImageUrl: ${checkoutItem.maskedImageUrl}`);
  }
  
  if (!checkoutItem.rawImageUrl) {
    warnings.push('⚠️  WARNING: rawImageUrl is missing - Cockpit3D won\'t have the original image');
  } else {
    console.log(`✅ rawImageUrl: ${checkoutItem.rawImageUrl}`);
  }
  
  console.log('');
  
  // Print issues
  if (issues.length > 0) {
    console.log('CRITICAL ISSUES:');
    issues.forEach(i => console.log(i));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('WARNINGS:');
    warnings.forEach(w => console.log(w));
    console.log('');
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ All validations passed!');
  }
  
  // 8. Output full test payload for PHP backend
  console.log('');
  console.log('='.repeat(60));
  console.log('TEST PAYLOAD FOR COCKPIT3D API');
  console.log('='.repeat(60));
  console.log('');
  
  const testPayload = {
    testMode: true,
    sendTestEmail: true,
    orderNumber: orderNumber,
    cartItems: [checkoutItem],
    customer: {
      email: 'test@crystalkeepsakes.com',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '555-123-4567'
    },
    shippingInfo: {
      address: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
      shippingMethod: 'air',
      destination: 'customer_home'
    }
  };
  
  console.log('Save this to a file and POST to /api/cockpit3d/submit-order.php:');
  console.log('');
  console.log(JSON.stringify(testPayload, null, 2));
  
  // Save to file
  const outputPath = path.join(__dirname, 'test-order-payload.json');
  fs.writeFileSync(outputPath, JSON.stringify(testPayload, null, 2));
  console.log('');
  console.log(`✅ Test payload saved to: ${outputPath}`);
  
  return { issues, warnings, payload: testPayload };
}

// Run test
testOrderPayload();
