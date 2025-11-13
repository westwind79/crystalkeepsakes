#!/bin/bash
# Deploy to crystalkeepsakes.com/test

set -e

echo "🚀 Building for production /test subfolder..."

# Copy production env
cp .env.production.test .env.production

# Build static site with basePath
NEXT_PUBLIC_BASE_PATH=/test \
NEXT_PUBLIC_ENV_MODE=production \
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test \
yarn build

# Copy .env.production to output for PHP backend
cp .env.production out/.env

echo ""
echo "✅ Build complete!"
echo "📊 BasePath configured: /test"
echo "🔍 Checking asset paths..."
grep -o '"/_next/' out/index.html > /dev/null && echo "⚠️  WARNING: Assets still pointing to root /_next/" || echo "✓ Assets correctly prefixed"

echo "✅ Build complete!"
echo ""
echo "📦 Next steps:"
echo "1. Upload the 'out' folder to server"
echo "2. Create .env file on server with Stripe keys"
echo ""
echo "📂 Upload instructions:"
echo "   ./out/* -> /public_html/crystalkeepsakes/test/"
echo ""
echo "⚠️  Note: API folder is included in ./out/api/"
echo ""
echo "🔐 Create .env in /public_html/crystalkeepsakes/.env with:"
echo "   STRIPE_SECRET_KEY=sk_test_xxxxx"
echo "   COCKPIT3D_RETAILER_ID=256568874"
echo ""
