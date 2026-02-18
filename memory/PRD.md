# Crystal Keepsakes - Order Payload Documentation

## Project Overview
E-commerce platform for custom crystal engravings with Cockpit3D integration.

## Repository
- Source: https://github.com/westwind79/crystalkeepsakes
- Branch: `localchanges`

## Order Payload Flow

### 1. Frontend (checkout/page.tsx)
Cart items are prepared with:
```javascript
{
  productId, cockpit3d_id, name, sku, price, quantity,
  sizeDetails: { sizeId, sizeName, cockpit3d_id, basePrice },
  options: [
    { category: 'lightBase', optionId: 'lightbase-rectangle', cockpit3d_option_id: null, ... },
    { category: 'background', optionId: '2d', cockpit3d_option_id: '154', ... },
    { category: 'customText', optionId: 'custom-text', cockpit3d_option_id: '199', line1, line2, ... }
  ],
  maskedImageUrl, rawImageUrl, customText
}
```

### 2. PHP Backend (create-checkout-session.php)
Saves full cart data to `/api/order-data/{orderNumber}.json` before Stripe checkout.

### 3. Stripe Webhook (stripe-webhook.php)
After payment:
1. Loads cart data from `/api/order-data/{orderNumber}.json`
2. Builds Cockpit3D order with `buildCockpit3DItemOptions()`
3. Submits to Cockpit3D API

### 4. Cockpit3D Order Structure
```json
{
  "retailer_id": 123456,
  "address": { order_id, email, firstname, lastname, street, city, ... },
  "items": [{
    "sku": "CCD-001",
    "qty": "1",
    "client_item_id": "CK_ORDER_001-1",
    "original_photo": "https://...",
    "cropped_photo": "https://...",
    "options": [
      { "id": "202", "qty": "1" },           // Size
      { "id": "105", "qty": "1" },           // Light base
      { "id": "154", "qty": "1" },           // Background
      { "id": "199", "value": ["Line1", "Line2"] }  // Custom text
    ],
    "special_instructions": "Custom Text: ..."
  }]
}
```

## Fixes Applied (2025-02-18)

### Light Base Mapping Fix
**Problem:** Frontend sends `optionId: "lightbase-rectangle"` but Cockpit3D needs numeric IDs like `"105"`.

**Solution:** Added `$LIGHTBASE_COCKPIT3D_MAP` to:
- `/api/stripe/stripe-webhook.php`
- `/api/cockpit3d/submit-order.php`
- `/api/orders/process-order.php`
- `/src/lib/cockpit3d-order-builder.ts`

```php
$LIGHTBASE_COCKPIT3D_MAP = [
    'lightbase-rectangle' => '105',
    'lightbase-square' => '106',
    'lightbase-wood-small' => '107',
    'lightbase-wood-medium' => '108',
    'lightbase-wood-long' => '119',
    'rotating-led-lightbase' => '160',
    'concave-lightbase' => '276',
    'ornament-stand' => '279',
];
```

### Field Name Fix
**Problem:** Frontend sends `cockpit3d_option_id` but some PHP code looked for `cockpit3d_id`.

**Solution:** PHP now checks both: `$opt['cockpit3d_id'] ?? $opt['cockpit3d_option_id']`

## Environment Variables Required
```
COCKPIT3D_USERNAME=your_email
COCKPIT3D_PASSWORD=your_password
COCKPIT3D_RETAILER_ID=your_retailer_id
COCKPIT3D_API_URL=https://c3d-profit-dev.host.alva.tools
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

### Test Mode Submission
```bash
curl -X POST http://localhost:8888/crystalkeepsakes/api/cockpit3d/submit-order.php \
  -H "Content-Type: application/json" \
  -d '{"testMode": true, "sendTestEmail": true, "orderNumber": "TEST_001", ...}'
```

### Files for Testing
- `/tests/test-order-payload.js` - Node.js test script
- `/api/test-order-flow.php` - PHP test script
- `/tests/test-order-payload.json` - Sample payload

## Backlog
- [ ] Add cockpit3d_id to light bases in final-products.json
- [ ] Test full checkout flow with Stripe test mode
- [ ] Test email notification delivery
- [ ] Test Cockpit3D API submission (dev environment)
