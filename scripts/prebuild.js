// scripts/prebuild.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Development mode logging
function devLog(message) {
  console.log(`🔨 PREBUILD: ${message}`);
}

// Function to test if MAMP/API is available
async function testAPIAvailability() {
  try {
    console.log('🧪 Testing API availability...');
    
    // Test the exact same URL that vite uses in proxy
    const testUrl = 'http://crystalkeepsakes:8888/api/cockpit3d-data-fetcher.php?action=generate-products';
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Prebuild-Test/1.0'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout for test
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    devLog(`✅ API test successful - received ${result.count || 0} items`);
    
    return true;
  } catch (error) {
    devLog(`❌ API test failed: ${error.message}`);
    return false;
  }
}

// Function to create fallback products file if API fails
async function createFallbackProductsFile() {
  devLog('Creating fallback products file from static-products.js...');
  
  try {
    // Import static products - fix Windows path issue
    const staticProductsPath = path.join(rootDir, 'src/data/static-products.js');
    const staticProductsUrl = `file://${staticProductsPath.replace(/\\/g, '/')}`;
    
    devLog(`Static products path: ${staticProductsPath}`);
    
    // Check if file exists first
    const fileExists = await fs.pathExists(staticProductsPath);
    if (!fileExists) {
      throw new Error(`Static products file not found: ${staticProductsPath}`);
    }
    
    const { products } = await import(staticProductsUrl);
    devLog(`Loaded ${products.length} static products`);
    
    // Create the fallback file content - FIXED: Use correct export name
    const jsContent = `// Auto-generated fallback products file - ${new Date().toISOString()}
// This file was created because the API was not available during build

export const cockpit3dProducts = ${JSON.stringify(products, null, 2)};

export const generatedAt = "${new Date().toISOString()}";

export const isRealTimeData = false;

export const fallbackReason = "API not available during build - using static products";

export const sourceInfo = {
  static_products: ${products.length},
  cockpit3d_products: 0,
  final_total: ${products.length},
  matching_algorithm: "fallback_static_only"
};

export default cockpit3dProducts;
`;

    // Write the file
    const outputPath = path.join(rootDir, 'src/data/cockpit3d-products.js');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, jsContent);
    
    devLog(`✅ Fallback products file created: ${outputPath}`);
    devLog(`📊 Fallback file contains ${products.length} static products`);
    return true;
    
  } catch (error) {
    console.error(`❌ PREBUILD: Failed to create fallback file: ${error.message}`);
    return false;
  }
}

// Function to generate products via API call
async function generateProductsViaAPI() {
  devLog('Attempting to generate products via API...');
  
  try {
    // FIXED: Use the same URL structure as vite proxy
    const apiUrl = 'http://crystalkeepsakes:8888';
    const fullUrl = `${apiUrl}/api/cockpit3d-data-fetcher.php?action=generate-products&refresh=true`;
    
    devLog(`Calling API: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Prebuild-Script/1.0'
      },
      signal: AbortSignal.timeout(120000) // 2 minute timeout for generation
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText.substring(0, 200)}`);
    }
    
    const result = await response.json();
    devLog(`API Response: ${JSON.stringify(result, null, 2)}`);
    
    if (!result.success) {
      throw new Error(result.error || 'API returned unsuccessful result');
    }
    
    // Verify the products file was actually created
    const productsFilePath = path.join(rootDir, 'src/data/cockpit3d-products.js');
    const fileExists = await fs.pathExists(productsFilePath);
    
    if (!fileExists) {
      throw new Error('API call succeeded but products file was not created');
    }
    
    // Verify the file has content
    const stats = await fs.stat(productsFilePath);
    if (stats.size < 100) {
      throw new Error('Products file was created but appears to be empty or corrupted');
    }
    
    devLog(`✅ Products file generated successfully via API (${Math.round(stats.size/1024)}KB)`);
    devLog(`✅ Generated ${result.total_products || result.merged_count} total products`);
    
    // Log detailed breakdown if available
    if (result.static_count !== undefined && result.cockpit3d_count !== undefined) {
      devLog(`📊 Breakdown: ${result.static_count} static + ${result.cockpit3d_count} CockPit3D = ${result.total_products} total`);
    }
    
    return true;
    
  } catch (error) {
    devLog(`❌ API generation failed: ${error.message}`);
    return false;
  }
}

// Function to verify the generated file
async function verifyGeneratedFile() {
  try {
    const productsFilePath = path.join(rootDir, 'src/data/cockpit3d-products.js');
    
    if (!await fs.pathExists(productsFilePath)) {
      return { valid: false, error: 'File does not exist' };
    }
    
    const content = await fs.readFile(productsFilePath, 'utf8');
    
    // Check if file contains the expected export
    if (!content.includes('export const cockpit3dProducts')) {
      return { valid: false, error: 'File missing cockpit3dProducts export' };
    }
    
    // Try to extract and parse the products array
    const match = content.match(/export const cockpit3dProducts = (\[.*?\]);/s);
    if (!match) {
      return { valid: false, error: 'Could not parse products array' };
    }
    
    try {
      const products = JSON.parse(match[1]);
      const productCount = Array.isArray(products) ? products.length : 0;
      
      if (productCount < 2) {
        return { valid: false, error: `Too few products found: ${productCount}. Expected at least 2.` };
      }
      
      devLog(`✅ File verification passed: ${productCount} products found`);
      return { valid: true, productCount };
    } catch (parseError) {
      return { valid: false, error: 'Products array is not valid JSON: ' + parseError.message };
    }
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Main prebuild function
async function prebuild() {
  console.log('🚀 Starting prebuild process...');
  
  try {
    // First, test if API is available
    const isAPIAvailable = await testAPIAvailability();
    
    if (isAPIAvailable) {
      console.log('✅ API is available, attempting to generate products...');
      
      // Try to generate via API
      const apiSuccess = await generateProductsViaAPI();
      
      if (apiSuccess) {
        // Verify the generated file
        const verification = await verifyGeneratedFile();
        if (verification.valid) {
          console.log(`✅ Prebuild completed successfully - ${verification.productCount} products generated via API`);
          return;
        } else {
          console.log(`⚠️ Generated file failed verification: ${verification.error}`);
          console.log('🔄 Falling back to static products...');
        }
      } else {
        console.log('⚠️ API generation failed, falling back to static products...');
      }
    } else {
      console.log('⚠️ API not available (MAMP may not be running), using static products...');
    }
    
    // If API fails or verification fails, create fallback file
    console.log('📁 Creating fallback file from static products...');
    const fallbackSuccess = await createFallbackProductsFile();
    
    if (fallbackSuccess) {
      // Verify the fallback file
      const verification = await verifyGeneratedFile();
      if (verification.valid) {
        console.log(`✅ Prebuild completed with fallback - ${verification.productCount} static products`);
        return;
      } else {
        console.error(`❌ Fallback file failed verification: ${verification.error}`);
      }
    }
    
    // If everything fails, exit with error
    console.error('❌ Prebuild failed - could not generate or create fallback products file');
    throw new Error('All prebuild methods failed');
    
  } catch (error) {
    console.error(`❌ Prebuild error: ${error.message}`);
    throw error; // Re-throw to be caught by vite config
  }
}

// Run prebuild if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prebuild().catch((error) => {
    console.error('Prebuild failed:', error.message);
    process.exit(1);
  });
}

export { prebuild };