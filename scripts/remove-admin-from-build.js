#!/usr/bin/env node

/**
 * Remove Admin Panel from Production/Test Builds
 * 
 * This script runs after the build process to physically remove
 * the /admin directory from production and test builds.
 * 
 * Admin panel should ONLY exist in local development.
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

console.log(`\n🔒 Security Check: Removing Admin Panel from ${distDir}/`);
console.log(`   Environment: ${envMode}`);
console.log(`   Build Mode: ${buildMode}\n`);

// Only remove admin from production/test builds
if (envMode === 'development' || buildMode === 'local') {
  console.log('✅ Development mode - Admin panel preserved\n');
  process.exit(0);
}

const adminPath = path.join(process.cwd(), distDir, 'admin');

// Check if admin directory exists
if (fs.existsSync(adminPath)) {
  try {
    // Remove the entire admin directory recursively
    fs.rmSync(adminPath, { recursive: true, force: true });
    console.log('✅ Admin panel removed successfully');
    console.log(`   Deleted: ${adminPath}\n`);
    
    // Also remove admin route from any route manifest files
    const manifestPaths = [
      path.join(process.cwd(), distDir, '_next', 'routes-manifest.json'),
      path.join(process.cwd(), distDir, 'routes-manifest.json')
    ];
    
    manifestPaths.forEach(manifestPath => {
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          
          // Remove admin routes
          if (manifest.staticRoutes) {
            manifest.staticRoutes = manifest.staticRoutes.filter(
              route => !route.page.startsWith('/admin')
            );
          }
          if (manifest.dynamicRoutes) {
            manifest.dynamicRoutes = manifest.dynamicRoutes.filter(
              route => !route.page.startsWith('/admin')
            );
          }
          
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          console.log(`   Updated: ${path.basename(manifestPath)}`);
        } catch (e) {
          // Ignore manifest errors
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error removing admin panel:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  Admin panel not found in build (already excluded)\n');
}

console.log('🔐 Production build is secure - no admin access\n');
process.exit(0);
