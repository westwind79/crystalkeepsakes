# Complete Checkout Flow Implementation

## Date: 2025-01-14

---

## Current Issues:

1. ❌ **No shipping address collection**
2. ❌ **No Cockpit3D order structure in payment metadata**
3. ❌ **Webhook doesn't send order to Cockpit3D**
4. ⚠️ **Cart items missing cockpit3d_id fields**

---

## Complete Flow Architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CHECKOUT PAGE (checkout/page.tsx)                            │
├─────────────────────────────────────────────────────────────────┤
│ - Collect shipping address                                       │
│ - Select shipping method                                         │
│ - Build Cockpit3D order structure from cart                     │
│ - Create Stripe Payment Intent with metadata                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. STRIPE PAYMENT INTENT (create-payment-intent.php)            │
├─────────────────────────────────────────────────────────────────┤
│ - Store full order data in metadata:                            │
│   * Cart items with cockpit3d_ids                               │
│   * Shipping address                                             │
│   * Customer email                                               │
│   * Custom image IDs                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PAYMENT SUCCESS (payment_intent.succeeded)                   │
├─────────────────────────────────────────────────────────────────────┤
│ Webhook receives event                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. BUILD COCKPIT3D ORDER (stripe-webhook.php)                   │
├─────────────────────────────────────────────────────────────────┤
│ - Extract metadata from payment intent                           │
│ - Retrieve custom images from IndexedDB URLs                     │
│ - Build Cockpit3D API payload                                    │
│ - Map option IDs correctly                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. SEND TO COCKPIT3D (Cockpit3D API)                            │
├─────────────────────────────────────────────────────────────────┤
│ POST to profit.cockpit3d.com/api/orders                         │
│ - Order details                                                  │
│ - Shipping address                                               │
│ - Custom images (base64)                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. ORDER CONFIRMATION                                            │
├─────────────────────────────────────────────────────────────────┤
│ - Customer receives confirmation email                           │
│ - Cockpit3D begins fulfillment                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps:

### Step 1: Update CartItem Interface

**File:** `/src/lib/cartUtils.ts`

Add missing fields:

```typescript
export interface CartItem {
  productId: string
  cockpit3d_id?: string  // ← ADD IF MISSING
  name: string
  sku: string
  price: number
  quantity: number
  options: {
    size?: {
      id: string
      name: string
      price: number
      cockpit3d_id: string  // ← IMPORTANT
    }
    lightbase?: {
      id: string
      name: string
      price: number
      cockpit3d_id: string  // ← IMPORTANT
    }
    background?: {
      id: string
      name: string
      price: number
      cockpit3d_option_id: string  // ← IMPORTANT
    }
    text?: {
      id: string
      name: string
      price: number
      cockpit3d_option_id: string  // ← IMPORTANT
      value?: string
    }
  }
  sizeDetails?: any
  productImage?: string
  customImageId?: string
  customImageMetadata?: {
    filename?: string
    hasImage: boolean
  }
  dateAdded: string
}
```

### Step 2: Update Checkout Page with Shipping Form

**File:** `/src/app/checkout/page.tsx`

Add shipping address collection:

```typescript
interface ShippingAddress {
  name: string
  email: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export default function CheckoutPage() {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  })
  
  // ... rest of state
  
  // Build Cockpit3D order structure
  function buildCockpit3DOrder() {
    return cart.map(item => ({
      product_id: item.cockpit3d_id || item.productId,
      quantity: item.quantity,
      options: [
        // Size option
        item.options?.size && {
          option_id: '151',  // Size option ID
          value_id: item.options.size.cockpit3d_id,
          name: 'Size',
          value: item.options.size.name
        },
        // Lightbase option
        item.options?.lightbase && item.options.lightbase.id !== 'none' && {
          option_id: '152',  // Light Base option ID
          value_id: item.options.lightbase.cockpit3d_id,
          name: 'Light Base',
          value: item.options.lightbase.name
        },
        // Background option
        item.options?.background && item.options.background.id !== 'rm' && {
          option_id: item.options.background.cockpit3d_option_id,
          name: item.options.background.name,
          value: 'true'
        },
        // Text option
        item.options?.text && item.options.text.id !== 'none' && {
          option_id: item.options.text.cockpit3d_option_id,
          name: 'Customer text',
          value: item.options.text.value || ''
        }
      ].filter(Boolean),
      custom_image: item.customImageId ? {
        image_id: item.customImageId,
        filename: item.customImageMetadata?.filename || 'custom.jpg',
        // Image data will be retrieved in webhook
      } : undefined
    }))
  }
  
  // Initialize payment with full order data
  async function initializePayment() {
    try {
      // Validate shipping address
      if (!shippingAddress.name || !shippingAddress.email || 
          !shippingAddress.line1 || !shippingAddress.city) {
        throw new Error('Please complete shipping address')
      }
      
      const cockpitOrder = buildCockpit3DOrder()
      
      const result = await createPaymentIntent(
        cart,
        shippingMethod,
        cart,  // fullCartItems
        `ORD-${Date.now()}`,
        {
          items: cockpitOrder,
          shipping_address: shippingAddress,
          customer_email: shippingAddress.email,
          customer_name: shippingAddress.name
        }
      )
      
      setClientSecret(result.clientSecret)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }
}
```

### Step 3: Update create-payment-intent.php

**File:** `/app/api/stripe/create-payment-intent.php`

