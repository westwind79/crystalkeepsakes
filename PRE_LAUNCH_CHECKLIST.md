# 🚀 Pre-Launch Checklist - Crystal Keepsakes
**Status:** PRODUCTION READINESS CHECK  
**Date:** 2025-01-19

---

## ⚠️ CRITICAL ISSUES TO FIX NOW

### 1. Stripe Showing Sandbox in Production 🚨
**Issue:** You're seeing test checkout on production site

**Check:**
- [ ] Upload `stripe-environment-check.php` to server
- [ ] Visit: `https://crystalkeepsakes.com/stripe-environment-check.php`
- [ ] Verify it shows "✅ Configuration is CORRECT!"
- [ ] Verify keys show as "LIVE" (not TEST)

**Fix if needed:**
1. Edit `.env.production` on server
2. Ensure these exist:
   ```bash
   NEXT_PUBLIC_ENV_MODE=production
   STRIPE_SECRET_KEY=sk_live_XXXXX  # NOT sk_test_!
   NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_XXXXX  # NOT pk_test_!
   ```
3. Rebuild: `npm run build:prod`
4. Re-upload build to server
5. Clear browser cache
6. Test again

---

### 2. Directory Structure 🚨
**Issue:** crystalkeepsakes.com is inside exposethegrove.com folder

**Your Structure:**
```
/public_html/
  ├── exposethegrove.com/
  │   └── crystalkeepsakes.com/  ← Your site
  │
  └── crystal-data/  ← CREATE THIS!
      └── order-images/
```

**Check:**
- [ ] Upload `check-path.php` to crystalkeepsakes.com folder
- [ ] Visit: `https://crystalkeepsakes.com/check-path.php`
- [ ] Note the RECOMMENDED path shown
- [ ] Create crystal-data directory at that location

**Create Directory:**
```bash
# Via cPanel File Manager:
# 1. Navigate to /public_html/
# 2. Create folder: crystal-data
# 3. Inside: create order-images
# 4. Permissions: 755
```

**Update .env.production:**
```bash
# Use path from check-path.php output
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images
```

---

### 3. Database Setup 🚨
**Issue:** Database not set up yet

**Check:**
- [ ] MySQL database created in cPanel
- [ ] `schema.sql` imported via phpMyAdmin
- [ ] Tables exist: orders, order_images, order_status_history
- [ ] Database credentials in `.env.production`

**Steps:**
1. cPanel → MySQL Databases
2. Create database: `username_crystalkeepsakes`
3. Create user and grant ALL privileges
4. cPanel → phpMyAdmin
5. Select database
6. Import → Choose `schema.sql`
7. Verify tables created

**Update .env.production:**
```bash
DB_HOST=localhost
DB_NAME=username_crystalkeepsakes  # Use FULL name from cPanel
DB_USER=username_crystal
DB_PASS=your_password_here
```

---

## STRIPE CONFIGURATION

### Live Account Checklist
- [ ] Stripe account fully activated (not restricted)
- [ ] Business information completed
- [ ] Bank account connected for payouts
- [ ] Tax ID provided (if required)
- [ ] Identity verification completed

**Check at:** https://dashboard.stripe.com/settings/account

### Stripe Live Mode Requirements

**1. Account Activation:**
- [ ] Email verified
- [ ] Business details submitted
- [ ] Bank account for payouts added
- [ ] No restrictions on account

**2. Tax Settings:**
- [ ] Automatic tax enabled (if applicable)
- [ ] Tax locations configured

**Go to:** https://dashboard.stripe.com/settings/tax

**3. Shipping Rates Created:**
- [ ] 3-5 Business Days: `shr_1RRRX82YE48VQlzYpcQsdaSE`
- [ ] 5-7 Ground Ship: `shr_1RRRZF2YE48VQlzY3XrqHEPm`
- [ ] 7-10 Ground Ship: `shr_1RRRZp2YE48VQlzYYqNzpUQj`
- [ ] 10-14 Ground Ship: `shr_1RRRaI2YE48VQlzYUG3v8RPf`
- [ ] 3-4 Weeks Postal: `shr_1RRRbE2YE48VQlzYypBEVG4V`

**Check:** https://dashboard.stripe.com/shipping-rates

**4. Webhook Setup (LIVE MODE):**
- [ ] Webhook endpoint added
- [ ] URL: `https://crystalkeepsakes.com/api/stripe/stripe-webhook.php`
- [ ] Events selected:
  - [x] checkout.session.completed
  - [x] payment_intent.succeeded
  - [x] payment_intent.payment_failed
- [ ] Webhook secret saved in .env.production

**Get secret:** https://dashboard.stripe.com/webhooks

```bash
# Add to .env.production
STRIPE_WEBHOOK_SECRET=whsec_XXXXX  # LIVE webhook secret
```

### Key Format Verification

**✅ LIVE Keys (Production):**
- Secret: `sk_live_51...`
- Publishable: `pk_live_51...`
- Webhook: `whsec_...`

**✅ TEST Keys (Development/Testing):**
- Secret: `sk_test_51...`
- Publishable: `pk_test_51...`
- Webhook: `whsec_...`

---

## ENVIRONMENT FILES

### Production (.env.production)
```bash
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# LIVE Stripe Keys
STRIPE_SECRET_KEY=sk_live_XXXXX
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_XXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXX

# Images
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images

# Database
DB_HOST=localhost
DB_NAME=username_crystalkeepsakes
DB_USER=username_crystal
DB_PASS=your_password
```

