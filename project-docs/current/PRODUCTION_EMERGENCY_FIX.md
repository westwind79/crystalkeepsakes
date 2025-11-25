# 🚨 PRODUCTION EMERGENCY FIX

## Critical Issue
Your live site at https://crystalkeepsakes.com is redirecting to localhost:3000

---

## Immediate Fix (Do This Now!)

### Step 1: Update .env on GoDaddy

1. **Connect to GoDaddy via FTP or File Manager**

2. **Navigate to:** `/public_html/crystalkeepsakes.com/`

3. **Edit the `.env` file** (or create if missing)

4. **Replace entire contents with this:**

```env
# Production Environment
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# Your actual Stripe LIVE keys (from dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY

# Cockpit3D Production
COCKPIT3D_USERNAME=noah.westwind@gmail.com
COCKPIT3D_PASSWORD=z99rr9,Hod,,bdb,azzo
COCKPIT3D_RETAILER_ID=256568874
COCKPIT3D_BASE_URL=https://api.cockpit3d.com

# Email
CONTACT_EMAIL=info@crystalkeepsakes.com
ORDERS_EMAIL=orders@crystalkeepsakes.com

# Database (if using)
DB_HOST=localhost
DB_NAME=crystal_orders
DB_USER=ck_admin
DB_PASS=[M9hl~a]Pr?f

# Image storage
CUSTOMER_IMAGE_PATH=/home/uydbo2r007mb/public_html/crystal-data/order-images
```

5. **Save the file**

---

### Step 2: Clear Browser Cache

The redirect might be cached in browsers. Users need to:
- Clear cache
- Hard refresh (Ctrl+Shift+R)

---

## Root Cause

The PHP backend files (in `/api/stripe/`) try to detect the base URL from:
1. HTTP_ORIGIN header
2. HTTP_REFERER header  
3. .env file (NEXT_PUBLIC_ENV_MODE)
4. Fallback to localhost ← This is what's happening

Because the .env file on GoDaddy either:
- Doesn't exist
- Has wrong values
- Isn't being read correctly

---

## Better Long-Term Fix

### Option A: Hardcode Production URL in PHP

Edit on GoDaddy: `/api/stripe/create-checkout-session.php`

Find (around line 189):
```php
else {
    if ($mode === 'production') {
        $baseUrl = 'https://crystalkeepsakes.com';
    } else {
```

Make sure it's exactly like this (not localhost).

### Option B: Update Build Process

Before deploying, ensure your `.env.production` file has correct values:

**Your local `.env.production` file should have:**
```env
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
```

Then rebuild:
```bash
npm run build:prod
```

This will copy the correct .env to `/out/.env`

---

## Verify the Fix

After uploading .env to GoDaddy:

1. Go to: https://crystalkeepsakes.com/checkout/
2. Add item to cart
3. Click checkout
4. Should redirect to Stripe (not localhost)

---

## Test Environment

Your test site needs its own .env at:
`/public_html/crystalkeepsakes.com/test/.env`

```env
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_KEY
```

---

## Quick Checklist

- [ ] Upload .env to GoDaddy production folder
- [ ] Verify NEXT_PUBLIC_ENV_MODE=production
- [ ] Verify base URLs are https://crystalkeepsakes.com
- [ ] Add your LIVE Stripe keys (pk_live_... and sk_live_...)
- [ ] Test checkout on live site
- [ ] Ensure it redirects to Stripe (not localhost)

---

## If Still Broken

Check PHP error logs on GoDaddy:
1. cPanel → Error Log
2. Look for Stripe API errors
3. Check if .env is being read

Or temporarily add debugging:
```php
// Add to /api/stripe/create-checkout-session.php (line 200)
error_log("MODE: $mode | BASE_URL: $baseUrl | ENV: " . getEnvVariable('NEXT_PUBLIC_ENV_MODE'));
```

---

**Priority:** CRITICAL - Fix immediately  
**Impact:** All checkout attempts failing on production
