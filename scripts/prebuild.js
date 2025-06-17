// scripts/prebuild.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Development mode logging
function devLog(message) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔨 PREBUILD: ${message}`);
  }
}

// Function to create a simple local server to test the API
async function testLocalAPI() {
  try {
    // Try to fetch from MAMP server - use the same URL as vite proxy
    const response = await fetch('http://crystalkeepsakes:8888/api/cockpit3d-data-fetcher.php?action=generate-products');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    devLog(`API Test Result: ${JSON.stringify(result, null, 2)}`);
    
    return result.success;
  } catch (error) {
    devLog(`API test failed: ${error.message}`);
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
    devLog(`Static products URL: ${staticProductsUrl}`);
    
    // Check if file exists first
    const fileExists = await fs.pathExists(staticProductsPath);
    if (!fileExists) {
      throw new Error(`Static products file not found: ${staticProductsPath}`);
    }
    
    const { products } = await import(staticProductsUrl);
    
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
  total: ${products.length}
};
`;

    // Write the file
    const outputPath = path.join(rootDir, 'src/data/cockpit3d-products.js');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, jsContent);
    
    devLog(`Fallback products file created: ${outputPath}`);
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
    // FIXED: Use the correct API URL (same as vite proxy) and action
    const apiUrl = process.env.VITE_API_URL || 'http://crystalkeepsakes:8888';
    const fullUrl = `${apiUrl}/api/cockpit3d-data-fetcher.php?action=generate-products&refresh=true`;
    
    devLog(`Calling API: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Prebuild-Script/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
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
    
    // ADDED: Also verify the file has content
    const stats = await fs.stat(productsFilePath);
    if (stats.size < 100) {
      throw new Error('Products file was created but appears to be empty or corrupted');
    }
    
    devLog(`✅ Products file generated successfully via API (${stats.size} bytes)`);
    devLog(`✅ Generated ${result.products_count} total products (${result.static_count} static + ${result.cockpit3d_count} CockPit3D)`);
    return true;
    
  } catch (error) {
    devLog(`❌ API generation failed: ${error.message}`);
    return false;
  }
}

// ADDED: Function to verify the generated file
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
      
      devLog(`✅ File verification passed: ${productCount} products found`);
      return { valid: true, productCount };
    } catch (parseError) {
      return { valid: false, error: 'Products array is not valid JSON' };
    }
    
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Main prebuild function
async function prebuild() {
  console.log('🚀 Starting prebuild process...');
  
  try {
    // First, try to generate via API
    const apiSuccess = await generateProductsViaAPI();
    
    if (apiSuccess) {
      // Verify the generated file
      const verification = await verifyGeneratedFile();
      if (verification.valid) {
        console.log(`✅ Prebuild completed - ${verification.productCount} products generated via API`);
        return;
      } else {
        console.log(`⚠️ Generated file failed verification: ${verification.error}`);
        console.log('🔄 Falling back to static products...');
      }
    }
    
    // If API fails or verification fails, create fallback file
    console.log('⚠️ API generation failed, creating fallback file...');
    const fallbackSuccess = await createFallbackProductsFile();
    
    if (fallbackSuccess) {
      // Verify the fallback file
      const verification = await verifyGeneratedFile();
      if (verification.valid) {
        console.log(`✅ Prebuild completed - ${verification.productCount} fallback products file created`);
        return;
      } else {
        console.error(`❌ Fallback file failed verification: ${verification.error}`);
      }
    }
    
    // If everything fails, exit with error
    console.error('❌ Prebuild failed - could not generate or create fallback products file');
    process.exit(1);
    
  } catch (error) {
    console.error(`❌ Prebuild error: ${error.message}`);
    process.exit(1);
  }
}

// Run prebuild if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prebuild();
}

export { prebuild };