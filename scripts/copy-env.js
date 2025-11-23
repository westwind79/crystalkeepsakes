// scripts/copy-env.js
// Cross-platform script to copy .env files to /out or /out-test

const fs = require('fs');
const path = require('path');

// Determine which env file to copy based on command line argument
const envFile = process.argv[2] || '.env.production';
const sourcePath = path.join(__dirname, '..', envFile);

// Determine target directory based on env file
// If it's .env.production.test, copy to out-test, otherwise to out
const isTestBuild = envFile.includes('.test');
const targetDir = path.join(__dirname, '..', isTestBuild ? 'out-test' : 'out');
const targetPath = path.join(targetDir, '.env');

try {
  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${envFile}`);
    process.exit(1);
  }

  // Create out directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(sourcePath, targetPath);
  const outputDir = isTestBuild ? 'out-test' : 'out';
  console.log(`✅ Copied ${envFile} to ${outputDir}/.env`);
} catch (error) {
  console.error(`❌ Error copying env file:`, error.message);
  process.exit(1);
}
