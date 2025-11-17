# Production Data Loading Fix

## Problem
Products page in production (`/test` directory) was failing with:
```
❌ Error loading products from file: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
GET https://crystalkeepsakes.com/data/products.json 404 (Not Found)
```

## Root Cause
The products page was using a **hardcoded path** `/data/products.json` instead of using the `assetPath()` helper that handles the `/test` basePath correctly.

## Fix Applied
**File:** `/app/src/app/products/page.tsx`

### Before:
```typescript
const res = await fetch('/data/products.json')
```

### After:
```typescript
import { assetPath } from '@/lib/assetPath'
// ...
const res = await fetch(assetPath('/data/products.json'))
if (!res.ok) {
  throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`)
}
```

## How It Works
1. **Test Build** (basePath: `/test`):
   - Fetches: `https://crystalkeepsakes.com/test/data/products.json` ✅

2. **Production Build** (basePath: empty):
   - Fetches: `https://crystalkeepsakes.com/data/products.json` ✅

## Build Commands
```bash
# For test directory (/test)
npm run build:test

# For production root
npm run build:prod
```

## Verification
After building and uploading:
1. ✅ products.json is included in `/out/data/` directory
2. ✅ assetPath() correctly prefixes with basePath
3. ✅ Products page will load data from correct URL

## Files Modified
- `/app/src/app/products/page.tsx` - Added assetPath import and usage

## Testing Checklist
- [ ] Build succeeds without errors
- [ ] `/out/data/products.json` exists (73KB)
- [ ] Upload `/out` directory to GoDaddy
- [ ] Visit `/test/products` - products should load
- [ ] Check browser console - no 404 errors
