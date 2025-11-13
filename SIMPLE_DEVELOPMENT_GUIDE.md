# Simple Development Guide
## Crystal Keepsakes - How to Run Your Website

---

## What You Have

Your website is split into TWO pieces:

1. **Next.js (The Website)**
   - Shows product pages, cart, checkout form
   - Runs on: **http://localhost:3000**
   - Start with: `npm run dev`

2. **PHP (Payment Processing)**
   - Handles Stripe payments
   - Runs on: **http://localhost:8888**
   - Start with: **MAMP**

**BOTH need to be running for checkout to work!**

---

## How to Start Development

### Step 1: Start MAMP

1. Open **MAMP** application
2. Click **"Start"** button
3. Wait for both Apache and MySQL to turn green
4. Verify it's working: Open browser → `http://localhost:8888`
   - Should see MAMP success page

### Step 2: Start Next.js

1. Open terminal/command prompt
2. Navigate to project:
   ```bash
   cd C:\MAMP\htdocs\crystalkeepsakes
   ```
3. Start the website:
   ```bash
   npm run dev
   ```
4. Wait for: `✓ Ready in 924ms`
5. Open browser: `http://localhost:3000`

**That's it!** Both are now running and can talk to each other.

---

## What Each Part Does

### Next.js (Port 3000)
```
✓ Homepage
✓ Product pages
✓ Cart
✓ Checkout form (collects info)
✓ Shows products
✓ Image editor
```

### PHP (Port 8888)
```
✓ Stripe payment processing
✓ Create payment intents
✓ Handle webhooks
✓ Submit orders to Cockpit3D
✓ Database storage
```

### How They Work Together

```
Customer fills out checkout form (Next.js)
        ↓
Click "Pay Now"
        ↓
Next.js calls: http://localhost:8888/crystalkeepsakes/api/stripe/create-payment-intent.php
        ↓
PHP talks to Stripe
        ↓
PHP sends back: "Here's your payment form"
        ↓
Customer enters card (Stripe)
        ↓
Payment succeeds
        ↓
PHP submits order to Cockpit3D
        ↓
Done!
```

---

## Troubleshooting

### Error: "Payment intent failed: 500"

**Problem:** MAMP is not running

**Solution:**
1. Check MAMP - are both servers green?
2. Test PHP: http://localhost:8888/crystalkeepsakes/api/stripe/create-payment-intent.php
3. Should see a PHP error (not "can't connect")

### Error: "ECONNREFUSED"

**Problem:** MAMP is definitely not running

**Solution:**
1. Start MAMP
2. Wait 30 seconds
3. Refresh your website

### Products Don't Load

**Problem:** Data file missing or MAMP not running (for initial fetch)

**Solution:**
1. Ensure MAMP is running
2. Run: `node scripts/fetch-cockpit3d-products.js`
3. Restart Next.js: `npm run dev`

---

## File Structure (Simple)

```
C:\MAMP\htdocs\crystalkeepsakes\
│
├── src/                    ← Next.js website code
│   ├── app/               ← Pages (home, products, cart, checkout)
│   ├── components/        ← Reusable parts (buttons, modals)
│   └── lib/               ← Helper functions (cart, stripe)
│
├── api/                    ← PHP backend
│   ├── stripe/            ← Payment processing
│   │   ├── create-payment-intent.php
│   │   └── stripe-webhook.php
│   └── cockpit3d/         ← Order submission
│
├── public/                 ← Images, static files
└── out/                    ← Built website (for upload to GoDaddy)
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start MAMP (GUI application)
# 2. In terminal:
cd C:\MAMP\htdocs\crystalkeepsakes
npm run dev

# 3. Open browser:
http://localhost:3000

# Make changes to files → Website auto-updates!
```

### Before Deploying to GoDaddy

```bash
# 1. Ensure MAMP is running
# 2. Build the website:
npm run build

# 3. Upload to GoDaddy:
#    - Upload /out/* → Your website files
#    - Upload /api/* → Your PHP files (separately)
#    - Upload .env → Your credentials
```

---

## What You Need to Understand

### For Next.js Code (Website):
- **Page.tsx files** = Website pages
- **Component.tsx files** = Reusable pieces
- **CSS files** = Styling

### For PHP Code (Backend):
- **create-payment-intent.php** = Starts payment
- **stripe-webhook.php** = Confirms payment
- **.env** = Your secret keys

### You DON'T need to understand:
- ❌ Static exports
- ❌ API routes
- ❌ Rewrites
- ❌ SSR/SSG/ISR
- ❌ Build optimization

**Just remember:** Run MAMP + npm run dev = Everything works!

---

## Common Tasks

### Add a new product
1. Products come from Cockpit3D
2. Run: `node scripts/fetch-cockpit3d-products.js`
3. Restart: `npm run dev`

### Change styling
1. Edit the .css file
2. Save
3. Browser auto-updates!

### Test checkout
1. **MUST have MAMP running!**
2. Go to checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future date, any CVC

### View orders
1. Check Stripe Dashboard: https://dashboard.stripe.com
2. Check Cockpit3D: Your Cockpit3D portal

---

## Production (GoDaddy)

Your GoDaddy server has:
- Static HTML files (from /out folder)
- PHP files (from /api folder)
- Same structure, but port 80 (standard web)

**In production:**
- Customer visits: `https://crystalkeepsakes.com`
- Static files served by GoDaddy
- PHP runs on GoDaddy's PHP server
- No MAMP, no npm needed!

---

## Quick Reference

**Start Development:**
```
1. Start MAMP
2. npm run dev
3. Open localhost:3000
```

**Build for Production:**
```
1. Start MAMP
2. npm run build
3. Upload /out to GoDaddy
```

**Fix "Payment Failed" Error:**
```
1. Check MAMP is running
2. Test: localhost:8888
3. Restart if needed
```

---

## Questions?

If something doesn't work:
1. Is MAMP running? (Check the app)
2. Is npm running? (Check terminal says "Ready")
3. Is your browser on localhost:3000?

**All three must be YES for checkout to work!**
