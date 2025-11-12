# Static Products Loading Fix

## Problem
The `cockpit3d-products.js` file was showing:
- `static_products: 0`  
- `cockpit3d_products: 45`  
- `total: 45`

Static products were **NOT** being merged into the final file.

## Root Cause
The `loadStaticProducts()` method in `/app/api/cockpit3d-data-fetcher.php` had issues with:

1. **Regex pattern too greedy**: The pattern `/export\s+const\s+staticProducts\s*=\s*(\[.*?\]);/s` with non-greedy `.*?` could stop prematurely on complex nested JSON structures.

2. **No trailing comma cleanup**: JavaScript allows trailing commas like `[item1, item2,]` but JSON does not. This caused JSON parsing to fail.

3. **Limited error logging**: No debug output to identify where parsing failed.

## Fix Applied

### 1. Improved Regex Pattern
Changed from:
```php
/export\s+const\s+staticProducts\s*=\s*(\[.*?\]);/s
```

To:
```php
/export\s+const\s+staticProducts\s*=\s*(\[[\s\S]*?\]);/s
```

Using `[\s\S]*?` instead of `.*?` ensures better matching of multi-line content.

### 2. Added Trailing Comma Cleanup
```php
// Clean up trailing commas (valid in JS, invalid in JSON)
$jsonString = preg_replace('/,\s*\]/s', ']', $jsonString);
$jsonString = preg_replace('/,\s*\}/s', '}', $jsonString);
```

### 3. Enhanced Error Logging
- Added file size logging
- Added preview of extracted JSON
- Added debug file output for troubleshooting
- Added fallback alternative regex patterns

### 4. Better Path Detection
The method now checks multiple possible paths and logs each attempt.

## Testing the Fix

### Option 1: Using PHP (Recommended)
If you have MAMP or PHP server running on port 8888:

```bash
# Run the full build process
npm run build
```

This will:
1. Call `prebuild` script
2. Fetch data from `http://localhost:8888/crystalkeepsakes/api/cockpit3d-data-fetcher.php?action=generate-products`
3. Generate combined products file with BOTH static and Cockpit3D products

### Option 2: Direct PHP Call
```bash
# Call the PHP endpoint directly
curl "http://localhost:8888/crystalkeepsakes/api/cockpit3d-data-fetcher.php?action=generate-products"
```

### Option 3: Node.js Fallback (Static Only)
If PHP is not available, use the Node.js generator:

```bash
node scripts/generate-products-node.js
```

**Note**: This only merges static products. Cockpit3D products need PHP transformation.

## Verification

After running the build, check the generated file:

```bash
tail -10 src/data/cockpit3d-products.js
```

You should see:
```javascript
export const sourceInfo = {
  static_products: 2,      // ✅ Should be > 0
  cockpit3d_products: 45,  // ✅ From API
  total: 47                // ✅ Combined total
};
```

## Files Changed

1. **`/app/api/cockpit3d-data-fetcher.php`**
   - Fixed `loadStaticProducts()` method (lines 254-315)
   - Enhanced error logging and debugging
   - Added JSON cleanup for trailing commas
   - Added alternative parsing patterns

2. **`/app/scripts/generate-products-node.js`** (NEW)
   - Node.js alternative for static products
   - Useful for environments without PHP
   - Can be used as fallback during build

## Next Steps

Once static products are loading correctly, the next fixes needed are:

1. **Complete Checkout Flow**
   - Store Cockpit3D order data in Stripe Payment Intent metadata
   - Update webhook to handle `payment_intent.succeeded`
   - Send order to Cockpit3D after payment success

2. **SEO Optimization**
   - Add metadata to product pages
   - Generate sitemap.xml
   - Add robots.txt
   - Add Open Graph tags

## Deployment Notes

For production deployment:

- **Option A**: Deploy with PHP server (cPanel, shared hosting, VPS)
  - Upload `/api` folder to server
  - Ensure PHP has write permissions to `/src/data`
  - Set up .env file with Cockpit3D credentials

- **Option B**: Pre-build approach (Vercel, Netlify)
  - Run `npm run build` locally with PHP
  - Generated files are committed to repo
  - Static export deploys everywhere
  - Periodic rebuilds needed for product updates

- **Option C**: Hybrid (Recommended)
  - Deploy Next.js to Vercel/Netlify
  - Deploy PHP API to separate subdomain (api.yourdomain.com)
  - Use CORS to connect them
  - Best of both worlds: serverless frontend, PHP backend
