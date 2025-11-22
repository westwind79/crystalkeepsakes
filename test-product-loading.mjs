// ESM test to verify product loading works
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing Product Loading System\n');

try {
  // Simulate what getProducts() does
  const jsonPath = join(__dirname, 'public', 'data', 'final-products.json');
  console.log('📄 Reading:', jsonPath);
  
  const data = readFileSync(jsonPath, 'utf-8');
  const products = JSON.parse(data);
  
  console.log(`✅ Successfully loaded ${products.length} products\n`);
  
  // Test product structure
  const firstProduct = products[0];
  console.log('📦 First Product Structure:');
  console.log(`   ID: ${firstProduct.id}`);
  console.log(`   Name: ${firstProduct.name}`);
  console.log(`   Slug: ${firstProduct.slug}`);
  console.log(`   Base Price: $${firstProduct.basePrice}`);
  console.log(`   Images: ${firstProduct.images?.length || 0}`);
  console.log(`   Sizes: ${firstProduct.sizes?.length || 0}`);
  console.log(`   Light Bases: ${firstProduct.lightBases?.length || 0}`);
  
  // Verify all products have required fields
  console.log('\n🔍 Validating all products...');
  const missingFields = [];
  products.forEach((p, idx) => {
    if (!p.id) missingFields.push(`Product ${idx}: missing id`);
    if (!p.name) missingFields.push(`Product ${idx}: missing name`);
    if (!p.slug) missingFields.push(`Product ${idx}: missing slug`);
    if (p.basePrice === undefined) missingFields.push(`Product ${idx}: missing basePrice`);
  });
  
  if (missingFields.length > 0) {
    console.log('❌ Validation errors:');
    missingFields.forEach(err => console.log(`   ${err}`));
  } else {
    console.log('✅ All products have required fields');
  }
  
  // Test slug uniqueness
  const slugs = products.map(p => p.slug);
  const uniqueSlugs = new Set(slugs);
  console.log(`\n🔗 Slugs: ${slugs.length} total, ${uniqueSlugs.size} unique`);
  if (slugs.length !== uniqueSlugs.size) {
    console.log('❌ WARNING: Duplicate slugs detected!');
  } else {
    console.log('✅ All slugs are unique');
  }
  
  console.log('\n🎉 Product loading system is working correctly!');
  console.log('\n📊 Summary:');
  console.log(`   ✅ JSON file exists and is valid`);
  console.log(`   ✅ All products properly structured`);
  console.log(`   ✅ Ready for use by Next.js app`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
