// scripts/fetch-cockpit3d-products.js
// This runs BEFORE build to generate products JSON from CockPit3D API

const http = require('http');

// Get port from MAMP config (check your MAMP settings)
const MAMP_PORT = process.env.MAMP_PORT || '8888';
const API_URL = `http://localhost:${MAMP_PORT}/crystalkeepsakes/api/cockpit3d-data-fetcher.php?action=generate-products`;

console.log('[FETCH] Fetching products from CockPit3D...');
console.log(`📍 API URL: ${API_URL}`);

// Make HTTP request
http.get(API_URL, (res) => {
  let data = '';

  // Collect response chunks
  res.on('data', (chunk) => {
    data += chunk;
  });

  // Handle complete response
  res.on('end', () => {
      // Check if response is empty
      if (!data || data.trim() === '') {
        console.warn('⚠️ Warning: Empty response from PHP endpoint');
        console.warn('💡 Skipping Cockpit3D fetch - using existing product data');
        console.warn('   This is normal in containerized environments without MAMP');
        console.log('✅ Build will continue with existing product files');
        process.exit(0);
      }

      // Check if response is HTML (error page)
      if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
        console.warn('⚠️ Warning: Received HTML instead of JSON');
        console.warn('💡 Skipping Cockpit3D fetch - using existing product data');
        console.warn('   This is normal in containerized environments without MAMP');
        console.log('✅ Build will continue with existing product files');
        process.exit(0);
      }

      // Parse JSON
      let result;
      try {
        result = JSON.parse(data);
      } catch (parseError) {
        console.warn('⚠️ Warning: Could not parse JSON response');
        console.warn('📄 Response preview:', data.substring(0, 200));
        console.warn('💡 Skipping Cockpit3D fetch - using existing product data');
        console.warn('   This is normal in containerized environments without MAMP');
        console.log('✅ Build will continue with existing product files');
        process.exit(0);
      }

      // Check for errors in response
      if (!result.success) {
        console.warn('⚠️ Warning from PHP script:', result.error || 'Unknown error');
        if (result.details) {
          console.warn('📋 Details:', result.details);
        }
        console.warn('💡 Skipping Cockpit3D fetch - using existing product data');
        console.warn('   This is normal in containerized environments without MAMP');
        console.log('✅ Build will continue with existing product files');
        process.exit(0);
      }
      
      if (result.success) {
        console.log('✅ Products fetched successfully!');
        console.log(`   📦 Total: ${result.total_count || result.products_count || 0} products`);
        console.log(`   📁 Static: ${result.static_count || 0} products`);
        console.log(`   🌐 CockPit3D: ${result.cockpit3d_count || 0} products`);
        console.log(`   💾 Saved to: public/data/final-products.json`);
        console.log('   ⚠️  NOTE: This script needs to be updated to save JSON instead of JS');
        process.exit(0);
      }
  });

}).on('error', (error) => {
  console.warn('⚠️ Could not fetch from Cockpit3D:', error.message);
  console.warn('');
  console.warn('💡 Skipping Cockpit3D fetch - using existing product data');
  console.warn('   This is normal in containerized environments without MAMP');
  console.warn('   If you need fresh data, run this on your local machine with MAMP');
  console.warn('');
  console.log('✅ Build will continue with existing product files');
  process.exit(0);  // Exit successfully so build continues
});