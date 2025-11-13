# Cart & Product Image Fix - Comprehensive

## Issues to Fix:

1. **Products without custom images don't show any image** (lightbases, stands, etc.)
2. **Static products behave differently than Cockpit3D products**
3. **Price and option mapping has typos and inconsistencies**

## Root Causes:

### Issue 1: Missing Product Images
- Cart only displays `customImage?.thumbnail` (user's uploaded photo)
- Products like lightbases don't need custom images, they should show the PRODUCT photo
- Product images exist in cockpit3d-products.js: `images[0].src`
- But cart item doesn't store the product image path

### Issue 2: Static vs Cockpit3D Products
- Static products defined in `/src/data/static-products.js`
- Cockpit3D products fetched from API
- Both merged in `cockpit3d-products.js` but may have different structures
- Cart doesn't handle both types consistently

### Issue 3: Price/Option Mapping
- Cockpit3D API has typos in option names (from PDF analysis)
- Option prices may not match between catalog and product
- Size prices can be in different places (product.options[].values[].price)

---

## Solution 1: Store & Display Product Images

### A. When Adding to Cart - Store Product Image

**In `addToCart()` function:**

```typescript
// productDetailClient.tsx or wherever addToCart is called
const cartItem = {
  productId: product.id,
  name: product.name,
  sku: product.sku,
  price: totalPrice,
  productImage: product.images?.[0]?.src || null,  // ✅ ADD THIS
  // ... rest of fields
}
```

### B. When Displaying Cart - Use Product Image as Fallback

**In `cart/page.tsx`:**

```typescript
const displayImage = item.customImage?.thumbnail ||  // User's photo first
                     item.productImage ||             // ✅ Product photo second
                     '/img/placeholder.png'           // Fallback last
```

---

## Solution 2: Normalize Static & Cockpit3D Products

### A. Ensure Consistent Structure in Data Fetcher

**In `cockpit3d-data-fetcher.php` - transformCockpit3dProduct():**

Make sure both static and Cockpit3D products have same structure:
- `images` array with `src` and `isMain`
- `basePrice` as number
- `requiresImage` boolean flag
- All option arrays present (even if empty)

### B. Verify Static Products Structure

**Check `/src/data/static-products.js`:**

Ensure structure matches:
```javascript
{
  "id": "001",
  "name": "Static Product",
  "images": [{
    "src": "/img/products/...",
    "isMain": true
  }],
  "basePrice": 169,
  "requiresImage": true,
  "lightBases": [],
  "backgroundOptions": [],
  "textOptions": []
}
```

---

## Solution 3: Fix Price & Option Mapping

### A. Size Options - Extract Correct Price

From Cockpit3D API:
```json
{
  "options": [{
    "name": "Size",
    "values": [{
      "id": "202",
      "name": "Cut Corner Diamond (5x5cm)",
      "price": "70"  // ← THIS IS THE PRICE
    }]
  }]
}
```

**Fix in data-fetcher.php line ~374:**

```php
// BEFORE (might be using wrong price):
$price = (float)$rawProduct['price'];

// AFTER (use value-specific price):
$price = isset($value['price']) && is_numeric($value['price']) 
    ? (float)$value['price'] 
    : (float)$rawProduct['price'];
```

### B. Lightbase Options - Extract from Product, Not Catalog

**Already fixed in data-fetcher.php**, but verify:
- Line ~397: `extractProductLightbases($rawProduct['options'])`
- Gets lightbases from the product's own options
- NOT from catalog

### C. Background & Text Options - Get from Catalog

**Already in data-fetcher.php:**
- `extractBackgroundOptions($catalog)` - line ~699
- `extractTextOptions($catalog)` - line ~743

---

## Implementation Steps:

### Step 1: Update CartUtils to Store Product Image

**File:** `/src/lib/cartUtils.ts`

**In addToCart() function (~line 101):**

```typescript
// Create cart item with just image ID reference
const cartItem: CartItem = {
  productId: item.productId,
  name: item.name,
  sku: item.sku,
  price: item.price || item.totalPrice,
  quantity: item.quantity,
  options: cleanedOptions,
  sizeDetails: item.size || item.sizeDetails,
  productImage: item.productImage,  // ✅ ADD THIS LINE
  customImageId,
  customImageMetadata,
  cockpit3d_id: item.cockpit3d_id,
  dateAdded: item.dateAdded || new Date().toISOString()
}
```

**Update CartItem interface (~line 13):**

```typescript
export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: any
  sizeDetails?: any
  productImage?: string  // ✅ ADD THIS LINE
  customImageId?: string
  customImageMetadata?: {
    filename?: string
    maskName?: string
    hasImage: boolean
  }
  cockpit3d_id?: string
  dateAdded: string
}
```

### Step 2: Update ProductDetailClient to Pass Product Image

**File:** `/src/components/ProductDetailClient.tsx`

**In handleAddToCart() function (find where addToCart is called):**

```typescript
await addToCart({
  productId: product.id,
  name: product.name,
  sku: product.sku,
  price: totalPrice,
  quantity: quantity,
  productImage: product.images?.[0]?.src || null,  // ✅ ADD THIS LINE
  customImage: finalMaskedImage ? {
    dataUrl: finalMaskedImage,
    // ... metadata
  } : undefined,
  // ... rest of data
})
```

### Step 3: Update Cart Display Logic

**File:** `/src/app/cart/page.tsx`

**Update displayImage logic (~line 345):**

```typescript
// BEFORE:
const displayImage = item.customImage?.thumbnail || 
                     'https://placehold.co/800x800?text=No+Image'

// AFTER:
const displayImage = item.customImage?.thumbnail ||  // Custom image first
                     item.productImage ||             // Product image second
                     'https://placehold.co/800x800?text=No+Image'  // Placeholder last
```

### Step 4: Verify Image Paths

Images should be in: `/public/img/products/cockpit3d/{product_id}/cockpit3d_{id}_{name}.jpg`

**Check images exist:**
```bash
ls -la /app/public/img/products/cockpit3d/
```

**Download missing images:**
```
http://localhost:8888/crystalkeepsakes/api/cockpit3d-download-images.php?action=download
```

---

## Testing Checklist:

### Test 1: Product with Custom Image
```
1. Go to a product that requires custom image (e.g., crystal)
2. Upload a photo
3. Add to cart
4. Check cart displays the CUSTOM image thumbnail
```

### Test 2: Product WITHOUT Custom Image
```
1. Go to a lightbase or stand product
2. Add to cart (no photo upload)
3. Check cart displays the PRODUCT image (not placeholder)
```

### Test 3: Static Product
```
1. Add a static product to cart
2. Verify it displays correctly
3. Check price is correct
```

### Test 4: Mixed Cart
```
1. Add multiple products:
   - One with custom image
   - One lightbase (no custom image)
   - One static product
2. All should display correct images
```

---

## Expected Results:

### Before Fix:
```
Cart Item 1: Crystal with custom photo ✅ Shows thumbnail
Cart Item 2: Lightbase ❌ Shows placeholder
Cart Item 3: Static product ❌ Shows placeholder
```

### After Fix:
```
Cart Item 1: Crystal with custom photo ✅ Shows thumbnail
Cart Item 2: Lightbase ✅ Shows product image
Cart Item 3: Static product ✅ Shows product image
```

---

## Price & Option Mapping Fixes

### Verify in cockpit3d-data-fetcher.php:

**Line ~374 - Size options:**
```php
$price = isset($value['price']) && is_numeric($value['price']) 
    ? (float)$value['price'] 
    : (float)$rawProduct['price'];
```

**Line ~397 - Lightbase options:**
```php
$transformed['lightBases'] = $this->extractProductLightbases($rawProduct['options']);
```

**Line ~416 - Background & Text from catalog:**
```php
$transformed['backgroundOptions'] = $this->extractBackgroundOptions($catalog);
$transformed['textOptions'] = $this->extractTextOptions($catalog);
```

These should all be correct now based on the API documentation.

---

## Common Issues & Solutions:

### Issue: Images not showing
**Solution:** Run image downloader:
```
http://localhost:8888/crystalkeepsakes/api/cockpit3d-download-images.php?action=download
```

### Issue: Wrong price displayed
**Check:**
1. Is size selected? Check `item.sizeDetails.price`
2. Are options added? Check `item.price` vs `product.basePrice`
3. Console log the full item object to debug

### Issue: Static product image missing
**Check:**
1. Does static-products.js have images array?
2. Is path correct? Should be `/img/products/...`
3. Does file exist in public/img folder?

---

## Files to Change:

1. ✅ `/src/lib/cartUtils.ts` - Add productImage to CartItem interface and addToCart
2. ✅ `/src/components/ProductDetailClient.tsx` - Pass productImage when adding to cart
3. ✅ `/src/app/cart/page.tsx` - Use productImage as fallback in displayImage
4. ✅ `/api/cockpit3d-data-fetcher.php` - Verify price/option extraction (should be correct)

---

**Priority:** HIGH
**Impact:** Fixes major UX issue where products show placeholder images
**Difficulty:** EASY - Just add one field to cart items