Store order data in metadata:

```php
// After calculating total
$metadata = [
    'order_number' => $orderNumber,
    'shipping_method' => $shippingMethod,
    'customer_email' => $cockpitOrder['customer_email'] ?? '',
    'customer_name' => $cockpitOrder['customer_name'] ?? '',
    
    // Store entire order as JSON
    'cockpit3d_order' => json_encode($cockpitOrder),
    
    // Store shipping address
    'shipping_address' => json_encode($cockpitOrder['shipping_address'] ?? []),
    
    // Cart items (for reference)
    'cart_items' => json_encode($cartItems)
];

// Create Payment Intent
$paymentIntent = \Stripe\PaymentIntent::create([
    'amount' => $totalInCents,
    'currency' => 'usd',
    'metadata' => $metadata,
    'automatic_payment_methods' => [
        'enabled' => true,
    ],
]);
```

### Step 4: Update Webhook to Handle Payment Success

**File:** `/app/api/stripe/stripe-webhook.php`

Add payment_intent.succeeded handler:

```php
case 'payment_intent.succeeded':
    $paymentIntent = $event->data->object;
    
    // Extract order data
    $metadata = $paymentIntent->metadata;
    $orderNumber = $metadata->order_number ?? 'unknown';
    
    // Parse Cockpit3D order
    $cockpitOrder = json_decode($metadata->cockpit3d_order ?? '{}', true);
    $shippingAddress = json_decode($metadata->shipping_address ?? '{}', true);
    
    if (!empty($cockpitOrder['items'])) {
        // Process custom images
        foreach ($cockpitOrder['items'] as &$item) {
            if (isset($item['custom_image']['image_id'])) {
                // Custom images are stored client-side in IndexedDB
                // We need a way to retrieve them
                // Option 1: Store image URLs in metadata
                // Option 2: Upload images before payment
                // Option 3: Email link to customer to upload
            }
        }
        
        // Send to Cockpit3D
        $cockpitResult = sendToCockpit3D([
            'order' => [
                'order_id' => $paymentIntent->id,
                'customer_email' => $metadata->customer_email,
                'customer_name' => $metadata->customer_name,
                'shipping_address' => $shippingAddress,
                'items' => $cockpitOrder['items']
            ]
        ]);
        
        if ($cockpitResult['success']) {
            console_log("✅ Order sent to Cockpit3D", [
                'order_id' => $paymentIntent->id,
                'cockpit_order_id' => $cockpitResult['cockpit_order_id']
            ]);
        } else {
            console_log("❌ Failed to send to Cockpit3D", [
                'error' => $cockpitResult['error']
            ]);
        }
    }
    break;

// Add new function
function sendToCockpit3D($orderData) {
    $apiUrl = 'https://profit.cockpit3d.com/api/orders';
    $apiKey = getenv('COCKPIT3D_API_KEY') ?: 'your-api-key';
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        $result = json_decode($response, true);
        return [
            'success' => true,
            'cockpit_order_id' => $result['order_id'] ?? null
        ];
    }
    
    return [
        'success' => false,
        'error' => $response
    ];
}
```

---

## Custom Image Handling Issue:

The main challenge: **Custom images are in IndexedDB (browser storage)** and can't be accessed from webhook.

### Solution Options:

**Option A: Upload Before Payment** (RECOMMENDED)
1. Before creating payment intent, upload custom images to server
2. Store image URLs in metadata
3. Webhook retrieves images from URLs

**Option B: Email Link After Payment**
1. Complete payment without images
2. Send customer email with link to upload images
3. Link includes order ID and image IDs

**Option C: Store Images as Data URLs in Metadata**
1. Extract images from IndexedDB before checkout
2. Convert to base64
3. Store in payment metadata (careful: metadata has 500KB limit)

---

## Testing Checklist:

### 1. Cart to Checkout
```
[ ] Cart items have all cockpit3d_id fields
[ ] Product images display in cart
[ ] Prices calculate correctly
[ ] Proceed to checkout works
```

### 2. Checkout Page
```
[ ] Shipping address form displays
[ ] All fields required and validated
[ ] Shipping method selection works
[ ] Order total updates with shipping
[ ] Payment form loads
```

### 3. Payment Intent Creation
```
[ ] Full order data in metadata
[ ] Shipping address included
[ ] Custom image IDs included
[ ] Amount matches cart total
```

### 4. Payment Success
```
[ ] Webhook receives payment_intent.succeeded
[ ] Order data extracted correctly
[ ] Cockpit3D order built correctly
[ ] API call to Cockpit3D succeeds
[ ] Customer redirected to confirmation
```

### 5. Cockpit3D Order
```
[ ] Order appears in Cockpit3D dashboard
[ ] All items included
[ ] Options mapped correctly
[ ] Shipping address correct
[ ] Custom images attached
```

---

## Environment Variables Needed:

```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cockpit3D
COCKPIT3D_API_KEY=your_api_key
COCKPIT3D_API_URL=https://profit.cockpit3d.com/api
```

---

## Next Implementation Priority:

1. **HIGH:** Add shipping address form to checkout
2. **HIGH:** Update payment intent to include full order metadata
3. **HIGH:** Implement webhook payment_intent.succeeded handler
4. **MEDIUM:** Solve custom image upload (choose Option A, B, or C)
5. **MEDIUM:** Test complete flow
6. **LOW:** Add order confirmation page

