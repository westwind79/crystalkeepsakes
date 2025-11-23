# CrystalKeepsakes Order Flow Testing Guide

## Complete Order Process Overview

```
[Browse Products] → [Product Details] → [Configure Options] → [Add to Cart] 
    → [Review Cart] → [Checkout (Stripe)] → [Order Confirmation] 
    → [Send to Cockpit3D] → [Fulfillment]
```

---

## Step-by-Step Testing Process

### 1. **Browse Products** (`/products`)
**What to Test:**
- [ ] Products display correctly with images
- [ ] Featured badge shows on featured products
- [ ] Sale badge and pricing shows on sale items
- [ ] Category filtering works
- [ ] "Add to Cart" button visible on products

**Expected Behavior:**
- Product grid loads with all items
- Categories filter products correctly
- Sale prices show strikethrough on original price

---

### 2. **Product Detail Page** (`/products/[slug]`)
**What to Test:**
- [ ] Product images load (product image + mask preview)
- [ ] Size selector works (if applicable)
- [ ] Light Base selector works (if applicable)
- [ ] Background options work (if applicable)
- [ ] Custom text input works (2 lines)
- [ ] Image upload works (drag & drop or browse)
- [ ] Image gets masked correctly
- [ ] Price updates as options are selected
- [ ] "Add to Cart" button works

**Critical Data Points:**
```javascript
{
  productId: "...",
  name: "...",
  sku: "...",
  cockpit3d_id: "...",  // MUST HAVE for Cockpit3D
  basePrice: 0.00,
  optionsPrice: 0.00,
  price: 0.00,  // Total price
  quantity: 1,
  options: [
    { category: "size", name: "...", price: 0, cockpit3d_id: "..." },
    { category: "lightBase", name: "...", priceModifier: 0, cockpit3d_id: "..." },
    { category: "background", name: "...", priceModifier: 0, cockpit3d_id: "..." },
    { category: "textOption", name: "...", priceModifier: 0, cockpit3d_id: "..." }
  ],
  customImage: {
    dataUrl: "...",  // Masked image for Cockpit3D
    thumbnail: "...",
    rawImageDataUrl: "...",  // Original uploaded
    rawImageThumbnail: "...",
    metadata: { ... }
  },
  customText: {
    line1: "...",
    line2: "..."
  }
}
```

**Image Flow:**
1. User uploads original image
2. Image gets resized/compressed
3. Mask applied (if product has mask)
4. **BOTH** original and masked images stored
5. Masked image sent to Cockpit3D for engraving

---

### 3. **Shopping Cart** (`/cart`)
**What to Test:**
- [ ] Cart items display with correct images (192x192 thumbnails)
- [ ] Shows BOTH original and masked images
- [ ] Configuration details show all options with prices
- [ ] Custom text displays correctly
- [ ] Quantity controls work (+/-)
- [ ] Line totals calculate correctly
- [ ] Remove item works
- [ ] Clear cart works
- [ ] Order summary shows correct subtotal
- [ ] "Proceed to Checkout" button works

**Cart Data Verification:**
```javascript
// Open browser console on /cart page
console.log('Cart Items:', localStorage.getItem('cart'))

// Should show:
[
  {
    productId: "...",
    name: "...",
    sku: "...",
    cockpit3d_id: "123",  // ✅ MUST BE PRESENT
    price: 100.00,
    quantity: 2,
    options: [...],  // ✅ ALL OPTIONS PRESERVED
    customImage: {
      dataUrl: "data:image/jpeg;base64,...",  // ✅ MASKED IMAGE
      rawImageDataUrl: "data:image/jpeg;base64,..."  // ✅ ORIGINAL IMAGE
    },
    customText: { line1: "...", line2: "..." }
  }
]
```

**Debug Panel (Development Mode):**
- Click "🔧 Developer Debug Panel" at bottom of cart page
- Check:
  - Cart Summary shows correct item count
  - Full JSON shows all data
  - Cockpit3D Readiness: Each item should have ✓ and Cockpit3D ID

---

### 4. **Checkout** (`/checkout-hosted`)
**What Happens:**
- Cart data sent to your backend
- Stripe Checkout Session created
- Customer redirected to Stripe hosted checkout page
- Customer enters:
  - Email
  - Shipping address
  - Payment info
  - Billing address (if different)

**What to Test:**
- [ ] Checkout page loads
- [ ] Stripe shows correct items and prices
- [ ] Can complete test payment (use Stripe test cards)
- [ ] Redirected to success page after payment

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Exp: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

---

### 5. **Order Confirmation & Processing**
**What Should Happen:**
- Payment captured by Stripe
- Webhook received (if configured)
- Order created in your system
- Order sent to Cockpit3D API

**Backend Files to Check:**
```
/app/src/app/api/checkout-hosted/route.ts  - Creates Stripe session
/app/src/app/api/process-order/route.ts    - Processes completed order
/app/src/lib/cockpit3d-order-builder.ts    - Builds Cockpit3D order
```

---

