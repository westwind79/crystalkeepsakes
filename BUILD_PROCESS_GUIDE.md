# Crystal Keepsakes - Build Process Guide

## Understanding the Build Architecture

### Overview
Your project uses **Next.js static export** with **PHP backend for Cockpit3D integration**.

```
Development:
  MAMP (PHP Server) ← Cockpit3D API → Generates products JSON
          ↓
  Next.js Dev Server (port 3000) → Uses cached JSON

Production Build:
  1. Prebuild: PHP fetches from Cockpit3D → Generates JSON
  2. Next.js Build: Uses JSON → Generates static HTML
  3. Export: Creates /out folder → Upload to GoDaddy
```

---

## Environment Files Explained

### File Locations
```
Your Project Root:
  ├── .env.local          ← Development (IGNORED by git)
  ├── .env.production     ← Production settings
  └── .env.example        ← Template for others
```

### .env.local (Development)
Used when running:
- `npm run dev` or `yarn dev`
- Local MAMP development
- Testing with Stripe test keys

### .env.production (Production)
Used when running:
- `npm run build` or `yarn build`
- Building for GoDaddy deployment
- Uses Stripe live keys

---

## Build Process Step-by-Step

### What Happens During Build

```bash
npm run build
```

Executes:

**Step 1: Prebuild Script** (package.json → prebuild)
```bash
node scripts/fetch-cockpit3d-products.js
```

- Calls: `http://localhost:8888/crystalkeepsakes/api/cockpit3d-data-fetcher.php`
- PHP script reads `.env` file (looks in project root)
- PHP fetches products from Cockpit3D API
- Generates: `/src/data/cockpit3d-products.js`

**Step 2: Next.js Build**
```bash
next build
```

- Reads `/src/data/cockpit3d-products.js` (from Step 1)
- Generates static HTML for all 72 products
- Creates optimized JavaScript bundles
- Outputs to `/out` folder

**Step 3: Static Export**
- All pages converted to static HTML
- Ready to upload to GoDaddy
- No Node.js server needed in production

---

## Environment Variables - Complete List

### Required for PHP (Prebuild)

```env
# Cockpit3D API - PHP needs these
COCKPIT3D_USERNAME=noah.westwind@gmail.com
COCKPIT3D_PASSWORD=z99rr9,Hod,,bdb,azzo
COCKPIT3D_RETAIL_ID=256568874          # ← PHP looks for this
COCKPIT3D_BASE_URL=https://api.cockpit3d.com/

# Alternative names (for compatibility)
COCKPIT3D_RETAIL_ID=256568874            # ← Your original name
NEXT_PUBLIC_COCKPIT3D_SHOP_ID=256568874  # ← For Next.js
```

**IMPORTANT**: PHP file `cockpit3d-data-fetcher.php` looks for `COCKPIT3D_RETAIL_ID`

### Required for Next.js (Build & Runtime)

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Application URLs
NEXT_PUBLIC_BASE_URL=https://crystalkeepsakes.com
NEXT_PUBLIC_ENV_MODE=production
```

---

## Common Build Issues & Solutions

### Issue 1: "CockPit3D credentials not found"

**Problem**: PHP can't read .env file

**Solution**:
```bash
# Check .env file exists in project root
dir .env        # Windows
ls -la .env     # Mac/Linux

# Verify it contains:
COCKPIT3D_USERNAME=noah.westwind@gmail.com
COCKPIT3D_PASSWORD=z99rr9,Hod,,bdb,azzo
COCKPIT3D_RETAILER_ID=256568874
COCKPIT3D_BASE_URL=https://api.cockpit3d.com/
```

### Issue 2: "ECONNREFUSED 127.0.0.1:8888"

**Problem**: MAMP not running

**Solution**:
1. Start MAMP
2. Verify Apache is running on port 8888
3. Test in browser: http://localhost:8888/crystalkeepsakes/

### Issue 3: "next: not recognized"

**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
# or
yarn install
```

### Issue 4: Build works but products missing

**Problem**: Cached products file is stale

