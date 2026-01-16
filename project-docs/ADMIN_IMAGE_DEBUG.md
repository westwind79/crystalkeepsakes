# Admin Panel Image Issue - Debugging Guide

## Problem
Images are removed in admin panel, you click Save, but the "dead" images (404s) come back.

## Root Causes & Solutions

### 1. Browser Cache Issue ✅ MOST COMMON
**Symptom**: Images show in admin but return 404 when you try to access them directly

**Why it happens**:
- Browser caches images with their URLs
- When you delete an image and save, the URL is removed from JSON
- But browser still has the cached image and displays it
- When you refresh, browser tries to load from cache but server returns 404

**Solution**:
```
Hard refresh the page:
- Windows/Linux: Ctrl + F5 or Ctrl + Shift + R
- Mac: Cmd + Shift + R
- Or use Incognito/Private mode
```

### 2. localStorage vs JSON Mismatch
**Symptom**: Changes persist in admin UI but not on frontend

**Why it happens**:
- Admin saves changes to localStorage for quick access
- When you Save, it writes to JSON file
- But if save fails or is interrupted, localStorage has newer data than JSON
- On page reload, localStorage is loaded first, showing "unsaved" changes

**Solution**: 
- Updated code to reload products from JSON after save
- This ensures admin UI always shows what's actually saved
- localStorage is cleared after successful save

### 3. Concurrent Edits / Race Conditions
**Symptom**: Some changes save but not others

**Why it happens**:
- You upload multiple images quickly
- Each upload updates `editedProducts` state
- React batches state updates
- When you click Save before all state updates complete, some changes are missing

**Solution**:
- Wait for all uploads to complete (green checkmarks)
- Check "Current Images" section shows all intended images
- Then click Save

### 4. Image URLs Reference Non-Existent Files
**Symptom**: JSON has image paths but files don't exist on disk

**Why it happens**:
- Image was uploaded successfully
- Image URL was saved to JSON
- But file was deleted from disk (manually or by cleanup script)
- OR upload completed but file save failed
- JSON still references non-existent file

**Solution**:
```bash
# Check if image files actually exist
ls -la /app/public/img/products/cockpit3d/{productId}/

# Compare with JSON references
cat /app/public/data/final-products.json | jq '.[] | select(.id == "{productId}") | .images'

# Remove dead image references in admin panel and save
```

## How to Debug

### Step 1: Check Browser Console
Open DevTools (F12) → Console tab

Look for errors like:
```
GET /img/products/cockpit3d/248/product_248_123456.png 404
```

This means the image URL is in JSON but file doesn't exist.

### Step 2: Check Network Tab
Open DevTools (F12) → Network tab

Filter by "Img" or "PNG/JPG"

Look for:
- ✅ **200**: Image loaded successfully
- ❌ **404**: Image file not found
- ❌ **304**: Cached image (might be stale)

### Step 3: Verify JSON Content
```bash
# View product images in JSON
cat /app/public/data/final-products.json | jq '.[] | select(.id == "248") | .images'
```

Should show:
```json
[
  {
    "src": "/img/products/cockpit3d/248/cockpit3d_248_3D_Crystal_Candle.png",
    "isMain": true
  }
]
```

### Step 4: Verify Files on Disk
```bash
# Check what image files actually exist
ls -la /app/public/img/products/cockpit3d/248/
```

Should show:
```
cockpit3d_248_3D_Crystal_Candle.png  ← Original image
product_248_1765398987863.png        ← Uploaded image
```

### Step 5: Check localStorage
Open DevTools (F12) → Application/Storage tab → Local Storage

Look for key: `productCustomizations`

If it exists and has data:
- This means you have unsaved changes
- OR the save process didn't clear it properly
- Click Save again or clear it manually

## Proper Workflow

### To Remove Images:
1. Go to admin panel (`/admin`)
2. Select product
3. Click "📸 Images" tab
4. Click "Remove" button on unwanted images
5. **Verify** "Current Images" section shows only the images you want
6. Click "Save Products" (or Ctrl+S)
7. **Wait** for success message
8. **Hard refresh** browser (Ctrl+F5)
9. Verify images are gone

### To Add Images:
1. Go to admin panel (`/admin`)
2. Select product
3. Click "📸 Images" tab
4. Upload new images
5. **Wait** for all uploads to complete (✅ messages in console)
6. **Verify** "Current Images" section shows all new images
7. Click "Save Products" (or Ctrl+S)
8. **Wait** for success message
9. **Hard refresh** browser (Ctrl+F5)
10. Verify new images display

## Known Limitations

### Development Only
The admin panel and upload API only work in development mode (`NODE_ENV=development`). This is a security feature.

For production:
- Use the PHP upload script with proper authentication
- OR build a separate admin backend with proper security

### Static Export
The Next.js config uses `output: 'export'` for static site generation. This means:
- API routes don't work in production build
- Admin panel must be used during development
- Changes are saved to JSON which is included in static build

### Cache Busting
Images don't have cache-busting URLs (like `image.png?v=123456`). If you replace an image with the same filename, browsers may show cached version.

**Solution**: 
- Upload API automatically adds timestamps to filenames
- Use `product_{id}_{timestamp}.{ext}` format
- Each upload creates a new unique filename

## Troubleshooting Checklist

- [ ] Hard refreshed browser (Ctrl+F5)?
- [ ] Checked browser console for 404 errors?
- [ ] Verified JSON has correct image paths?
- [ ] Verified image files exist on disk?
- [ ] Cleared localStorage (`productCustomizations`)?
- [ ] Waited for "Products reloaded from JSON" message after save?
- [ ] Tried in incognito/private window?
- [ ] Checked that product ID matches between JSON and disk?

## Quick Fixes

### Fix 1: Clear Everything and Start Fresh
```bash
# Remove localStorage in browser console
localStorage.removeItem('productCustomizations');

# Hard refresh
# Ctrl+F5 or Cmd+Shift+R
```

### Fix 2: Sync JSON with Disk
```bash
# Find orphaned image references (in JSON but not on disk)
cd /app
node scripts/cleanup-dead-images.js  # If this script exists

# Or manually: Compare JSON references with actual files
# and remove dead references in admin panel
```

### Fix 3: Restart Dev Server
Sometimes hot reload doesn't pick up file changes properly.

```bash
# Kill dev server
pkill -f "next dev"

# Start fresh
cd /app
yarn dev
```

## Summary

The most common issue is **browser caching**. Always do a hard refresh (Ctrl+F5) after saving changes in the admin panel.

The second most common issue is **not waiting** for uploads to complete before clicking Save.

The fix implemented:
- ✅ Admin panel now reloads products from JSON after save
- ✅ This ensures UI always shows saved state, not cached/localStorage state
- ✅ Upload API creates unique filenames to avoid cache conflicts

Always verify changes in a fresh browser session (incognito mode) to rule out caching issues.
