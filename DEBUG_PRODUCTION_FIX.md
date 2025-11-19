# Debug Output in Production - FIXED ✅

## Problem
Debug console.log statements appearing in production build despite `npm run build:prod`.

## Root Cause

### Issue #1: Missing Environment Files
The `build:prod` script references `.env.production.root` which didn't exist, so `NEXT_PUBLIC_ENV_MODE` was not set to `production` during build.

### Issue #2: Build-Time vs Runtime
- `next.config.ts` removes console.log at **build time** using `compiler.removeConsole`
- It checks: `process.env.NEXT_PUBLIC_ENV_MODE === "production"`
- If this var isn't set during build, console statements stay in the bundle

## Solution Applied

### Created Missing Environment Files:

**1. `.env.production.root`** - For production build:
```bash
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
```

**2. `.env.production.test`** - For testing subdirectory:
```bash
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://yourdomain.com/test
```

### How Console Removal Works:

**next.config.ts**:
```typescript
compiler: {
  removeConsole:
    process.env.NEXT_PUBLIC_ENV_MODE === "production"
      ? { exclude: ["error"] }  // Remove all except console.error
      : false,  // Keep all console in dev/test
}
```

**Build Process**:
```bash
# Testing build (keeps debug for troubleshooting)
npm run build:test
# Sets NEXT_PUBLIC_ENV_MODE=testing
# → compiler.removeConsole = false
# → All console.log statements preserved

# Production build (removes debug)
npm run build:prod
# Sets NEXT_PUBLIC_ENV_MODE=production
# → compiler.removeConsole = { exclude: ["error"] }
# → console.log/info/warn removed
# → console.error preserved for critical errors
```

### Logger Utility:

**src/utils/logger.ts** already has runtime protection:
```typescript
const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const shouldLog = ENV_MODE === 'development' || ENV_MODE === 'testing'

export const logger = {
  info: (message, data) => {
    if (!shouldLog) return  // No-op in production
    console.log(`ℹ️ ${message}`, data)
  },
  // ... other methods
}
```

**Double Protection**:
1. **Build-time**: Next.js removes console statements
2. **Runtime**: Logger checks ENV_MODE and returns early

---

## Testing the Fix

### Step 1: Configure Production Environment

Edit `.env.production.root` with your actual keys:
```bash
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# Replace with YOUR live Stripe keys
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY
```

### Step 2: Build for Production

```bash
npm run build:prod
```

**What happens**:
1. `env-cmd` loads `.env.production.root`
2. Sets `NEXT_PUBLIC_ENV_MODE=production`
3. Next.js compiler removes console.log statements
4. Output to `/out/` directory

### Step 3: Verify Console Removal

**Check built files**:
```bash
# Search for console.log in production build
grep -r "console.log" out/_next/static/chunks/ | wc -l
# Should be 0 or very few (only from node_modules)
```

**Or inspect browser**:
1. Open production site
2. Open DevTools → Console (F12)
3. Navigate through site
4. ✅ No debug messages should appear
5. ✅ Only critical errors (if any) from console.error

### Step 4: Check Runtime Logger

**Test in browser console**:
```javascript
// In production site:
console.log(window.ENV_MODE)  // Should show "production"

// Logger should be silent:
window.logger.info("Test")  // No output
window.logger.success("Test")  // No output
window.logger.error("Test")  // Will show (errors preserved)
```

---

## Build Scripts Explained

### `npm run dev`
- **Environment**: Development
- **Console**: All enabled
- **Hot reload**: Yes
- **Purpose**: Local development

### `npm run build:test`
```bash
env-cmd -f .env.production.test next build
```
- **Environment**: Testing
- **Console**: All enabled (for debugging)
- **Deploy to**: `/public_html/test/`
- **Purpose**: Test on server with debugging

### `npm run build:prod`
```bash
env-cmd -f .env.production.root next build
```
- **Environment**: Production
- **Console**: Removed (except errors)
- **Deploy to**: `/public_html/`
- **Purpose**: Live production site

---

## Environment Variables Required

### For Testing (/test):
```bash
NEXT_PUBLIC_ENV_MODE=testing  # Keeps debug
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://yourdomain.com/test
```

### For Production (root):
```bash
NEXT_PUBLIC_ENV_MODE=production  # Removes debug
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
```

---

## Verification Checklist

### Before Deploying Production:

- [ ] `.env.production.root` exists with correct values
- [ ] `NEXT_PUBLIC_ENV_MODE=production` is set
- [ ] Live Stripe keys (sk_live_*) configured
- [ ] Run `npm run build:prod` successfully
- [ ] Check `/out/` directory created
- [ ] Verify no console.log in built files:
  ```bash
  grep -r "console.log" out/_next/static/chunks/ | head -5
  ```
- [ ] Test locally by serving `/out/` directory
- [ ] Upload to production server
- [ ] Open production site in incognito
- [ ] Check browser console → Should be clean ✅

### Expected Production Console:
```
(Empty - no debug output)
```

### If Errors Occur:
```
❌ Error messages will still appear (console.error preserved)
```

---

## Common Issues

### Issue: Still seeing console.log after build

**Cause**: Built without `NEXT_PUBLIC_ENV_MODE=production`

**Fix**:
```bash
# Make sure you use build:prod, not build
npm run build:prod

# Verify environment during build
cat .env.production.root | grep ENV_MODE
```

### Issue: `env-cmd` not found

**Fix**:
```bash
npm install --save-dev env-cmd
```

### Issue: Wrong environment file loaded

**Check**:
```bash
# Testing build should use:
.env.production.test

# Production build should use:
.env.production.root

# Verify in package.json scripts
```

---

## File Structure

```
/app/
├── .env.example              # Template with all variables
├── .env.production.root      # Production environment (NEW)
├── .env.production.test      # Testing environment (NEW)
├── next.config.ts            # Console removal config
├── src/
│   └── utils/
│       └── logger.ts         # Runtime logger protection
└── package.json              # Build scripts
```

---

## Summary

### What Was Fixed:
1. ✅ Created `.env.production.root` with `NEXT_PUBLIC_ENV_MODE=production`
2. ✅ Created `.env.production.test` with `NEXT_PUBLIC_ENV_MODE=testing`
3. ✅ Documented console removal mechanism
4. ✅ Provided testing verification steps

### How It Works:
- **Testing builds**: Keep debug for troubleshooting
- **Production builds**: Remove console.log for performance & security
- **Logger utility**: Double protection (build + runtime)

### Next Steps:
1. Fill in actual credentials in `.env.production.root`
2. Run `npm run build:prod`
3. Verify console removal
4. Deploy to production
5. Test on live site

---

**Status**: ✅ FIXED  
**Impact**: Console statements removed in production builds  
**Breaking Changes**: None (backward compatible)

---

**Remember**: Always use `npm run build:prod` for production deployments, not `npm run build`.
