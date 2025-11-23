# What to Deploy from /out Folder

**Static Export Guide for GoDaddy/cPanel Hosting**

---

## 🎯 Quick Answer

**Deploy ONLY these folders from `/out`:**

```
✅ Upload to server:
/out/
├── index.html           ← YES
├── _next/               ← YES (entire folder)
├── api/                 ← YES (PHP files)
├── img/                 ← YES (images)
├── data/                ← YES (if exists)
├── products/            ← YES
├── cart/                ← YES
├── checkout/            ← YES
├── about/               ← YES
├── contact/             ← YES
├── faq/                 ← YES
└── (all page folders)   ← YES

❌ DO NOT upload:
├── server/              ← NO
├── cache/               ← NO
├── package.json         ← NO
├── *.trace files        ← NO
└── node_modules/        ← NO (shouldn't exist anyway)
```

---

## 📁 Detailed File Explanation

### ✅ Files to Deploy

#### 1. **HTML Files**
- `index.html` - Homepage
- `404.html` - Error page (if exists)
- All HTML files in root

#### 2. **_next Folder**
```
_next/
├── static/
│   ├── chunks/          ← JavaScript bundles
│   ├── css/             ← Stylesheets
│   └── media/           ← Fonts, assets
└── ...
```
**What it is:** Next.js compiled assets (JS, CSS, fonts)  
**Deploy:** ✅ YES - entire folder

#### 3. **Page Folders**
```
/products/
/cart/
/checkout/
/about/
/contact/
/faq/
/order-confirmation/
```
Each contains `index.html` for that page  
**Deploy:** ✅ YES - all page folders

#### 4. **api Folder**
```
api/
├── contact.php
├── stripe/
│   └── *.php
└── cockpit3d/
    └── *.php
```
**What it is:** Your PHP backend files  
**Deploy:** ✅ YES - entire folder

#### 5. **Static Assets**
```
/img/              ← Product images
/data/             ← JSON data files
/favicon.ico       ← Site icon
/robots.txt        ← SEO (if generated)
/sitemap.xml       ← SEO (if generated)
```
**Deploy:** ✅ YES - all static assets

---

### ❌ Files NOT to Deploy

