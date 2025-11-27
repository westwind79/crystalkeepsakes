# 🚀 Crystal Keepsakes - Production Readiness Audit
**Date**: November 26, 2025  
**Environment**: Next.js + PHP (MAMP) Hybrid Architecture

---

## ✅ **CART & CHECKOUT FLOW - STATUS**

### **1. Cart System** ✅ **SOLID**
**Location**: `/app/src/lib/cartUtils.ts`

**✓ Strengths:**
- IndexedDB for images (avoids localStorage quota issues)
- Complete order data preserved (SKU, options, pricing, Cockpit3D IDs)
- Stores BOTH raw and masked images
- Automatic cleanup of orphaned images
- Proper error handling

**⚠️ Production Considerations:**
- Image upload to server happens **during checkout** (not before)
- Custom images need to be uploaded to accessible URLs for Cockpit3D
- Ensure customer images persist long enough for order fulfillment

**Action Items:**
- [x] Cart data structure complete
- [ ] Verify image upload endpoint (`/api/customer-image-upload.php`) works in production
- [ ] Test image accessibility from Cockpit3D servers

---

### **2. Pricing Logic** ✅ **SOLID**
**Location**: `/app/src/utils/pricingUtils.ts`

**✓ Single Source of Truth:**
```typescript
Product → Cart → Checkout → Stripe Session
```

**Verified:**
- Base price + options price calculation ✓
- Sale/discount handling ✓
- Quantity multiplication ✓
- Stripe conversion (dollars to cents) ✓

**Action Items:**
- [x] Pricing logic centralized
- [ ] Add price validation in checkout (client vs server match)

---

### **3. Checkout Session Creation** ⚠️ **NEEDS REVIEW**
**Location**: `/app/api/stripe/create-checkout-session.php`

**✓ Current Features:**
- Dynamic URL detection (localhost, subdirectory, production)
- Stripe line items creation
- Shipping address collection
- Shipping rate options
- Automatic tax calculation
- Promo code support
- Order metadata storage

**⚠️ Gaps:**
- **Cart metadata truncated to 500 chars** (Stripe limit)
- Full cart data NOT passed to webhook
- Custom image URLs not included in metadata

**🔧 Critical Fix Needed:**
```php
// CURRENT: Only summary stored (truncated)
$metadata = [
    'order_number' => $orderNumber,
    'cart_items' => substr(json_encode($cartSummary), 0, 500), // TRUNCATED!
];

// NEEDED: Store full cart in expandable field
$sessionParams['metadata'] = [
    'order_number' => $orderNumber,
    'environment' => $mode
];

// Store full cart in description or client_reference_id
$sessionParams['client_reference_id'] = $orderNumber;
```

**Solution**: Use Stripe's `line_item.metadata` or upload full order JSON to server before checkout

---

### **4. Stripe Webhook** ⚠️ **INCOMPLETE CART DATA**
**Location**: `/app/api/stripe/stripe-webhook.php`

**✓ Current Implementation:**
- Webhook signature verification ✓
- Environment-based key selection ✓
- Handles `checkout.session.completed` ✓
- Cockpit3D integration ✓
- Database logging ✓

**❌ Critical Gap: Missing Full Cart Data**

**Current webhook only receives:**
```php
// From Stripe line_items
$lineItem->description  // Product name
$lineItem->quantity     // Quantity
$lineItem->amount_total // Price

// From metadata (TRUNCATED)
$session->metadata->cart_items // Only 500 chars!
```

**Missing from webhook:**
- ❌ Size details (e.g., "3x3x3 inches")
- ❌ Light base selection
- ❌ Background option (2D/3D/Remove)
- ❌ Custom text (line 1 & line 2)
- ❌ Custom image URLs
- ❌ Cockpit3D option IDs
- ❌ Mask names

**🚨 THIS IS THE BLOCKER FOR COCKPIT3D INTEGRATION**

---

## 🔴 **CRITICAL ISSUE: Cart Data Not Reaching Webhook**

### **The Problem:**
1. **Frontend cart** has complete data (IndexedDB + localStorage)
2. **Checkout session** creates Stripe session but **doesn't pass full cart**
3. **Webhook** receives payment but **can't rebuild Cockpit3D order**

### **Current Flow:**
```
Cart (Complete Data)
  ↓
Checkout Session PHP (Only sends line items to Stripe)
  ↓
Stripe (Stores order_number + truncated cart_items)
  ↓
Webhook (Receives payment, but missing cart options!)
  ↓
Cockpit3D ❌ (Can't send - missing size, options, images)
```

### **Required Flow:**
```
Cart (Complete Data)
  ↓
Upload to Server (Save full cart JSON with session_id)
  ↓
Checkout Session PHP (Reference to saved cart)
  ↓
Stripe (Stores order_number + reference)
  ↓
Webhook (Retrieves full cart from server)
  ↓
Cockpit3D ✅ (Complete order with all options)
```

---

## 🔧 **SOLUTION: Pre-Checkout Cart Upload**

### **Implementation Steps:**

#### **Step 1: Create Cart Storage Endpoint**
**New File**: `/app/api/stripe/store-cart.php`

```php
<?php
// Receives full cart before checkout
// Stores in database or temp file
// Returns: cart_id

$input = json_decode(file_get_contents('php://input'), true);
$cart = $input['cart'];
$cartId = uniqid('cart_', true);

// Save to database
$stmt = $pdo->prepare("INSERT INTO temp_carts (cart_id, cart_data, created_at) VALUES (?, ?, NOW())");
$stmt->execute([$cartId, json_encode($cart)]);

echo json_encode(['success' => true, 'cart_id' => $cartId]);
```

#### **Step 2: Update Checkout Flow**
**File**: `/app/src/app/checkout/page.tsx`

