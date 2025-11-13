# Stripe Checkout Setup Guide

## 🎯 Current Architecture

This is a **hybrid setup**:
- **Frontend**: Next.js running in Emergent container (port 3001)
- **Backend**: PHP running on your local MAMP (port 8888)

## ✅ What's Already Done

1. ✅ Enhanced checkout page with debug logging
2. ✅ Created `.env.local` with `NEXT_PUBLIC_PHP_BACKEND_URL`
3. ✅ Built diagnostic tools
4. ✅ Fixed Windows build scripts

## 🔧 Setup Steps on Your Local Machine

### 1. Make Sure MAMP is Running
- Start MAMP
- Verify Apache is running on port 8888
- Verify MySQL is running on port 8889

### 2. Set Up PHP Backend

```bash
# Navigate to your project directory
cd /path/to/crystalkeepsakes

# Install Composer dependencies
composer install

# This will install:
# - stripe/stripe-php (version ^18.2)
```

### 3. Create .env File for PHP

Create `.env` file in your project root with:

```env
NEXT_PUBLIC_ENV_MODE=development

# Stripe Keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
```

### 4. Update Next.js Environment

Your `.env.local` already has:
```env
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
```

**Important**: Restart Next.js dev server to pick up environment changes:
```bash
# Kill current server
pkill -f "next dev"

# Restart
yarn dev
```

## 🧪 Testing the Setup

### Step 1: Test PHP Backend Connection

Open in browser:
```
http://localhost:3001/diagnose-stripe.html
```

This will automatically check:
- ✓ PHP backend connectivity
- ✓ .env file location
- ✓ Stripe API keys loaded
- ✓ Composer vendor directory
- ✓ Stripe library loading

### Step 2: Test Checkout Session Creation

Open in browser:
```
http://localhost:3001/test-stripe-backend.html
```

This allows you to:
- Test creating a Stripe checkout session
- See exact request/response data
- View error messages

### Step 3: Test Real Checkout Flow

1. Add item to cart
2. Go to cart page
3. Click "Proceed to Checkout"
4. Monitor browser console (F12) for detailed logs

## 🐛 Common Issues & Solutions

### Issue 1: "Connection Failed" in Diagnostics

**Cause**: MAMP not running or wrong port

**Solution**:
- Start MAMP
- Verify URL: `http://localhost:8888/crystalkeepsakes/api/stripe/diagnose.php`
- Update `NEXT_PUBLIC_PHP_BACKEND_URL` in `.env.local` if different

### Issue 2: "Stripe library not found"

**Cause**: Composer dependencies not installed

**Solution**:
```bash
cd /path/to/project
composer install
```

### Issue 3: "Stripe secret key not found"

**Cause**: `.env` file missing or incorrect location

**Solution**:
- Create `.env` in project root
- PHP script searches these locations:
  - `/app/.env`
  - `/app/api/.env`
  - `{DOCUMENT_ROOT}/crystalkeepsakes/.env`
  - `{DOCUMENT_ROOT}/.env`

### Issue 4: Port 3000 vs 3001

**Note**: Next.js is running on **port 3001** because 3000 was in use.

Update URLs if needed:
- Development: `http://localhost:3001`
- Testing tools: Use port 3001

## 📁 File Structure

```
/app/
├── api/
│   └── stripe/
│       ├── create-checkout-session.php  ← Main endpoint
│       └── diagnose.php                 ← Diagnostic endpoint
├── public/
│   ├── diagnose-stripe.html            ← Backend diagnostics UI
│   └── test-stripe-backend.html        ← Checkout test UI
├── src/
│   └── app/
│       └── checkout-hosted/
│           └── page.tsx                 ← Enhanced with debug info
├── .env.local                           ← Next.js environment vars
├── composer.json                        ← PHP dependencies
└── vendor/                              ← Composer packages (local only)
```

## 🚀 Deployment Notes

### For GoDaddy Production:

1. **Upload files via FTP/cPanel**
2. **Run composer install on server**:
   ```bash
   ssh your-server
   cd public_html/crystalkeepsakes
   composer install
   ```

3. **Create production .env**:
   ```env
   NEXT_PUBLIC_ENV_MODE=production
   STRIPE_SECRET_KEY=sk_live_...
   ```

4. **Update frontend .env.production**:
   ```env
   NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
   ```

## 🔍 Debug Checklist

Before contacting support, verify:

- [ ] MAMP is running (Apache + MySQL)
- [ ] Composer dependencies installed (`vendor/` directory exists)
- [ ] `.env` file exists with Stripe keys
- [ ] `http://localhost:8888/crystalkeepsakes` is accessible
- [ ] Diagnostic tool shows all checks passing
- [ ] Browser console (F12) shows no errors
- [ ] Network tab shows successful API calls

## 📞 Next Steps

1. **Run diagnostics**: `http://localhost:3001/diagnose-stripe.html`
2. **Fix any failing checks**
3. **Test checkout**: Add item to cart → Checkout
4. **Check browser console** for detailed error logs
5. **Report specific error messages** if issues persist

---

**Note**: The Emergent container runs Next.js only. The PHP backend must run on your local MAMP or production server.
