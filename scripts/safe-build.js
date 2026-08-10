#!/usr/bin/env node
// scripts/safe-build.js
// Wrapper for Next.js build that handles Windows file lock issues

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const projectRoot = path.join(__dirname, '..');

const mode = process.argv[2] || 'local'; // test, prod, or local
const shouldExcludeAdmin = mode === 'test' || mode === 'prod';
const excludedRouteMoves = [
  {
    label: 'admin page',
    source: path.join(__dirname, '../src/app/admin'),
    hidden: path.join(__dirname, '../.build-excluded/admin')
  }
];

console.log(`\n🔨 Starting SAFE build for ${mode.toUpperCase()} mode\n`);

// Step 1: Close any file handles that might be locking files
console.log('📋 Step 1: Checking for locked files...\n');

// Get list of recently modified files in public/img/products/
const productsDir = path.join(__dirname, '../public/img/products/cockpit3d');
const now = Date.now();
const recentThreshold = 10000; // 10 seconds

let recentFiles = [];

function findRecentFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      findRecentFiles(fullPath);
    } else {
      try {
        const stats = fs.statSync(fullPath);
        const age = now - stats.mtimeMs;
        
        if (age < recentThreshold) {
          recentFiles.push({
            path: fullPath,
            age: Math.round(age),
            name: path.basename(fullPath)
          });
        }
      } catch (err) {
        // Skip files we can't stat
      }
    }
  }
}

findRecentFiles(productsDir);

if (recentFiles.length > 0) {
  console.log(`⚠️  Found ${recentFiles.length} recently modified file(s):\n`);
  recentFiles.forEach(f => {
    console.log(`   - ${f.name} (modified ${f.age}ms ago)`);
  });
  console.log(`\n⏳ Waiting 3 seconds for file locks to release...\n`);
  
  // Wait for locks to release
  execSync('timeout /t 3 /nobreak', { stdio: 'inherit', shell: true });
} else {
  console.log('✅ No recently modified files found\n');
}

// Step 2: Set environment variables for build
console.log('📋 Step 2: Setting build environment...\n');

const buildModes = {
  test: {
    envFile: '.env.production.test',
    BUILD_MODE: 'test',
    NEXT_PUBLIC_BASE_PATH: '/test',
    NEXT_PUBLIC_ENV_MODE: 'testing',
    NODE_ENV: 'production'  // Next.js needs this set to 'production' for builds
  },
  prod: {
    envFile: '.env.production',
    BUILD_MODE: 'prod',
    NEXT_PUBLIC_BASE_PATH: '',
    NEXT_PUBLIC_ENV_MODE: 'production',
    NODE_ENV: 'production'
  },
  local: {
    envFile: '.env',
    BUILD_MODE: 'local',
    NEXT_PUBLIC_BASE_PATH: '',
    NEXT_PUBLIC_ENV_MODE: 'development',
    NODE_ENV: 'development'
  }
};

const config = buildModes[mode];

if (!config) {
  console.error('❌ Invalid mode. Use: test, prod, or local\n');
  process.exit(1);
}

// Check if the required env file exists
const envFilePath = path.join(__dirname, '..', config.envFile);
if (!fs.existsSync(envFilePath)) {
  console.error(`❌ Error: ${config.envFile} not found!\n`);
  console.error(`   Expected at: ${envFilePath}\n`);
  console.error(`   Please create this file with your environment variables.\n`);
  console.error(`   You can copy from .env.example and customize.\n`);
  process.exit(1);
}

console.log(`   ✅ Using env file: ${config.envFile}`);
console.log(`   📍 Location: ${envFilePath}\n`);

// Load environment variables from the specific file
const envContent = fs.readFileSync(envFilePath, 'utf8');
const envLines = envContent.split('\n');
let loadedVars = 0;

envLines.forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return;
  
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
    process.env[key] = value;
    loadedVars++;
    
    // Only show NEXT_PUBLIC_ variables for security
    if (key.startsWith('NEXT_PUBLIC_')) {
      console.log(`   ${key}=${value}`);
    }
  }
});

console.log(`\n   Loaded ${loadedVars} environment variables from ${config.envFile}\n`);

// Apply additional build-specific variables
const { envFile, ...buildVars } = config;
Object.keys(buildVars).forEach(key => {
  process.env[key] = buildVars[key];
  console.log(`   ${key}=${buildVars[key]}`);
});

console.log('');

function movePathForBuild(move) {
  // Build-only exclusion: hide local admin routes before Next scans src/app.
  if (!fs.existsSync(move.source)) return false;

  // Keep hidden admin code outside src/app and outside TypeScript's build surface.
  fs.mkdirSync(path.dirname(move.hidden), { recursive: true });

  if (fs.existsSync(move.hidden)) {
    throw new Error(`Cannot exclude ${move.label}: temporary path already exists at ${move.hidden}`);
  }

  fs.renameSync(move.source, move.hidden);
  console.log(`   🔒 Excluded ${move.label} from build`);
  return true;
}

