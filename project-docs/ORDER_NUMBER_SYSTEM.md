# 🎯 Order Number System - Complete Consistency

## 📋 **Order Number Format**

**Format**: `CK-{TIMESTAMP}-{RANDOM}`

**Examples:**
- `CK-1764206918-A3F9`
- `CK-1764207123-B8K2`

**Why this format?**
- ✅ Unique (timestamp + random)
- ✅ Sortable (timestamp first)
- ✅ Readable (CK prefix = Crystal Keepsakes)
- ✅ Short enough for Stripe metadata
- ✅ URL-safe (no special chars)

---

## 🔄 **Order Number Flow**

```
1. User clicks "Proceed to Checkout"
   → Generate order number: CK-1764206918-A3F9
   → Store in localStorage

2. Upload images to server
   → Save to: /crystal-orders/order-images-test/CK-1764206918-A3F9/
   → Files: customer_104_masked.png, customer_104_raw.jpg

3. Create Payment Intent (Stripe)
   → metadata.order_number = "CK-1764206918-A3F9"
   → Shows in Stripe Dashboard

4. Create Checkout Session (Stripe)
   → metadata.order_number = "CK-1764206918-A3F9"
   → client_reference_id = "CK-1764206918-A3F9"

5. Store in Database
   → orders.order_number = "CK-1764206918-A3F9"
   → order_images.order_number = "CK-1764206918-A3F9"

6. Webhook receives payment
   → Extract: session.metadata.order_number
   → Update database with payment info

7. Send to Cockpit3D
   → order_id = "CK-1764206918-A3F9"
   → Image URLs: /crystal-orders/order-images-test/CK-1764206918-A3F9/xxx.jpg
```

---

## 📁 **Folder Structure**

### **Test Environment:**
```
/crystal-orders/
└── order-images-test/
    ├── CK-1764206918-A3F9/
    │   ├── customer_104_masked.png
    │   ├── customer_104_raw.jpg
    │   └── metadata.json
    ├── CK-1764207123-B8K2/
    │   ├── customer_105_masked.png
    │   └── customer_105_raw.jpg
    └── abandoned/              ← Move here if not paid within 48hrs
        └── CK-1764206000-X1Y2/
```

### **Production:**
```
/crystal-orders/
└── order-images/
    ├── CK-1764206918-A3F9/
    └── CK-1764207123-B8K2/
```

---

## 🗄️ **Database Schema**

### **Table: orders**
```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Stripe IDs (for reference only)
    stripe_payment_intent_id VARCHAR(100),
    stripe_checkout_session_id VARCHAR(100),
    stripe_customer_id VARCHAR(100),
    
    -- Order details
    cart_data JSON NOT NULL,
    subtotal DECIMAL(10,2),
    shipping_cost DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    
    -- Customer info
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    
    -- Status tracking
    order_status ENUM('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    cockpit3d_status ENUM('pending', 'submitted', 'accepted', 'failed') DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    
    -- Tracking
    cockpit3d_order_id VARCHAR(100),
    tracking_number VARCHAR(100),
    
    INDEX idx_order_number (order_number),
    INDEX idx_stripe_session (stripe_checkout_session_id),
    INDEX idx_email (customer_email),
    INDEX idx_status (order_status),
    INDEX idx_created (created_at)
);
```

### **Table: order_images**
```sql
CREATE TABLE order_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    product_id VARCHAR(50),
    
    -- Image info
    image_type ENUM('masked', 'raw') NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(50),
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_order (order_number),
    FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE
);
```

---

## 🎯 **Implementation Plan**

### **Step 1: Generate Order Number at Checkout Start**

**File**: `/src/app/checkout/page.tsx`

```typescript
// Generate order number ONCE at start
const orderNumber = localStorage.getItem('pending_order_number') || 
                    `CK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
localStorage.setItem('pending_order_number', orderNumber);

console.log('🎫 Order Number:', orderNumber);
```

### **Step 2: Use Order Number for Image Folders**

**File**: `/api/customer-image-upload.php`

```php
// Receive order number from frontend
$orderNumber = $data['orderNumber'] ?? 'TEMP-' . time();

// Create order-based folder
$orderFolder = $uploadDir . $orderNumber . '/';
if (!file_exists($orderFolder)) {
    mkdir($orderFolder, 0755, true);
}

