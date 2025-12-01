# Build & Deployment - Separate Output Directories

**Date:** November 23, 2025  
**Fix:** Production and test builds now output to separate directories

---

## 🔍 The Problem (Fixed)

**Before:**
- `npm run build:prod` → outputs to `/out/`
- `npm run build:test` → outputs to `/out/` (overwrites production!)

**Result:** Test build wiped out production build ❌

---

## ✅ The Solution

**After:**
- `npm run build:prod` → outputs to `/out/`
- `npm run build:test` → outputs to `/out-test/`

**Result:** Builds are separate and don't overwrite each other ✅

---

## 📦 Build Commands

### Development
```bash
npm run dev
```
- Runs dev server on `http://localhost:3000`
- Hot reload enabled
- No build output
- Uses `.env` file

### Production Build
```bash
npm run build:prod
```
- Reads: `.env.production`
- Outputs to: `/out/`
- Base path: `/` (root)
- Deploy to: `/public_html/crystalkeepsakes.com/`

### Test Environment Build
```bash
npm run build:test
```
- Reads: `.env.production.test`
- Outputs to: `/out-test/`
- Base path: `/test`
- Deploy to: `/public_html/crystalkeepsakes.com/test/`

---

## 🚀 Deployment Workflow

### Deploy to Production
```bash
# 1. Build
npm run build:prod

# 2. Output is in: /out/

# 3. Upload /out/ contents to GoDaddy:
# FTP to: /public_html/crystalkeepsakes.com/
# Upload ALL files from /out/ directory

# 4. Verify
# Visit: https://crystalkeepsakes.com
```

### Deploy to Test
```bash
# 1. Build
npm run build:test

# 2. Output is in: /out-test/

# 3. Upload /out-test/ contents to GoDaddy:
# FTP to: /public_html/crystalkeepsakes.com/test/
# Upload ALL files from /out-test/ directory

# 4. Verify
# Visit: https://crystalkeepsakes.com/test
# Password: TestAccess2025
```

---

## 📁 Directory Structure

### Your Local Machine (C:\MAMP\htdocs\crystalkeepsakes\)
```
crystalkeepsakes/
├── src/                  Source files
├── api/                  PHP backend
├── public/               Static assets
├── .env                  Local development config
├── .env.production       Production config (not tracked)
├── .env.production.test  Test config (not tracked)
├── out/                  ✅ Production build output
├── out-test/             ✅ Test build output (NEW!)
└── node_modules/
```

### Your GoDaddy Server
```
public_html/
└── crystalkeepsakes.com/
    ├── index.html                    ← From /out/
    ├── api/                          ← From /out/api/
    ├── _next/                        ← From /out/_next/
    └── test/
        ├── index.html                ← From /out-test/
        ├── api/                      ← From /out-test/api/
        └── _next/                    ← From /out-test/_next/
```

---

## 🎯 Build Configuration

### next.config.ts (Updated)
```typescript
const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development';
const distDir = envMode === 'testing' ? 'out-test' : 'out';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: distDir,  // ← Dynamically set based on environment
  basePath: basePath,
  // ...
};
```

### Environment Variables

**.env.production** (for production build):
```env
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
```

**.env.production.test** (for test build):
```env
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test
```

---

## 📋 Build Output Contents

### /out/ (Production)
```
out/
├── index.html                 Homepage
├── .htaccess                  Production Apache config
├── .env                       Production env (copied)
├── api/                       PHP backend files
│   ├── stripe/
│   ├── cockpit3d/
│   └── contact.php
├── products/                  Static product pages
├── cart/                      Cart page
├── checkout/                  Checkout page
├── _next/                     Next.js assets
├── data/                      Product data
└── img/                       Images
```

### /out-test/ (Test Environment)
```
out-test/
├── index.html                 Homepage (with /test base path)
├── .htaccess                  Test Apache config
├── .env                       Test env (copied)
├── api/                       PHP backend files
├── products/                  Static product pages
├── cart/                      Cart page
├── checkout/                  Checkout page
├── _next/                     Next.js assets (with /test prefix)
├── data/                      Product data
└── img/                       Images
```

---

## 🔄 Typical Workflow

### Scenario 1: Update Production Site
```bash
# 1. Make changes to code
# 2. Test locally: npm run dev
# 3. Build production: npm run build:prod
# 4. Upload /out/ to crystalkeepsakes.com/
# 5. Verify: https://crystalkeepsakes.com
```

### Scenario 2: Test Changes Before Production
```bash
# 1. Make changes to code
# 2. Test locally: npm run dev
# 3. Build test: npm run build:test
# 4. Upload /out-test/ to crystalkeepsakes.com/test/
# 5. Verify: https://crystalkeepsakes.com/test
# 6. If good, build production: npm run build:prod
# 7. Upload /out/ to crystalkeepsakes.com/
```

### Scenario 3: Build Both Environments
```bash
# Build both without overwriting
npm run build:prod    # → /out/
npm run build:test    # → /out-test/

# Now you have both:
# - /out/ ready for production
# - /out-test/ ready for test environment
```

---

## ⚠️ Important Notes

### 1. Don't Mix Output Directories
- **Production** = Upload `/out/` contents
- **Test** = Upload `/out-test/` contents
- Never mix files from both directories

### 2. .gitignore
Both output directories should be in `.gitignore`:
```
/out/
/out-test/
```

### 3. FTP Paths
```
Production:  /public_html/crystalkeepsakes.com/
Test:        /public_html/crystalkeepsakes.com/test/
```

### 4. Environment Files
- `.env` files are NOT tracked in git
- Each machine maintains its own `.env` files
- Build scripts copy appropriate `.env.production*` to output

---

## 🐛 Troubleshooting

### Problem: Test build overwrote production
**Solution:** Use new commands:
```bash
npm run build:prod    # Outputs to /out/
npm run build:test    # Outputs to /out-test/ (separate!)
```

### Problem: Wrong files deployed
**Check:**
- Production should come from `/out/`
- Test should come from `/out-test/`
- Verify base path in URL (test has `/test`, production doesn't)

### Problem: Links broken on test site
**Check:** `.env.production.test` has:
```env
NEXT_PUBLIC_BASE_PATH=/test
```

### Problem: API calls fail
**Check environment-specific .env files:**
- Production: `NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com`
- Test: `NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test`

---

## ✅ Summary

### What Changed:
- ✅ Production builds to `/out/`
- ✅ Test builds to `/out-test/` (NEW!)
- ✅ No more overwrites
- ✅ Can build both simultaneously

### Build Commands:
```bash
npm run dev           # Development server
npm run build:prod    # Production → /out/
npm run build:test    # Test → /out-test/
```

### Deployment:
```bash
Production: Upload /out/ to /crystalkeepsakes.com/
Test:       Upload /out-test/ to /crystalkeepsakes.com/test/
```

---

**Status:** ✅ FIXED - Separate build outputs implemented  
**Version:** v9 with isolated build directories