### Testing (.env.production.test)
```bash
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test

# TEST Stripe Keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_XXXXX
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_XXXXX

# Images
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images-test

# Database (same or separate)
DB_HOST=localhost
DB_NAME=username_crystalkeepsakes_test
DB_USER=username_crystal
DB_PASS=your_password
```

---

## TESTING SEQUENCE

### 1. Environment Verification
```bash
# Upload and run all test scripts
https://crystalkeepsakes.com/stripe-environment-check.php
https://crystalkeepsakes.com/check-path.php
https://crystalkeepsakes.com/test-godaddy-upload.php
```

**Expected Results:**
- ✅ Stripe shows LIVE keys
- ✅ Paths show crystal-data location
- ✅ Image upload succeeds
- ✅ Image accessible via URL

### 2. Debug Panel Check
```bash
# Visit site normally
https://crystalkeepsakes.com

# Check console (F12)
# Should be: CLEAN (no debug logs)

# Check page
# Should see: NO debug button in bottom right

# Add debug parameter
https://crystalkeepsakes.com/?debug=true

# Now should see: Debug button appears
# Click it and verify:
# - Mode: production (RED)
# - Stripe: LIVE (RED)
```

### 3. Test Order (Small Amount)
```bash
# Use your own real card
# Place order for $1 item (or smallest product)
# Verify:
# - Checkout shows LIVE Stripe page (not test mode)
# - Payment completes
# - Redirects to order confirmation
# - Order appears in Stripe LIVE dashboard
# - Order email received
# - Image uploaded to crystal-data directory
```

**Test Card Numbers (ONLY in test mode):**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

**⚠️ In production, these test cards will NOT work! Use real card.**

---

## PRODUCTION VERIFICATION

### Before Going Live
- [ ] All test scripts pass
- [ ] Debug panel hidden without ?debug=true
- [ ] Console clean (no debug logs)
- [ ] Stripe shows LIVE mode
- [ ] Test order with real card succeeds
- [ ] Images saved to persistent location
- [ ] Database records order correctly
- [ ] Order confirmation email sent
- [ ] Stripe webhook receives event

### After First Real Order
- [ ] Check Stripe dashboard for charge
- [ ] Verify order in database
- [ ] Confirm customer image saved
- [ ] Test image URL is accessible
- [ ] Verify webhook processed order
- [ ] Check for any PHP errors in logs

---

## STRIPE DASHBOARD CHECKLIST

### Before Accepting Payments
1. **Account Settings** → https://dashboard.stripe.com/settings/account
   - [ ] Business information complete
   - [ ] Bank account connected
   - [ ] Payouts enabled

2. **Tax Settings** → https://dashboard.stripe.com/settings/tax
   - [ ] Automatic tax enabled (or configured)
   - [ ] Tax registration completed (if required)

3. **Customer Communications** → https://dashboard.stripe.com/settings/emails
   - [ ] Receipt emails enabled
   - [ ] Custom branding set up (optional)

4. **Radar (Fraud Prevention)** → https://dashboard.stripe.com/radar/overview
   - [ ] Fraud rules reviewed
   - [ ] Default settings acceptable

5. **Webhooks** → https://dashboard.stripe.com/webhooks
   - [ ] Live webhook endpoint configured
   - [ ] Test webhook working in test mode

### Monitor After Launch
- Daily: Check for failed payments
- Daily: Review webhook delivery status
- Weekly: Check for disputes/chargebacks
- Monthly: Review payout schedule

---

## TROUBLESHOOTING

### If Stripe Still Shows Test Mode
1. Clear browser cache completely
2. Open incognito/private window
3. Check stripe-environment-check.php
4. Verify .env.production has sk_live_ keys
5. Rebuild: `npm run build:prod`
6. Re-upload entire build

### If Images Not Saving
1. Run check-path.php to verify structure
2. Create crystal-data directory at correct level
3. Set permissions: 755
4. Update CUSTOMER_IMAGE_PATH in .env.production
5. Test: php test-godaddy-upload.php

### If Database Connection Fails
1. Verify database exists in cPanel
2. Check database name includes username prefix
3. Verify user has ALL PRIVILEGES
4. Test connection: `php -r "require 'api/stripe/db-connect.php'; echo 'OK';"`

---

## EMERGENCY CONTACTS

**If Something Goes Wrong:**
1. Disable checkout (maintenance mode)
2. Switch back to test mode temporarily
3. Fix issues
4. Retest thoroughly
5. Re-enable live mode

**Stripe Support:**
- Dashboard: https://dashboard.stripe.com/support
- Docs: https://stripe.com/docs
- Phone: Check your dashboard for support number

**GoDaddy Support:**
- Phone: 1-480-505-8877
- Help: https://www.godaddy.com/help

---

## FINAL CHECKLIST

### Technical
- [ ] Stripe shows LIVE keys
- [ ] Debug panel hidden in production
- [ ] Console clean (no logs)
- [ ] Database connected
- [ ] Images saved correctly
- [ ] Test order completes

### Business
- [ ] Stripe account activated
- [ ] Bank account connected
- [ ] Payouts enabled
- [ ] Tax settings configured
- [ ] Webhooks working

### Legal
- [ ] Terms of service displayed
- [ ] Privacy policy displayed
- [ ] Refund policy clear
- [ ] Contact information visible

---

## GO LIVE

When ALL items checked:
1. Place final test order with real card (small amount)
2. Verify everything works end-to-end
3. Refund test order in Stripe dashboard
4. Remove test data from database
5. Announce launch! 🎉

---

**Last Updated:** 2025-01-19  
**Status:** Ready for final verification  
**Next:** Run all test scripts and verify results
