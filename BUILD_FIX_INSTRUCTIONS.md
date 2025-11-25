# Build Fix Instructions

## Issue 1: Redirects Warning ✅ FIXED
**Status:** Fixed in `next.config.ts`
- Removed the `redirects()` block that conflicts with `output: 'export'`
- Admin panel exclusion will be handled by `scripts/remove-admin-from-build.js`

## Issue 2: EPERM Error - Uploaded Images
**Status:** Requires manual action on Windows

### The Problem:
Uploaded images (like `product_114_1763976845961.png`) are being locked by Windows or have permission issues, preventing Next.js from copying them during build.

### Solution Options:

**Option A: Delete Test Upload Images (Recommended)**
```bash
# In your project directory on Windows
cd C:\MAMP\htdocs\crystalkeepsakes

# Delete all test uploaded images (keep only cockpit3d_* originals)
# For each product folder with uploaded images:
del /F /Q public\img\products\cockpit3d\114\product_114_*.png
del /F /Q public\img\products\cockpit3d\*\product_*_*.png
del /F /Q public\img\products\cockpit3d\*\product_*_*.jpg
```

**Option B: Fix Permissions**
```bash
# Right-click on the problematic file
# Properties > Security > Edit
# Give "Full Control" to your user
# Or run PowerShell as Admin:
icacls "C:\MAMP\htdocs\crystalkeepsakes\public\img\products\cockpit3d\114\product_114_1763976845961.png" /grant Users:F
```

**Option C: Close File Locks**
- Close any image viewers/editors that might have the file open
- Close Windows Explorer windows showing that folder
- Restart if needed

### After Cleanup:
```bash
# Try build again
npm run build:test
# or
npm run build:prod
```

## Build Commands Reference:

- `npm run dev` - Development server (admin panel available)
- `npm run build:test` - Build for test environment (/test subdirectory)
- `npm run build:prod` - Build for production (root directory)
- `npm run build:local` - Build for local testing

## Notes:
- Uploaded test images should be cleaned up regularly
- Only original cockpit3d_* images should remain in product folders
- Admin panel uploads work fine in dev, just not included in production builds
