#!/bin/bash
# Production Build Script - Excludes Admin Panel
# This script temporarily moves admin folder, builds, then restores it
# Version: 1.0.0

set -e  # Exit on error

echo "🚀 Starting production build (excluding admin panel)..."
echo ""

# Step 1: Backup admin folder
echo "📦 Step 1: Backing up admin panel..."
if [ -d "src/app/admin" ]; then
  mv src/app/admin src/app/admin.backup
  echo "✅ Admin panel backed up to admin.backup"
else
  echo "⚠️  Admin panel not found, skipping backup"
fi

# Step 2: Build the site
echo ""
echo "🔨 Step 2: Building Next.js site..."
if [ -f ".env.production.root" ]; then
  env-cmd -f .env.production.root next build
else
  next build
fi
echo "✅ Build complete"

# Step 3: Restore admin folder
echo ""
echo "📦 Step 3: Restoring admin panel..."
if [ -d "src/app/admin.backup" ]; then
  mv src/app/admin.backup src/app/admin
  echo "✅ Admin panel restored"
fi

# Step 4: Run cleanup script
echo ""
echo "🧹 Step 4: Running cleanup script..."
bash scripts/prepare-production.sh

# Step 5: Copy API files and environment
echo ""
echo "📋 Step 5: Copying API files..."
if [ -f "scripts/copy-api.js" ]; then
  node scripts/copy-api.js
  echo "✅ API files copied"
fi

if [ -f "scripts/copy-env.js" ] && [ -f ".env.production.root" ]; then
  node scripts/copy-env.js .env.production.root
  echo "✅ Environment files copied"
fi

echo ""
echo "✨ Production build complete!"
echo ""
echo "📁 Output directory: /out"
echo "⚠️  Admin panel excluded from build"
echo "✅ Ready to upload to server"
echo ""
