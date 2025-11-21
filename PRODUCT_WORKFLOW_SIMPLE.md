# Crystal Keepsakes - Product & Mask Management

## 🎯 SINGLE SOURCE OF TRUTH

**ONE FILE to manage products:**
- **File:** `/src/data/final-product-list.js`
- **FTP to:** `/public_html/crystalkeepsakes.com/src/data/final-product-list.js`

---

## 📦 Product Updates Workflow

### Option 1: Using Admin Panel (Recommended)

1. **Open admin panel** (localhost only): `http://localhost:3000/admin`
2. **Edit products** - change prices, descriptions, masks, etc.
3. **Click "Save Products"** - saves to `/src/data/final-product-list.js`
4. **FTP this ONE file** to your GoDaddy server

### Option 2: Direct File Edit

1. Edit `/src/data/final-product-list.js` directly
2. FTP it to GoDaddy
3. Done!

---

## 🎭 Mask Management (Visual Selector)

### How Masks Work

The admin panel shows **visual thumbnails** of all available masks. No hardcoded lists!

### Where Masks Live

**Masks folder:** `/public/img/masks/`

All PNG/JPG files in this folder automatically appear in the admin panel's visual selector.

### Adding New Masks

1. **Add PNG file** to `/public/img/masks/`
   - Example: `heart-large-mask.png`

2. **Update the mask list** (run this command once):
   ```bash
   cd /app/public/img/masks && ls *.png *.jpg *.jpeg *.webp 2>/dev/null | jq -R -s -c 'split("\n") | map(select(length > 0)) | map({filename: ., path: ("/img/masks/" + .), displayName: (. | sub("-mask\\.(png|jpg|jpeg|webp)$"; "") | gsub("[-_]"; " "))}) | sort_by(.displayName)' > /app/public/data/available-masks.json
   ```

3. **FTP both:**
   - The new mask file to `/public_html/crystalkeepsakes.com/img/masks/`
   - The updated JSON to `/public_html/crystalkeepsakes.com/data/available-masks.json`

4. **Reload admin panel** - new mask appears!

### Mask Naming Convention

- Good: `crystal-heart-mask.png` → Shows as "crystal heart"
- Good: `3d-ball-large-mask.png` → Shows as "3d ball large"
- Bad: `mask1.png` → Shows as "mask1.png"

---

## 🚀 Build & Deploy to GoDaddy

### Build for Production

```bash
npm run build:prod
```

### What to FTP

After building, FTP these files/folders:
- `/out/**` - All built files
- `/src/data/final-product-list.js` - Product data
- `/img/masks/**` - Mask images (if changed)
- `/data/available-masks.json` - Mask list (if masks changed)

---

## 🆘 Troubleshooting

### "finalProductList is not exported"

**Fix:** Make sure `/src/data/final-product-list.js` starts with:
```javascript
export const finalProductList = [
```

### Admin panel doesn't show masks

**Fix:** Check that `/public/data/available-masks.json` exists and contains mask data.

### Save button downloads instead of saving

**Issue:** You're in production build mode
**Fix:** Use `yarn dev` for admin panel work (dev mode only)

---

## 📁 File Structure

```
/app
├── public/
│   ├── data/
│   │   ├── final-products.json         (backup, not used by site)
│   │   └── available-masks.json        (mask list for admin)
│   └── img/
│       └── masks/                      (all mask PNG files)
└── src/
    └── data/
        └── final-product-list.js       ⭐ SINGLE SOURCE OF TRUTH
```

---

## ✅ Summary

- **ONE product file:** `final-product-list.js`
- **Masks:** Just drop PNGs in `/public/img/masks/` and regenerate the JSON
- **Admin panel:** Visual, click-to-select interface
- **No API routes:** Everything uses static files (works with `output: export`)
