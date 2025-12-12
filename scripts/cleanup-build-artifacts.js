#!/usr/bin/env node

/**
 * Cleanup Build Artifacts
 * 
 * Remove internal Next.js files that shouldn't be deployed:
 * - __next.* files (RSC internal cache)
 * - _buildManifest.js 
 * - Other Next.js internals that end up in static export
 */

const fs = require('fs');
const path = require('path');

const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';
const buildMode = process.env.BUILD_MODE || envMode;

// Determine output directory
let distDir = 'out';
if (buildMode === 'test' || envMode === 'testing') {
  distDir = 'out-test';
} else if (buildMode === 'prod' || envMode === 'production') {
  distDir = 'out-prod';
}

console.log(`\n🧹 Cleaning up build artifacts from ${distDir}/`);

const distPath = path.join(process.cwd(), distDir);

if (!fs.existsSync(distPath)) {
  console.log(`⚠️  ${distDir}/ not found - skipping cleanup\n`);
  process.exit(0);
}

// Recursively find and remove ALL __next.* files
function removeNextJsArtifacts(dir) {
  let count = 0;
  
  function walk(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recurse into subdirectories
        walk(filePath);
      } else if (file.startsWith('__next.') || file.startsWith('__next_')) {
        // Remove any __next.* or __next_* file
        try {
          fs.unlinkSync(filePath);
          const relativePath = path.relative(distPath, filePath);
          console.log(`   ✅ Removed: ${relativePath}`);
          count++;
        } catch (error) {
          console.log(`   ⚠️  Could not remove ${file}: ${error.message}`);
        }
      }
    });
  }
  
  walk(dir);
  return count;
}

const removedCount = removeNextJsArtifacts(distPath);

if (removedCount === 0) {
  console.log('   ✅ No artifacts to clean (already clean)');
} else {
  console.log(`\n   Removed ${removedCount} artifact file(s)`);
}

console.log('');
process.exit(0);
