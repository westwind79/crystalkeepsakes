// scripts/copy-api.js
// Copies /api folder into appropriate /out directory after Next.js build

const fs = require('fs-extra');
const path = require('path');

const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';

// Determine output directory based on environment
const getOutDir = () => {
  if (process.env.BUILD_MODE === 'test' || envMode === 'testing') return 'out-test';
  if (process.env.BUILD_MODE === 'prod' || envMode === 'production') return 'out-prod';
  return 'out';
};

const apiSource = path.join(__dirname, '..', 'api');
const outDir = path.join(__dirname, '..', getOutDir());
const apiDest = path.join(outDir, 'api');

async function copyApi() {
  try {
    console.log(`\n📂 Copying API files to /${getOutDir()}/...`);
    
    // Ensure out directory exists
    if (!await fs.pathExists(outDir)) {
      console.error(`❌ Output directory not found: ${outDir}`);
      console.error('   Did Next.js build succeed?');
      process.exit(1);
    }
    
    // Copy api folder
    if (await fs.pathExists(apiSource)) {
      await fs.copy(apiSource, apiDest, {
        overwrite: true,
        filter: (src) => {
          // Exclude log files and cache
          return !src.includes('.log') && !src.includes('node_modules');
        }
      });
      console.log(`✅ API folder copied to /${getOutDir()}/api`);
    } else {
      console.warn('⚠️  /api folder not found in project root');
    }
    
    // Copy vendor folder (Stripe library)
    const vendorSource = path.join(__dirname, '..', 'vendor');
    const vendorDest = path.join(outDir, 'vendor');
    
    if (await fs.pathExists(vendorSource)) {
      await fs.copy(vendorSource, vendorDest, { overwrite: true });
      console.log(`✅ Vendor folder copied to /${getOutDir()}/vendor`);
    }
    
    // Copy correct .htaccess based on environment
    const isTest = envMode === 'testing';
    const htaccessSource = isTest
      ? path.join(__dirname, '..', '_htaccess.production')  // Both use same for now
      : path.join(__dirname, '..', '_htaccess.production');
    const htaccessDest = path.join(outDir, '.htaccess');
    
    if (await fs.pathExists(htaccessSource)) {
      await fs.copy(htaccessSource, htaccessDest, { overwrite: true });
      console.log(`✅ Copied .htaccess to /${getOutDir()}/.htaccess`);
    } else {
      console.warn('⚠️  .htaccess file not found');
    }
    
    console.log(`\n✨ Build prepared in /${getOutDir()}/`);
    
  } catch (error) {
    console.error('❌ Error copying files:', error);
    process.exit(1);
  }
}

copyApi();