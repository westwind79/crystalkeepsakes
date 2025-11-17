# Order Data Structure - Cockpit3D & Stripe Integration

## Date: 2025-01-14

---

## Overview

This document defines the complete data structure for orders that need to work with both:
1. **Cockpit3D API** (for product fulfillment)
2. **Stripe API** (for payment processing)

---

## Product Data Structure (cockpit3d-products.js)

After data fetcher transformation, each product has:

```javascript
{
  "id": "104",
  "cockpit3d_id": "104",  // Cockpit3D product ID
  "name": "Cut Corner Diamond",
  "slug": "cut-corner-diamond",
  "sku": "Cut_Corner_Diamond",
  "basePrice": 70,
  "description": "Cut Corner Diamond",
  "longDescription": "",
  "images": [{
    "src": "/img/products/cockpit3d/104/cockpit3d_104_Cut_Corner_Diamond.jpg",
    "isMain": true
  }],
  "requiresImage": true,
  
  // Size options with Cockpit3D IDs
  "sizes": [
    {
      "id": "202",
      "name": "Cut Corner Diamond (5x5cm)",
      "price": 70,
      "cockpit3d_id": "202"  // ← For order mapping
    },
    {
      "id": "549",
      "name": "Cut Corner Diamond (6x6cm)",
      "price": 85,
      "cockpit3d_id": "549"
    },
    {
      "id": "550",
      "name": "Cut Corner Diamond (8x8cm)",
      "price": 105,
      "cockpit3d_id": "550"
    }
  ],
  
  // Lightbase options with prices from lookup
  "lightBases": [
    {
      "id": "none",
      "name": "No Base",
      "price": null,
      "cockpit3d_id": null
    },
    {
      "id": "207",
      "name": "Lightbase Rectangle",
      "price": 25,           // ← Looked up from product ID 105
      "cockpit3d_id": "207"  // ← For order mapping
    },
    {
      "id": "476",
      "name": "Rotating LED Lightbase",
      "price": 35,           // ← Looked up from product ID 160
      "cockpit3d_id": "476"
    }
  ],
  
  // Background options
  "backgroundOptions": [
    {
      "id": "rm",
      "name": "Remove Backdrop",
      "price": 0,
      "cockpit3d_option_id": null
    },
    {
      "id": "2d",
      "name": "2D Backdrop",
      "price": 12,
      "cockpit3d_option_id": "154"  // ← Option ID from catalog
    },
    {
      "id": "3d",
      "name": "3D Backdrop",
      "price": 15,
      "cockpit3d_option_id": "155"
    }
  ],
  
  // Text options
  "textOptions": [
    {
      "id": "none",
      "name": "No Text",
      "price": 0,
      "cockpit3d_option_id": null
    },
    {
      "id": "customText",
      "name": "Custom Text",
      "price": 9.5,
      "cockpit3d_option_id": "199"  // ← Option ID from catalog
    }
  ]
}
```

---

## Cart Item Structure (localStorage)

```javascript
{
  "productId": "104",
  "cockpit3d_id": "104",
  "name": "Cut Corner Diamond",
  "sku": "Cut_Corner_Diamond",
  "price": 155,  // Total calculated price
  "quantity": 1,
  
  "productImage": "/img/products/cockpit3d/104/cockpit3d_104_Cut_Corner_Diamond.jpg",
  
  // Selected options with IDs for mapping
  "options": {
    "size": {
      "id": "549",
      "name": "Cut Corner Diamond (6x6cm)",
      "price": 85,
      "cockpit3d_id": "549"
    },
    "lightbase": {
      "id": "207",
      "name": "Lightbase Rectangle",
      "price": 25,
      "cockpit3d_id": "207"
    },
    "background": {
      "id": "2d",
      "name": "2D Backdrop",
      "price": 12,
      "cockpit3d_option_id": "154"
    },
    "text": {
      "id": "customText",
      "name": "Custom Text",
      "price": 9.5,
      "cockpit3d_option_id": "199",
      "value": "Happy Birthday\nJohn"
    }
  },
  
  "sizeDetails": {
    "id": "549",
    "name": "Cut Corner Diamond (6x6cm)",
    "price": 85,
    "cockpit3d_id": "549"
  },
  
  // Custom image reference (stored in IndexedDB)
  "customImageId": "uuid-abc-123",
  "customImageMetadata": {
    "filename": "photo.jpg",
    "hasImage": true
  },
  
  "dateAdded": "2025-01-14T10:30:00.000Z"
}
```

---

## Stripe Checkout Payload

When creating payment intent/checkout session:

```javascript
// POST to /api/stripe/create-payment-intent.php
{
  "cart": [
    {
      "productId": "104",
      "name": "Cut Corner Diamond (6x6cm) with Lightbase Rectangle",
      "price": 155,
      "quantity": 1,
      "metadata": {
        "cockpit3d_id": "104",
        "size_cockpit3d_id": "549",
        "lightbase_cockpit3d_id": "207",
        "background_option_id": "154",
        "text_option_id": "199",
        "custom_text": "Happy Birthday\nJohn",
        "has_custom_image": true,
        "image_id": "uuid-abc-123"
      }
    }
  ],
  "shipping": {
    "name": "John Doe",
    "address": {
      "line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    }
  }
}

// Stripe Payment Intent Created
{
  "id": "pi_ABC123",
  "amount": 15500,  // $155.00 in cents
  "currency": "usd",
  "metadata": {
    "order_items": JSON.stringify([...]),  // Full cart
    "customer_email": "john@example.com",
    "shipping_address": JSON.stringify(...)
  }
}
```