### 6. **Cockpit3D Order Payload**
**Required Structure:**
```json
{
  "retailer_id": "your_retailer_id",
  "order_id": "CK-1234567890",
  "address": {
    "email": "customer@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "telephone": "555-1234",
    "region": "CA",
    "country": "US",
    "street": "123 Main St",
    "city": "Los Angeles",
    "postcode": "90001",
    "shipping_method": "standard",
    "destination": "residential"
  },
  "items": [
    {
      "sku": "product-sku",
      "qty": "1",
      "client_item_id": "unique-id",
      "cropped_photo": "base64-encoded-masked-image",
      "original_photo": "base64-encoded-original-image",
      "special_instructions": "Line 1: Text\nLine 2: More text",
      "options": [
        {
          "id": "size-option-id",
          "qty": "1"
        },
        {
          "id": "lightbase-option-id",
          "qty": "1"
        },
        {
          "id": "background-option-id",
          "value": "remove-background"
        }
      ],
      "price": 100.00
    }
  ],
  "total": 100.00,
  "subtotal": 100.00
}
```

**Critical Points:**
- ✅ `cockpit3d_id` must map to Cockpit3D's product IDs
- ✅ `cropped_photo` = masked/final image for engraving
- ✅ `original_photo` = customer's original upload (for reference)
- ✅ `options.id` must map to Cockpit3D option IDs
- ✅ All prices must match what customer paid

---

## Testing Checklist

### Pre-Flight Checks
- [ ] Products have `cockpit3d_id` in data
- [ ] Options have `cockpit3d_id` mapping
- [ ] Image upload/masking works
- [ ] Cart preserves all data

### Manual Testing Flow
1. **Add Product to Cart**
   ```
   /products → Select product → Configure → Add to Cart
   ```

2. **Verify Cart Data**
   ```
   /cart → Check thumbnails → Check options → Check debug panel
   ```

3. **Test Checkout**
   ```
   /cart → Proceed to Checkout → Use test card → Complete payment
   ```

4. **Verify Order Processing**
   ```
   Check backend logs → Verify Cockpit3D payload → Confirm order sent
   ```

### Automated Testing (Optional)
- Use Playwright/testing agent to test full flow
- Verify each step programmatically
- Check console for errors

---

## Common Issues & Solutions

### Issue: Product missing cockpit3d_id
**Solution:** Update product data in `/app/src/data/final-product-list.js`

### Issue: Images not showing in cart
**Solution:** Check IndexedDB storage, verify image compression

### Issue: Options not passed to Cockpit3D
**Solution:** Verify options array in cart, check option ID mapping

### Issue: Wrong price sent to Cockpit3D
**Solution:** Verify price calculation in cart, check total in order builder

### Issue: Checkout fails
**Solution:** Check Stripe configuration, verify API keys, check backend logs

---

## Debug Commands

### View Cart Data (Browser Console)
```javascript
// View cart
console.log(JSON.parse(localStorage.getItem('cart')))

// View cart with images
const { getCartWithImages } = await import('/src/lib/cartUtils')
const cart = await getCartWithImages()
console.log(cart)
```

### View IndexedDB Images (Browser Console)
```javascript
// Open IndexedDB
const request = indexedDB.open('CartImagesDB', 1)
request.onsuccess = (e) => {
  const db = e.target.result
  const tx = db.transaction('images', 'readonly')
  const store = tx.objectStore('images')
  const getAll = store.getAll()
  getAll.onsuccess = () => {
    console.log('Images:', getAll.result)
  }
}
```

### Check Cockpit3D Order Builder
```javascript
// In cart page, open console
const { buildCockpit3DOrder } = require('@/lib/cockpit3d-order-builder')
const cart = JSON.parse(localStorage.getItem('cart'))
const order = buildCockpit3DOrder('TEST-ORDER', cart)
console.log('Cockpit3D Order:', order)
```

---

## Next Steps After Testing

1. **Fix any issues** found during testing
2. **Configure Stripe live keys** for production
3. **Set up Cockpit3D API credentials**
4. **Test with Cockpit3D sandbox** (if available)
5. **Set up order confirmation emails**
6. **Configure shipping calculations**
7. **Test full live order** before launch

---

## Support Files
- `/app/src/lib/cockpit3d-order-builder.ts` - Order builder
- `/app/src/lib/cartUtils.ts` - Cart management
- `/app/src/app/api/checkout-hosted/route.ts` - Stripe checkout
- `/app/COCKPIT3D_ORDER_REVIEW.md` - Order structure details (if exists)

---

## Questions to Answer Before Launch

1. ✅ Do all products have correct `cockpit3d_id`?
2. ✅ Are option IDs mapped correctly?
3. ✅ Is image compression/masking working?
4. ✅ Are prices calculating correctly?
5. ⬜ Is Stripe configured for production?
6. ⬜ Is Cockpit3D API integrated?
7. ⬜ Are order confirmation emails working?
8. ⬜ Is shipping calculation set up?
9. ⬜ Is tax calculation configured?
10. ⬜ Have you tested a complete order?

