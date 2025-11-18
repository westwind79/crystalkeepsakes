// scripts/copy-api.js
// Copies /api folder into /out after Next.js build

const fs = require('fs-extra');
const path = require('path');

const apiSource = path.join(__dirname, '..', 'api');
const outDir = path.join(__dirname, '..', 'out');
const apiDest = path.join(outDir, 'api');

async function copyApi() {
  try {
    console.log('📁 Copying /api folder to /out...');
    
    // Ensure out directory exists
    await fs.ensureDir(outDir);
    
    // Copy api folder
    await fs.copy(apiSource, apiDest, {
      overwrite: true,
      filter: (src) => {
        // Exclude log files and cache
        return !src.includes('.log') && !src.includes('node_modules');
      }
    });
    
    console.log('✅ API folder copied to /out/api');
    
    // Copy correct .htaccess based on environment
    const isProduction = process.env.NEXT_PUBLIC_BASE_PATH === '';
    const htaccessSource = isProduction 
      ? path.join(__dirname, '..', 'public', '.htaccess.production')
      : path.join(__dirname, '..', 'public', '.htaccess');
    const htaccessDest = path.join(outDir, '.htaccess');
    
    await fs.copy(htaccessSource, htaccessDest, { overwrite: true });
    console.log(`✅ Copied ${isProduction ? '.htaccess.production' : '.htaccess'} to /out/.htaccess`);
    
  } catch (error) {
    console.error('❌ Error copying API folder:', error);
    process.exit(1);
  }
}

copyApi();
