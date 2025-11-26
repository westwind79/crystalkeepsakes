# 🎯 Crystal Keepsakes - Comprehensive Production Plan

**Goal**: Build a bulletproof cart → checkout → fulfillment system that handles:
- Complete order data (size, options, images, text)
- Better image quality vs size balance
- Security & abandoned cart cleanup
- No localStorage capacity issues
- Full Cockpit3D integration

---

## 🔍 **CURRENT STATE ANALYSIS**

### **1. Cart Storage Strategy**
**Current**: IndexedDB (images) + localStorage (metadata)

**Issues**:
- ❌ Images too compressed in cart preview (can't distinguish)
- ❌ Original images too large for display
- ⚠️ localStorage could fill up again
- ❌ No abandoned cart cleanup
- ❌ Security concerns for uploaded images

### **2. Order Data Flow**
**Current Gap**: Product options not fully flowing to Cockpit3D

**Missing in webhook**:
- Size details (e.g., "3x3x3 inches")
- Light base selection
- Background option (2D/3D/Remove)
- Custom text (line 1 & line 2)
- Custom image URLs
- Cockpit3D option IDs

### **3. Image Handling**
**Current**:
- Raw image (original upload)
- Masked image (with crystal shape applied)
- Both stored in IndexedDB
- Thumbnail created at 400px @ 0.9 quality

**Issues**:
- Thumbnail too compressed
- No server-side storage until checkout
- No cleanup mechanism

---

## 💡 **COMPREHENSIVE SOLUTION**

### **Architecture Overview**
```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Add to Cart                                       │
├─────────────────────────────────────────────────────────────┤
│  1. User configures product (size, options, image, text)   │
│  2. Frontend uploads images to server immediately           │
│     → Returns: image_id, urls (thumbnail + full)           │
│  3. Cart stores: image_id + urls (NOT image data)          │
│  4. localStorage only stores: metadata + image references   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Cart Display                                      │
├─────────────────────────────────────────────────────────────┤
│  1. Load cart from localStorage                             │
│  2. Display images from SERVER urls (better quality)        │
│  3. Show complete options breakdown                         │
│  4. No localStorage bloat (only refs)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: Checkout                                          │
├─────────────────────────────────────────────────────────────┤
│  1. Upload FULL cart JSON to server → cart_id              │
│  2. Create Stripe session with cart_id reference            │
│  3. Stripe stores: order_number + cart_id                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: Webhook → Cockpit3D                               │
├─────────────────────────────────────────────────────────────┤
│  1. Retrieve full cart using cart_id                        │
│  2. Build complete Cockpit3D order (all options)            │
│  3. Submit to Cockpit3D with image URLs                     │
│  4. Cleanup: Mark cart as processed                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: Cleanup                                           │
├─────────────────────────────────────────────────────────────┤
│  1. Cron job: Delete abandoned carts (24hr+)               │
│  2. Delete associated images from abandoned carts           │
│  3. Archive completed orders (30 days)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **IMPLEMENTATION PLAN**

### **PART 1: Improved Image Upload & Storage**

#### **1.1 New Image Upload Endpoint**
**File**: `/app/api/customer-image-upload-v2.php`

**Features**:
- Upload on "Add to Cart" (not at checkout)
- Generate multiple sizes: thumbnail (300x300), display (800x800), full (original)
- Store with session_id for security
- Return image_id and URLs
- Auto-delete after 48 hours if not purchased

**Image Sizes**:
```php
// Thumbnail for cart list view (300x300 @ 0.85 quality)
// Display for cart detail view (800x800 @ 0.9 quality)
// Full resolution for Cockpit3D (original size)
```

#### **1.2 Security Measures**
```php
// Generate unique, unpredictable image IDs
$imageId = bin2hex(random_bytes(16)) . '_' . time();

// Store in structured directory
/public/img/temp-customer-uploads/
  ├── 2025-11/
  │   ├── 26/
  │   │   ├── abc123_thumb.jpg
  │   │   ├── abc123_display.jpg
  │   │   └── abc123_full.jpg

// Access control: Check referer, rate limiting
// No directory listing
```

#### **1.3 Database Table: customer_images**
```sql
CREATE TABLE customer_images (
    image_id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(100),
    original_filename VARCHAR(255),
    thumbnail_path VARCHAR(255),
    display_path VARCHAR(255),
    full_path VARCHAR(255),
    file_size_bytes INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'in_cart', 'purchased', 'abandoned') DEFAULT 'pending',
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_uploaded (uploaded_at)
);
```

---

### **PART 2: Cart Storage (No localStorage Bloat)**

#### **2.1 New Cart Structure**
**localStorage** (tiny, only metadata):
```json
{
  "items": [
    {
      "productId": "crystal-heart",
      "sku": "CH-3X3",
      "name": "Crystal Heart",
      "quantity": 1,
      "price": 49.99,
      
      "options": [
        {"category": "size", "id": "size_3x3", "name": "3x3x3 inches", "cockpit3d_id": "12345"},
        {"category": "lightBase", "id": "lb_wooden", "name": "Wooden Base", "cockpit3d_id": "67890"},
        {"category": "background", "id": "bg_3d", "name": "3D Background", "cockpit3d_id": "154"}
      ],
      
      "customText": {
        "line1": "Forever in our hearts",
        "line2": "2024"
      },
      
      "images": {
        "imageId": "abc123def456",
        "thumbnailUrl": "/img/temp-customer-uploads/2025-11/26/abc123_thumb.jpg",
        "displayUrl": "/img/temp-customer-uploads/2025-11/26/abc123_display.jpg",
        "fullUrl": "/img/temp-customer-uploads/2025-11/26/abc123_full.jpg",
        "maskName": "heart-shape"
      }
    }
  ]
}
```

**Benefits**:
- ✅ No image data in localStorage
- ✅ All URLs point to server
- ✅ Better image quality in cart display
- ✅ Complete option data preserved
- ✅ Cockpit3D IDs included

---

### **PART 3: Cart → Checkout Flow**

#### **3.1 Store Full Cart Before Stripe**
**File**: `/app/api/stripe/store-cart.php`

```php
<?php
// Receives complete cart
// Stores in database with expiry
// Returns cart_id for Stripe metadata

