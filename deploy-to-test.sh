#!/bin/bash
# Deploy to crystalkeepsakes.com/test

set -e

echo "🚀 Building for production /test subfolder..."

# Copy production env
cp .env.production.test .env.production

# Build static site
yarn build

echo "✅ Build complete!"
echo ""
echo "📦 Next steps:"
echo "1. Upload the 'out' folder contents to: /public_html/crystalkeepsakes/test"
echo "2. Upload the 'api' folder to: /public_html/crystalkeepsakes/api"
echo "3. Create .env file on server in /public_html/crystalkeepsakes/ with:"
echo "   - STRIPE_SECRET_KEY"
echo "   - COCKPIT3D_RETAILER_ID"
echo ""
echo "📂 Files to upload:"
echo "   - ./out/* -> /public_html/crystalkeepsakes/test/"
echo "   - ./api/* -> /public_html/crystalkeepsakes/api/"
echo ""