**Solution**:
```bash
# Regenerate products
node scripts/fetch-cockpit3d-products.js

# Then rebuild
npm run build
```

---

## Production Deployment to GoDaddy

### Build for Production

```bash
# On your LOCAL machine (Windows):
cd C:\MAMP\htdocs\crystalkeepsakes

# 1. Ensure MAMP is running
# 2. Build the site
npm run build

# Output: /out folder with static files
```

### Upload to GoDaddy

```
Your GoDaddy Server:
  public_html/
    └── crystalkeepsakes/
        ├── index.html              ← From /out
        ├── _next/                  ← From /out/_next
        ├── products/               ← From /out/products
        ├── img/                    ← From /out/img
        └── api/                    ← Your PHP files (separate!)
            ├── cockpit3d-data-fetcher.php
            └── stripe/
                ├── create-payment-intent.php
                └── webhook.php
```

**Important**:
- Upload contents of `/out` folder → GoDaddy
- Upload `/api` folder (PHP files) → GoDaddy separately
- PHP files are NOT in /out - they're in your source
- Create `.env` file on GoDaddy server with production credentials

---

## File Structure

### Source Files (Development)
```
C:\MAMP\htdocs\crystalkeepsakes\
├── .env.local                    ← Dev credentials
├── .env.production               ← Prod credentials
├── package.json                  ← Build scripts
├── next.config.ts                ← Next.js config
├── src/
│   ├── app/                      ← Next.js pages
│   ├── components/               ← React components
│   ├── lib/                      ← Utilities
│   └── data/
│       └── cockpit3d-products.js ← Generated by prebuild
├── scripts/
│   └── fetch-cockpit3d-products.js ← Calls PHP
├── api/                          ← PHP backend files
│   └── cockpit3d-data-fetcher.php
└── public/                       ← Static assets
    └── img/
```

### Build Output (Production)
```
out/                              ← Upload to GoDaddy
├── index.html                    ← Homepage
├── products/
│   ├── cut-corner-diamond/
│   │   └── index.html
│   └── [72 more products]
├── _next/                        ← JavaScript bundles
├── img/                          ← Images
└── [other pages]
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start MAMP (Apache on port 8888)

# 2. Start Next.js dev server
npm run dev

# 3. Open browser
http://localhost:3000

# Make changes → Hot reload works
```

### When Products Change in Cockpit3D

```bash
# 1. Regenerate products
node scripts/fetch-cockpit3d-products.js

# 2. Restart dev server
# Press Ctrl+C
npm run dev
```

### Preparing for Production

```bash
# 1. Test locally with production build
npm run build
npx serve out

# 2. Test in browser
http://localhost:3000/crystalkeepsakes/

# 3. If all works, upload /out to GoDaddy
```

---

## Troubleshooting Checklist

### Before Build
- [ ] MAMP is running
- [ ] .env file exists in project root
- [ ] .env contains all Cockpit3D credentials
- [ ] PHP file path: `C:\MAMP\htdocs\crystalkeepsakes\api\cockpit3d-data-fetcher.php`
- [ ] Dependencies installed (`node_modules` folder exists)

### During Build
- [ ] Prebuild script runs successfully
- [ ] Products file generated: `src/data/cockpit3d-products.js`
- [ ] Build completes without errors
- [ ] `/out` folder created

### After Build
- [ ] Test locally: `npx serve out`
- [ ] All product pages work
- [ ] Images load correctly
- [ ] Cart functions properly

---

## Key Takeaways

1. **.env files are CRITICAL** - Without them, prebuild fails
2. **MAMP must be running** - PHP script needs it for prebuild
3. **Two separate systems**:
   - Next.js (static HTML) → GoDaddy static hosting
   - PHP (Stripe, Cockpit3D) → GoDaddy PHP hosting
4. **Build generates /out** - Upload this to GoDaddy
5. **PHP files separate** - Not in /out, upload separately

---

## Need Help?

If build fails:
1. Check this guide
2. Verify .env file
3. Check MAMP is running
4. Look at console error messages
5. Check `/api/cockpit3d_errors.log` for PHP errors
