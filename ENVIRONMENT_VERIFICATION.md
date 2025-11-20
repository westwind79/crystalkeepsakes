# Environment Verification Guide
**Version:** 1.0.0  
**Date:** 2025-01-19  
**Critical:** Use this checklist before ANY deployment

---

## Debug Panel Behavior

### ✅ Correct Behavior

| Environment | Debug Panel Visible? | How to Show |
|-------------|---------------------|-------------|
| **Development** (localhost) | ✅ YES - Always | Automatic |
| **Testing** (/test subdirectory) | ✅ YES - Always | Automatic |
| **Production** (crystalkeepsakes.com) | ❌ NO - Hidden | Add `?debug=true` to URL |

### Production Debug Access
If you need to debug on production:
1. Go to: `https://crystalkeepsakes.com/?debug=true`
2. Debug panel will appear in bottom right
3. Panel shows environment verification
4. **Remove `?debug=true` before sharing URL with customers!**

---

## Environment Files Configuration

### `.env.production` (Production - crystalkeepsakes.com)
```bash
NEXT_PUBLIC_ENV_MODE=production  # ← CRITICAL!
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# LIVE Stripe Keys (starts with sk_live_ and pk_live_)
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### `.env.production.test` (Testing - /test subdirectory)
```bash
NEXT_PUBLIC_ENV_MODE=testing  # ← CRITICAL!
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test

# TEST Stripe Keys (starts with sk_test_ and pk_test_)
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_xxxxx
```

### `.env` or `.env.local` (Local Development)
```bash
NEXT_PUBLIC_ENV_MODE=development  # ← CRITICAL!
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# TEST Stripe Keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_xxxxx
```

---

## Verification Checklist

### Before Building for Production
- [ ] `.env.production` exists in project root
- [ ] `NEXT_PUBLIC_ENV_MODE=production` is set
- [ ] Live Stripe keys start with `sk_live_` and `pk_live_`
- [ ] `NEXT_PUBLIC_PHP_BACKEND_URL` points to production domain
- [ ] No `NEXT_PUBLIC_BASE_PATH` (or empty string)

### After Building for Production
```bash
# Run production build
npm run build:prod

# This uses: env-cmd -f .env.production next build
```

### After Deploying to Production
1. **Open Production Site**
   - Go to: `https://crystalkeepsakes.com`
   - Do NOT add any URL parameters

2. **Check for Debug Panel**
   - ❌ Debug button should NOT be visible in bottom right
   - ✅ If you see it, ENV_MODE is wrong!

3. **Verify with Debug URL**
   - Go to: `https://crystalkeepsakes.com/?debug=true`
   - ✅ Debug button should NOW appear
   - Click "Debug" button
   - Verify these values:

   ```
   Mode: production (should be RED)
   Base Path: /
   Backend: https://crystalkeepsakes.com
   Stripe Key: pk_live_... (first 20 chars)
   Stripe Mode: 🔴 LIVE (should be RED)
   ```

4. **Verify Console is Clean**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Navigate around the site
   - ❌ Should see NO debug logs
   - ❌ Should see NO emoji logs (🌐, ✅, ❌, etc.)
   - ✅ Console should be completely clean

---

## Testing Environment Verification

### After Deploying to /test
1. **Open Test Site**
   - Go to: `https://crystalkeepsakes.com/test`

2. **Check for Debug Panel**
   - ✅ Debug button SHOULD be visible (no URL param needed)

3. **Click Debug Button**
   - Verify these values:

   ```
   Mode: testing (should be YELLOW)
   Base Path: /test
   Backend: https://crystalkeepsakes.com/test
   Stripe Key: pk_test_... (first 20 chars)
   Stripe Mode: ✓ TEST (should be GREEN)
   ```

4. **Verify Console Has Logs**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Navigate around the site
   - ✅ Should see debug logs with emojis
   - ✅ Logs are expected in testing mode

---

## Development Environment Verification

### While Running Locally
1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Open Local Site**
   - Go to: `http://localhost:3000`

3. **Check for Debug Panel**
   - ✅ Debug button SHOULD be visible

4. **Click Debug Button**
   - Verify these values:

   ```
   Mode: development (should be BLUE)
   Base Path: /
   Backend: http://localhost:8888/crystalkeepsakes (or your local)
   Stripe Key: pk_test_... (first 20 chars)
   Stripe Mode: ✓ TEST (should be GREEN)
   ```

5. **Verify Console Has Logs**
   - ✅ Should see debug logs
   - ✅ This is normal and expected

---

## Common Issues & Fixes

### Issue: Debug panel shows in production
**Cause:** `NEXT_PUBLIC_ENV_MODE` is not set to `production`

**Check:**
```bash
# On server, verify .env.production
cat .env.production | grep NEXT_PUBLIC_ENV_MODE

# Should output:
# NEXT_PUBLIC_ENV_MODE=production
```

**Fix:**
1. Edit `.env.production` on server
2. Set `NEXT_PUBLIC_ENV_MODE=production`
3. Rebuild: `npm run build:prod`
4. Restart web server

---

### Issue: Wrong Stripe keys being used
**Cause:** `NEXT_PUBLIC_ENV_MODE` doesn't match deployed environment

