# 🎯 Hybrid Payment Solution: Best of Both Worlds

## ✅ **What You Want:**
1. ✅ Track abandoned checkouts (Payment Intents)
2. ✅ Stripe hosts the payment page (no SSL needed on your site)
3. ✅ Order confirmation redirect (helps with tracking)
4. ✅ No custom payment form
5. ✅ Shows in Stripe Dashboard immediately

## 🚀 **The Hybrid Approach**

### **Flow:**
```
1. User clicks "Proceed to Checkout"
   → Create Payment Intent (shows in Stripe immediately)
   
2. Create Checkout Session with Payment Intent
   → Link them together
   
3. Redirect to Stripe-hosted page
   → User enters card details on Stripe's site (not yours)
   
4. Payment completes
   → Intent status: "succeeded"
   → Checkout Session: "complete"
   → Webhook fires
   
5. Redirect back to your order-confirmation page
   → Tracks conversion
   → Shows order details

If user abandons at step 3:
   → Payment Intent stays "requires_payment_method"
   → Shows in Stripe Dashboard as incomplete
   → You can track abandonment rate
```

### **Benefits:**
- ✅ No SSL/PCI compliance needed (Stripe handles it)
- ✅ Track abandoned checkouts
- ✅ Shows in Stripe immediately
- ✅ Simple redirect flow (what you have now)
- ✅ Order confirmation page for analytics
- ✅ Webhook still fires on success

---

## 🛠️ **Implementation**

### **Step 1: Update create-checkout-session.php**

Add Payment Intent creation BEFORE Checkout Session:

