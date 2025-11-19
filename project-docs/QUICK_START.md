# 🚀 Quick Start - Test Stripe Checkout

## Current Status
- ✅ Next.js running on port 3001
- ✅ Diagnostic tools created
- ✅ Enhanced checkout with debug info
- ⏳ PHP backend needs to be running on your machine

## 🔍 Step 1: Check PHP Backend (2 minutes)

**On Your Local Machine:**

1. Start MAMP (if not running)
2. Open Terminal/Command Prompt:
   ```bash
   cd /path/to/crystalkeepsakes
   composer install
   ```

3. Create `.env` file in project root:
   ```env
   NEXT_PUBLIC_ENV_MODE=development
   STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
   ```

4. Test PHP backend directly:
   ```
   http://localhost:8888/crystalkeepsakes/api/stripe/diagnose.php
   ```
   
   Should return JSON with diagnostic results.

## 🧪 Step 2: Run Diagnostics (1 minute)

Open in browser:
```
http://localhost:3001/diagnose-stripe.html
```

This page will automatically:
- Test connection to PHP backend
- Check if .env variables are loaded
- Verify Stripe library is installed
- Show exactly what's missing

**Expected Results:**
- ✅ All checks should show "PASS"
- ❌ If any "FAIL", follow the suggestions shown

## 🛒 Step 3: Test Checkout (2 minutes)

1. **Add item to cart**: 
   ```
   http://localhost:3001/products
   ```

2. **View cart**:
   ```
   http://localhost:3001/cart
   ```

3. **Open Browser DevTools** (F12) → Console tab

4. **Click "Proceed to Checkout"**

5. **Watch the console** for detailed logs:
   ```
   🔍 Making API call: {url, itemCount, subtotal}
   📡 Response received: {status, statusText}
   📄 Raw response: ...
   ```

## 🐛 What You'll See

### If PHP Backend is Running:
- Console shows API call details
- Either redirects to Stripe OR shows specific error
- Debug info panel appears if error occurs

### If PHP Backend is NOT Running:
```
❌ Checkout error Error: Failed to create checkout session

🔍 Debug Information:
{
  "url": "http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php",
  "status": 0,
  "statusText": "",
  "error": "Network error / CORS / Server not responding"
}
```

**Solution**: Start MAMP and ensure PHP backend is accessible.

## 📋 Quick Checklist

Before testing checkout, verify:

- [ ] MAMP is running (green lights)
- [ ] `http://localhost:8888` shows Apache landing page
- [ ] Composer installed dependencies (`vendor/` folder exists)
- [ ] `.env` file created with Stripe key
- [ ] Diagnostic page shows all PASS
- [ ] Browser DevTools console is open

## 🎯 Expected Checkout Flow

1. **User clicks checkout** → Console logs API call
2. **Frontend calls PHP backend** → `/api/stripe/create-checkout-session.php`
3. **PHP creates Stripe session** → Returns session URL
4. **Frontend redirects** → `checkout.stripe.com`
5. **User completes payment** → Redirects to order confirmation

## 📞 If Something Goes Wrong

**Check these in order:**

1. **Diagnostic page** - What's failing?
2. **Browser console (F12)** - What errors appear?
3. **Network tab** - Did the API call reach backend?
4. **PHP error log** - Check `/api/stripe/checkout_session_errors.log`

**Common Fixes:**

| Issue | Solution |
|-------|----------|
| Connection failed | Start MAMP |
| Stripe library not found | Run `composer install` |
| Invalid JSON response | Check PHP syntax errors |
| CORS error | Verify allowed origins in PHP |
| 500 error | Check Stripe API key validity |

## 🎉 Success Looks Like:

1. Diagnostic page: All green checkmarks ✅
2. Checkout click: Console shows successful API call
3. Browser redirects to Stripe checkout page
4. You can see Stripe's payment form

## 📁 Useful URLs

- **Diagnostics**: http://localhost:3001/diagnose-stripe.html
- **Backend Test**: http://localhost:3001/test-stripe-backend.html
- **Products**: http://localhost:3001/products
- **Cart**: http://localhost:3001/cart
- **PHP Diagnostic**: http://localhost:8888/crystalkeepsakes/api/stripe/diagnose.php

---

**Time Estimate**: 5-10 minutes to get everything working

**Need Help?** Check the console logs first - they show exactly what's happening!
