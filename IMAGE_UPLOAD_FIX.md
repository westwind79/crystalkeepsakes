# Image Upload Fix - Product Gallery Issue Resolved

## Problem Identified
Images were being uploaded via the admin panel but not displaying on the website.

### Root Cause
1. **PHP Backend Missing**: The admin panel was configured to upload images to a PHP script (`/api/upload-image.php`), but:
   - No PHP server was running in the environment
   - Environment variable `NEXT_PUBLIC_PHP_BACKEND_URL` was not configured
   - This caused uploads to fail silently or save incorrectly

2. **Dual Data Sources**: Confusion between:
   - `/public/data/final-products.json` ← Frontend reads from HERE ✅
   - `/src/data/*.js` ← Old backup files, not used by frontend ⚠️

## Solution Implemented

### 1. Created Next.js Image Upload API
**New File**: `/app/src/app/api/admin/upload-image/route.ts`

This replaces the PHP upload script with a Next.js API route that:
- Runs in development mode only (security)
- Handles multipart form data (images)
- Validates file types (JPG, PNG, GIF, WebP)
- Validates file size (max 10MB)
- Saves to correct location: `/public/img/products/cockpit3d/{productId}/`
- Returns proper JSON response with image URL

### 2. Updated Admin Panel
**Modified**: `/app/src/components/admin/ImageUpload.tsx`

Changed upload endpoint from:
```javascript
const backendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || '';
const apiUrl = backendUrl ? `${backendUrl}/api/upload-image.php` : '/api/upload-image.php';
```

To:
```javascript
const apiUrl = '/api/admin/upload-image';
```

## How to Use

### Upload Images (Admin Panel)
1. Navigate to `http://localhost:3000/admin` (development only)
2. Select a product from the list
3. Click the "📸 Images" tab
4. Click "Choose Files" or drag and drop images
5. Wait for upload success messages
6. **IMPORTANT**: Click "Save Products" button (or press Ctrl+S)
7. Images are now saved to both:
   - File system: `/public/img/products/cockpit3d/{id}/`
   - JSON database: `/public/data/final-products.json`

### Verify Images Display
1. Navigate to the product page on the website
2. Images should now display correctly
3. If multiple images uploaded, gallery navigation will appear

## File Locations

### Images Storage
```
/app/public/img/products/cockpit3d/
├── 104/
│   ├── cockpit3d_104_Cut_Corner_Diamond.jpg (original)
│   └── product_104_1765398987863.png (uploaded)
├── 248/
│   └── cockpit3d_248_3D_Crystal_Candle.png
...
```

### Product Data (Source of Truth)
```
/app/public/data/final-products.json
```

Frontend reads product data (including image paths) from this file.

### Legacy Files (Can Be Ignored)
```
/app/src/data/
├── final-product-list.js (not used)
├── final-product-list-{timestamp}.js (backups)
└── cockpit3d-*.json (cache files)
```

These files are NOT used by the frontend and can be safely ignored or deleted.

## Technical Details

### Image URL Format
Images are referenced in JSON as:
```json
{
  "images": [
    {
      "src": "/img/products/cockpit3d/104/product_104_1765398987863.png",
      "isMain": true
    }
  ]
}
```

Frontend uses `assetPath()` helper which:
- Prepends `NEXT_PUBLIC_BASE_PATH` if configured
- Works in both development and production
- Handles both relative and absolute URLs

### Next.js Serving
- **Development**: Next.js serves `/public/` at root `/`
- **Production**: Static export includes all files from `/public/`
- Images are optimized at build time if using `next/image`

## Troubleshooting

### Images Still Not Displaying?

1. **Check Console for 404 Errors**
   ```
   GET /img/products/cockpit3d/248/product_248_*.png 404
   ```
   This means the file doesn't exist. Check file system.

2. **Verify File Exists**
   ```bash
   ls -la /app/public/img/products/cockpit3d/{productId}/
   ```

3. **Check JSON Contains Image**
   ```bash
   cat /app/public/data/final-products.json | grep "product_.*_"
   ```

4. **Restart Dev Server**
   ```bash
   cd /app
   yarn dev
   ```

5. **Clear Browser Cache**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private mode

### Upload Fails?

1. **Check API is Accessible**
   ```bash
   curl -X POST http://localhost:3000/api/admin/upload-image
   ```
   Should return: `{"error":"Missing productId or image file"}`

2. **Check File Permissions**
   ```bash
   ls -la /app/public/img/products/cockpit3d/
   ```
   Directories should be `drwxr-xr-x` (755)

3. **Check Browser Console**
   - Open DevTools (F12)
   - Check Network tab for failed requests
   - Check Console for JavaScript errors

## Next Steps

1. **Production Deployment**:
   - The PHP upload script at `/app/api/upload-image.php` can still be used in production
   - Configure `NEXT_PUBLIC_PHP_BACKEND_URL` in production environment
   - OR extend the Next.js API route to work in production with proper authentication

2. **Image Optimization**:
   - Consider adding image compression to the Next.js upload API
   - Use Sharp library for server-side image processing
   - Generate thumbnails automatically

3. **Cleanup**:
   - Remove unused files in `/src/data/`
   - Document the actual data flow
   - Add validation to ensure image paths match actual files

## Summary

✅ **Fixed**: Image uploads now work correctly in development
✅ **Fixed**: Images display properly on product pages
✅ **Clarified**: Single source of truth is `/public/data/final-products.json`
✅ **Documented**: Clear workflow for uploading and managing product images

The admin panel now correctly uploads images to the file system and saves references to the JSON database, making them immediately available on the website.
