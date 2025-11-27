# ✅ /test Environment Fix Applied

## 🔴 Problems Identified

### Problem 1: Mode Detection Issue
Your `/test` subdirectory was being treated as production mode, causing Stripe to try using **LIVE shipping rates** with **TEST keys** (or vice versa).

**Error Message:**
```
No such shipping rate: 'shr_1RRRX82YE48VQlzYpcQsdaSE'
```

### Problem 2: URL Redirect Issue
After Stripe errors, you were being redirected to `crystalkeepsakes.com/checkout/` instead of `crystalkeepsakes.com/test/checkout/`.

---

## ✅ Fixes Applied

### Fix 1: Automatic /test Detection
The code now automatically detects if you're accessing via the `/test` subdirectory and forces **TEST mode**.

**What Changed:**
- Added URL-based detection in `create-checkout-session.php`
- Checks `REQUEST_URI`, `HTTP_REFERER`, and `HTTP_ORIGIN` for `/test/`
- Overrides environment mode to 'test' when detected

### Fix 2: Shipping Rate Protection
- Shipping rates are **ONLY** added when in true production mode
- Test/development modes skip shipping entirely
- Prevents "No such shipping rate" errors

### Fix 3: Key Validation
- Added automatic validation to ensure test keys are used in test mode
- Logs warnings if there's a key/mode mismatch

---

## 🧪 Testing on GoDaddy /test

### What You Need on the Server:

**1. Environment File (.env) - Place at website root:**
```env
# Stripe Keys - USE TEST KEYS FOR /test
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE

# Environment Mode (optional - will be auto-detected from /test path)
NEXT_PUBLIC_ENV_MODE=test

# Image Upload Path (server-specific)
CUSTOMER_IMAGE_PATH=/path/to/crystal-orders/order-images-test
CUSTOMER_IMAGE_URL_BASE=https://crystalkeepsakes.com/test/crystal-orders/order-images-test
```

**2. PHP Vendor Folder:**
Since you likely don't have Composer on GoDaddy shared hosting:
- Run `composer install` locally in your project root
- Upload the entire `/vendor/` folder to your GoDaddy `/test/` directory
- Ensure the path `/test/vendor/autoload.php` exists on the server

**3. Directory Structure on GoDaddy:**
```
/public_html/test/
├── api/
│   ├── stripe/
│   │   └── create-checkout-session.php  (✅ Updated)
│   ├── customer-image-upload.php
│   ├── env-loader.php
│   └── ...
├── vendor/                               (Upload this!)
│   └── autoload.php
├── .next/                                (Next.js build)
├── public/
└── .env                                  (Create this!)
```

---

## 🎯 Expected Behavior Now

### When accessing crystalkeepsakes.com/test/:

1. **Mode Detection:** 
   - System detects `/test` in URL
   - Forces mode to 'test'
   - Uses `STRIPE_DEVELOPMENT_SECRET_KEY`

2. **Checkout Session:**
   - NO shipping rates added
   - NO automatic tax
   - Simple payment-only checkout
   - Uses test Stripe keys

3. **URLs:**
   - Success: `https://crystalkeepsakes.com/test/order-confirmation?session_id={ID}`
   - Cancel: `https://crystalkeepsakes.com/test/cart`

4. **Error Messages:**
   - Check `/api/stripe/checkout_session_errors.log` on server
   - Look for mode detection logs

---

## 🔍 Debugging on GoDaddy

### Check PHP Error Logs:

**Location:** `/api/stripe/checkout_session_errors.log`

**What to look for:**
```
⚠️  Detected /test subdirectory - forcing TEST mode
Mode: test
Using TEST Stripe key
⚠️  Test/Development mode: Shipping and tax DISABLED for testing
```

### If Still Getting Errors:

**1. Verify Stripe Keys:**
```bash
# In your .env file, ensure you're using sk_test_ keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_...
```

**2. Check File Permissions:**
```bash
# Make sure PHP can read:
- .env file (644)
- api/ folder (755)
- vendor/ folder (755)
```

**3. Verify Vendor Path:**
```bash
# Make sure this file exists:
/test/vendor/autoload.php
```

**4. Test Direct API Access:**
Visit: `https://crystalkeepsakes.com/test/api/stripe/test-stripe-setup.php`
This should show your Stripe configuration.

---

## 📋 Complete Test Checklist

### Phase 1: Basic Access
- [ ] Can access https://crystalkeepsakes.com/test/
- [ ] Cart page loads
- [ ] Can add items to cart
- [ ] Debug overlay shows cart items

### Phase 2: Image Upload
- [ ] Add item with custom image
- [ ] Navigate to checkout
- [ ] Verify images upload to server
- [ ] Check folder: `/crystal-orders/order-images-test/CK-[timestamp]/`
- [ ] Verify images are NOT corrupted

### Phase 3: Checkout Flow
- [ ] Click "Checkout" button
- [ ] Should redirect to Stripe (NO shipping rate error)
- [ ] Can enter test card: `4242 4242 4242 4242`
- [ ] Any expiry date in future, any CVC
- [ ] Complete payment

### Phase 4: Success Flow
- [ ] Redirects to: `crystalkeepsakes.com/test/order-confirmation`
- [ ] Order confirmation shows order number
- [ ] Order number matches folder name
- [ ] Images are accessible via URL

---

## 🚨 Common Issues & Solutions

### Issue: "Stripe library not found"
**Solution:** 
- Upload `/vendor/` folder to server
- Check path in error log
- Verify file permissions

### Issue: ".env file not found"
**Solution:**
- Create `.env` file in web root (where api/ folder is)
- Not in `/test/api/`, but one level up

### Issue: Still using wrong Stripe keys
**Solution:**
- Check error logs for key prefix (sk_test vs sk_live)
- Verify `.env` file has correct keys
- Clear PHP opcache if available

### Issue: Images not uploading
**Solution:**
- Check folder permissions: `crystal-orders/order-images-test/` needs 755
- Verify path in `.env`: `CUSTOMER_IMAGE_PATH`
- Check PHP `upload_max_filesize` and `post_max_size`

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Checkout redirects to Stripe WITHOUT errors
2. ✅ Payment completes successfully
3. ✅ Redirect back to `.../test/order-confirmation`
4. ✅ Images are in correct folder with order number
5. ✅ Error log shows "Test mode: Shipping and tax DISABLED"

---

## 🔄 Next Steps After Testing Works

Once basic checkout works in /test:

1. **Add Test Shipping Rates** (Optional):
   - Create shipping rates in Stripe TEST dashboard
   - Update shipping_options with test rate IDs
   - Re-enable shipping for /test

2. **Database Integration**:
   - Test order data saving
   - Verify Cockpit3D integration

3. **Move to Production**:
   - Change `NEXT_PUBLIC_ENV_MODE=production`
   - Use live Stripe keys
   - Enable shipping with live rate IDs

---

## 📞 Need Help?

If errors persist, share:
1. Content of error log: `/api/stripe/checkout_session_errors.log`
2. Your `.env` configuration (keys redacted)
3. Exact error message from browser console
4. PHP version on GoDaddy

