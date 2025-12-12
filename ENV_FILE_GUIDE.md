# Environment Files Guide - Crystal Keepsakes

## CRITICAL: Understanding Environment Files

### ❌ NEVER USE `.env.example` FOR BUILDS
`.env.example` is a **TEMPLATE ONLY** - it contains placeholder values and should NEVER be used for actual builds.

### ✅ Correct Environment Files

```
.env.example          ← Template with placeholders (committed to git)
.env.local            ← Local development (NOT committed)
.env.production.test  ← Testing/staging builds (NOT committed)
.env.production       ← Production builds (NOT committed)
```

---

## Environment File Hierarchy

Next.js loads environment files in this order (later files override earlier ones):

1. `.env` (base, if exists)
2. `.env.production` or `.env.development` (based on NODE_ENV)
3. `.env.production.local` or `.env.development.local`
4. `.env.local` (always loaded except in test)

### Our Setup:

- **Development** (`yarn dev`): Loads `.env.local`
- **Test Build** (`yarn build:test`): Loads `.env.production.test`
- **Prod Build** (`yarn build:prod`): Loads `.env.production`

---

## File Purposes

### 1. `.env.example` ✅ COMMIT THIS
**Purpose**: Template for other developers
**Contains**: Placeholder values, documentation
**Used for**: Reference only, never for builds

```env
# Example (DO NOT USE DIRECTLY)
NEXT_PUBLIC_ENV_MODE=development
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
```

### 2. `.env.local` ❌ NEVER COMMIT
**Purpose**: Local development (your machine)
**Contains**: Your local test credentials
**Used for**: `yarn dev`

```env
# Local Development
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
```

### 3. `.env.production.test` ❌ NEVER COMMIT
**Purpose**: Testing/staging environment
**Contains**: Test credentials for `/test` deployment
**Used for**: `yarn build:test`

```env
# Testing Environment
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
```

### 4. `.env.production` ❌ NEVER COMMIT
**Purpose**: Production environment
**Contains**: **LIVE** credentials
**Used for**: `yarn build:prod`

```env
# Production (LIVE)
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY  ⚠️ LIVE KEY!
```

---

## Setup Instructions

### Initial Setup (First Time)

1. **Copy the example file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with your local credentials:
   ```bash
   nano .env.local
   # or
   code .env.local
   ```

3. **Fill in real values** (replace all `YOUR_*_HERE` placeholders)

4. **Repeat for test and production**:
   ```bash
   cp .env.example .env.production.test
   cp .env.example .env.production
   ```

5. **Edit each file** with environment-specific values

---

## Build Commands

### Development (Local)
```bash
yarn dev
```
- Uses: `.env.local`
- Mode: `development`
- Base Path: `/` (root)
- Stripe: Test keys
- Debug: Always visible

### Test Build
```bash
yarn build:test
```
- Uses: `.env.production.test`
- Mode: `testing`
- Base Path: `/test`
- Stripe: Test keys
- Output: `out-test/`
- **Includes**: `out-test/.env` (copied from `.env.production.test`)
- Deploy to: `https://crystalkeepsakes.com/test/`

### Production Build
```bash
yarn build:prod
```
- Uses: `.env.production`
- Mode: `production`
- Base Path: `/` (root)
- Stripe: **LIVE** keys ⚠️
- Output: `out-prod/`
- **Includes**: `out-prod/.env` (copied from `.env.production`)
- Deploy to: `https://crystalkeepsakes.com/`

---

## Build Output - .env File Included

**IMPORTANT**: When you run a build, the `.env` file is automatically copied to the output directory:

- `yarn build:test` → Creates `out-test/.env` (from `.env.production.test`)
- `yarn build:prod` → Creates `out-prod/.env` (from `.env.production`)

This means:
- ✅ You upload the entire `out-test/` or `out-prod/` folder
- ✅ The `.env` file is included automatically
- ✅ No need to manually create `.env` on the server
- ⚠️ Make sure your source `.env.production.test` and `.env.production` have real credentials!

**Workflow**:
1. Edit `.env.production.test` with your test credentials
2. Run `yarn build:test`
3. Upload `out-test/` to server → `.env` is included
4. Done! The server has the correct `.env` file

