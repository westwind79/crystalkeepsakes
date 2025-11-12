#!/usr/bin/env node
/**
 * Test Storage Size Calculator
 * Simulates cart data to check if it fits in localStorage/sessionStorage
 */

// Simulate a cart item with all data
const fullCartItem = {
  productId: '104',
  cockpit3d_id: '104',
  name: 'Cut Corner Diamond',
  sku: 'Cut_Corner_Diamond',
  price: 155,
  quantity: 1,
  productImage: '/img/products/cockpit3d/104/cockpit3d_104_Cut_Corner_Diamond.jpg',
  options: {
    size: {
      id: '549',
      name: 'Cut Corner Diamond (6x6cm)',
      price: 85,
      cockpit3d_id: '549'
    },
    lightbase: {
      id: '207',
      name: 'Lightbase Rectangle',
      price: 25,
      cockpit3d_id: '207'
    }
  },
  customImageId: 'uuid-abc-123',
  customImageMetadata: {
    filename: 'photo.jpg',
    hasImage: true
  },
  // Simulate a 2MB image (base64)
  customImage: {
    thumbnail: 'data:image/jpeg;base64,' + 'x'.repeat(60000), // 60KB thumbnail
    dataUrl: 'data:image/jpeg;base64,' + 'x'.repeat(2000000) // 2MB full image
  }
};

// Cart with full images (BAD)
const cartWithImages = [fullCartItem, fullCartItem];
const sizeWithImages = JSON.stringify(cartWithImages).length;

console.log('📊 Storage Size Test\n');
console.log('Cart with 2 items (FULL IMAGES):');
console.log('  Size:', (sizeWithImages / 1024).toFixed(2), 'KB');
console.log('  Fits in localStorage (5MB):', sizeWithImages < 5 * 1024 * 1024 ? '✅ YES' : '❌ NO');

// Cart without images (GOOD)
const cartWithoutImages = cartWithImages.map(item => {
  const { customImage, ...itemWithoutImage } = item;
  return {
    ...itemWithoutImage,
    customImageId: item.customImageId,
    customImageMetadata: item.customImageMetadata
  };
});

const sizeWithoutImages = JSON.stringify(cartWithoutImages).length;

console.log('\nCart with 2 items (IMAGES STRIPPED):');
console.log('  Size:', (sizeWithoutImages / 1024).toFixed(2), 'KB');
console.log('  Fits in localStorage (5MB):', sizeWithoutImages < 5 * 1024 * 1024 ? '✅ YES' : '❌ NO');

console.log('\n📈 Savings:');
console.log('  Reduced by:', ((sizeWithImages - sizeWithoutImages) / sizeWithImages * 100).toFixed(1), '%');
console.log('  Space saved:', ((sizeWithImages - sizeWithoutImages) / 1024).toFixed(2), 'KB');

console.log('\n✅ Solution: Always strip customImage before storing in localStorage/sessionStorage');
console.log('   Store only customImageId and retrieve from IndexedDB when needed');
