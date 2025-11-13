# Environment Variables Setup

## 🔐 Security Notice

**NEVER commit real API keys to the repository!**

All sensitive credentials should be stored in `.env.local` (gitignored) or your hosting environment's secrets management.

## 📝 Quick Setup

### 1. Copy the Example File

```bash
cp .env.example .env.local
```

### 2. Fill in Your Credentials

Edit `.env.local` and replace all placeholder values:

#### Stripe Keys (Required for Checkout)

Get your keys from: https://dashboard.stripe.com/apikeys

```env
# For development/testing
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_ACTUAL_TEST_KEY
STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_TEST_KEY

# For production (use live keys)
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_KEY
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_KEY

# Webhook secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET
```

#### Cockpit3D API (Required for 3D Product Rendering)

Get your credentials from: https://cockpit3d.com

```env
NEXT_PUBLIC_COCKPIT3D_SHOP_ID=your_actual_shop_id
COCKPIT3D_API_TOKEN=your_actual_api_token
COCKPIT3D_RETAIL_ID=your_actual_retail_id
COCKPIT3D_USERNAME=your_actual_email@example.com
COCKPIT3D_PASSWORD=your_actual_password
```

#### Database Credentials (For Order Storage)

```env
DB_HOST=localhost
DB_NAME=crystal_orders
DB_USER=your_actual_db_user
DB_PASS=your_actual_db_password
```

### 3. Restart Your Dev Server

After updating environment variables:

```bash
# Stop the server (Ctrl+C)
# Then restart
yarn dev
```

## 🎯 Environment Modes

The app supports three modes via `NEXT_PUBLIC_ENV_MODE`:

- **`development`** - Uses test Stripe keys, shows debug UI
- **`testing`** - Staging environment on production server
- **`production`** - Live site with real Stripe keys

## 🚀 Deployment

### Local Development (MAMP)

1. Create `.env.local` as described above
2. Ensure `NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes`
3. Run `yarn dev`

### Production (GoDaddy/cPanel)

1. Create `.env` file on the server (not `.env.local`)
2. Set `NEXT_PUBLIC_ENV_MODE=production`
3. Use **live** Stripe keys
4. Update `NEXT_PUBLIC_PHP_BACKEND_URL=https://yourdomain.com`

### Environment Variables in Hosting

Most hosting providers allow setting environment variables via:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **cPanel**: PHP Selector → Options → Add variables
- **AWS/GCP/Azure**: Console → App Settings → Configuration

## ⚠️ Common Mistakes

1. **Using test keys in production** - Always use `sk_live_*` and `pk_live_*` for production
2. **Hardcoding keys in code** - Use `process.env.VARIABLE_NAME` instead
3. **Committing .env.local** - Already in .gitignore, but double-check!
4. **Wrong key format** - Stripe keys have specific prefixes:
   - Secret: `sk_test_*` or `sk_live_*`
   - Publishable: `pk_test_*` or `pk_live_*`
   - Webhook: `whsec_*`

## 🔍 Verifying Your Setup

After setting up environment variables, run diagnostics:

```
http://localhost:3001/diagnose-stripe.html
```

This will verify:
- ✅ All required variables are set
- ✅ Stripe keys are valid format
- ✅ PHP backend can access credentials
- ✅ Stripe library is working

## 📋 Required Variables Checklist

### Minimum for Development:

- [ ] `NEXT_PUBLIC_PHP_BACKEND_URL`
- [ ] `STRIPE_DEVELOPMENT_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### For Production:

- [ ] `NEXT_PUBLIC_ENV_MODE=production`
- [ ] `STRIPE_SECRET_KEY` (live)
- [ ] `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_PHP_BACKEND_URL` (production domain)

### Optional (For Full Features):

- [ ] Cockpit3D credentials (for 3D rendering)
- [ ] Database credentials (for order storage)
- [ ] Email/SMTP settings (for notifications)

## 🆘 Troubleshooting

### "Stripe key not found" Error

1. Check `.env.local` exists and has the key
2. Verify key format starts with `sk_test_` or `sk_live_`
3. Restart dev server after adding keys

### "Cannot connect to PHP backend" Error

1. Verify `NEXT_PUBLIC_PHP_BACKEND_URL` is correct
2. Ensure MAMP/Apache is running
3. Test the URL directly in browser

### Keys Not Loading

- Environment variables must start with `NEXT_PUBLIC_` to be accessible in client-side code
- Server-only keys (like `STRIPE_SECRET_KEY`) should NOT have `NEXT_PUBLIC_` prefix

## 📚 Additional Resources

- [Stripe API Keys](https://stripe.com/docs/keys)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Remember**: Keep your `.env.local` file safe and never share it publicly!
