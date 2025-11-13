#!/bin/bash
# Deploy to crystalkeepsakes.com/test

set -e

echo "🚀 Building for production /test subfolder..."

# Copy production env
cp .env.production.test .env.production

# Export env vars for build
export $(cat .env.production | grep -v '^#' | xargs)

# Build static site
yarn build

# Copy .env.production to output
cp .env.production out/.env

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