$input = json_decode(file_get_contents('php://input'), true);
$cart = $input['cart'];
$sessionId = $input['session_id'] ?? session_id();

$cartId = bin2hex(random_bytes(16));

$pdo->prepare("
    INSERT INTO checkout_carts (cart_id, session_id, cart_data, created_at)
    VALUES (?, ?, ?, NOW())
")->execute([$cartId, $sessionId, json_encode($cart)]);

// Mark images as 'in_cart'
foreach ($cart['items'] as $item) {
    if (isset($item['images']['imageId'])) {
        $pdo->prepare("UPDATE customer_images SET status = 'in_cart' WHERE image_id = ?")
            ->execute([$item['images']['imageId']]);
    }
}

echo json_encode(['success' => true, 'cart_id' => $cartId]);
```

#### **3.2 Database Table: checkout_carts**
```sql
CREATE TABLE checkout_carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id VARCHAR(50) UNIQUE NOT NULL,
    session_id VARCHAR(100),
    cart_data JSON NOT NULL,
    stripe_session_id VARCHAR(255),
    order_number VARCHAR(50),
    status ENUM('pending', 'processing', 'completed', 'abandoned') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_cart_id (cart_id),
    INDEX idx_stripe_session (stripe_session_id),
    INDEX idx_status_created (status, created_at)
);
```

---

### **PART 4: Webhook → Cockpit3D (Complete Order)**

#### **4.1 Update Webhook Handler**
**File**: `/app/api/stripe/stripe-webhook.php`

```php
function handleCheckoutCompleted($session) {
    global $pdo;
    
    $orderNumber = $session->metadata->order_number;
    $cartId = $session->metadata->cart_id;
    
    // Retrieve FULL cart
    $stmt = $pdo->prepare("SELECT cart_data FROM checkout_carts WHERE cart_id = ?");
    $stmt->execute([$cartId]);
    $cartJson = $stmt->fetchColumn();
    
    if (!$cartJson) {
        error_log("❌ Cart not found: $cartId");
        return;
    }
    
    $cart = json_decode($cartJson, true);
    
    // Build Cockpit3D order with COMPLETE data
    $cockpit3dOrder = buildCompleteCockpit3DOrder($cart, $session);
    
    error_log("📦 Cockpit3D Order:\n" . json_encode($cockpit3dOrder, JSON_PRETTY_PRINT));
    
    // Send to Cockpit3D
    $result = sendToCockpit3D($cockpit3dOrder);
    
    if ($result['success']) {
        // Mark cart as completed
        $pdo->prepare("UPDATE checkout_carts SET status = 'completed', completed_at = NOW() WHERE cart_id = ?")
            ->execute([$cartId]);
        
        // Mark images as purchased (keep for fulfillment)
        foreach ($cart['items'] as $item) {
            if (isset($item['images']['imageId'])) {
                $pdo->prepare("UPDATE customer_images SET status = 'purchased' WHERE image_id = ?")
                    ->execute([$item['images']['imageId']]);
            }
        }
    }
}

