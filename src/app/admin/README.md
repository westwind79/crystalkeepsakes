# Admin Panel - DEVELOPMENT ONLY

⚠️ **SECURITY NOTICE:** This admin panel is for **local development only** and is automatically excluded from production builds.

---

## 🔒 Security Features

### 1. **Build Exclusion**
The admin panel is automatically removed from production/test builds:
- `yarn build:prod` → Admin excluded ✅
- `yarn build:test` → Admin excluded ✅
- `yarn build:local` → Admin included (for local testing)

Script: `/scripts/remove-admin-from-build.js`

### 2. **Runtime Protection**
Client-side safeguard redirects non-localhost visitors to homepage.

```javascript
// In page.tsx line 23-25
if (window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('127.0.0.1')) {
  window.location.href = '/';
}
```

### 3. **Not in Git Builds**
`.gitignore` excludes admin from production build outputs:
```
out-prod/admin/
out-test/admin/
```

---

## 🎯 Purpose

This admin panel allows local management of:
- ✏️ Product information (name, description, prices)
- 🖼️ Product images (upload, reorder, set main)
- 📦 Product options (sizes, light bases, backgrounds, text)
- 💰 Pricing configuration (base price, sale prices, option prices)
- 🏷️ Product metadata (categories, tags, SKUs)

**All changes save to:** `/public/data/final-products.json`

---

## 🚀 Usage

### Access
```
http://localhost:3000/admin
```

### Upload Images
Images are saved to:
```
/public/img/products/cockpit3d/{productId}/product_{id}_{timestamp}.jpg
```

These images:
- ✅ Work in Next.js dev server
- ✅ Included in production builds automatically
- ✅ Served as static files

### Save Changes
Click "Save All Products" button to write changes to:
```
/public/data/final-products.json
```

---

## ⚠️ Important Notes

1. **Never deploy `/admin` directory to production**
   - Automated scripts remove it during build
   - Double-check before manual deployments

2. **Product data location**
   - Single source of truth: `/public/data/final-products.json`
   - This file SHOULD be committed to git
   - Only commit significant product data changes

3. **Image uploads**
   - Saved to `/public/img/products/cockpit3d/{id}/`
   - Should NOT commit individual admin uploads
   - .gitignore excludes: `public/img/products/*/product_*`

4. **Backend requirements**
   - MAMP must be running (port 8888)
   - PHP GD library enabled (for image compression)
   - Write permissions on `/public/img/` folder

---

## 🔍 Verification

After building for production, verify admin is excluded:

```bash
# Build for production
yarn build:prod

# Check admin doesn't exist
ls out-prod/admin/  # Should not exist

# Verify images are included
ls out-prod/img/products/  # Should exist
```

---

## 📝 Development Workflow

1. **Make product changes** in admin panel
2. **Upload new images** if needed
3. **Test changes** in local dev
4. **Save products** to JSON
5. **Commit JSON changes** to git
6. **Build & deploy** (admin excluded automatically)

---

## 🛠️ Troubleshooting

**Admin redirects to homepage on localhost:**
- Check `window.location.hostname` in console
- Try `http://127.0.0.1:3000/admin` instead

**Images not showing:**
- Restart Next.js dev server (picks up new files)
- Clear browser cache
- Check image saved to `/public/img/products/...`

**Upload fails:**
- Check MAMP is running
- Check PHP error logs
- Verify folder write permissions
- Enable GD extension in php.ini

**Admin appears in production build:**
- Check build script ran successfully
- Verify `NEXT_PUBLIC_ENV_MODE=production`
- Manually run: `node scripts/remove-admin-from-build.js`

---

Last Updated: 2025-01-24
