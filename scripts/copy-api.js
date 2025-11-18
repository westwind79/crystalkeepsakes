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
    const isTest = process.env.NEXT_PUBLIC_BASE_PATH === '/test';
    const htaccessSource = isTest
      ? path.join(__dirname, '..', 'public', '.htaccess')
      : path.join(__dirname, '..', '.htaccess.production');
    const htaccessDest = path.join(outDir, '.htaccess');
    
    await fs.copy(htaccessSource, htaccessDest, { overwrite: true });
    console.log(`✅ Copied ${isTest ? 'public/.htaccess (test)' : '.htaccess.production'} to /out/.htaccess`);
    
  } catch (error) {
    console.error('❌ Error copying API folder:', error);
    process.exit(1);
  }
}

copyApi();
