#!/bin/bash
# Production Build Prep
# Removes admin panel from /out directory

echo "🔨 Preparing production build..."

# Remove admin directory
if [ -d "out/admin" ]; then
  rm -rf out/admin
  echo "✅ Removed /admin directory"
fi

# Remove admin API routes
if [ -d "out/api/admin" ]; then
  rm -rf out/api/admin
  echo "✅ Removed /api/admin routes"
fi

# Remove any backup/timestamped product files
find out/data -name "final-products-*.json" -type f -delete 2>/dev/null && echo "✅ Removed backup product files"

echo "✨ Production build ready!"
echo "📁 Upload /out directory to your server"
echo "⚠️  Remember: Update products.json via FTP, not full rebuild"