function buildCompleteCockpit3DOrder($cart, $session) {
    $items = [];
    
    foreach ($cart['items'] as $cartItem) {
        $item = [
            'sku' => $cartItem['sku'],
            'qty' => (string)$cartItem['quantity'],
            'client_item_id' => $cartItem['productId'] . '-' . uniqid(),
            'options' => [],
            'price' => $cartItem['price']
        ];
        
        // Add ALL options with Cockpit3D IDs
        foreach ($cartItem['options'] as $option) {
            if (isset($option['cockpit3d_id'])) {
                $item['options'][] = [
                    'id' => $option['cockpit3d_id'],
                    'qty' => '1'
                ];
            }
        }
        
        // Add custom images (use full URL)
        if (isset($cartItem['images']['fullUrl'])) {
            $baseUrl = 'https://crystalkeepsakes.com'; // or from env
            $item['original_photo'] = $baseUrl . $cartItem['images']['fullUrl'];
            $item['cropped_photo'] = $baseUrl . $cartItem['images']['fullUrl'];
        }
        
        // Add custom text
        if (isset($cartItem['customText'])) {
            $item['special_instructions'] = implode(' | ', array_filter([
                $cartItem['customText']['line1'] ?? '',
                $cartItem['customText']['line2'] ?? ''
            ]));
        }
        
        $items[] = $item;
    }
    
    // Build complete order
    return [
        'retailer_id' => getEnvVariable('COCKPIT3D_RETAIL_ID'),
        'order_id' => $session->metadata->order_number,
        'address' => buildAddressFromSession($session),
        'items' => $items
    ];
}
```

---

### **PART 5: Cleanup System**

#### **5.1 Cron Job: Abandoned Cart Cleanup**
**File**: `/app/api/cron/cleanup-abandoned-carts.php`

```php
<?php
// Run daily via cron: 0 2 * * * php /path/to/cleanup-abandoned-carts.php

require_once __DIR__ . '/../stripe/db-connect.php';

$cutoff = date('Y-m-d H:i:s', strtotime('-48 hours'));

