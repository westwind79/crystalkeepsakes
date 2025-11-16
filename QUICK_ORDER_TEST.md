# Quick Order Flow Test

## Let's Test Together - Step by Step

### STEP 1: Add a Product to Cart
**URL:** http://localhost:3002/products

**Actions:**
1. Browse to products page
2. Click on any product (e.g., "3D Crystal Heart")
3. Select options:
   - Size (if available)
   - Light Base (if available)
   - Background (if available)
4. Add custom text (optional): "Test Order"
5. Upload an image (optional)
6. Click "Add to Cart"

**Expected Result:**
- Success message/modal appears
- Cart icon updates with item count
- Product added to localStorage

**To Verify:**
Open browser console (F12) and run:
```javascript
console.log('Cart:', JSON.parse(localStorage.getItem('cart')))
```

---

### STEP 2: Review Cart
**URL:** http://localhost:3002/cart

**What to Check:**
- ✅ Product name displays correctly
- ✅ Thumbnails show (192x192 size, clear and visible)
- ✅ Original uploaded image shows (if you uploaded one)
- ✅ Masked/final image shows (if applicable)
- ✅ Configuration details section shows:
  - Size: [selected size] - $X.XX
  - Light Base: [selected base] - $X.XX
  - Background: [selected option] - $X.XX
  - Custom Text: "[your text]" - $X.XX
- ✅ Item Total shows correct price
- ✅ Quantity controls work (+ and -)
- ✅ Line total updates when quantity changes
- ✅ Order Summary shows correct subtotal

**Debug Info (Development Mode):**
Scroll to bottom and click "🔧 Developer Debug Panel"

Check:
- Cart Summary: Shows item count, images count, total
- Cockpit3D Readiness: Each item should have ✓ with Cockpit3D ID
- Full JSON: All data is present

**Expected Cart Structure:**
```json
[
  {
    "productId": "248",
    "name": "3D Crystal Heart",
    "sku": "CK-3D-HEART-001",
    "cockpit3d_id": "248",
    "basePrice": 50.00,
    "optionsPrice": 25.00,
    "price": 75.00,
    "quantity": 1,
    "options": [
      {
        "category": "size",
        "name": "Medium (3x3x3)",
        "price": 50.00,
        "cockpit3d_id": "size-medium-001"
      },
      {
        "category": "lightBase",
        "name": "Rotating LED Base",
        "priceModifier": 25.00,
        "cockpit3d_id": "lightbase-rotating-001"
      }
    ],
    "customImage": {
      "dataUrl": "data:image/jpeg;base64,...",
      "thumbnail": "data:image/jpeg;base64,...",
      "rawImageDataUrl": "data:image/jpeg;base64,...",
      "rawImageThumbnail": "data:image/jpeg;base64,..."
    },
    "customText": {
      "line1": "Test Order",
      "line2": ""
    }
  }
]
```

---

### STEP 3: Proceed to Checkout
**URL:** http://localhost:3002/cart → Click "Proceed to Checkout"

**What Happens:**
1. Cart data sent to `/api/checkout-hosted`
2. Stripe Checkout Session created
3. Redirected to Stripe hosted checkout page

**Expected Behavior:**
- Redirects to Stripe checkout
- Shows product(s) with correct names and prices
- Shows total amount

**To Check Backend (if needed):**
```bash
# View backend logs
tail -50 /var/log/supervisor/backend.*.log
```

---

### STEP 4: Complete Stripe Checkout (Test Mode)
**Stripe Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

**Fill out:**
- Email: test@example.com
- Shipping Address:
  - Name: Test Customer
  - Address: 123 Test St
  - City: Los Angeles
  - State: CA
  - ZIP: 90001
  - Country: US
- Payment: Use test card above

**Click "Pay"**

**Expected Result:**
- Payment processes successfully
- Redirected to success/confirmation page

---

