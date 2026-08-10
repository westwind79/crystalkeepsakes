#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';
const buildMode = process.env.BUILD_MODE || envMode;

// Keep local builds flexible; only deployed builds must prove admin is absent.
if (envMode === 'development' || buildMode === 'local') {
  console.log('   ✅ Development/local build - admin verification skipped');
  process.exit(0);
}

let distDir = 'out';
if (buildMode === 'test' || envMode === 'testing') {
  distDir = 'out-test';
} else if (buildMode === 'prod' || envMode === 'production') {
  distDir = 'out-prod';
}

const distPath = path.join(process.cwd(), distDir);
const forbiddenPaths = [
  path.join(distPath, 'admin'),
  path.join(distPath, 'api', 'admin')
];

// Verification replaces deletion: production should never emit admin output.
const leakedPaths = forbiddenPaths.filter(candidate => fs.existsSync(candidate));

if (leakedPaths.length > 0) {
  console.error('\n❌ Admin route leak detected in build output:');
  leakedPaths.forEach(leakedPath => console.error(`   - ${leakedPath}`));
  process.exit(1);
}

console.log(`   ✅ Admin routes absent from ${distDir}/`);
