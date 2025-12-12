const fs = require('fs-extra');
const path = require('path');

const mode = process.argv[2]; // 'test', 'prod', or 'local'

// Configuration for each build mode
const configs = {
  test: {
    targetOut: 'out-test',
    env: '.env.production.test',
    htaccess: '_htaccess.production.test',  // ✅ Your actual file
    basePath: '/test',
    stripeKeys: 'TEST (sk_test_...)',
    uploadTo: '/public_html/crystalkeepsakes.com/test/',
    url: 'https://crystalkeepsakes.com/test'
  },
  prod: {
    targetOut: 'out-prod',
    env: '.env.production',
    htaccess: '_htaccess.production',  // ✅ Your actual file
    basePath: '',
    stripeKeys: 'LIVE (sk_live_...)',
    uploadTo: '/public_html/crystalkeepsakes.com/',
    url: 'https://crystalkeepsakes.com'
  },
  local: {
    targetOut: 'out',
    env: '.env',
    htaccess: '_htaccess.local',  // ✅ Your actual file
    basePath: '',
    stripeKeys: 'TEST (sk_test_...)',
    uploadTo: 'N/A - Served by MAMP',
    url: 'http://localhost:8888/crystalkeepsakes/'
  }
};

const config = configs[mode];

if (!config) {
  console.error('\n❌ Invalid mode. Use: test, prod, or local\n');
  console.error('Examples:');
  console.error('  node scripts/prepare-build.js test');
  console.error('  node scripts/prepare-build.js prod');
  console.error('  node scripts/prepare-build.js local\n');
  process.exit(1);
}

console.log(`\n🔨 Preparing ${mode.toUpperCase()} build...\n`);

