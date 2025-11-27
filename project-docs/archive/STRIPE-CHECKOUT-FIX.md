# Stripe Checkout Fix - Environment Setup

## Problem Identified

Your checkout was failing with `ERR_CONNECTION_REFUSED` because:

1. **Checkout page was trying to connect to MAMP** (`localhost:8888/crystalkeepsakes`)
2. **MAMP doesn't exist in this container** (This is a Node.js/Next.js container, not PHP/MAMP)
3. **PHP backend files exist** but can't run without PHP-FPM

---

## Solution Implemented

### 1. Created Next.js API Route for Development

**File:** `/src/app/api/stripe/create-checkout-session/route.ts`

- Works in development mode (`npm run dev`)
- Uses Stripe Node.js library
- Mirrors functionality of PHP backend
- **Only works in dev mode** - API routes don't work in static export

### 2. Updated Checkout Page

**File:** `/src/app/checkout/page.tsx`

**Changed from:**
```typescript
const apiUrl = `${phpBackendUrl}/api/stripe/create-checkout-session.php`
```

**Changed to:**
```typescript
const isDev = process.env.NODE_ENV === 'development'
const apiUrl = isDev 
  ? '/src/api/stripe/create-checkout-session'  // Next.js API route (dev only)
  : '/api/stripe/create-checkout-session.php'  // PHP file (production)
```

### 3. Created Proper Environment File

**File:** `/.env` (NEW)

- For local development in container
- Contains development Stripe keys (needs your actual keys)

---

## Environment File Structure

Your project now has:

```
.env                    → Local development (container) - NEW
.env.production         → Production (crystalkeepsakes.com)
.env.production.test    → Testing (/test subdirectory)
```

---

## What You Need To Do

### Add Your Stripe Test Keys

Edit `/.env` and replace these placeholder values:

```bash
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
```

**Where to get them:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy "Secret key" (starts with `sk_test_`)
3. Copy "Publishable key" (starts with `pk_test_`)

---

## How It Works Now

### Development (This Container)
```
Checkout page → Next.js API route → Stripe API → Creates session
```

### Production (GoDaddy)
```
Checkout page → PHP backend → Stripe API → Creates session
```

---

## Testing Checkout

Once you add your Stripe keys:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Add items to cart:**
   - Visit http://localhost:3000/products
   - Add a product to cart

3. **Go to checkout:**
   - Visit http://localhost:3000/checkout
   - Should redirect to Stripe's hosted checkout page

4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

---

## Production Deployment

**IMPORTANT:** For production on GoDaddy:

1. The **PHP files in `/api/stripe/`** need to be on the server
2. They require:
   - PHP 7.4+ with `php-fpm`
   - Stripe PHP library (via Composer)
   - Proper `.env.production` with live Stripe keys

3. **Build process automatically copies PHP files:**
   ```bash
   npm run build:prod
   # PHP files are copied to /out/api/
   # Upload entire /out folder to GoDaddy
   ```

---

## File Locations

### Development (Container):
- **Checkout page:** `/src/app/checkout/page.tsx`
- **Next.js API route:** `/src/app/api/stripe/create-checkout-session/route.ts`
- **Environment:** `/.env`

### Production (GoDaddy):
- **PHP backend:** `/api/stripe/create-checkout-session.php`
- **Environment:** `/.env.production`

---

## Key Changes Summary

✅ Created Next.js API route for development
✅ Updated checkout page to use correct endpoint per environment
✅ Created proper `.env` file for container development
✅ Removed confusing `.env.local`
✅ Documented the dual-system approach (Next.js for dev, PHP for prod)

---

## Next Step

**Please provide your Stripe test API keys** so I can add them to `.env` and test the checkout flow.

Or if you prefer, I can mock the Stripe integration so you can test the rest of the site without needing real Stripe keys.