---

## Cockpit3D Order Payload

When payment succeeds, send order to Cockpit3D:

```json
{
  "order": {
    "order_id": "pi_ABC123",
    "customer_email": "john@example.com",
    "customer_name": "John Doe",
    "shipping_address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "items": [
      {
        "product_id": "104",           // Main product
        "quantity": 1,
        "options": [
          {
            "option_id": "151",        // Size option
            "value_id": "549",         // Selected size value
            "name": "Size",
            "value": "Cut Corner Diamond (6x6cm)"
          },
          {
            "option_id": "152",        // Light Base option  
            "value_id": "207",         // Selected lightbase
            "name": "Light Base",
            "value": "Lightbase Rectangle"
          },
          {
            "option_id": "154",        // Background option
            "value_id": null,          // Boolean options don't have value_id
            "name": "2D Backdrop",
            "value": "true"
          },
          {
            "option_id": "199",        // Text option
            "value_id": null,
            "name": "Customer text",
            "value": "Happy Birthday\nJohn"
          }
        ],
        "custom_image": {
          "filename": "photo.jpg",
          "image_data": "base64_encoded_image_data_here",
          "mask": "diamond"
        }
      }
    ]
  }
}
```

---

## Data Flow: Add to Cart → Checkout → Fulfillment

```
1. Product Page (ProductDetailClient.tsx)
   ↓
   User selects options
   ↓
   Creates OrderLineItem with all IDs:
   {
     productId: "104",
     cockpit3d_id: "104",
     size: { id: "549", cockpit3d_id: "549", price: 85 },
     lightbase: { id: "207", cockpit3d_id: "207", price: 25 },
     background: { id: "2d", cockpit3d_option_id: "154", price: 12 },
     ...
   }
   ↓
2. Cart (cartUtils.ts)
   ↓
   Stores in localStorage (without images)
   Stores custom image in IndexedDB
   ↓
3. Checkout (checkout/page.tsx)
   ↓
   Builds Stripe payload with metadata
   ↓
4. Stripe Payment Intent
   ↓
   Stores order data in metadata
   ↓
5. Payment Success
   ↓
6. Webhook (stripe-webhook.php)
   ↓
   payment_intent.succeeded event
   ↓
   Extracts order data from metadata
   ↓
7. Build Cockpit3D Order
   ↓
   Maps option IDs to Cockpit3D format:
   - size.cockpit3d_id → option "151" value_id
   - lightbase.cockpit3d_id → option "152" value_id
   - background.cockpit3d_option_id → option "154"
   - text.cockpit3d_option_id → option "199"
   ↓
8. Retrieve Custom Image
   ↓
   Get from IndexedDB by customImageId
   Convert to base64
   ↓
9. Send to Cockpit3D API
   ↓
   POST to https://profit.cockpit3d.com/api/...
   ↓
10. Order Fulfilled ✅
```

---

## Option ID Mapping Reference

### Fixed Option IDs (from Cockpit3D API):

| Option Type | Option ID | Description |
|------------|-----------|-------------|
| Size | 151 | Product size selection |
| Light Base | 152 | Lightbase selection |
| Face | 198 | Face/image upload |
| 2D Backdrop | 154 | 2D background effect |
| 3D Backdrop | 155 | 3D background effect |
| Customer text | 199 | Custom text input |

### Variable Value IDs (product-specific):

Size value IDs come from each product's size options.
Lightbase value IDs come from lightbase products in catalog.

Example for Cut Corner Diamond:
- Size 5x5cm: value_id = "202"
- Size 6x6cm: value_id = "549"
- Size 8x8cm: value_id = "550"

---

## Key Changes Made:

1. ✅ Added `lookupOptionPrice()` function to fetch prices from products list
2. ✅ Updated `extractProductLightbases()` to lookup lightbase prices
3. ✅ Updated size extraction to lookup size variation prices
4. ✅ Added `cockpit3d_id` to all option objects for order mapping
5. ✅ Added `cockpit3d_option_id` to background and text options
6. ✅ Ensured all data structures include necessary IDs for fulfillment

---

## Testing Checklist:

### 1. Data Generation
```bash
# Run PHP data fetcher
http://localhost:8888/crystalkeepsakes/api/cockpit3d-data-fetcher.php?action=generate-products

# Verify output
node diagnose-prices.js

# Check cockpit3d-products.js has all prices
tail -20 src/data/cockpit3d-products.js
```

### 2. Product Page
- Select size → price updates correctly
- Select lightbase → price adds correctly
- Select background → price adds correctly
- Add custom text → price adds correctly
- Total = base + size + lightbase + background + text ✅

### 3. Cart
- Product image displays
- Options display with correct prices
- Update quantity works
- Remove item works

### 4. Checkout
- Shipping form works
- Stripe payment intent creates with metadata
- Custom image included in metadata

### 5. Order Fulfillment (after payment)
- Webhook receives payment_intent.succeeded
- Order data extracted from metadata
- Cockpit3D payload built correctly
- Custom image retrieved from IndexedDB
- API call to Cockpit3D succeeds

---

## Next Implementation Steps:

1. ✅ Run data fetcher to generate products with correct prices
2. Test product page price calculations
3. Update checkout to include all IDs in Stripe metadata
4. Update webhook to build Cockpit3D order from metadata
5. Test end-to-end flow