try {
  // Step 1: Verify build output exists
  // Next.js now builds directly to targetOut (via next.config.ts distDir)
  if (!fs.existsSync(config.targetOut)) {
    throw new Error(`Build output ${config.targetOut}/ not found. Did next build succeed?`);
  }
  
  console.log(`  ✅ Build output found: ${config.targetOut}/`);

  // Step 2: Copy API files
  // Check if API is in public/api or root /api
  const publicApiSource = path.join('public', 'api');
  const rootApiSource = 'api';
  const apiDest = path.join(config.targetOut, 'api');

  let apiCopied = false;

  // Try public/api first
  if (fs.existsSync(publicApiSource)) {
    fs.copySync(publicApiSource, apiDest, { overwrite: true });
    console.log(`  ✅ Copied API files from public/api/ → ${config.targetOut}/api/`);
    apiCopied = true;
  }
  // Then try root /api
  else if (fs.existsSync(rootApiSource)) {
    fs.copySync(rootApiSource, apiDest, { overwrite: true });
    console.log(`  ✅ Copied API files from api/ → ${config.targetOut}/api/`);
    apiCopied = true;
  }

  if (!apiCopied) {
    console.log(`  ⚠️  No API folder found (checked public/api/ and api/)`);
  }

  // Step 3: Copy .htaccess
  if (fs.existsSync(config.htaccess)) {
    const htaccessDest = path.join(config.targetOut, '.htaccess');
    fs.copyFileSync(config.htaccess, htaccessDest);
    console.log(`  ✅ Copied ${config.htaccess} → ${config.targetOut}/.htaccess`);
  } else {
    console.log(`  ⚠️  ${config.htaccess} not found - build will work without it`);
  }

  // Step 4: Copy vendor/ folder (for PHP dependencies)
  const vendorSource = 'vendor';
  const vendorDest = path.join(config.targetOut, 'vendor');
  
  if (fs.existsSync(vendorSource)) {
    fs.copySync(vendorSource, vendorDest, { overwrite: true });
    console.log(`  ✅ Copied vendor/ → ${config.targetOut}/vendor/`);
  } else if (mode !== 'local') {
    console.log(`  ⚠️  vendor/ folder not found - run 'composer install' if using Stripe`);
  }

  // Step 5: Copy .env file to build output
  // This .env will be used by the PHP backend on the server
  if (fs.existsSync(config.env)) {
    // Copy as .env (the actual file the server will use)
    const envDest = path.join(config.targetOut, '.env');
    fs.copyFileSync(config.env, envDest);
    console.log(`  ✅ Copied ${config.env} → ${config.targetOut}/.env`);
    
    // Also create .env.example for reference
    const envExample = path.join(config.targetOut, '.env.example');
    fs.copyFileSync(config.env, envExample);
    console.log(`  ✅ Created .env.example (backup reference)`);
  } else {
    console.log(`  ⚠️  ${config.env} not found - you'll need to create .env on server manually`);
  }

  // Step 6: Create deployment instructions
  const deployInstructions = `
╔════════════════════════════════════════════════════════════════╗
║                  DEPLOYMENT INSTRUCTIONS                        ║
║                  ${mode.toUpperCase()} BUILD                                        ║
╚════════════════════════════════════════════════════════════════╝

📦 BUILD INFO:
   Mode:        ${mode}
   Folder:      ${config.targetOut}/
   Base Path:   ${config.basePath || '(root)'}
   URL:         ${config.url}

📤 UPLOAD INSTRUCTIONS:
   1. Upload ALL files from ${config.targetOut}/ to:
      ${config.uploadTo}

   2. DO NOT UPLOAD:
      - .env.example (this is just a reference)

   3. CREATE .env on server manually with:
      ${config.stripeKeys} Stripe keys

🔐 ENVIRONMENT VARIABLES:
   Create this file on server: ${config.uploadTo}.env

   Required contents:
   ┌─────────────────────────────────────────────────────────┐
   │ NEXT_PUBLIC_ENV_MODE=${mode === 'prod' ? 'production' : 'testing'}                      │
   │ NEXT_PUBLIC_BASE_PATH=${config.basePath}                            │
   │ NEXT_PUBLIC_PHP_BACKEND_URL=${config.url}  │
   │                                                           │
   │ # Stripe Keys - ${config.stripeKeys}             │
   ${mode === 'prod' ? '│ STRIPE_SECRET_KEY=sk_live_YOUR_KEY                    │' : '│ STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_KEY       │'}
   ${mode === 'prod' ? '│ NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_... │' : '│ NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=...  │'}
   │                                                           │
   │ # Database (if using)                                    │
   │ DB_HOST=localhost                                        │
   │ DB_NAME=your_database                                    │
   │ DB_USER=your_user                                        │
   │ DB_PASS=your_password                                    │
   └─────────────────────────────────────────────────────────┘

🧪 TESTING CHECKLIST:
   ${mode === 'test' ? '☐ Test checkout with Stripe test card: 4242 4242 4242 4242' : '☐ Test with REAL payment (small amount)'}
   ☐ Verify images load correctly
   ☐ Check contact form works
   ☐ Verify order confirmation email
   ${mode === 'prod' ? '☐ Check SSL certificate is valid' : '☐ Verify /test is password protected (optional)'}

⚠️  SAFETY REMINDERS:
   ${mode === 'prod' ? '• Using LIVE Stripe keys - real charges will occur!' : '• Using TEST Stripe keys - no real charges'}
   • Double-check you're uploading to: ${config.uploadTo}
   • Create .env with ${config.stripeKeys} keys
   ${mode === 'prod' ? '• BACKUP production before uploading!' : '• Test thoroughly before moving to production'}

📋 DEPLOYMENT CHECKLIST:
   ☐ Uploaded all files from ${config.targetOut}/
   ☐ Created .env on server with ${config.stripeKeys} keys
   ☐ Set file permissions: chmod 644 .env
   ☐ Verified ${config.url} loads correctly
   ☐ Tested complete checkout flow
   ${mode === 'prod' ? '☐ Monitored for errors after deployment' : '☐ Ready to deploy to production'}

───────────────────────────────────────────────────────────────

Generated: ${new Date().toISOString()}
Build Mode: ${mode}
Next Steps: Upload ${config.targetOut}/ to ${config.uploadTo}
`;

  fs.writeFileSync(
    path.join(config.targetOut, 'DEPLOY.txt'),
    deployInstructions
  );
  console.log(`  ✅ Created DEPLOY.txt with instructions`);

  // Step 7: Create a safety marker file
  const safetyMarker = {
    buildMode: mode,
    buildDate: new Date().toISOString(),
    uploadTo: config.uploadTo,
    stripeKeysType: config.stripeKeys,
    url: config.url,
    htaccessUsed: config.htaccess,
    warning: mode === 'prod' 
      ? '⚠️  PRODUCTION BUILD - Use LIVE Stripe keys!' 
      : 'TEST BUILD - Use TEST Stripe keys'
  };

  fs.writeFileSync(
    path.join(config.targetOut, 'build-info.json'),
    JSON.stringify(safetyMarker, null, 2)
  );
  console.log(`  ✅ Created build-info.json`);

  // Success message
  console.log(`\n✅ ${mode.toUpperCase()} build ready!\n`);
  console.log(`📁 Location: ${config.targetOut}/`);
  console.log(`📋 Instructions: ${config.targetOut}/DEPLOY.txt\n`);
  
  if (mode !== 'local') {
    console.log(`⚡ NEXT STEPS:`);
    console.log(`   1. Review: cat ${config.targetOut}/DEPLOY.txt`);
    console.log(`   2. Upload: ${config.targetOut}/ → ${config.uploadTo}`);
    console.log(`   3. Create .env on server with ${config.stripeKeys} keys`);
    console.log(`   4. Test: ${config.url}\n`);
  } else {
    console.log(`⚡ NEXT STEPS:`);
    console.log(`   1. MAMP will serve from: ${config.targetOut}/`);
    console.log(`   2. Visit: ${config.url}\n`);
  }

} catch (error) {
  console.error(`\n❌ Build preparation failed:`);
  console.error(`   ${error.message}\n`);
  process.exit(1);
}