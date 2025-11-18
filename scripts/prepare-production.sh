#!/bin/bash
# Production Build Preparation Script
# Removes admin panel and development-only files from /out directory
# Version: 2.0.0

echo "🔨 Preparing production build..."
echo ""

# Remove admin directory
if [ -d "out/admin" ]; then
  rm -rf out/admin
  echo "✅ Removed /admin directory"
else
  echo "⚠️  No /admin directory found (already clean)"
fi

# Remove admin API routes
if [ -d "out/api/admin" ]; then
  rm -rf out/api/admin
  echo "✅ Removed /api/admin routes"
else
  echo "⚠️  No /api/admin routes found (already clean)"
fi

# Remove any backup/timestamped product files
if find out/data -name "final-products-*.json" -type f -delete 2>/dev/null; then
  echo "✅ Removed backup product files"
fi

# Remove development documentation
if [ -d "out/project-docs" ]; then
  rm -rf out/project-docs
  echo "✅ Removed /project-docs directory"
fi

# Remove markdown documentation (keep README only)
find out -maxdepth 1 -name "*.md" ! -name "README.md" -type f -delete 2>/dev/null && echo "✅ Removed documentation files"

# Remove _archive folder if it exists
if [ -d "out/_archive" ]; then
  rm -rf out/_archive
  echo "✅ Removed /_archive directory"
fi

# Remove test files
find out -name "*.test.*" -type f -delete 2>/dev/null
find out -name "test-*.html" -type f -delete 2>/dev/null

# Remove Next.js build artifacts (shouldn't be in static export)
if [ -d "out/server" ]; then
  rm -rf out/server
  echo "✅ Removed /server folder (Next.js artifact)"
fi

if [ -d "out/cache" ]; then
  rm -rf out/cache
  echo "✅ Removed /cache folder"
fi

# Remove package.json from output (not needed for static site)
if [ -f "out/package.json" ]; then
  rm out/package.json
  echo "✅ Removed package.json"
fi

# Remove trace files
find out -name "*.trace" -type f -delete 2>/dev/null && echo "✅ Removed trace files"
find out -name "*.nft.json" -type f -delete 2>/dev/null && echo "✅ Removed .nft.json files"

# Verify critical production files exist
echo ""
echo "🔍 Verifying production build..."

if [ ! -f "out/index.html" ]; then
  echo "❌ ERROR: index.html not found!"
  exit 1
fi

if [ ! -d "out/products" ]; then
  echo "❌ ERROR: /products directory not found!"
  exit 1
fi

if [ ! -d "out/api" ]; then
  echo "❌ ERROR: /api directory not found!"
  exit 1
fi

echo "✅ All critical files present"
echo ""
echo "✨ Production build ready!"
echo ""
echo "📁 Safe to upload /out directory to your server"
echo "⚠️  IMPORTANT: Admin panel has been removed from build"
echo "⚠️  Remember: Update products.json via FTP, not full rebuild"
echo ""
echo "📊 Build contents:"
du -sh out/
echo ""