#### 1. **server Folder**
```
/out/server/
```
**What it is:** Server-side code for Next.js server mode  
**Why exists:** Bug in Next.js 15 - shouldn't be there with `output: 'export'`  
**Deploy:** ❌ NO - Not used in static export  
**Delete before upload:** Optional (won't hurt if uploaded, just unnecessary)

#### 2. **cache Folder**
```
/out/cache/
```
**What it is:** Build cache from Next.js  
**Deploy:** ❌ NO - Build artifact only  
**Delete before upload:** Yes

#### 3. **package.json**
```
/out/package.json
```
**What it is:** Your Node.js dependencies manifest  
**Deploy:** ❌ NO - Only needed for development  
**Why exists:** Shouldn't be there - likely copied by mistake  
**Delete before upload:** Yes

#### 4. **Trace Files**
```
*.trace
*.nft.json
```
**What they are:** Next.js build tracing files  
**Purpose:** Help Next.js determine which files are needed  
**Deploy:** ❌ NO - Build-time only  
**Delete before upload:** Optional (tiny files, won't hurt)

#### 5. **Manifest Files**

**Which manifest files exist:**
```
_next/static/chunks/
├── app-build-manifest.json    ← Build info
├── build-manifest.json        ← Chunk mapping
└── middleware-manifest.json   ← Middleware config
```

**Do you deploy them?**
- **✅ YES** - These are inside `_next/` folder
- They help your site load the right JS chunks
- **BUT:** You upload entire `_next/` folder anyway
- So they come along automatically

---

## 🧹 Clean Before Deploy

### Automated Cleanup Script

Add this to `prepare-production.sh`:

```bash
# Remove unnecessary files from /out
echo "🧹 Removing deployment files..."

# Remove server folder (Next.js 15 bug)
if [ -d "out/server" ]; then
  rm -rf out/server
  echo "✅ Removed /server folder"
fi

# Remove cache folder
if [ -d "out/cache" ]; then
  rm -rf out/cache
  echo "✅ Removed /cache folder"
fi

# Remove package.json
if [ -f "out/package.json" ]; then
  rm out/package.json
  echo "✅ Removed package.json"
fi

# Remove trace files
find out -name "*.trace" -type f -delete 2>/dev/null && echo "✅ Removed trace files"
find out -name "*.nft.json" -type f -delete 2>/dev/null && echo "✅ Removed .nft.json files"
```

---

## 📊 Typical /out Structure After Build

### Before Cleanup:
```
out/
├── _next/                  ✅ Deploy
├── api/                    ✅ Deploy
├── products/               ✅ Deploy
├── cart/                   ✅ Deploy
├── img/                    ✅ Deploy
├── index.html              ✅ Deploy
├── server/                 ❌ Remove
├── cache/                  ❌ Remove
├── package.json            ❌ Remove
└── *.trace                 ❌ Remove
```

### After Cleanup:
```
out/
├── _next/                  ✅ Deploy
├── api/                    ✅ Deploy
├── products/               ✅ Deploy
├── cart/                   ✅ Deploy
├── img/                    ✅ Deploy
└── index.html              ✅ Deploy
```

**Much cleaner!**

---

## 🚀 Deployment Checklist

### Before Upload:

- [ ] Run `npm run build:prod`
- [ ] Check `out/` folder size: `du -sh out/`
- [ ] Verify no `out/admin/` folder
- [ ] Verify no `out/server/` folder (or delete it)
- [ ] Verify no `out/cache/` folder (or delete it)
- [ ] Remove `out/package.json` if exists

### Upload to Server:

**Via FTP:**
1. Connect to server
2. Navigate to `/public_html/test/`
3. Upload entire `/out` folder contents
4. Overwrite existing files

**Via cPanel File Manager:**
1. Compress `/out` to `out.zip`
2. Upload `out.zip`
3. Extract in `/public_html/test/`
4. Delete `out.zip`

### After Upload:

- [ ] Visit your site: `https://crystalkeepsakes.com/test/`
- [ ] Test products page
- [ ] Test cart functionality
- [ ] Try admin page (should 404)
- [ ] Check console for errors

---

## 🔍 What Each File Type Does

### .html Files
**Purpose:** Your pages  
**Example:** `products/index.html`  
**Deploy:** ✅ YES

### .js Files (in _next/static/chunks/)
**Purpose:** Your React code, compiled  
**Example:** `app-chunk-123abc.js`  
**Deploy:** ✅ YES (auto via _next/)

### .css Files (in _next/static/css/)
**Purpose:** Your styles  
**Example:** `app-layout-456def.css`  
**Deploy:** ✅ YES (auto via _next/)

### .php Files (in api/)
**Purpose:** Your backend (Stripe, Cockpit3D, contact)  
**Deploy:** ✅ YES

### .json Files
**In _next/ folder:** Manifests (needed)  
**In data/ folder:** Product data (needed)  
**In root:** package.json (NOT needed)  
**Deploy:** ✅ YES for _next/ and data/, ❌ NO for root

### .trace Files
**Purpose:** Next.js internal build info  
**Deploy:** ❌ NO

---

## 💡 Why These Files Exist

### server/ Folder
**Shouldn't exist!** This is a bug/quirk in Next.js 15.

With `output: 'export'`, you're making a **static site**.  
The `server/` folder is for **server mode** (with Node.js).

**What happened:**
- Next.js 15 sometimes generates this even with static export
- It's unused in your setup
- Safe to delete

**Solution:** Delete before deploy (add to cleanup script)

### cache/ Folder
**Build optimization cache**

Next.js stores build cache to speed up subsequent builds.  
Not needed on production server.

**Solution:** Delete before deploy

### package.json
**Shouldn't be in /out!**

This file lists your npm dependencies.  
Only needed for `npm install` during development.

**How it got there:**
- Possibly copied by a script
- Or Next.js bug

**Solution:** Remove from /out before deploy

---

## 🎯 Simplified Deployment

### Option 1: Deploy Everything (Lazy Way)
```bash
# Build
npm run build:prod

# Upload entire /out folder
# Includes unnecessary files but they won't hurt
```

**Pros:** Simple, fast  
**Cons:** Extra ~2-5MB of unnecessary files

### Option 2: Clean Deploy (Recommended)
```bash
# Build
npm run build:prod

# Clean
rm -rf out/server out/cache out/package.json
find out -name "*.trace" -delete
find out -name "*.nft.json" -delete

# Upload /out folder
# Only essential files
```

**Pros:** Smaller, cleaner  
**Cons:** Extra cleanup step

### Option 3: Automated Clean (Best)

Update `prepare-production.sh` to include cleanup.  
Then just:
```bash
npm run build:prod
# Auto-cleaned!
```

---

## 📋 Size Expectations

### Typical /out Folder Sizes:

**With unnecessary files:**
```
Total: ~15-20 MB
├── _next/: 8-12 MB
├── img/: 3-5 MB
├── api/: 100 KB
├── server/: 1-2 MB ❌
├── cache/: 500 KB ❌
└── pages/: 2-3 MB
```

**After cleanup:**
```
Total: ~12-15 MB
├── _next/: 8-12 MB
├── img/: 3-5 MB
├── api/: 100 KB
└── pages/: 2-3 MB
```

**Savings: ~20-25%**

---

## 🔒 Security Note

**Never deploy these to production:**
- ❌ `/node_modules/` (dev dependencies)
- ❌ `/.env` files (sensitive data)
- ❌ `/src/` folder (source code)
- ❌ `/.git/` folder (version control)
- ❌ `/admin/` folder (already excluded)

**Only deploy `/out` folder contents!**

---

## ✅ Summary

### Deploy These:
1. ✅ `_next/` - Compiled assets
2. ✅ `api/` - PHP backend
3. ✅ `img/` - Images
4. ✅ `data/` - JSON data
5. ✅ All page folders (products/, cart/, etc.)
6. ✅ `index.html` and all HTML files

### Don't Deploy These:
1. ❌ `server/` - Next.js server code (unused)
2. ❌ `cache/` - Build cache
3. ❌ `package.json` - npm manifest
4. ❌ `*.trace` - Build traces
5. ❌ `*.nft.json` - Node file traces

### Best Practice:
```bash
npm run build:prod
# Should auto-clean everything
# Upload /out folder contents
```

---

**Need help updating the cleanup script? Let me know!**
