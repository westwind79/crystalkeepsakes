# ⚠️ CRITICAL: .env File Required for Checkout

## Problem
Checkout is failing because `.env` file doesn't have the required variable.

## Solution
In your **LOCAL** `.env` file (at `/crystalkeepsakes/.env` on your machine), add this line:

```env
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
```

## Full Example .env
Your `.env` file should look like this:

```env
# Backend URL for PHP APIs
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# ... rest of your existing variables ...
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_BASE_PATH=

# Stripe test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_...

# Cockpit3D
COCKPIT3D_USERNAME=...
COCKPIT3D_PASSWORD=...

# etc...
```

## Why This Is Needed
- Checkout page needs to know where your PHP backend is
- In development: `http://localhost:8888/crystalkeepsakes`
- In production: `https://crystalkeepsakes.com`
- Test environment: `https://crystalkeepsakes.com/test`

## After Adding
1. Save your `.env` file
2. Restart dev server: `npm run dev`
3. Try checkout again

---

**Note:** `.env` files are NOT tracked in git (they're in `.gitignore`). This is correct - each environment has its own .env file.
