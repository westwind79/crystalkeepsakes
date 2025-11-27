# 🚀 GoDaddy /test Deployment & Issue Resolution

## 🔴 CRITICAL ISSUES FOUND

### Issue 1: Stripe Shipping Rate Mode Mismatch
**Problem**: The code uses production Stripe shipping rate IDs in the /test environment.

**Error**: `No such shipping rate: 'shr_1RRRX82YE48VQlzYpcQsdaSE'`

**Root Cause**: Lines 207-219 in `/api/stripe/create-checkout-session.php` add shipping rates when `$mode === 'production'`, BUT your /test environment is likely being detected as 'production' mode by the domain name.

**The Fix**: The mode detection needs to account for the `/test` subdirectory.

### Issue 2: Redirect URL Not Respecting /test Subdirectory
**Problem**: After Stripe error, redirecting to `crystalkeepsakes.com/checkout/` instead of `crystalkeepsakes.com/test/checkout/`

**Root Cause**: The URL detection logic (lines 128-171) tries to detect the subdirectory, but there might be a mismatch in how the mode is determined vs. how URLs are constructed.

---

## ✅ SOLUTIONS

### Solution 1: Fix Mode Detection for /test Environment

The code needs to explicitly check if we're in a `/test` subdirectory and treat it as 'test' mode, not 'production' mode.

**Required Changes:**

1. **Detect /test subdirectory explicitly**
2. **Disable shipping rates for test environment**
3. **Use test Stripe keys for /test subdirectory**

### Solution 2: Ensure Consistent URL Handling

The success_url and cancel_url need to perfectly match the subdirectory path.

---

## 🛠️ IMPLEMENTATION STEPS

### Step 1: Update Environment Detection

Add explicit /test detection to override production mode when in test subdirectory.

### Step 2: Create Test-Specific Configuration

You'll need a `.env` file on GoDaddy that specifies:
```env
NEXT_PUBLIC_ENV_MODE=test
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_...
```

### Step 3: Ensure URL Construction Works

Make sure the base URL detection includes the `/test` path consistently.

---

## 📋 DEPLOYMENT CHECKLIST FOR /test

### Before Deploying:

- [ ] Verify you're using Stripe TEST keys (sk_test_...)
- [ ] Comment out or remove shipping rate IDs for test mode
- [ ] Set NEXT_PUBLIC_ENV_MODE=test in your .env file on GoDaddy
- [ ] Verify base URL is set to https://crystalkeepsakes.com/test

### Files to Upload:

- [ ] All `/api/` PHP files
- [ ] All Next.js build files (`.next/` or static export)
- [ ] `.env` file with test configuration
- [ ] `.htaccess` file (if needed for routing)
- [ ] `/vendor/` folder (Stripe PHP library) - ONLY for /test if no Composer access

### After Deploying:

- [ ] Test: Can you access crystalkeepsakes.com/test/?
- [ ] Test: Does the cart page load?
- [ ] Test: Can you add items to cart?
- [ ] Test: Does checkout redirect correctly?
- [ ] Check PHP error logs for any issues

---

## 🔧 QUICK FIX FOR IMMEDIATE TESTING

**To test right now without shipping:**

We can modify the code to:
1. Detect if we're in `/test` subdirectory
2. Completely skip shipping options for test
3. Use correct test environment variables

Would you like me to implement these fixes now?

---

## 📝 QUESTIONS TO ANSWER:

1. **What Stripe keys are you using in /test?**
   - [ ] Test mode keys (sk_test_...)
   - [ ] Live mode keys (sk_live_...)

2. **Do you NEED shipping rates in the test environment?**
   - If NO: We can disable them completely
   - If YES: We need to create test shipping rates in your Stripe dashboard

3. **What is set in your .env file on GoDaddy?**
   - What is `NEXT_PUBLIC_ENV_MODE` set to?
   - Or is it missing entirely?

---

## 🎯 RECOMMENDED APPROACH

**For /test environment:**
- Use Stripe TEST mode keys
- DISABLE shipping options entirely (test without shipping first)
- DISABLE automatic tax
- Focus on testing: image uploads, cart flow, basic checkout

**Once /test works:**
- Then configure test shipping rates in Stripe dashboard
- Re-enable shipping for more complete testing