function restorePathAfterBuild(move, wasMoved) {
  // Always restore the source tree so local development keeps /admin available.
  if (!wasMoved) return;

  if (fs.existsSync(move.source)) {
    throw new Error(`Cannot restore ${move.label}: source path already exists at ${move.source}`);
  }

  fs.renameSync(move.hidden, move.source);
  console.log(`   🔓 Restored ${move.label}`);
}

function removeEmptyBuildExclusionDir() {
  // Remove the temporary parent when all excluded routes have been restored.
  const tempRoot = path.join(__dirname, '../.build-excluded');
  if (fs.existsSync(tempRoot) && fs.readdirSync(tempRoot).length === 0) {
    fs.rmdirSync(tempRoot);
  }
}

function runRequiredStep(label, command) {
  // Production packaging steps are required; a failure must fail the build.
  console.log(`   ${label}...`);
  execSync(command, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
    cwd: projectRoot
  });
}

// Step 3: Run Next.js build
console.log('📋 Step 3: Running Next.js build...\n');

const movedRoutes = new Map();
let buildFailed = false;

try {
  // Clear .next cache to ensure clean build
  const nextCacheDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextCacheDir)) {
    console.log('   🧹 Clearing .next cache...');
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
  }
  
  if (shouldExcludeAdmin) {
    console.log('   🔒 Excluding local-only admin routes before build...');
    excludedRouteMoves.forEach(move => {
      movedRoutes.set(move.label, movePathForBuild(move));
    });
  }
  
  runRequiredStep('Validating product data', 'node scripts/validate-product-data.js');

  const nextBin = process.platform === 'win32'
    ? path.join(projectRoot, 'node_modules', '.bin', 'next.cmd')
    : path.join(projectRoot, 'node_modules', '.bin', 'next');
  const buildCmd = `"${nextBin}" build`;
  
  console.log(`\n   Command: ${buildCmd}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Mode: ${process.env.NEXT_PUBLIC_ENV_MODE}\n`);
  
  execSync(buildCmd, {
    stdio: 'inherit',
    shell: true,
    env: process.env,
    cwd: projectRoot
  });
  
  console.log('\n✅ Build completed successfully!\n');
  
  // Step 4: Run post-build cleanup scripts
  console.log('📋 Step 4: Running post-build cleanup...\n');
  
  // 4a. Verify admin panel was never emitted into production/test output.
  runRequiredStep('🔒 Verifying admin routes are absent', 'node scripts/verify-admin-excluded.js');
  
  // 4b. Clean up Next.js internal artifacts
  runRequiredStep('🧹 Cleaning build artifacts', 'node scripts/cleanup-build-artifacts.js');
  
  // 4c. Prepare final deployment
  runRequiredStep('📦 Preparing deployment files', `node scripts/prepare-build.js ${mode}`);
  
} catch (err) {
  buildFailed = true;
  console.error(`   ${err.message}\n`);
  console.error('\n❌ Build failed!\n');
  
  // Check if it's a file lock error
  if (err.message.includes('EPERM') || err.message.includes('EBUSY')) {
    console.error('⚠️  This appears to be a Windows file lock issue.\n');
    console.error('Possible solutions:\n');
    console.error('1. Close any programs that might be accessing the files (file explorer, antivirus, etc.)\n');
    console.error('2. Wait a few seconds and run the build again\n');
    console.error('3. Don\'t build immediately after uploading files in the admin panel\n');
    console.error('4. Run this command to retry: node scripts/safe-build.js ' + mode + '\n');
  }
} finally {
  if (shouldExcludeAdmin) {
    console.log('\n📋 Restoring build-excluded source routes...\n');
    [...excludedRouteMoves].reverse().forEach(move => {
      restorePathAfterBuild(move, movedRoutes.get(move.label));
    });
    removeEmptyBuildExclusionDir();
  }
}

if (buildFailed) {
  // Exit only after finally restores any temporarily hidden source routes.
  process.exit(1);
}

// Step 5: Summary
const distDirs = {
  test: 'out-test',
  prod: 'out-prod',
  local: 'out'
};

const distDir = distDirs[mode];

console.log('╔════════════════════════════════════════════════════╗');
console.log('║              BUILD COMPLETE                        ║');
console.log('╠════════════════════════════════════════════════════╣');
console.log(`║ Mode:        ${mode.toUpperCase().padEnd(38)} ║`);
console.log(`║ Output Dir:  ${distDir.padEnd(38)}  ║`);
console.log(`║ Files Ready: ✅${' '.repeat(37)}║`);
console.log('╚════════════════════════════════════════════════════╝');
console.log('');

if (mode === 'test' || mode === 'prod') {
  console.log('📤 Next steps:');
  console.log(`   1. Upload contents of ${distDir}/ to your server`);
  console.log('   2. Verify .htaccess is in place');
  console.log('   3. Test the deployment\n');
}
