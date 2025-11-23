# 🚨 CORRECT File Upload Guide - CRITICAL

## ❌ WRONG (What You Were Doing)

```
Uploading: final-product-list.js
To: /public_html/crystalkeepsakes.com/src/data/
Result: Products page doesn't update ❌
```

## ✅ CORRECT (What You Should Do)

```
Uploading: final-products.json
To: /public_html/crystalkeepsakes.com/data/
Result: Products page updates ✅
```

---

## 📁 Understanding the Two Files

### File 1: `final-product-list.js`
**Location:** `/src/data/final-product-list.js`
**Format:** JavaScript module
**Used by:** Development environment (localhost)
**Purpose:** Fast loading during development with hot-reload
**FTP:** ❌ **DO NOT upload to GoDaddy**

```javascript
// This is a JavaScript file
export const finalProductList = [
  { id: "123", name: "Crystal Heart", price: 89.99 },
  // ... more products
];
```

### File 2: `final-products.json`
**Location:** `/public/data/final-products.json`
**Format:** Pure JSON array
**Used by:** Production environment (GoDaddy)
**Purpose:** Can be updated without rebuilding entire site
**FTP:** ✅ **THIS is what you upload!**

```json
[
  { "id": "123", "name": "Crystal Heart", "price": 89.99 },
  ...more products
]
```

---

## 🔄 How the System Works

### Development (localhost:3000)
```
products.ts → Reads from final-product-list.js
          → Fast, uses ES modules
          → Changes require page refresh
```

### Production (crystalkeepsakes.com)
```
products.ts → Fetches /data/final-products.json
          → Allows FTP updates
          → No rebuild needed
```

**Code in `/src/lib/products.ts`:**
```typescript
export async function getProducts() {
  if (process.env.NODE_ENV === 'development') {
    const { finalProductList } = await import('@/data/final-product-list')
    return finalProductList  // Uses .js file
  }
  
  const res = await fetch('/data/final-products.json')
  return res.json()  // Uses .json file
}
```

---

## 🛠️ Fixed: Admin Panel Now Saves Both Files

**Before (BROKEN):**
- Admin panel only saved `final-product-list.js`
- You uploaded `.js` file to GoDaddy
- Production still read old `.json` file
- Changes never appeared ❌

**After (FIXED):**
- Admin panel now saves BOTH files automatically
- Dev uses `.js` file ✅
- Production uses `.json` file ✅
- Both always in sync ✅

---

## 📤 Step-by-Step FTP Instructions

### 1. Make Changes in Admin Panel
- Go to `http://localhost:3000/admin`
- Edit products
- Click "Save Products"

### 2. See Success Message
```
✅ Products saved!

📁 Files updated:
• /app/src/data/final-product-list.js (dev)
• /app/public/data/final-products.json (production)

📤 FTP TO GODADDY:
/public_html/crystalkeepsakes.com/data/final-products.json
```

### 3. Upload the Correct File
**FileZilla / FTP Client:**
1. Connect to GoDaddy
2. Navigate to: `/public_html/crystalkeepsakes.com/data/`
3. Upload from: `/app/public/data/final-products.json`
4. Overwrite existing `final-products.json`
5. Done! ✅

---

## 🎯 Quick Reference

| Question | Answer |
|----------|--------|
| Which file for localhost? | `final-product-list.js` (automatic) |
| Which file for GoDaddy? | `final-products.json` |
| Where to upload on GoDaddy? | `/public_html/crystalkeepsakes.com/data/` |
| What's the file name? | `final-products.json` |
| Do I upload the .js file? | ❌ NO! |
| Do both files stay in sync? | ✅ YES (admin panel handles it) |

---

## 🔍 How to Verify It Works

### Test Locally
1. Make a change in admin panel
2. Check `/app/public/data/final-products.json`
3. Should see your changes ✅

### Test on GoDaddy
1. Upload `final-products.json`
2. Visit https://crystalkeepsakes.com/test/products
3. Your changes should appear ✅
4. Check browser console - no errors ✅

---

## 🆘 Troubleshooting

### "I uploaded the file but changes don't show"
1. ✅ Did you upload `final-products.json`? (not .js)
2. ✅ Is it in the `/data/` folder? (not `/src/data/`)
3. ✅ Did you refresh your browser? (Ctrl+Shift+R)
4. ✅ Check browser console for errors

### "Both files don't match"
- Admin panel now keeps them in sync automatically
- If out of sync, save in admin panel again

### "I made changes but localhost doesn't show them"
- Localhost uses `.js` file
- Admin panel updates both files
- Refresh page (hot reload might not catch it)

---

## 📝 Summary

**THE GOLDEN RULE:**
```
GoDaddy needs: final-products.json
Upload to: /public_html/crystalkeepsakes.com/data/

NOT: final-product-list.js
NOT: /src/data/
```

**Admin Panel Does:**
- ✅ Saves `.js` file (for dev)
- ✅ Saves `.json` file (for production)
- ✅ Keeps both in sync
- ✅ Shows correct FTP path

**You Do:**
- ✅ Edit in admin panel
- ✅ Upload `final-products.json` to GoDaddy
- ✅ Refresh website to see changes
