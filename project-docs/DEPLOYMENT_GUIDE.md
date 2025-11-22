# CrystalKeepsakes Deployment Guide

## Overview

This guide covers deploying to:
1. **Test Environment** - https://crystalkeepsakes.com/test/ (password-protected)
2. **Production** - https://crystalkeepsakes.com/ (live site)

---

## 🧪 Test Environment Deployment

### Purpose
Password-protected staging site for testing before going live.

### Configuration

**File**: `.env.production.test`

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com/test

# Test Environment Password
NEXT_PUBLIC_TEST_PASSWORD=TestAccess2025

# Use TEST Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Use TEST Cockpit3D credentials
COCKPIT3D_USERNAME=test_username
COCKPIT3D_PASSWORD=test_password
```

### Build Command

```bash
npm run build:test
```

This will:
- Build Next.js with `/test` base path
- Enable password protection
- Use TEST API keys
- Copy PHP files to `/out/test/`
- Generate static export in `/out/` directory

### Upload to Server

Upload the contents of `/out/` to your server:

```bash
# Via FTP/SFTP: Upload /out/ contents to public_html/
# Result: Files will be at public_html/test/

# Or via rsync:
rsync -avz --delete out/ user@crystalkeepsakes.com:~/public_html/
```

### Server Structure (After Upload)

```
public_html/
├── test/                          # Test environment
│   ├── _next/                     # Next.js assets
│   ├── api/                       # PHP files
│   │   ├── contact.php
│   │   └── send-order-notification.php
│   ├── index.html
│   └── [other pages]
└── [production files]
```

### Access Test Site

1. **URL**: https://crystalkeepsakes.com/test/
2. **Password**: `TestAccess2025` (or whatever you set in `.env.production.test`)
3. **Login Page**: Automatically shown on first visit
4. **Session**: Cookie lasts 24 hours

### Email Behavior (Test)
- Uses **PHP mail()** (production-like)
- Sends to real email addresses
- No Mailhog

---

## 🚀 Production Deployment

### Purpose
Live site for customers.

### Configuration

**File**: `.env.production`

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com

# Use LIVE Stripe keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Use PRODUCTION Cockpit3D credentials
COCKPIT3D_USERNAME=production_username
COCKPIT3D_PASSWORD=production_password
```

### Build Command

```bash
npm run build:prod
```

This will:
- Build Next.js with NO base path (root)
- NO password protection
- Use LIVE API keys
- Copy PHP files to `/out/`
- Generate static export in `/out/` directory

### Upload to Server

```bash
# IMPORTANT: Back up existing site first!
# Then upload /out/ contents to public_html/

# Via FTP/SFTP: Upload /out/ contents to public_html/
# Result: Files will be at public_html/ (root)

# Or via rsync:
rsync -avz --delete out/ user@crystalkeepsakes.com:~/public_html/
```

### Server Structure (After Upload)

```
public_html/
├── _next/                         # Next.js assets
├── api/                           # PHP files
│   ├── contact.php
│   └── send-order-notification.php
├── products/
├── cart/
├── checkout/
├── index.html
└── [other pages and directories]
```

### Email Behavior (Production)
- Uses **PHP mail()** function
- Sends to real email addresses
- Routes based on topic:
  - Orders → orders@crystalkeepsakes.com
  - Support → support@crystalkeepsakes.com
  - General → info@crystalkeepsakes.com

---

## 📋 Pre-Deployment Checklist

### Before Building (Test or Production)

- [ ] Update `.env.production.test` or `.env.production` with real credentials
- [ ] Verify Stripe keys (test vs live)
- [ ] Verify Cockpit3D credentials
- [ ] Verify email addresses
- [ ] Test locally if possible
- [ ] Review admin panel settings (if using `/admin`)

### After Upload

- [ ] Test contact form
- [ ] Test product browsing
- [ ] Test add to cart
- [ ] Test checkout flow (use test card: 4242 4242 4242 4242)
- [ ] Verify order emails arrive
- [ ] Check all pages load correctly
- [ ] Test on mobile devices
- [ ] Check browser console for errors

---

## 🔑 API Keys & Credentials

### Stripe

**Test Keys** (for /test/ environment):
- Get from: https://dashboard.stripe.com/test/apikeys
- Publishable Key: `pk_test_...`
- Secret Key: `sk_test_...`
- Test Card: 4242 4242 4242 4242

**Live Keys** (for production):
- Get from: https://dashboard.stripe.com/apikeys
- Publishable Key: `pk_live_...`
- Secret Key: `sk_live_...`

### Cockpit3D

Contact your Cockpit3D account manager for:
- API Base URL: https://api.cockpit3d.com
- Test Username/Password
- Production Username/Password

---

## 🐛 Troubleshooting

### Test Password Not Working
- Check `.env.production.test` has `NEXT_PUBLIC_TEST_PASSWORD` set
- Rebuild: `npm run build:test`
- Clear browser cookies and try again

### Email Not Sending
- Verify PHP `mail()` function is enabled on server
- Check email addresses in `.env.production.test` or `.env.production`
- Check server email logs (ask hosting provider)

### Pages Return 404
- Ensure you uploaded to correct directory
- Check `.htaccess` file exists in root
- Verify basePath in build matches URL structure

### Stripe Not Working
- Verify you're using correct keys (test vs live)
- Check Stripe Dashboard for errors
- Ensure webhook URL is configured

---

## 📁 Important Files

### Environment Files
- `.env` - Development (Mailhog)
- `.env.production.test` - Test environment
- `.env.production` - Production

### Build Outputs
- `/out/` - Static export directory
- `/out/test/` - Test build (if using build:test)

### PHP Files (Copied during build)
- `/public/api/contact.php`
- `/api/cockpit3d/send-order-notification.php`

### Scripts
- `scripts/copy-api.js` - Copies PHP files
- `scripts/copy-env.js` - Copies environment files
- `scripts/prepare-production.sh` - Production prep

---

## 🔄 Updating After Initial Deployment

### Quick Updates (Content/Styles)
1. Make changes
2. Run build command
3. Upload changed files only

### Full Redeploy
1. Run full build: `npm run build:test` or `npm run build:prod`
2. Upload entire `/out/` directory
3. Test site

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check server error logs
3. Verify all environment variables are set
4. Test in incognito/private mode
5. Contact hosting provider for server issues
