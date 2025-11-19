# FTP Product File Update Guide

**Quick update without uploading entire site** ✅ SIMPLE METHOD

---

## 📁 File to Upload

**After generating products in Admin Panel:**

1. **Run this command locally:**
   ```bash
   npm run copy-products
   ```
   
2. **File location on your computer:**
   ```
   /app/public/data/final-product-list.js
   ```

3. **Upload destination on server:**
   ```
   /public_html/test/data/final-product-list.js
   ```
   OR for production:
   ```
   /public_html/data/final-product-list.js
   ```

---

## 🚀 Quick FTP Upload Steps

### Method 1: Direct Data File (Simpler)

If your build copies the file to `/out/data/`:

1. **Find the file locally:**
   - After running `npm run build:prod`
   - Look in: `/out/data/final-product-list.js`

2. **Connect via FTP:**
   - Host: Your domain
   - Username: Your FTP username
   - Password: Your FTP password

3. **Navigate to:**
   ```
   /public_html/test/data/
   ```

4. **Upload:**
   - Drag `final-product-list.js` to this folder
   - Overwrite existing file

5. **Clear cache and test:**
   - Hard refresh: `Ctrl+Shift+R`
   - Check products page

---

### Method 2: Next.js Chunk (More Complex)

If the file is bundled in Next.js chunks:

1. **Build first:**
   ```bash
   npm run build:prod
   ```

2. **Find the file in:**
   ```
   /out/_next/static/chunks/
   ```
   Look for files containing your product data

3. **Upload to server:**
   ```
   /public_html/test/_next/static/chunks/
   ```

**⚠️ Problem:** Next.js bundles and hashes filenames, making this difficult.

---

## ✅ Recommended Approach: API Endpoint

**Better solution:** Don't use FTP for product updates!

### Option A: Create a Product API

Instead of updating JS files, create an API endpoint that reads products from a JSON file:

**1. Create `/public/data/products.json`:**
```json
[
  {
    "id": "1",
    "name": "Heart Crystal",
    "price": 89.99,
    ...
  }
]
```

**2. Fetch in your app:**
```javascript
const response = await fetch('/data/products.json')
const products = await response.json()
```

**3. Update via FTP:**
- Upload `products.json` to `/public_html/test/data/products.json`
- No build needed
- Instant updates

---

### Option B: Admin Panel Upload

**Even better:** Add an upload feature to your admin panel:

1. Edit products in admin panel
2. Click "Save & Upload"
3. Admin panel uploads to server via API
4. No FTP needed at all

---

## 🔧 Current Workflow Issues

**Problem with current setup:**
- Products are in JS files compiled into Next.js bundles
- Bundles have random hashes in filenames
- Can't easily replace one file
- Must rebuild entire site

**Solution:**
Move products to separate JSON file that:
- Lives in `/public/data/`
- Loaded dynamically
- Updated via FTP without rebuild
- Or updated via admin panel API

---

## 📋 Quick FTP Update (Current Setup)

### If you MUST use current setup:

**1. Generate the file in admin:**
- Visit `/admin`
- Make your changes
- Click "Generate final-product-list.js"
- File saved to `/src/data/final-product-list.js`

**2. Copy to public folder:**
```bash
cp src/data/final-product-list.js public/data/products.js
```

**3. Update your code to fetch from public:**
```javascript
// Instead of:
import { products } from '@/data/final-product-list'

// Use:
const response = await fetch('/data/products.js')
const products = await response.json()
```

**4. Upload via FTP:**
- Connect to server
- Navigate to `/public_html/test/data/`
- Upload `products.js`
- Done! No rebuild needed.

---

## 🎯 Best Practice Setup (Recommended)

### Convert to API-based products:

**1. Move products to public folder:**
```
/public/data/products.json
```

**2. Create a hook to fetch products:**
```typescript
// hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState([])
  
  useEffect(() => {
    fetch('/data/products.json')
      .then(res => res.json())
      .then(data => setProducts(data))
  }, [])
  
  return products
}
```

**3. Use in components:**
```typescript
const products = useProducts()
```

**4. Update via FTP:**
- Just upload new `products.json`
- No build
- Instant updates
- Works perfectly

---

## 📞 Quick Answer to Your Question

**"How do I ONLY FTP the product file?"**

**Current setup:** You can't easily - products are bundled.

**Quick fix:**
1. Copy `/src/data/final-product-list.js` to `/public/data/products.json`
2. Change your imports to fetch from `/data/products.json`
3. FTP upload just that JSON file
4. No rebuild needed

**Want me to implement this change?** It would make updates much easier!

---

## 🔍 Find Where File Goes

```bash
# Build the site
npm run build:prod

# Search for the product file
find out/ -name "*final-product*" -o -name "*products*"

# Check the data folder
ls -la out/data/

# Check the chunks folder
ls -la out/_next/static/chunks/
```

---

## Summary

**Current problem:** Products in JS bundles = hard to update  
**Solution 1:** Move to `/public/data/products.json` = easy FTP updates  
**Solution 2:** Add API upload to admin panel = no FTP needed  

**Which would you prefer?**