---

## Verification

### Check Which File Is Being Used

After running a build, the console will show:
```
📋 Step 2: Setting build environment...

   ✅ Using env file: .env.production.test
   📍 Location: /path/to/.env.production.test

   Loaded 15 environment variables from .env.production.test
```

### Verify Environment Variables

Add this to any page during development:
```tsx
console.log('ENV MODE:', process.env.NEXT_PUBLIC_ENV_MODE);
console.log('BASE PATH:', process.env.NEXT_PUBLIC_BASE_PATH);
console.log('STRIPE KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20));
```

Or use the **Debug Panel** (`?debug=true`):
- Shows environment mode
- Shows base path
- Shows Stripe mode (TEST/LIVE)

---

## Troubleshooting

### Problem: Build uses .env.example

**Symptom**: Placeholder values appear in build
**Cause**: Missing proper env file
**Solution**:
1. Check if `.env.production.test` exists (for test builds)
2. Check if `.env.production` exists (for prod builds)
3. Ensure files have real values (no `YOUR_*_HERE`)

### Problem: Wrong Stripe keys

**Symptom**: Test keys in production or vice versa
**Cause**: Wrong env file loaded
**Solution**:
1. Verify `NEXT_PUBLIC_ENV_MODE` in the file:
   - `.env.production.test` should have `testing`
   - `.env.production` should have `production`
2. Check build output for "Using env file: ..."
3. Use debug panel to verify Stripe mode

### Problem: Environment variables not working

**Symptom**: Variables show as `undefined`
**Cause**: Variables must start with `NEXT_PUBLIC_` for client-side access
**Solution**:
- Server-only: `STRIPE_SECRET_KEY` (OK)
- Client-side: Must use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Problem: Changes not reflected

**Symptom**: Updated env file but changes don't appear
**Cause**: Next.js caches environment at build time
**Solution**:
1. Delete `.next/` folder: `yarn clean`
2. Rebuild: `yarn build:test` or `yarn build:prod`
3. For dev: Restart `yarn dev`

---

## Security Checklist

### ✅ DO:
- Keep `.env.local`, `.env.production`, `.env.production.test` in `.gitignore`
- Use different credentials for test vs production
- Commit `.env.example` as a template
- Use test Stripe keys for test environment
- Use live Stripe keys ONLY in production

### ❌ DON'T:
- Commit any `.env` file except `.env.example`
- Use live Stripe keys in test environment
- Share env files via email or chat
- Hardcode credentials in code
- Use `.env.example` for actual builds

---

## File Status Check

Run this to verify your setup:

```bash
# Check which env files exist
ls -la .env*

# Should show:
# .env.example          ← ✅ Should exist (template)
# .env.local            ← ✅ Should exist (your local)
# .env.production.test  ← ✅ Should exist (test build)
# .env.production       ← ✅ Should exist (prod build)
```

Check git status:
```bash
git status | grep .env

# Should show ONLY:
# .env.example
# (others should be in .gitignore)
```

---

## Quick Reference

| Environment | File | Mode | Base Path | Stripe | Command |
|------------|------|------|-----------|--------|---------|
| Development | `.env.local` | `development` | `/` | Test | `yarn dev` |
| Testing | `.env.production.test` | `testing` | `/test` | Test | `yarn build:test` |
| Production | `.env.production` | `production` | `/` | **LIVE** | `yarn build:prod` |

---

## Support

If you see:
- "Using env file: .env.example" ← ❌ WRONG
- "Using env file: .env.production.test" ← ✅ CORRECT (for test)
- "Using env file: .env.production" ← ✅ CORRECT (for prod)

The build script will **stop and show an error** if the required `.env` file is missing.

---

## Summary

1. **.env.example** = Template (committed to git)
2. **.env.local** = Your local development (not committed)
3. **.env.production.test** = Test/staging build (not committed)
4. **.env.production** = Production build (not committed)

**NEVER** use `.env.example` for builds - it's a template with placeholders!

The build script (`safe-build.js`) now:
- ✅ Checks for the correct `.env` file
- ✅ Shows which file it's using
- ✅ Stops if the file is missing
- ✅ Loads variables from the correct file
- ✅ Never touches `.env.example`
