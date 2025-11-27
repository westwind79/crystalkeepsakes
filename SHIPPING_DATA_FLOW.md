# 📦 Shipping Address Data Flow

## ✅ How Shipping Works in Test vs Production

### Test Mode (/test subdirectory):
```
Customer → Stripe Checkout
         ↓
    Enters shipping address (required)
         ↓
    Sees ONLY product prices
         ↓
    No shipping rate charges
    No tax calculations
         ↓
    Completes payment
         ↓
    Returns to order-confirmation
         ↓
    Shipping data available for Cockpit3D
```

### Production Mode:
```
Customer → Stripe Checkout
         ↓
    Enters shipping address (required)
         ↓
    Selects shipping speed (3-5 days, 5-7 days, etc.)
         ↓
    Sees product price + shipping cost + tax
         ↓
    Completes payment
         ↓
    Returns to order-confirmation
         ↓
    Full order data including shipping choice sent to Cockpit3D
```

---

## 📊 Stripe Session Data Structure

When you retrieve a Stripe Checkout Session, shipping data is stored in:

### `$session->shipping_details` (Primary for shipping_address_collection)
```php
{
  "name": "John Doe",
  "address": {
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "Los Angeles",
    "state": "CA",
    "postal_code": "90001",
    "country": "US"
  }
}
```

### `$session->customer_details` (Billing info)
```php
{
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "address": {
    // Same structure as above
  }
}
```

**Note:** If shipping address is collected, `shipping_details` will have the delivery address. If not collected, `customer_details->address` might be the only address (billing).

---

## 🔄 Data Flow in Your Application

### 1. Checkout Page (`/checkout`)
```typescript
// Generates order number
const orderNumber = `CK-${Date.now()}-${randomString}`

// Uploads images to server
await uploadCustomerImages(images, orderNumber)

// Creates Stripe session (with shipping_address_collection)
fetch('/api/stripe/create-checkout-session.php', {
  cartItems, orderNumber
})

// Redirects to Stripe hosted checkout
```

### 2. Stripe Hosted Checkout
```
Customer fills out:
- Email address
- Payment card info
- Shipping address (automatically requested)
- [Production only: Shipping speed selection]
```

### 3. Order Confirmation Page (`/order-confirmation`)
```typescript
// Retrieves session ID from URL
const sessionId = searchParams.get('session_id')

// Fetches complete order data from Stripe
const response = await fetch('/api/stripe/verify-session-debug.php', {
  body: JSON.stringify({ session_id: sessionId })
})

// Response includes:
// - Order number
// - Customer email, name, phone
// - Billing address
// - Shipping address (for Cockpit3D)
// - Payment details
// - Line items
```

### 4. Cockpit3D Payload
```php
[
  'retailer_id' => '256568874',
  'order_id' => 'CK-1234567890-ABCD',
  'address' => [
    'email' => 'customer@example.com',
    'firstname' => 'John',
    'lastname' => 'Doe',
    'telephone' => '+1234567890',
    'street' => '123 Main St',
    'city' => 'Los Angeles',
    'region' => 'CA',
    'postcode' => '90001',
    'country' => 'US',
    'shipping_method' => 'standard',
    'destination' => 'customer_home'
  ],
  'items' => [...],
  'total' => 99.99
]
```

---

## 🔧 Technical Implementation

### File: `/api/stripe/create-checkout-session.php`

**Lines 234-260: Shipping Configuration**
```php
// ALWAYS collect shipping address (needed for Cockpit3D)
$sessionParams['shipping_address_collection'] = [
    'allowed_countries' => ['US', 'CA'],
];

// Add shipping RATES only in production
if ($mode === 'production') {
    $sessionParams['shipping_options'] = [
        ['shipping_rate' => 'shr_1RRRX82YE48VQlzYpcQsdaSE'], // 3-5 days
        // ... more rates
    ];
    $sessionParams['automatic_tax'] = ['enabled' => true];
} else {
    // Test mode: Address collected, but no rates/charges
}
```

### File: `/api/stripe/verify-session-debug.php`

**Lines 65-86: Extract Shipping Data**
```php
// Priority: Use shipping_details (when shipping_address_collection is used)
if (isset($session->shipping_details->address)) {
    $shippingAddress = $session->shipping_details->address;
    $shippingName = $session->shipping_details->name;
}
// Fallback: customer billing address
elseif (isset($session->customer_details->address)) {
    $shippingAddress = $session->customer_details->address;
}

// Build Cockpit3D payload with shipping address
$cockpit3dPayload = [
    'address' => [
        'street' => $shippingAddress->line1,
        'city' => $shippingAddress->city,
        'region' => $shippingAddress->state,
        'postcode' => $shippingAddress->postal_code,
        // ...
    ]
];
```

---

## 🧪 Testing Checklist

### Test Environment Verification:

**1. Checkout Flow:**
- [ ] Add product to cart
- [ ] Click checkout
- [ ] Redirected to Stripe (no shipping rate error)
- [ ] See shipping address form ✅
- [ ] Do NOT see shipping speed options ✅
- [ ] Do NOT see tax line item ✅

**2. Address Entry:**
- [ ] Fill out shipping address
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Complete payment

**3. Order Confirmation:**
- [ ] Redirected to `/test/order-confirmation`
- [ ] See order number
- [ ] Open browser console (F12)
- [ ] Check for: `🐛 [DEBUG] Complete order info`
- [ ] Verify `shipping` object contains address

**4. Shipping Data Structure:**
```javascript
// Expected in browser console:
{
  "shipping": {
    "name": "John Doe",
    "address": {
      "line1": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "postal_code": "90001",
      "country": "US"
    }
  }
}
```

---

## 🔍 Debugging Shipping Data

### Check PHP Error Log:
```bash
tail -f /test/api/stripe/checkout_session_errors.log
```

**Look for:**
```
⚠️  Test mode: Shipping ADDRESS collected (for Cockpit3D), but NO rates/tax
Customer will enter address but won't be charged for shipping
```

### Check Browser Console:
```javascript
// In order-confirmation page, press F12 → Console
// Look for debug output showing shipping details
```

### Direct API Test:
```bash
# After completing a test order, get the session_id
# Then test the verify endpoint:

curl -X POST https://crystalkeepsakes.com/test/api/stripe/verify-session-debug.php \
  -H "Content-Type: application/json" \
  -d '{"session_id":"cs_test_YOUR_SESSION_ID_HERE"}'
```

**Expected response should include:**
```json
{
  "success": true,
  "shipping": {
    "name": "Customer Name",
    "address": {
      "line1": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "postal_code": "90001",
      "country": "US"
    }
  },
  "cockpit3d_payload": {
    "address": {
      "street": "123 Main St",
      "city": "Los Angeles",
      "region": "CA",
      "postcode": "90001"
    }
  }
}
```

---

## ✅ Summary

**What You Get in Test Mode:**
- ✅ Shipping address collected
- ✅ Customer email and name
- ✅ Payment information
- ✅ Order number tracking
- ✅ Image uploads to correct folder
- ✅ Data ready for Cockpit3D

**What You DON'T Get in Test Mode:**
- ❌ Shipping rate charges (customer pays $0 for shipping)
- ❌ Tax calculations
- ❌ Shipping speed selection

**Result:** Perfect for testing the complete order flow and Cockpit3D integration without needing to configure test shipping rates in Stripe Dashboard!