// Save image
$filename = "customer_{$productId}_{$imageType}.{$imageExtension}";
$filePath = $orderFolder . $filename;
```

### **Step 3: Save to Database**

**File**: `/api/stripe/create-checkout-session.php`

```php
// Before creating Stripe session, save order to database
$stmt = $pdo->prepare("
    INSERT INTO orders (
        order_number, cart_data, subtotal, 
        order_status, payment_status
    ) VALUES (?, ?, ?, 'pending', 'pending')
");
$stmt->execute([
    $orderNumber,
    json_encode($cartItems),
    $subtotal
]);

// Save image references
foreach ($cartItems as $item) {
    if (isset($item['maskedImageUrl'])) {
        $stmt = $pdo->prepare("
            INSERT INTO order_images (
                order_number, product_id, image_type, 
                file_path, file_url
            ) VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $orderNumber,
            $item['productId'],
            'masked',
            $item['maskedImagePath'],
            $item['maskedImageUrl']
        ]);
    }
}
```

### **Step 4: Update Stripe Session**

```php
$sessionParams = [
    'client_reference_id' => $orderNumber,  // Shows in Stripe Dashboard
    'metadata' => [
        'order_number' => $orderNumber,
        'environment' => $mode
    ],
    // ... rest
];
```

### **Step 5: Webhook Updates Database**

**File**: `/api/stripe/stripe-webhook.php`

```php
function handleCheckoutCompleted($session) {
    $orderNumber = $session->metadata->order_number;
    
    // Update order status
    $stmt = $pdo->prepare("
        UPDATE orders SET
            order_status = 'paid',
            payment_status = 'paid',
            stripe_payment_intent_id = ?,
            stripe_checkout_session_id = ?,
            stripe_customer_id = ?,
            paid_at = NOW()
        WHERE order_number = ?
    ");
    $stmt->execute([
        $session->payment_intent,
        $session->id,
        $session->customer,
        $orderNumber
    ]);
    
    // Send to Cockpit3D with order number
    sendToCockpit3D($orderNumber);
}
```

### **Step 6: Cockpit3D Submission**

```php
function sendToCockpit3D($orderNumber) {
    // Get order from database
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();
    
    // Get images
    $stmt = $pdo->prepare("SELECT * FROM order_images WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $images = $stmt->fetchAll();
    
    // Build Cockpit3D order
    $cockpit3dOrder = [
        'order_id' => $orderNumber,  // USE OUR ORDER NUMBER
        'items' => buildItems($order, $images)
    ];
    
    // Submit to Cockpit3D
    $response = submitToCockpit3D($cockpit3dOrder);
    
    // Update status
    $stmt = $pdo->prepare("
        UPDATE orders SET
            cockpit3d_status = 'submitted',
            cockpit3d_order_id = ?
        WHERE order_number = ?
    ");
    $stmt->execute([$response['cockpit3d_id'], $orderNumber]);
}
```

---

## 🧹 **Cleanup System**

### **Abandoned Cart Cleanup (Cron Job)**

**File**: `/api/cron/cleanup-abandoned-orders.php`

```php
<?php
// Run daily: 0 2 * * * php cleanup-abandoned-orders.php

$cutoff = date('Y-m-d H:i:s', strtotime('-48 hours'));

// Find abandoned orders (not paid)
$stmt = $pdo->prepare("
    SELECT order_number 
    FROM orders 
    WHERE payment_status = 'pending' 
    AND created_at < ?
");
$stmt->execute([$cutoff]);
$abandoned = $stmt->fetchAll();

foreach ($abandoned as $order) {
    $orderNum = $order['order_number'];
    
    // Move images to abandoned folder
    $sourceDir = "/crystal-orders/order-images-test/$orderNum/";
    $targetDir = "/crystal-orders/order-images-test/abandoned/$orderNum/";
    
    if (is_dir($sourceDir)) {
        rename($sourceDir, $targetDir);
    }
    
    // Update database
    $pdo->prepare("UPDATE orders SET order_status = 'cancelled' WHERE order_number = ?")
        ->execute([$orderNum]);
}

echo "Cleaned up " . count($abandoned) . " abandoned orders\n";
```

---

## ✅ **Benefits of This System**

1. **ONE order number everywhere**
   - ✅ Cart
   - ✅ Stripe Payment Intent
   - ✅ Stripe Checkout Session
   - ✅ Database
   - ✅ Image folders
   - ✅ Cockpit3D order

2. **Easy tracking**
   - Search by order number finds EVERYTHING
   - Stripe Dashboard shows your order number
   - File system organized by order

3. **Easy cleanup**
   - Delete folder = delete all images for that order
   - Database tracks status
   - Automated abandoned cart handling

4. **Production ready**
   - Same structure for test and production
   - Just change folder path in .env

---

## 🚀 **Next Steps**

Should I:
1. **Implement this complete system** (order-based folders, database tracking)?
2. **Start with order-based folders** first, add database later?
3. **Focus on Cockpit3D integration** with current setup?

This will make everything consistent and production-ready! 🎯