**Verification:**
1. Add `?debug=true` to URL
2. Open debug panel
3. Check "Stripe Key" field
4. Production should show: `pk_live_...`
5. Testing/Dev should show: `pk_test_...`

**Fix:**
1. Verify correct `.env` file exists
2. Check `NEXT_PUBLIC_ENV_MODE` value
3. Rebuild with correct env file:
   ```bash
   # For production
   npm run build:prod
   
   # For testing
   npm run build:test
   ```

---

### Issue: Console shows debug logs in production
**Cause:** Logger is working, but ENV_MODE is wrong

**Check:**
1. Open browser console
2. Type: `process.env.NEXT_PUBLIC_ENV_MODE`
3. Should output: `"production"`

**Fix:**
- If it outputs anything else, rebuild with `.env.production`
- Ensure `.env.production` is on server and being used

---

### Issue: Test Stripe keys in production
**CRITICAL - This means customers can't pay!**

**Symptoms:**
- Orders going through but no real charges
- Stripe dashboard shows test mode orders
- Payment cards work with 4242 4242 4242 4242

**Verification:**
```bash
# Check what key is being used
grep "NEXT_PUBLIC_STRIPE" .env.production

# Should show LIVE keys:
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# Should NOT show or use:
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_...
```

**Fix:**
1. **URGENT:** Take site offline or disable checkout
2. Verify live Stripe keys in `.env.production`
3. Rebuild: `npm run build:prod`
4. Deploy
5. Verify with `?debug=true` that live keys are active
6. Bring site back online

---

## Build Scripts Reference

### For Production
```bash
npm run build:prod
# Uses: env-cmd -f .env.production next build
# Result: NEXT_PUBLIC_ENV_MODE=production
# Output: /out directory
```

### For Testing
```bash
npm run build:test
# Uses: env-cmd -f .env.production.test next build
# Result: NEXT_PUBLIC_ENV_MODE=testing
# Output: /out directory
```

### For Development
```bash
npm run dev
# Uses: .env.local or .env
# Result: NEXT_PUBLIC_ENV_MODE=development
# No build, runs in real-time
```

---

## Environment Detection Logic

### Debug Panel Visibility
```typescript
// File: /src/components/DebugOverlay.tsx

const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const isDev = envMode === 'development'
const isTest = envMode === 'testing'
const urlParams = new URLSearchParams(window.location.search)
const hasDebugParam = urlParams.get('debug') === 'true'

// Show if: development OR testing OR ?debug=true
const showDebug = isDev || isTest || hasDebugParam
```

### Stripe Key Selection
```typescript
// File: /src/lib/stripe.ts

const STRIPE_PUBLISHABLE_KEY = 
  process.env.NEXT_PUBLIC_ENV_MODE === 'production'
    ? process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY  // Live
    : process.env.NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY  // Test
```

### Logger Behavior
```typescript
// File: /src/utils/logger.ts

const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const shouldLog = ENV_MODE === 'development' || ENV_MODE === 'testing'

// Only logs if shouldLog is true
```

---

## Security Checklist

### Before Going Live
- [ ] `.env.production` has live Stripe keys (starts with sk_live_)
- [ ] `.env.production` has `NEXT_PUBLIC_ENV_MODE=production`
- [ ] Debug panel NOT visible on production without `?debug=true`
- [ ] Console clean (no debug logs) on production
- [ ] Test order with real card (small amount)
- [ ] Verify charge appears in Stripe live dashboard
- [ ] `.env.production` NOT committed to Git
- [ ] Webhook uses live webhook secret

### After Going Live
- [ ] Place test order
- [ ] Verify charge in Stripe LIVE dashboard (not test)
- [ ] Check webhook logs in Stripe dashboard
- [ ] Verify order email received
- [ ] Check that order data is correct
- [ ] Remove `?debug=true` from any public URLs

---

## Quick Reference

### What Should You See?

#### Production (crystalkeepsakes.com)
```
✅ NO debug panel visible
✅ Clean console (no logs)
✅ Live Stripe keys (pk_live_...)
✅ Real payments processed
❌ Test card 4242... does NOT work
```

#### Testing (/test subdirectory)
```
✅ Debug panel visible
✅ Debug logs in console
✅ Test Stripe keys (pk_test_...)
✅ Test payments only
✅ Test card 4242... works
```

#### Development (localhost)
```
✅ Debug panel visible
✅ Debug logs in console
✅ Test Stripe keys (pk_test_...)
✅ Test payments only
✅ Test card 4242... works
```

---

## Emergency Contacts

### If Production is Using Test Keys
1. **Immediate:** Disable checkout or take site offline
2. **Fix:** Update `.env.production` with live keys
3. **Rebuild:** `npm run build:prod`
4. **Deploy:** Upload new build
5. **Verify:** Check with `?debug=true`
6. **Resume:** Enable checkout

### If Debug Panel Shows in Production
1. **Check:** `.env.production` has `NEXT_PUBLIC_ENV_MODE=production`
2. **Rebuild:** `npm run build:prod`
3. **Deploy:** Upload new build
4. **Verify:** No debug panel without `?debug=true`

---

**Last Updated:** 2025-01-19  
**Critical:** Review this checklist before EVERY deployment  
**Next Review:** After first production deployment with real orders
