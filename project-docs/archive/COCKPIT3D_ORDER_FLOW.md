# Cockpit3D Order Submission Flow

## Overview
Orders are submitted to Cockpit3D after successful Stripe payment via webhook.

## API Endpoint
- **Production**: `https://profit.cockpit3d.com/rest/V2/orders`
- **Development**: `https://c3d-profit-dev.host.alva.tools/rest/V2/orders`

Set `COCKPIT3D_API_URL` in `.env` to switch between environments.

## Required Environment Variables
```env
COCKPIT3D_API_URL=https://profit.cockpit3d.com
COCKPIT3D_USERNAME=your_email@example.com
COCKPIT3D_PASSWORD=your_api_password
COCKPIT3D_RETAILER_ID=your_retailer_id
```

## Order Flow

### 1. Checkout Page (`/app/src/app/checkout/page.tsx`)
- Generates order number
- Uploads customer images to server (gets URLs)
- Sends cart data with image URLs to PHP backend

### 2. Create Checkout Session (`/app/api/stripe/create-checkout-session.php`)
- Receives cart items with image URLs
- Saves FULL cart data to `/app/api/order-data/{orderNumber}.json`
- Creates Stripe checkout session

### 3. Stripe Webhook (`/app/api/stripe/stripe-webhook.php`)
- Triggered on `checkout.session.completed`
- Loads full cart data from `/app/api/order-data/{orderNumber}.json`
- Builds Cockpit3D order with:
  - Customer address from Stripe
  - `original_photo` - Raw uploaded image URL
  - `cropped_photo` - Masked/processed image URL
  - Product SKU and options
- Submits to Cockpit3D API

## Order Payload Structure
```json
{
  "retailer_id": 123456,
  "address": {
    "email": "customer@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "telephone": "555-0100",
    "region": "CA",
    "country": "US",
    "street": "123 Main St",
    "city": "Los Angeles",
    "postcode": "90001",
    "shipping_method": "air",
    "destination": "customer_home",
    "order_id": "CK-1234567890",
    "staff_user": "Web Order"
  },
  "items": [
    {
      "sku": "Cut_Corner_Diamond",
      "qty": "1",
      "client_item_id": "CK-1234567890-1",
      "original_photo": "https://example.com/uploads/raw-image.jpg",
      "cropped_photo": "https://example.com/uploads/masked-image.jpg",
      "options": [
        { "id": "198", "qty": "1" },
        { "id": "199", "value": ["Custom Text Line 1"] }
      ]
    }
  ]
}
```

## Testing

### Test API Configuration
```bash
# View config status
curl https://crystalkeepsakes.com/api/cockpit3d/test-order.php

# View test payload (not submitted)
curl https://crystalkeepsakes.com/api/cockpit3d/test-order.php?test=1
```

### Manual Order Submission
```bash
curl -X POST https://crystalkeepsakes.com/api/cockpit3d/submit-order.php \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-123",
    "cartItems": [...],
    "customer": {...},
    "shippingInfo": {...}
  }'
```

## Troubleshooting

### Image URLs Not Being Sent
1. Check `/app/api/order-data/` for the order JSON file
2. Verify image upload succeeded during checkout
3. Check webhook logs for "📸 Item X original_photo" messages

### Authentication Errors
1. Verify `COCKPIT3D_USERNAME` and `COCKPIT3D_PASSWORD` are set
2. Check that retailer_id matches your Cockpit3D account

### Order Rejected
1. Verify SKU exists in your Cockpit3D catalog
2. Check that option IDs are valid for the product
3. Review Cockpit3D response in webhook logs