### STEP 5: Verify Order Processing
**What Should Happen Behind the Scenes:**
1. Stripe sends webhook to your backend (if configured)
2. Order processed via `/api/process-order`
3. Cockpit3D order built using `cockpit3d-order-builder.ts`
4. Order sent to Cockpit3D API (if configured)
5. Confirmation email sent (if configured)

**To Check Order Data:**
Look at backend logs or check database for order details

**Cockpit3D Payload Should Include:**
```json
{
  "retailer_id": "your_id",
  "order_id": "CK-1234567890",
  "address": { ... },
  "items": [
    {
      "sku": "CK-3D-HEART-001",
      "qty": "1",
      "cockpit3d_id": "248",
      "cropped_photo": "base64...",  // Masked image
      "original_photo": "base64...", // Original upload
      "special_instructions": "Line 1: Test Order",
      "options": [
        { "id": "size-medium-001", "qty": "1" },
        { "id": "lightbase-rotating-001", "qty": "1" }
      ],
      "price": 75.00
    }
  ],
  "total": 75.00
}
```

---

## Key Things to Verify

### ✅ Cart Page Checks
1. **Images Display Properly**
   - Original image: Blue border, labeled "📷 Your Original"
   - Masked image: Green border, labeled "✨ Final Engraving"
   - Both should be 192x192px (w-48 h-48)
   - Should be clear and visible

2. **Configuration Details Box**
   - Green gradient background
   - All options listed with prices
   - Custom text shown (if entered)
   - Item total at bottom

3. **Pricing**
   - Base price + options = item total
   - Item total × quantity = line total
   - All line totals sum to order total

4. **Debug Panel (Dev Mode)**
   - Cockpit3D ID present for each item
   - Options array populated
   - Images stored (both raw and masked)

### ✅ Checkout Flow
1. **Stripe Integration**
   - Session creates successfully
   - Redirects to Stripe checkout
   - Products show correct info
   - Payment processes

2. **Order Processing**
   - Backend receives order
   - Cockpit3D order builds correctly
   - All data preserved from cart

---

## Testing Commands

### Check if Stripe is configured:
```bash
grep -r "STRIPE" /app/.env* 2>/dev/null
```

### Check if Cockpit3D is configured:
```bash
grep -r "COCKPIT" /app/.env* 2>/dev/null
```

### View cart data in browser:
```javascript
// In browser console (F12)
const cart = JSON.parse(localStorage.getItem('cart'))
console.table(cart.map(item => ({
  name: item.name,
  sku: item.sku,
  cockpit3d_id: item.cockpit3d_id,
  price: item.price,
  hasImage: !!item.customImage,
  options: item.options?.length || 0
})))
```

### Test Cockpit3D order builder:
```javascript
// In browser console
import('@/lib/cockpit3d-order-builder').then(module => {
  const cart = JSON.parse(localStorage.getItem('cart'))
  const order = module.buildCockpit3DOrder('TEST-123', cart)
  console.log('Cockpit3D Order:', order)
})
```

---

## Current Status

### ✅ Completed
- Products page with filtering
- Product detail with options
- Image upload and masking
- Cart with proper data structure
- Cart displays images (larger thumbnails)
- Configuration details shown
- Green theming throughout
- Debug information organized

### ⏳ Need to Test
- [ ] Add product to cart flow
- [ ] Cart displays everything correctly
- [ ] Proceed to checkout
- [ ] Stripe payment
- [ ] Order processing
- [ ] Cockpit3D integration
- [ ] Order confirmation email

### ❓ Need Configuration
- Stripe API keys (test & live)
- Cockpit3D API credentials
- Email service (production)
- Shipping calculations
- Tax calculations

---

## Let's Start Testing!

**Ready to begin?**

1. Open your browser to: http://localhost:3002/products
2. Let me know what you see
3. We'll walk through each step together

**Or if you prefer, I can:**
- Use the testing agent to automate the flow
- Take screenshots at each step
- Show you the data at each point

What would you like to do?
