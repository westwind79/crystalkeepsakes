# Crystal Keepsakes - Complete Order Flow Documentation

> **Version:** 2.0.0  
> **Last Updated:** August 2025  
> **Single Source of Truth for Order Processing**

---

## Table of Contents

1. [Flow Overview](#flow-overview)
2. [Image Upload Process](#image-upload-process)
3. [Cart & Order Session](#cart--order-session)
4. [Checkout Flow](#checkout-flow)
5. [Cockpit3D Order Payload](#cockpit3d-order-payload)
6. [Email Notification System](#email-notification-system)
7. [Testing Guide](#testing-guide)
8. [Debug Panel Usage](#debug-panel-usage)
9. [Troubleshooting](#troubleshooting)

---

## Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMER JOURNEY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PRODUCT PAGE          2. IMAGE EDITOR         3. CART                   │
│  ┌──────────────┐        ┌──────────────┐       ┌──────────────┐           │
│  │ Select       │───────>│ Upload Photo │──────>│ Review Items │           │
│  │ Product      │        │ Apply Mask   │       │ with Images  │           │
│  │ + Options    │        │ Save to      │       │              │           │
│  └──────────────┘        │ Server       │       └──────────────┘           │
│         │                └──────────────┘              │                    │
│         │                       │                      │                    │
│         v                       v                      v                    │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │              UNIFIED ORDER SESSION (localStorage)             │          │
│  │  - orderId: "CK-250815-XXXX"                                 │          │
│  │  - images: { masked: URL, raw: URL }                         │          │
│  │  - status: "customizing" | "cart" | "checkout" | "paid"      │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    v                                        │
│  4. CHECKOUT (Stripe)        5. WEBHOOK             6. FULFILLMENT         │
│  ┌──────────────┐          ┌──────────────┐       ┌──────────────┐        │
│  │ Enter        │─────────>│ Stripe       │──────>│ Cockpit3D    │        │
│  │ Payment      │          │ Webhook      │       │ Order        │        │
│  │ + Shipping   │          │ Fires        │       │ Created      │        │
│  └──────────────┘          └──────────────┘       └──────────────┘        │
│                                    │                      │                │
│                                    v                      v                │
│                            ┌──────────────┐       ┌──────────────┐        │
│                            │ Email        │       │ Crystal      │        │
│                            │ Notification │       │ Engraved     │        │
│                            │ Sent         │       │ & Shipped    │        │
│                            └──────────────┘       └──────────────┘        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Image Upload Process

### Step 1: Customer Uploads Photo (ProductDetailClient.tsx)

```typescript
// User selects file → handleImageUpload()
const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files[0]
  
  // Clear previous session (new image = new order)
  clearOrderSession()
  
  // Store raw image for later upload
  setRawUploadedImage(dataUrl)
  setUploadedImage(dataUrl)
  
  // Open image editor
  setShowEditor(true)
}
```

### Step 2: Image Editor Saves & Uploads (handleImageEditorSave)

```typescript
// User clicks "Save" in editor → handleImageEditorSave()
const handleImageEditorSave = async (maskedImageDataUrl: string) => {
  // 1. Compress image
  const compressedImage = await compressImageWithAlpha(maskedImageDataUrl, 0.85, 1200)
  
  // 2. Get/create unified order ID
  const orderId = getOrderIdForUpload()  // e.g., "CK-250815-7K3M"
  
  // 3. Upload BOTH images to PHP server
  const uploadResult = await uploadCustomerImages(
    compressedImage,      // Masked/processed image
    rawUploadedImage,     // Original upload
    productId,
    orderId               // Used as folder name
  )
  
  // 4. Store server URLs in state
  setMaskedImageServerUrl(uploadResult.maskedUrl)
  setRawImageServerUrl(uploadResult.rawUrl)
  
  // 5. Update order session with image URLs
  updateSessionImages(uploadResult.maskedUrl, uploadResult.rawUrl)
}
```

### Step 3: PHP Upload Handler (api/customer-image-upload.php)

**Endpoint:** `POST /api/customer-image-upload.php`

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "productId": "123",
  "imageType": "masked",  // or "raw"
  "orderNumber": "CK-250815-7K3M"
}
```

**Response:**
```json
{
  "success": true,
  "url": "/crystal-data/orders-test/CK-250815-7K3M/customer_123_masked_1723456789_abc123.png",
  "filename": "customer_123_masked_1723456789_abc123.png",
  "size": 245678
}
```

**Server File Structure:**
```
/crystal-data/
├── orders/           # Production orders
│   └── CK-250815-7K3M/
│       ├── customer_123_masked_1723456789_abc123.png
│       └── customer_123_raw_1723456789_def456.jpeg
└── orders-test/      # Testing orders (same structure)
```

---

## Cart & Order Session

### Unified Order Session (localStorage)

**Key:** `ck_order_session`

```typescript
interface OrderSession {
  orderId: string           // "CK-250815-7K3M"
  status: 'started' | 'customizing' | 'cart' | 'checkout' | 'paid'
  images: {
    masked?: string         // Server URL for masked image
    raw?: string            // Server URL for raw image
  }
  createdAt: string         // ISO timestamp
  productId?: string
}
```

### Cart Item Structure (localStorage)

**Key:** `crystal_keepsakes_cart`

```typescript
interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: ProductOption[]
  
  // Custom Image Data (lightweight - no base64!)
  customImage?: {
    serverUrl?: string          // ✅ CRITICAL: Masked image server URL
    originalServerUrl?: string  // ✅ CRITICAL: Raw image server URL
    tempOrderRef?: string       // Order ID for folder reference
    filename?: string
    mimeType?: string
    width?: number
    height?: number
  }
  
  // IndexedDB reference (for local display only)
  customImageId?: string
  customImageMetadata?: {...}
}
```

### Data Flow: Image to Cart

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│  handleImageSave   │────>│    addToCart()     │────>│   localStorage     │
│                    │     │                    │     │                    │
│  maskedServerUrl   │     │  customImage: {    │     │  cart item with    │
│  rawServerUrl      │     │    serverUrl,      │     │  serverUrl stored  │
│  tempOrderRef      │     │    originalUrl,    │     │                    │
│                    │     │    tempOrderRef    │     │                    │
└────────────────────┘     │  }                 │     └────────────────────┘
                           └────────────────────┘
```

---

## Checkout Flow

### Step 1: Stripe Checkout Session Created

**Endpoint:** `POST /api/stripe/create-checkout-session.php`

**Request from frontend:**
```json
{
  "items": [
    {
      "name": "3D Crystal Rectangle",
      "sku": "RECT-MED",
      "price": 89.99,
      "quantity": 1,
      "maskedImageUrl": "/crystal-data/orders-test/CK-250815-7K3M/customer_..._masked.png",
      "rawImageUrl": "/crystal-data/orders-test/CK-250815-7K3M/customer_..._raw.jpeg",
      "options": [...]
    }
  ],
  "orderNumber": "CK-250815-7K3M",
  "successUrl": "https://site.com/order-confirmation?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://site.com/cart"
}
```

**What happens:**
1. Creates Stripe Checkout Session
2. Stores full cart data to `/api/order-data/{orderNumber}.json` (includes image URLs!)
3. Returns session ID and redirect URL

### Step 2: Customer Completes Payment

Stripe handles payment on their hosted checkout page.

### Step 3: Webhook Receives Payment Confirmation

**Endpoint:** `POST /api/stripe/stripe-webhook.php`

**Stripe sends:** `checkout.session.completed` event

**Webhook actions:**
1. Verify webhook signature
2. Load full cart data from `/api/order-data/{orderNumber}.json`
3. Build Cockpit3D order payload (with image URLs!)
4. Submit to Cockpit3D API
5. Save to local database
6. Send email notification

```php
// stripe-webhook.php
function handleCheckoutCompleted($session) {
    $orderNumber = $session->metadata->order_number;
    
    // Load cart data with IMAGE URLs
    $fullCartData = loadFullCartData($orderNumber);
    
    // Build Cockpit3D order
    $cockpit3dOrder = buildCockpit3DOrder($session, $orderNumber);
    
    // Submit to Cockpit3D
    $result = sendToCockpit3D($cockpit3dOrder);
    
    // Send notification email
    sendOrderNotification($orderNumber, $session);
}
```

---

## Cockpit3D Order Payload

### API Endpoint

**Production:** `POST https://profit.cockpit3d.com/rest/V2/orders`  
**Development:** `POST https://c3d-profit-dev.host.alva.tools/rest/V2/orders`

### Authentication

```
Authorization: Basic base64(username:password)
```

### Full Payload Structure

```json
{
  "retailer_id": 256568874,
  "address": {
    "email": "customer@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "telephone": "+1-555-123-4567",
    "street": "123 Main St\nApt 4B",
    "city": "New York",
    "region": "NY",
    "postcode": "10001",
    "country": "US",
    "shipping_method": "air",
    "destination": "customer_home",
    "order_id": "CK-250815-7K3M",
    "staff_user": "Web Order"
  },
  "items": [
    {
      "sku": "RECT-MED-3D",
      "qty": "1",
      "client_item_id": "CK-250815-7K3M-1",
      
      // ✅ CRITICAL: Image URLs
      "original_photo": "https://crystalkeepsakes.com/crystal-data/orders/CK-250815-7K3M/customer_123_raw.jpeg",
      "cropped_photo": "https://crystalkeepsakes.com/crystal-data/orders/CK-250815-7K3M/customer_123_masked.png",
      
      // Options array
      "options": [
        { "id": "456", "qty": "1" },           // Size option
        { "id": "789", "qty": "1" },           // Light base
        { "id": "199", "value": ["Line 1", "Line 2"] }  // Custom text
      ],
      
      "special_instructions": "Custom Text: Happy Birthday / John 2025"
    }
  ]
}
```

### Image URL Fields

| Field | Description | Required |
|-------|-------------|----------|
| `original_photo` | URL to customer's original uploaded photo | Yes (if custom) |
| `cropped_photo` | URL to masked/processed photo ready for engraving | Yes (if custom) |

### Options ID Reference

| Category | ID | Notes |
|----------|-----|-------|
| Size | varies | Get from `sizeDetails.cockpit3d_id` |
| Light Base | varies | Get from `option.cockpit3d_id` |
| Background | varies | Get from `option.cockpit3d_option_id` |
| Custom Text | `199` | Value is array of lines |

---

## Email Notification System

### Endpoint

**URL:** `POST /api/cockpit3d/send-order-notification.php`

### Request Payload

```json
{
  "orderId": "CK-250815-7K3M",
  "receipt_email": "customer@example.com",
  "shippingInfo": {
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "+1-555-123-4567",
    "address": {
      "line1": "123 Main St",
      "line2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "US"
    }
  },
  "cartItems": [
    {
      "name": "3D Crystal Rectangle",
      "sku": "RECT-MED",
      "quantity": 1,
      "price": 89.99,
      "maskedImageUrl": "/crystal-data/orders/CK-250815-7K3M/customer_masked.png",
      "rawImageUrl": "/crystal-data/orders/CK-250815-7K3M/customer_raw.jpeg",
      "options": [...],
      "customText": { "line1": "Happy Birthday", "line2": "John 2025" }
    }
  ],
  "cockpit3dOrder": { ... }  // Full Cockpit3D payload for reference
}
```

### Email Content

Sends to: `orders@crystalkeepsakes.com`

**HTML Email includes:**
- Order ID (prominent)
- Customer info
- Shipping address
- All line items with options
- **Customer Images section** with clickable links to:
  - Masked image URL
  - Original image URL
- Link to image folder on server
- Full Cockpit3D order JSON (collapsible)
- Raw order data for debugging

### Test Mode

Add `testMode: true` to request:
```json
{
  "orderId": "TEST-123",
  "testMode": true,
  "sendTestEmail": true,  // Actually send the email
  ...
}
```

---

## Testing Guide

### Option A: Debug Panel Test Submit (Recommended)

1. Go to any product page
2. Upload an image, apply mask, save
3. Add to cart
4. Open Debug Panel (bottom-right badge or `?debug=true`)
5. Go to **Cockpit3D** tab
6. Review order preview - verify image URLs are present
7. Check **"📧 Send test email"** checkbox
8. Click **"🧪 Test Submit (No Charge)"**
9. Check email at `orders@crystalkeepsakes.com`

### Option B: Stripe Test Mode

Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC
- Any ZIP code

Full flow executes including Cockpit3D submission.

### Option C: Direct API Testing

```bash
# Test order submission
curl -X POST https://crystalkeepsakes.com/api/cockpit3d/submit-order.php \
  -H "Content-Type: application/json" \
  -d '{
    "testMode": true,
    "sendTestEmail": true,
    "orderNumber": "TEST-CLI-001",
    "cartItems": [{
      "name": "Test Product",
      "sku": "TEST-SKU",
      "quantity": 1,
      "price": 99.99,
      "maskedImageUrl": "/crystal-data/orders-test/TEST/test_masked.png",
      "rawImageUrl": "/crystal-data/orders-test/TEST/test_raw.jpeg"
    }],
    "customer": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    }
  }'

# Test email only
curl -X POST https://crystalkeepsakes.com/api/cockpit3d/send-order-notification.php \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "EMAIL-TEST-001",
    "receipt_email": "test@example.com",
    "cartItems": [...]
  }'
```

---

## Debug Panel Usage

### Accessing Debug Panel

- **Development/Testing:** Automatically visible (bottom-right corner)
- **Production:** Add `?debug=true` to URL
- Click the **DEBUG** badge to open

### Tab Guide

| Tab | Shows | Use For |
|-----|-------|---------|
| **Order IDs** | Unified session, localStorage, cart refs | Verify order ID consistency |
| **Environment** | All env vars, Stripe/Cockpit config | Check API configuration |
| **Storage** | localStorage, sessionStorage, IndexedDB | Debug storage issues |
| **Cart** | All items with image URLs | Verify image URLs attached |
| **Cockpit3D** | Full order preview + test submit | Test order flow |
| **Logs** | Real-time activity | Track operations |

### Key Checks

✅ **Order IDs tab:**
- Unified Session shows Order ID
- Masked Image: ✓ Uploaded (not ✗ None)
- Raw Image: ✓ Uploaded (not ✗ None)

✅ **Cart tab:**
- Each item shows `serverUrl` (not empty)
- Each item shows `tempOrderRef`

✅ **Cockpit3D tab:**
- Order preview shows `cropped_photo` URL
- Order preview shows `original_photo` URL

---

## Troubleshooting

### Image URLs Missing in Cart

**Symptom:** Debug panel shows "Masked Image: ✗ None"

**Causes:**
1. Image upload failed silently
2. State update race condition
3. Session cleared after upload

**Fix:**
1. Check browser console for upload errors
2. Look for `📤 [IMAGE SAVE]` logs
3. Verify PHP endpoint returns `url` field
4. Ensure `updateSessionImages()` is called only on success

### Cockpit3D Order Missing Images

**Symptom:** Order submitted but `cropped_photo` is null

**Causes:**
1. Cart items missing `serverUrl`
2. Cart data file not saved before webhook
3. Checkout not including image URLs

**Debug:**
1. Check Debug Panel → Cart tab for `serverUrl`
2. Check `/api/order-data/{orderId}.json` file exists
3. Check webhook logs for image URL extraction

### Email Not Received

**Symptom:** Test submit succeeds but no email

**Causes:**
1. PHP `mail()` not configured on server
2. Email going to spam
3. `sendTestEmail` not set to true

**Fix:**
1. Check PHP error logs: `tail -f /var/log/php/error.log`
2. Check order_notification.log in API folder
3. Verify SMTP settings if using external mail

### Order ID Mismatch

**Symptom:** Debug panel shows mismatch warnings

**Causes:**
1. Multiple browser tabs
2. Old session not cleared
3. New image uploaded mid-checkout

**Fix:**
1. Use "🗑 Clear All Order Data" in Debug Panel
2. Start fresh with new upload
3. Ensure only one tab active during checkout

---

## File Reference

| File | Purpose |
|------|---------|
| `src/components/DebugOverlay.tsx` | Single debug panel component |
| `src/components/ProductDetailClient.tsx` | Image upload + cart logic |
| `src/lib/unifiedOrderId.ts` | Order session management |
| `src/lib/cartUtils.ts` | Cart storage + retrieval |
| `src/lib/customerImageUpload.ts` | PHP upload client |
| `src/lib/cockpit3d-order-builder.ts` | Order payload builder |
| `api/customer-image-upload.php` | Server image storage |
| `api/cockpit3d/submit-order.php` | Order submission handler |
| `api/cockpit3d/send-order-notification.php` | Email sender |
| `api/stripe/stripe-webhook.php` | Payment webhook handler |
| `api/stripe/create-checkout-session.php` | Checkout session creator |

---

*Document maintained by Crystal Keepsakes Development Team*
