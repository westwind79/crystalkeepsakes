// scripts/copy-with-retry.js
// Handles Windows file lock issues during build by retrying locked files
const fs = require('fs-extra');
const path = require('path');

/**
 * Copy file with retry logic for Windows file locks
 * @param {string} src Source file path
 * @param {string} dest Destination file path
 * @param {number} maxRetries Maximum number of retries
 * @param {number} delay Delay between retries in ms
 */
async function copyWithRetry(src, dest, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure destination directory exists
      await fs.ensureDir(path.dirname(dest));
      
      // Try to copy
      await fs.copyFile(src, dest);
      
      return true; // Success
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'EBUSY') {
        if (attempt < maxRetries) {
          console.log(`  ⚠️  File locked (attempt ${attempt}/${maxRetries}): ${path.basename(src)}`);
          console.log(`     Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log(`  ❌ Failed to copy after ${maxRetries} attempts: ${path.basename(src)}`);
          console.log(`     Error: ${err.message}`);
          console.log(`     This file will be skipped (likely uploaded during build)`);
          return false; // Failed after all retries
        }
      } else {
        // Other error, throw it
        throw err;
      }
    }
  }
  
  return false;
}

/**
 * Copy directory with retry logic for locked files
 */
async function copyDirWithRetry(srcDir, destDir, options = {}) {
  const { maxRetries = 3, delay = 1000, skipRecent = true } = options;
  
  if (!fs.existsSync(srcDir)) {
    console.log(`  ⚠️  Source directory not found: ${srcDir}`);
    return { copied: 0, skipped: 0, failed: 0 };
  }
  
  await fs.ensureDir(destDir);
  
  let stats = { copied: 0, skipped: 0, failed: 0 };
  const now = Date.now();
  const recentThreshold = 5000; // 5 seconds
  
  async function copyRecursive(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await copyRecursive(srcPath, destPath);
      } else {
        // Check if file is very recent (might be locked)
        if (skipRecent) {
          try {
            const stat = await fs.stat(srcPath);
            const age = now - stat.mtimeMs;
            
            if (age < recentThreshold) {
              console.log(`  ⏭️  Skipping recently modified file: ${path.relative(srcDir, srcPath)} (${Math.round(age)}ms old)`);
              stats.skipped++;
              continue;
            }
          } catch (err) {
            // If we can't stat it, try to copy anyway
          }
        }
        
        const success = await copyWithRetry(srcPath, destPath, maxRetries, delay);
        if (success) {
          stats.copied++;
        } else {
          stats.failed++;
        }
      }
    }
  }
  
  await copyRecursive(srcDir, destDir);
  
  return stats;
}

module.exports = { copyWithRetry, copyDirWithRetry };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('\nUsage: node copy-with-retry.js <source> <destination>\n');
    process.exit(1);
  }
  
  const [src, dest] = args;
  
  (async () => {
    try {
      console.log(`\n🔄 Copying with retry logic...\n`);
      console.log(`  Source: ${src}`);
      console.log(`  Destination: ${dest}\n`);
      
      if (fs.statSync(src).isDirectory()) {
        const stats = await copyDirWithRetry(src, dest, { skipRecent: true });
        console.log(`\n✅ Copy complete:`);
        console.log(`   Copied: ${stats.copied} files`);
        console.log(`   Skipped: ${stats.skipped} files (recently modified)`);
        console.log(`   Failed: ${stats.failed} files (locked after retries)\n`);
      } else {
        const success = await copyWithRetry(src, dest);
        if (success) {
          console.log(`\n✅ File copied successfully\n`);
        } else {
          console.log(`\n❌ File copy failed\n`);
          process.exit(1);
        }
      }
    } catch (err) {
      console.error(`\n❌ Error: ${err.message}\n`);
      process.exit(1);
    }
  })();
}