```typescript
// BEFORE creating Stripe session
const cart = await getCartWithImages();

// Upload full cart to server
const cartUploadResponse = await fetch(
  `${phpBackendUrl}/api/stripe/store-cart.php`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart })
  }
);
const { cart_id } = await cartUploadResponse.json();

// THEN create Stripe session with cart_id
const checkoutResponse = await fetch(
  `${phpBackendUrl}/api/stripe/create-checkout-session.php`,
  {
    method: 'POST',
    body: JSON.stringify({
      cartItems: cart, // Still send for line items
      cart_id: cart_id, // NEW: Reference to full cart
      orderNumber: `CK-${Date.now()}`
    })
  }
);
```

#### **Step 3: Update create-checkout-session.php**
```php
// Store cart_id in metadata
$metadata = [
    'order_number' => $orderNumber,
    'cart_id' => $data->cart_id, // NEW
    'environment' => $mode
];
```

#### **Step 4: Update Webhook to Retrieve Full Cart**
```php
function handleCheckoutCompleted($session) {
    // Get cart_id from metadata
    $cartId = $session->metadata->cart_id ?? null;
    
    if ($cartId) {
        // Retrieve full cart from database
        $stmt = $pdo->prepare("SELECT cart_data FROM temp_carts WHERE cart_id = ?");
        $stmt->execute([$cartId]);
        $fullCart = json_decode($stmt->fetchColumn(), true);
        
        // Now build Cockpit3D order with COMPLETE data
        $cockpit3dOrder = buildCockpit3DOrderWithFullData($fullCart, $session);
        
        // Clean up temp cart
        $pdo->prepare("DELETE FROM temp_carts WHERE cart_id = ?")->execute([$cartId]);
    }
}
```

---

## 📋 **PRODUCTION DEPLOYMENT CHECKLIST**

### **Environment Variables** (`.env` file)
```bash
# Must be set in production
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# Cockpit3D credentials
COCKPIT3D_USERNAME=...
COCKPIT3D_PASSWORD=...
COCKPIT3D_RETAIL_ID=256568874
```

### **Stripe Dashboard Configuration**
- [ ] Create webhook endpoint: `https://crystalkeepsakes.com/api/stripe/stripe-webhook.php`
- [ ] Subscribe to: `checkout.session.completed`
- [ ] Copy webhook secret to `.env`
- [ ] Test webhook with Stripe CLI

### **Server Requirements**
- [ ] PHP 7.4+ with cURL, JSON extensions
- [ ] Composer dependencies installed (`vendor/autoload.php`)
- [ ] Writable directory for customer images: `/public/img/customer-uploads/`
- [ ] MySQL database for temp_carts table
- [ ] SSL certificate (HTTPS required for Stripe)

### **Database Setup**
```sql
CREATE TABLE temp_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id VARCHAR(50) UNIQUE NOT NULL,
    cart_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cart_id (cart_id),
    INDEX idx_created_at (created_at)
);

-- Auto-cleanup old carts (run daily via cron)
DELETE FROM temp_carts WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

## 🧪 **TESTING PROTOCOL**

### **Test 1: Complete Checkout Flow**
```bash
# Test cart data preservation
1. Add product with custom image to cart
2. Select size (e.g., "3x3x3")
3. Choose light base option
4. Add custom text
5. Proceed to checkout
6. Complete Stripe payment (test card: 4242 4242 4242 4242)
7. Verify webhook receives FULL cart data
8. Check Cockpit3D receives order with all options
```

### **Test 2: Webhook Data Validation**
```php
// Add to webhook for testing
error_log('=== WEBHOOK CART DATA ===');
error_log('Cart ID: ' . ($session->metadata->cart_id ?? 'MISSING'));
error_log('Full Cart: ' . json_encode($fullCart, JSON_PRETTY_PRINT));
error_log('Cockpit3D Payload: ' . json_encode($cockpit3dOrder, JSON_PRETTY_PRINT));
```

---

## 📊 **DEBUG PANEL ENHANCEMENTS**

### **Current Debug Panel**
**Files**: 
- `/app/src/components/DebugOverlay.tsx` (basic)
- `/app/src/components/EnhancedDebugOverlay.tsx` (advanced)

**Suggestions:**
1. Add "Checkout Journey" tab showing:
   - ✓ Cart uploaded to server
   - ✓ Stripe session created
   - ✓ Payment completed
   - ✓ Webhook received
   - ✓ Cockpit3D order submitted

2. Add cart data validation:
   - Show which fields are missing
   - Highlight Cockpit3D required fields

3. Add timestamp for each step

---

## 🎯 **IMMEDIATE ACTION ITEMS**

### **Priority 1: Fix Cart Data Flow** 🔴
- [ ] Create `store-cart.php` endpoint
- [ ] Create `temp_carts` database table
- [ ] Update checkout page to upload cart before Stripe
- [ ] Update webhook to retrieve full cart
- [ ] Test complete flow

### **Priority 2: Verify Cockpit3D Integration** 🟡
- [ ] Test Cockpit3D API authentication
- [ ] Verify option ID mapping
- [ ] Test image upload and accessibility
- [ ] Handle Cockpit3D errors gracefully

### **Priority 3: Production Hardening** 🟢
- [ ] Add error monitoring (Sentry, Bugsnag)
- [ ] Set up webhook retry logic
- [ ] Add admin notification for failed orders
- [ ] Implement order status dashboard

---

## 📞 **NEXT STEPS**

Should I:
1. **Implement the cart upload solution** (Priority 1)?
2. **Create database migration** for temp_carts table?
3. **Update all affected files** to complete the flow?

Let me know and I'll make it production-ready! 🚀
