# 🔧 Next.js DistDir Switching Issue - FIXED

## The Problem

Next.js kept switching between:
```typescript
import "./.next/types/routes.d.ts";
import "./out/dev/types/routes.d.ts";
```

This caused:
- ⏰ Wasted time regenerating types
- 💰 Wasted money on unnecessary builds
- 😤 Frustrating back-and-forth

## Root Cause

The `distDir` in `next.config.ts` was dynamically changing based on environment variables, even during development:

```typescript
// BAD - switches between .next, out, out-test, out-prod
const getDistDir = () => {
  if (process.env.BUILD_MODE === 'test') return 'out-test';
  if (process.env.BUILD_MODE === 'prod') return 'out-prod';
  return 'out'; // ❌ This was used for dev too!
};
```

## The Fix

Updated `getDistDir()` to **ALWAYS use `.next` for development**:

```typescript
// GOOD - .next is locked for dev mode
const getDistDir = () => {
  // ALWAYS use .next for development (yarn dev)
  if (isDev || process.env.NODE_ENV === 'development') {
    return '.next';  // ✅ Never changes!
  }
  
  // Only switch for builds
  if (process.env.BUILD_MODE === 'test') return 'out-test';
  if (process.env.BUILD_MODE === 'prod') return 'out-prod';
  
  return 'out'; // builds only
};
```

## What Changed

### 1. `next.config.ts`
- Dev mode now **locked to `.next`**
- Only builds use `out-test`, `out-prod`, `out`
- No more switching during development

### 2. `next-env.d.ts`
- Changed from `import` to `/// <reference>` for type stability
- Always points to `.next/types/routes.d.ts`

```typescript
// Before (unstable):
import "./.next/dev/types/routes.d.ts";

// After (stable):
/// <reference types="./.next/types/routes.d.ts" />
```

## How It Works Now

### Development (`yarn dev`)
```
distDir: .next          ✅ Always
Types:   .next/types/   ✅ Always
Never changes!
```

### Test Build (`yarn build:test`)
```
distDir: out-test       ✅ Build only
Output:  out-test/      ✅ Static files
```

### Production Build (`yarn build:prod`)
```
distDir: out-prod       ✅ Build only
Output:  out-prod/      ✅ Static files
```

## Verification

Check the logs to confirm `.next` is used:

```bash
# Should show: Output Dir: .next
tail /var/log/supervisor/frontend.out.log | grep "Output Dir"
```

Check TypeScript types:

```bash
# Should be stable at .next/types/routes.d.ts
cat next-env.d.ts
```

## Benefits

✅ **No more switching** - Dev always uses `.next`
✅ **Faster startup** - No type regeneration
✅ **Saves money** - No unnecessary rebuilds
✅ **Less frustration** - Consistent behavior

## Rules Going Forward

1. **Development**: Always `.next` (automatic)
2. **Builds**: Use appropriate output dir (automatic)
3. **Never manually change `distDir`** in dev mode
4. **Use build scripts**: `yarn build:test`, `yarn build:prod`

## Files Modified

- ✅ `/app/next.config.ts` - Fixed getDistDir() logic
- ✅ `/app/next-env.d.ts` - Stabilized type imports

## Success Criteria

✅ `yarn dev` starts without type regeneration
✅ Output Dir always shows `.next` in dev logs
✅ No more import switching in next-env.d.ts
✅ Build commands still work: `yarn build:test`, `yarn build:prod`

---

Last Updated: 2025-11-25
**Status**: ✅ FIXED - distDir is now stable for development!
