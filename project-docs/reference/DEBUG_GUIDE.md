# Debug Overlay Guide

## Quick Start

**View debug overlay:**
- Dev: Automatically shows 🐛 button bottom-right
- Production: Add `?debug=true` to URL

## Usage in Code

```typescript
import { debugStep } from '@/components/DebugOverlay'

// Track a step
debugStep('step-id', 'Step Name', 'status', optionalData, optionalError)
```

## Statuses

- `'pending'` - Not started (○)
- `'active'` - In progress (⟳)
- `'complete'` - Success (✓)
- `'error'` - Failed (✕)

## Key Order Flow Steps

```typescript
// 1. Cart Load
debugStep('cart-load', 'Loading cart', 'active')
debugStep('cart-load', 'Cart loaded', 'complete', { itemCount: 5 })

// 2. Image Upload
debugStep('img-upload', 'Uploading images', 'active')
debugStep('img-upload', 'Images uploaded', 'complete', { 
  urls: ['server/path/img1.jpg', 'server/path/img2.jpg']
})

// 3. Checkout
debugStep('checkout', 'Creating checkout session', 'active')
debugStep('checkout', 'Stripe session created', 'complete', { sessionId: 'cs_xxx' })

// 4. Payment
debugStep('payment', 'Processing payment', 'active')
debugStep('payment', 'Payment confirmed', 'complete', { amount: 99.99 })

// 5. Cockpit3D Order
debugStep('cockpit-order', 'Creating Cockpit3D order', 'active', { 
  items: orderItems 
})
debugStep('cockpit-order', 'Order created', 'complete', { 
  orderId: 'C3D-123',
  response: apiResponse 
})

// Error Example
debugStep('payment', 'Payment failed', 'error', null, 'Card declined')
```

## Example: Add to Checkout

```typescript
// src/app/checkout/page.tsx
import { debugStep } from '@/components/DebugOverlay'

async function handleCheckout() {
  debugStep('checkout', 'Starting checkout', 'active', { 
    total: cartTotal,
    items: cartItems.length 
  })
  
  try {
    const response = await fetch('/api/stripe/create-checkout-session.php')
    const data = await response.json()
    
    debugStep('checkout', 'Checkout session created', 'complete', { 
      sessionId: data.id,
      url: data.url 
    })
    
    window.location.href = data.url
  } catch (error) {
    debugStep('checkout', 'Checkout failed', 'error', null, error.message)
  }
}
```

## Critical Steps to Track

**Cart:**
- ✅ Load cart
- ✅ Add item
- ✅ Remove item
- ✅ Update quantity

**Images:**
- Upload to server
- Get server URLs
- Store in cart

**Checkout:**
- Create Stripe session
- Redirect to Stripe

**Payment:**
- Webhook received
- Payment confirmed

**Order:**
- Upload images to Cockpit3D (if needed)
- Create order
- Order ID received

**Confirmation:**
- Email sent
- Order saved
