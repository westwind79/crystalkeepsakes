#!/usr/bin/env node
// scripts/safe-build.js
// Wrapper for Next.js build that handles Windows file lock issues

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'local'; // test, prod, or local

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
    envFile: '.env.local',
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

// Step 3: Run Next.js build
console.log('📋 Step 3: Running Next.js build...\n');

try {
  // Build command - Next.js will automatically load the correct .env file
  // For test mode: .env.production.test
  // For prod mode: .env.production
  // For local mode: .env.local
  
  const buildCmd = 'next build';
  
  console.log(`   Command: ${buildCmd}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Mode: ${process.env.NEXT_PUBLIC_ENV_MODE}\n`);
  
  execSync(buildCmd, {
    stdio: 'inherit',
    shell: true,
    env: process.env  // Pass current environment with loaded vars
  });
  
  console.log('\n✅ Build completed successfully!\n');
  
  // Step 4: Run post-build cleanup scripts
  console.log('📋 Step 4: Running post-build cleanup...\n');
  
  // 4a. Remove admin panel (security)
  try {
    console.log('   🔒 Removing admin panel...');
    execSync('node scripts/remove-admin-from-build.js', {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
  } catch (err) {
    console.error('   ⚠️  Admin removal failed:', err.message);
  }
  
  // 4b. Clean up Next.js internal artifacts
  try {
    console.log('   🧹 Cleaning build artifacts...');
    execSync('node scripts/cleanup-build-artifacts.js', {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
  } catch (err) {
    console.error('   ⚠️  Artifact cleanup failed:', err.message);
  }
  
  // 4c. Prepare final deployment
  try {
    console.log('   📦 Preparing deployment files...');
    execSync(`node scripts/prepare-build.js ${mode}`, {
      stdio: 'inherit',
      shell: true,
      env: process.env
    });
  } catch (err) {
    console.error('   ⚠️  Deployment prep failed:', err.message);
  }
  
} catch (err) {
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
  
  process.exit(1);
}

// Step 4: Run prepare-build script
console.log('📋 Step 4: Preparing build output...\n');

try {
  execSync(`node scripts/prepare-build.js ${mode}`, {
    stdio: 'inherit',
    shell: true
  });
  
  console.log('\n✅ Build preparation complete!\n');
  
} catch (err) {
  console.error('\n⚠️  Build preparation had issues, but build files exist.\n');
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