// Find abandoned carts
$stmt = $pdo->prepare("
    SELECT cart_id, cart_data 
    FROM checkout_carts 
    WHERE status = 'pending' AND created_at < ?
");
$stmt->execute([$cutoff]);
$abandonedCarts = $stmt->fetchAll();

foreach ($abandonedCarts as $cart) {
    $cartData = json_decode($cart['cart_data'], true);
    
    // Delete associated images
    foreach ($cartData['items'] as $item) {
        if (isset($item['images']['imageId'])) {
            $imageId = $item['images']['imageId'];
            
            // Get image paths
            $stmt = $pdo->prepare("SELECT thumbnail_path, display_path, full_path FROM customer_images WHERE image_id = ?");
            $stmt->execute([$imageId]);
            $paths = $stmt->fetch();
            
            if ($paths) {
                // Delete physical files
                @unlink($_SERVER['DOCUMENT_ROOT'] . $paths['thumbnail_path']);
                @unlink($_SERVER['DOCUMENT_ROOT'] . $paths['display_path']);
                @unlink($_SERVER['DOCUMENT_ROOT'] . $paths['full_path']);
                
                // Delete DB record
                $pdo->prepare("DELETE FROM customer_images WHERE image_id = ?")->execute([$imageId]);
            }
        }
    }
    
    // Mark cart as abandoned
    $pdo->prepare("UPDATE checkout_carts SET status = 'abandoned' WHERE cart_id = ?")
        ->execute([$cart['cart_id']]);
}

echo "Cleaned up " . count($abandonedCarts) . " abandoned carts\n";
```

#### **5.2 Cron Job: Archive Old Orders**
```php
// Archive completed orders after 30 days
$archiveCutoff = date('Y-m-d H:i:s', strtotime('-30 days'));

$pdo->prepare("
    UPDATE checkout_carts 
    SET status = 'archived' 
    WHERE status = 'completed' AND completed_at < ?
")->execute([$archiveCutoff]);

// Keep purchased images for 90 days (for customer support)
$imageCutoff = date('Y-m-d H:i:s', strtotime('-90 days'));
$stmt = $pdo->prepare("SELECT * FROM customer_images WHERE status = 'purchased' AND uploaded_at < ?");
$stmt->execute([$imageCutoff]);
// ... delete files and records
```

---

## 🧪 **TESTING PROTOCOL**

### **Test Order: Complete Product Configuration**

**Product**: Crystal Heart 3x3x3  
**Options**:
- ✅ Size: 3x3x3 inches (Cockpit3D ID: 12345)
- ✅ Light Base: Wooden Base (Cockpit3D ID: 67890)
- ✅ Background: 3D Background (Cockpit3D ID: 154)
- ✅ Custom Text: "Forever in our hearts" / "2024"
- ✅ Custom Image: Uploaded + masked

**Test Steps**:
```
1. Upload image → Verify 3 sizes created on server
2. Add to cart → Verify localStorage only has references
3. View cart → Verify display image quality (800x800)
4. Proceed to checkout → Verify cart uploaded to server
5. Complete Stripe payment → Test card: 4242 4242 4242 4242
6. Check webhook logs → Verify full cart retrieved
7. Check Cockpit3D → Verify order with ALL options
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Image Upload System** (2-3 hours)
- [ ] Create `/app/api/customer-image-upload-v2.php`
- [ ] Create `customer_images` database table
- [ ] Test image upload with 3 sizes
- [ ] Verify URLs returned correctly

### **Phase 2: Update Cart System** (1-2 hours)
- [ ] Update `/app/src/lib/cartUtils.ts` to use image URLs
- [ ] Remove IndexedDB image storage
- [ ] Test cart with server-hosted images
- [ ] Verify localStorage size reduction

### **Phase 3: Cart Storage Endpoint** (1 hour)
- [ ] Create `/app/api/stripe/store-cart.php`
- [ ] Create `checkout_carts` database table
- [ ] Test cart upload before checkout

### **Phase 4: Update Checkout Flow** (1 hour)
- [ ] Update `/app/src/app/checkout/page.tsx`
- [ ] Upload cart before Stripe session
- [ ] Pass cart_id to checkout-session.php

### **Phase 5: Update Webhook** (2-3 hours)
- [ ] Update `/app/api/stripe/stripe-webhook.php`
- [ ] Retrieve full cart in webhook
- [ ] Build complete Cockpit3D order
- [ ] Test with Stripe test webhook

### **Phase 6: Cleanup System** (1-2 hours)
- [ ] Create `/app/api/cron/cleanup-abandoned-carts.php`
- [ ] Set up cron job on server
- [ ] Test cleanup logic

### **Phase 7: End-to-End Testing** (2-3 hours)
- [ ] Complete test order with all options
- [ ] Verify Cockpit3D receives everything
- [ ] Test abandoned cart cleanup
- [ ] Load test (10+ products in cart)

---

## 🎯 **NEXT STEPS**

Should I:
1. **Start with Phase 1** (Image Upload System)?
2. **Create all files at once** and then test?
3. **Focus on a specific concern first**?

This plan addresses ALL your concerns:
- ✅ Complete order data to Cockpit3D
- ✅ Better image quality (800x800 display)
- ✅ No localStorage bloat
- ✅ Secure image handling
- ✅ Abandoned cart cleanup
- ✅ Keep each part of the process in mind

Ready to implement? 🚀
