# 🚀 Quick Deploy to GoDaddy /test

## ✅ What Was Fixed

The code now:
1. ✅ Automatically detects `/test` subdirectory from URL
2. ✅ Forces TEST mode (disables shipping rates)
3. ✅ Uses TEST Stripe keys
4. ✅ Keeps URLs within `/test` subdirectory
5. ✅ Logs all mode detection for debugging

---

## 📦 Files to Upload to GoDaddy /test

### Critical Files (Must Upload):

1. **`/api/stripe/create-checkout-session.php`** ← **UPDATED - MUST UPLOAD**
2. **`/api/env-loader.php`**
3. **`/api/customer-image-upload.php`**
4. **All other `/api/` files**
5. **`/vendor/` folder** (if no Composer on server)

### How to Prepare Vendor Folder:

```bash
# On your local machine:
cd /path/to/crystalkeepsakes
composer install --no-dev

# This creates /vendor/ folder with Stripe library
# Upload this entire folder to GoDaddy /test/vendor/
```

---

## 🔧 GoDaddy Configuration

### 1. Create .env File

Create a file named `.env` in your `/test/` root (same level as `api/` folder):

```env
# === STRIPE KEYS (USE TEST KEYS!) ===
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE

# === ENVIRONMENT ===
# Optional - will auto-detect from /test URL
NEXT_PUBLIC_ENV_MODE=test

# === IMAGE STORAGE ===
# Adjust paths for your GoDaddy server
CUSTOMER_IMAGE_PATH=/home/your_username/crystal-orders/order-images-test
CUSTOMER_IMAGE_URL_BASE=https://crystalkeepsakes.com/test/crystal-orders/order-images-test

# === OPTIONAL: Database if you need it ===
# DB_HOST=localhost
# DB_NAME=your_database
# DB_USER=your_username
# DB_PASS=your_password
```

### 2. Directory Structure on GoDaddy

```
/public_html/test/
├── .env                                  ← CREATE THIS
├── api/
│   ├── stripe/
│   │   └── create-checkout-session.php   ← UPLOAD UPDATED VERSION
│   ├── customer-image-upload.php
│   ├── env-loader.php
│   └── ...
├── vendor/                               ← UPLOAD IF NO COMPOSER
│   ├── autoload.php
│   └── stripe/
├── .next/                                ← Your Next.js build
├── public/
└── crystal-orders/                       ← Create for images
    └── order-images-test/                ← 755 permissions
```

### 3. Set Folder Permissions

```bash
# Via FTP or cPanel File Manager:
chmod 755 /test/api/
chmod 755 /test/vendor/
chmod 755 /test/crystal-orders/
chmod 755 /test/crystal-orders/order-images-test/
chmod 644 /test/.env
```

---

## 🧪 Test the Fix

### Step 1: Basic Test
Visit: `https://crystalkeepsakes.com/test/`

### Step 2: Add to Cart
Add any product to cart (with or without custom image).

### Step 3: Try Checkout
Click "Checkout" - you should:
- ✅ NOT see "No such shipping rate" error
- ✅ Get redirected to Stripe checkout page
- ✅ See email + card + **shipping address fields** (for Cockpit3D)
- ✅ NOT see shipping rate/speed selection
- ✅ NOT see tax calculations

### Step 4: Complete Test Payment
Use Stripe test card:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Step 5: Verify Success
- ✅ Redirects to: `crystalkeepsakes.com/test/order-confirmation`
- ✅ Shows order number
- ✅ If images uploaded: Check folder exists with order number

---

## 🔍 Debugging

### Check PHP Error Logs

**File:** `/test/api/stripe/checkout_session_errors.log`

**Look for these messages:**
```
=== CHECKOUT SESSION REQUEST ===
⚠️  Detected /test subdirectory - forcing TEST mode
Mode: test
Using TEST Stripe key
✓ Stripe loaded from: /path/to/vendor/autoload.php
⚠️  Test/Development mode: Shipping and tax DISABLED for testing
✓ Checkout session created: cs_test_...
```

### Browser Console

**Open Dev Tools (F12) → Console Tab**

Look for:
```
🎫 Generated Order Number: CK-1234567890-ABCD
📤 Uploading customer images to server...
✅ Images uploaded, preparing checkout...
```

### Test Individual Components

**Test 1: Check if API is reachable:**
```
https://crystalkeepsakes.com/test/api/stripe/test-stripe-setup.php
```

**Test 2: Check env file:**
```
https://crystalkeepsakes.com/test/api/debug-env.php
```

---

## ⚠️ Common Issues

### "Stripe library not found"
**Solution:** 
- Upload `/vendor/` folder
- Check that `/test/vendor/autoload.php` exists
- Verify file permissions (755 for folders, 644 for files)

### ".env file not found" 
**Solution:**
- Place `.env` at `/test/.env` (not in `/test/api/.env`)
- Check file permissions (644)
- Ensure it's named exactly `.env` (with the dot)

### "Wrong Stripe key mode"
**Solution:**
- Check error log for: "WARNING: Test mode but using live key"
- Update `.env` to use `sk_test_...` key for `STRIPE_DEVELOPMENT_SECRET_KEY`

### Images not uploading
**Solution:**
- Create folder: `/test/crystal-orders/order-images-test/`
- Set permissions: `chmod 755 order-images-test/`
- Update `.env` with correct `CUSTOMER_IMAGE_PATH`

### Still redirecting to wrong URL
**Solution:**
- Clear browser cache
- Check PHP error log for base URL detection
- Verify `.htaccess` is not interfering

---

## 📝 What to Share if Issues Persist

1. **Error Log Content:**
   ```
   /test/api/stripe/checkout_session_errors.log
   ```

2. **Browser Console Errors:**
   ```
   Press F12 → Console Tab → Copy any red errors
   ```

3. **Your .env Configuration:**
   ```
   (Share with API keys redacted as sk_test_xxx...)
   ```

4. **Exact Error Message:**
   ```
   The full error text you see on screen
   ```

---

## 🎯 Success Checklist

- [ ] Updated `create-checkout-session.php` uploaded to server
- [ ] `.env` file created with TEST Stripe keys
- [ ] `/vendor/` folder uploaded (or Composer installed)
- [ ] Image folders created with correct permissions
- [ ] Can access /test/ homepage
- [ ] Can add items to cart
- [ ] Checkout redirects to Stripe (no shipping rate error)
- [ ] Can complete test payment
- [ ] Redirects back to /test/order-confirmation
- [ ] Images upload successfully

Once all checked: **You're ready for full testing!** ✅

