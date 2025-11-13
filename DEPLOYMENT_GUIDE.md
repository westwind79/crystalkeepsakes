# Deployment Guide: crystalkeepsakes.com/test

## Server Directory Structure

```
/public_html/crystalkeepsakes/
├── .env                          # PHP environment variables
├── api/                          # PHP backend files
│   └── stripe/
│       ├── create-checkout-session.php
│       └── (other PHP files)
└── test/                         # Next.js static site
    ├── .htaccess
    ├── index.html
    ├── _next/
    ├── products/
    ├── cart/
    └── (all built files)
```

## Deployment Steps

### 1. Build the Site Locally

```bash
cd /app
./deploy-to-test.sh
```

This creates the `out` folder with all static files.

### 2. Upload Files via FTP/SFTP

**Upload Everything from 'out' folder:**
```
Local: ./out/*
Server: /public_html/crystalkeepsakes/test/
```

The build automatically includes:
- All Next.js static files
- PHP backend in `out/api/`
- .htaccess file

So you only upload ONE folder!

### 3. Create Server .env File

Create `/public_html/crystalkeepsakes/.env` with:

```env
STRIPE_SECRET_KEY=sk_test_51RRRxxxxxx
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_51RRRxxxxxx
COCKPIT3D_RETAILER_ID=256568874
NEXT_PUBLIC_ENV_MODE=production
```

### 4. Set File Permissions

```bash
# PHP files need execute permissions
chmod 755 /public_html/crystalkeepsakes/api/stripe/*.php

# .env should be protected
chmod 600 /public_html/crystalkeepsakes/.env
```

### 5. Verify PHP Backend

Test the PHP endpoint:
```bash
curl https://crystalkeepsakes.com/api/stripe/create-checkout-session.php \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

Should return JSON (not HTML 404).

### 6. Test the Site

Visit: https://crystalkeepsakes.com/test

**Test checklist:**
- [ ] Homepage loads
- [ ] Products page loads
- [ ] Product detail page loads
- [ ] Can add to cart
- [ ] Cart displays correctly
- [ ] Custom text works
- [ ] Images upload and display
- [ ] Checkout button works
- [ ] Redirects to Stripe
- [ ] Can complete test payment

## Troubleshooting

### Issue: 404 Errors on Subfolder Routes

**Solution:** Check .htaccess RewriteBase is set to `/test/`

### Issue: PHP Backend Returns 404

**Causes:**
1. PHP files not uploaded to correct location
2. .htaccess blocking .php files
3. PHP not enabled on server

**Check:**
```bash
# Test PHP is working
curl https://crystalkeepsakes.com/api/stripe/create-checkout-session.php
```

### Issue: Assets (CSS/JS) Not Loading

**Causes:**
1. NEXT_PUBLIC_BASE_PATH not set during build
2. Files uploaded to wrong directory

**Fix:** Rebuild with correct .env.production.test file

### Issue: Stripe Checkout Fails

**Causes:**
1. STRIPE_SECRET_KEY not set in server .env
2. PHP backend URL incorrect in frontend

**Check:**
- Frontend calls: `https://crystalkeepsakes.com/api/stripe/create-checkout-session.php`
- PHP .env has valid Stripe key

### Issue: Images Don't Display

**Check:**
1. Image paths in database/static files
2. Server has images in `/public_html/crystalkeepsakes/test/img/`

## URLs Reference

**Frontend (Static Site):**
- Homepage: `https://crystalkeepsakes.com/test/`
- Products: `https://crystalkeepsakes.com/test/products/`
- Cart: `https://crystalkeepsakes.com/test/cart/`
- Checkout: `https://crystalkeepsakes.com/test/checkout-hosted/`

**Backend (PHP):**
- Stripe Checkout: `https://crystalkeepsakes.com/api/stripe/create-checkout-session.php`
- Cockpit3D Data: `https://crystalkeepsakes.com/api/cockpit3d-data-fetcher.php`

## Production Deployment (When Ready)

To deploy to `https://crystalkeepsakes.com/`:

1. Update `.env.production`:
   ```env
   NEXT_PUBLIC_BASE_PATH=
   NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
   ```

2. Build:
   ```bash
   cp .env.production .env.production.local
   yarn build
   ```

3. Upload `out/*` to `/public_html/crystalkeepsakes/`

4. Update Stripe keys to live keys in server .env