```php
<?php
// ... existing code ...

try {
    // ... existing Stripe setup ...
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Calculate amount
    $amountInCents = 0;
    foreach ($data['cartItems'] as $item) {
        $itemPrice = floatval($item['price'] ?? 0);
        $itemQuantity = intval($item['quantity'] ?? 1);
        $amountInCents += round(($itemPrice * $itemQuantity) * 100);
    }
    
    // Order number
    $orderNumber = $data['orderNumber'] ?? ('CK-' . time());
    if ($mode !== 'production') {
        $orderNumber = 'TEST_' . $orderNumber;
    }
    
    // STEP 1: Create Payment Intent FIRST
    $paymentIntent = \Stripe\PaymentIntent::create([
        'amount' => $amountInCents,
        'currency' => 'usd',
        'automatic_payment_methods' => [
            'enabled' => true,
        ],
        'metadata' => [
            'order_number' => $orderNumber,
            'items_count' => count($data['cartItems']),
            'created_from' => 'checkout_session',
        ]
    ]);
    
    error_log("✓ Payment Intent created: " . $paymentIntent->id);
    
    // STEP 2: Create Checkout Session linked to Payment Intent
    $sessionParams = [
        'payment_intent_data' => [
            'setup_future_usage' => 'on_session', // Optional: save card for future
        ],
        'line_items' => $lineItems,
        'mode' => 'payment',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => [
            'order_number' => $orderNumber,
            'payment_intent_id' => $paymentIntent->id, // Link them
        ],
        'customer_email' => $data['customerEmail'] ?? null,
        'allow_promotion_codes' => true,
    ];
    
    // Add shipping/tax for production only
    if ($mode === 'production') {
        $sessionParams['shipping_address_collection'] = [
            'allowed_countries' => ['US', 'CA'],
        ];
        $sessionParams['shipping_options'] = [
            ['shipping_rate' => 'shr_1RRRX82YE48VQlzYpcQsdaSE'],
            // ... your other rates
        ];
        $sessionParams['automatic_tax'] = ['enabled' => true];
    }
    
    $checkoutSession = \Stripe\Checkout\Session::create($sessionParams);
    
    error_log("✓ Checkout session created: " . $checkoutSession->id);
    error_log("✓ Linked to payment intent: " . $paymentIntent->id);
    
    echo json_encode([
        'success' => true,
        'sessionId' => $checkoutSession->id,
        'url' => $checkoutSession->url,
        'order_number' => $orderNumber,
        'payment_intent_id' => $paymentIntent->id, // Return for tracking
    ]);
    
} catch (Exception $e) {
    error_log('❌ ERROR: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

---

### **Step 2: Update Frontend Checkout**

**File**: `/src/app/checkout/page.tsx`

```typescript
const initiateCheckout = async () => {
  try {
    const cart = getCart(); // Your cart function
    
    const response = await fetch(`${phpBackendUrl}/api/stripe/create-checkout-session.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cartItems: cart.items,
        subtotal: cart.subtotal,
        orderNumber: `CK-${Date.now()}`,
        customerEmail: userEmail, // if you have it
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store payment intent ID for tracking
      localStorage.setItem('pending_payment_intent', data.payment_intent_id);
      localStorage.setItem('pending_order_number', data.order_number);
      
      // Redirect to Stripe
      window.location.href = data.url;
    }
    
  } catch (error) {
    console.error('Checkout error:', error);
  }
};
```

---

### **Step 3: Order Confirmation Page**

**File**: `/src/app/order-confirmation/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState(null);
  
  useEffect(() => {
    if (sessionId) {
      // Verify payment with backend
      fetch(`${process.env.NEXT_PUBLIC_PHP_BACKEND_URL}/api/stripe/verify-session.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
      .then(res => res.json())
      .then(data => {
        setOrderDetails(data);
        
        // Clear pending payment intent
        localStorage.removeItem('pending_payment_intent');
        localStorage.removeItem('pending_order_number');
        
        // Clear cart
        clearCart();
      });
    }
  }, [sessionId]);
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Order Confirmed! 🎉</h1>
      
      {orderDetails && (
        <div className="bg-green-50 p-6 rounded-lg">
          <p className="text-lg">Order Number: <strong>{orderDetails.order_number}</strong></p>
          <p>Payment Status: <strong>{orderDetails.payment_status}</strong></p>
          <p>Amount: <strong>${(orderDetails.amount_total / 100).toFixed(2)}</strong></p>
          
          <div className="mt-4">
            <p>You will receive an email confirmation shortly.</p>
            <p>Your custom crystal will be created and shipped within 3-5 business days.</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### **Step 4: Create verify-session.php**

**File**: `/api/stripe/verify-session.php`

```php
<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../env-loader.php';
require_once dirname(__DIR__, 2) . '/vendor/autoload.php';

try {
    $mode = getEnvVar('NEXT_PUBLIC_ENV_MODE') ?? 'development';
    
    if ($mode === 'production') {
        $secretKey = getEnvVar('STRIPE_SECRET_KEY');
    } else {
        $secretKey = getEnvVar('STRIPE_DEVELOPMENT_SECRET_KEY');
    }
    
    \Stripe\Stripe::setApiKey($secretKey);
    
    $data = json_decode(file_get_contents('php://input'), true);
    $sessionId = $data['session_id'] ?? null;
    
    if (!$sessionId) {
        throw new Exception('Session ID required');
    }
    
    // Retrieve session from Stripe
    $session = \Stripe\Checkout\Session::retrieve($sessionId);
    
    // Get payment intent if exists
    $paymentIntent = null;
    if ($session->payment_intent) {
        $paymentIntent = \Stripe\PaymentIntent::retrieve($session->payment_intent);
    }
    
    echo json_encode([
        'success' => true,
        'order_number' => $session->metadata->order_number ?? 'Unknown',
        'payment_status' => $session->payment_status,
        'amount_total' => $session->amount_total,
        'currency' => $session->currency,
        'customer_email' => $session->customer_details->email ?? null,
        'payment_intent_status' => $paymentIntent ? $paymentIntent->status : null,
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

---

## 📊 **What Shows in Stripe Dashboard**

### **Immediately (when user clicks checkout):**
- **Payment Intent** created
  - Status: "requires_payment_method"
  - Amount: $49.99
  - Order number in metadata
  
### **After user completes payment:**
- **Payment Intent**
  - Status: "succeeded"
  - Linked to Checkout Session
  
- **Checkout Session**
  - Status: "complete"
  - Payment status: "paid"
  
- **Payment**
  - Shows in Payments list
  - Full details

### **If user abandons:**
- **Payment Intent**
  - Status: "requires_payment_method"
  - Age: X hours
  - You can see this in Dashboard and send reminders

---

## 🎯 **Abandoned Cart Tracking (Future)**

You can create a cron job to check for incomplete intents:

```php
// /api/cron/check-abandoned-carts.php

$twentyFourHoursAgo = time() - (24 * 60 * 60);

$intents = \Stripe\PaymentIntent::all([
    'limit' => 100,
    'created' => ['lt' => $twentyFourHoursAgo],
]);

foreach ($intents->data as $intent) {
    if ($intent->status === 'requires_payment_method') {
        $orderNumber = $intent->metadata->order_number ?? null;
        $email = $intent->charges->data[0]->billing_details->email ?? null;
        
        // Send reminder email
        // "You left $X in your cart. Complete your order!"
    }
}
```

---

## ❓ **FAQ**

### **Q: Do I need SSL on my site?**
A: No! Stripe handles all payment processing. Your site just redirects.

### **Q: Does order-confirmation page need HTTPS?**
A: No, but it's recommended for security. You can still use HTTP for now.

### **Q: Why is order-confirmation helpful?**
A: 
1. Tracks conversion (analytics)
2. Shows order details immediately
3. Confirms payment before email arrives
4. Clears cart after success
5. Can upsell related products

### **Q: Can I skip order-confirmation?**
A: Yes! Set `success_url` to your homepage if you prefer.

### **Q: What about shipping rates?**
A: For development: disabled (what we did)
   For production: match Cockpit3D rates in Stripe Dashboard

---

## 🚀 **Implementation Priority**

1. **Now:** Test current Checkout Session flow
2. **Next:** Add Payment Intent (15 min)
3. **Then:** Create order-confirmation page (30 min)
4. **Later:** Add abandoned cart emails (when you have email system)

Want me to implement the Payment Intent hybrid now? 🎯
