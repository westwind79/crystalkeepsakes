# Admin Panel - Save & Backup Workflow

## Buttons Overview

### 1. 💾 Save Products
Downloads 2 files (same base name, no timestamp):
- `final-products.json` → Upload to `/public/data/` on production server
- `final-products.js` → Replace in `/src/data/` for development

**Use this for:** Regular updates to live site

### 2. 📦 Backup
Downloads 2 timestamped files for history:
- `final-products-2024-11-17T09-30-15.json`
- `final-products-2024-11-17T09-30-15.js`

**Use this for:** Creating version snapshots before major changes

## Workflow

### Update Products on Live Site:
1. Edit products in admin panel
2. Click **"Save Products"**
3. Upload `final-products.json` to server `/public/data/` via FTP
4. Refresh site → changes appear instantly

### Update Development Environment:
1. After saving, replace `/src/data/final-product-list.js` with downloaded `final-products.js`
2. Rename: `final-products.js` → `final-product-list.js`
3. Dev server hot-reloads with new data

### Create Backup Before Major Changes:
1. Click **"Backup"** button
2. Store timestamped files for rollback if needed

## File Locations

**Production:**
- Server: `/public/data/final-products.json` ← Upload here via FTP
- Loaded at runtime by production build

**Development:**
- Local: `/src/data/final-product-list.js` ← Replace this file
- Loaded at build time by dev server

## Important Notes

✅ **Same data, different formats:**
- JSON for production (runtime fetch)
- JS for development (compile-time import)

✅ **No rebuild needed:**
- Production updates work instantly after FTP upload
- Development needs file replacement only

✅ **Ecommerce Engine Status:**
- 🟢 Stripe: Hosted checkout ready
- 🟡 Cockpit3D: Order payload emails (API access pending)
- 🟢 Products: Dynamic updates working
