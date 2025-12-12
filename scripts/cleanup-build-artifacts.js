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

// Files to remove (these are Next.js internals that shouldn't be deployed)
const filesToRemove = [
  '__next.__PAGE__.txt',
  '__next._full.txt',
  '__next._head.txt',
  '__next._index.txt',
  '__next._tree.txt',
];

let removedCount = 0;

filesToRemove.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`   ✅ Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`   ⚠️  Could not remove ${file}: ${error.message}`);
    }
  }
});

if (removedCount === 0) {
  console.log('   ✅ No artifacts to clean (already clean)');
} else {
  console.log(`\n   Removed ${removedCount} artifact file(s)`);
}

console.log('');
process.exit(0);
