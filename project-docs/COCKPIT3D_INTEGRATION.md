# Cockpit3D API Integration Guide
**Version:** 1.0.0  
**Date:** 2025-01-19  
**Status:** Ready for Implementation

## Overview
Crystal Keepsakes integrates with TWO Cockpit3D APIs for order fulfillment:
1. **Cockpit3D API** - Main order processing and tracking
2. **Profit API** - 3D model processing and designer assignment

---

## API 1: Cockpit3D API (Main Order Processing)

### Base URLs
- **Production:** `https://api.cockpit3d.com`
- **Development:** `https://c3d-profit-dev.host.alva.tools`

### Authentication
**Method:** Basic Auth + Bearer Token

#### Step 1: Get Access Token
```php
POST /rest/V2/login
Content-Type: application/json

{
  "username": "your_email@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Step 2: Use Token in Requests
```php
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Creating an Order

### Endpoint
```
POST /rest/V2/orders
Authorization: Bearer {token}
Content-Type: application/json
```

### Request Structure
```json
{
  "retailer_id": "256568874",
  "address": {
    "email": "customer@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "telephone": "+1-555-0123",
    "street": "123 Main St",
    "city": "Los Angeles",
    "region": "CA",
    "postcode": "90001",
    "country": "US",
    "order_id": "CK-1234567890",
    "shipping_method": "standard",
    "destination": "USA"
  },
  "items": [
    {
      "sku": "CRYSTAL-HEART-M",
      "qty": "1",
      "client_item_id": "item_001",
      "original_photo": "https://example.com/photo.jpg",
      "cropped_photo": "data:image/jpeg;base64,/9j/4AAQ...",
      "3d_file": "",
      "special_instructions": "Handle with care",
      "2d": false,
      "canvas_project_id": null,
      "canvas_job_id": null,
      "options": [
        {
          "id": "light_base",
          "qty": "1",
          "value": "LED Remote Control"
        },
        {
          "id": "custom_text_line1",
          "qty": "1", 
          "value": "Forever in our hearts"
        }
      ]
    }
  ]
}
```

### Response
```json
{
  "order_id": 12345,
  "hq_order_id": 67890,
  "status": "pending",
  "message": "Order created successfully"
}
```

---

## Webhook Events (Received from Cockpit3D)

### 1. SyncOrder Webhook
**Triggered:** When order is synchronized from HQ

```json
POST /your-webhook-endpoint?store_key={your_api_key}

{
  "order_id": 12345,
  "hq_order_id": 67890,
  "items": [
    {
      "item_id": 111,
      "hq_item_id": 222
    }
  ]
}
```

### 2. AddTracking Webhook
**Triggered:** When tracking code is available

```json
POST /your-webhook-endpoint?store_key={your_api_key}

{
  "tracking": "1Z999AA10123456784",
  "order_id": 12345,
  "hq_order_id": 67890
}
```

### 3. UpdateStatus Webhook
**Triggered:** When order status changes

```json
POST /your-webhook-endpoint?store_key={your_api_key}

{
  "item_id": 111,
  "hq_item_id": 222,
  "status": "processing",
  "order": {
    "order_id": 12345,
    "hq_order_id": 67890,
    "status": "processing",
    "status_label": "With 3D Artist"
  }
}
```

---

## API 2: Profit API (3D Processing)

### Base URL
```
https://3d.cockpit3d.com/api
```

### Authentication
**Method:** Basic Auth (username = email, password = API token)

```php
Authorization: Basic base64_encode("email@example.com:api_token")
```

---

## Get Available Designers

### Endpoint
```
GET /api/designers
Authorization: Basic {credentials}
```

### Response
```json
{
  "designers": [
    {
      "id": 123,
      "name": "Designer A",
      "availablePriorities": [24, 48, 72],
      "availableFileTypes": ["ci", "3d"]
    },
    {
      "id": 456,
      "name": "Designer B",
      "availablePriorities": [12, 24],
      "availableFileTypes": ["ci"]
    }
  ]
}
```

**Notes:**
- `availablePriorities` = turnaround time in hours
- `availableFileTypes`:
  - `"ci"` = Crystal Image (2D photo processing)
  - `"3d"` = 3D model creation

---

## Submit Processing Job

### Endpoint
```
POST /api/orders
Authorization: Basic {credentials}
Content-Type: application/json
```

### Request Structure
```json
[
  {
    "order": {
      "fileType": "ci",
      "time": 24,
      "designerId": 123,
      "numberOfHalfBodies": 1,
      "numberOfFullBodies": 0,
      "numberOfObjects": 0,
      "numberOfChests": 0,
      "backdrop": "3d_backdrop",
      "optimizeImage": true,
      "hdEnhancement": false,
      "photoFixing": null,
      "line1": "Forever in our hearts",
      "line2": "2024",
      "instructions": "Remove background, enhance clarity",
      "uniqueId": "CK-1234567890-item1"
    },
    "assets": [
      {
        "id": "photo_001",
        "content": "data:image/jpeg;base64,/9j/4AAQ...",
        "filename": "customer_photo.jpg"
      }
    ]
  }
]
```

### Request Fields Explained

#### Required Fields
- `fileType` - Always `"ci"` for Crystal Images
- `time` - Processing time in hours (must match designer's `availablePriorities`)
- `designerId` - Designer ID from `/api/designers`

#### Body Count (Optional)
- `numberOfHalfBodies` - Count of people shown from waist up
- `numberOfFullBodies` - Count of people shown head to toe
- `numberOfObjects` - Count of non-human objects
- `numberOfChests` - Count of chest-up portraits

#### Processing Options (Optional)
- `backdrop` - `"2d_backdrop"` or `"3d_backdrop"`
- `optimizeImage` - Boolean, enhance image quality
- `hdEnhancement` - Boolean, HD upgrade (extra charge)
- `photoFixing` - String, special fixing instructions (extra charge if not null)

#### Text & Instructions (Optional)
- `line1` - First line of engraving text
- `line2` - Second line of engraving text
- `instructions` - Special processing instructions
- `uniqueId` - Your order reference ID

#### Assets (Required)
Array of images to process:
- `id` - Unique ID for the image
- `content` - Base64 encoded image data (Data URI format)
- `filename` - Original filename

### Response
```json
{
  "message": "OK",
  "orders": [
    {
      "hqOrderGid": "GROUP123",
      "hqOrderId": 67890,
      "orderNumber": "HQ-67890",
      "uniqueId": "CK-1234567890-item1"
    }
  ]
}
```

---

## Integration Workflow

### Current Implementation Status

#### ✅ Implemented
- Stripe payment processing
- Order data collection
- Cockpit3D order builder (`/src/lib/cockpit3d-order-builder.ts`)
- Order validation
- Webhook structure

#### ⏸️ Pending Manual Review
- Automatic order submission to Cockpit3D
- Profit API integration for 3D processing
- Webhook endpoint setup to receive status updates

---

## Complete Order Flow

### Phase 1: Payment (Currently Active)
```
Customer pays via Stripe
  ↓
Stripe webhook triggers
  ↓
Order data collected & validated
  ↓
Order email sent to admin
  ↓
MANUAL REVIEW REQUIRED
```

### Phase 2: Cockpit3D Submission (Ready to Enable)
```
Admin reviews order
  ↓
Submit to Cockpit3D API
  ↓
POST /rest/V2/orders
  ↓
Receive order_id & hq_order_id
  ↓
Store IDs for tracking
```

### Phase 3: 3D Processing (Future)
```
Determine if 3D processing needed
  ↓
Get available designers (GET /api/designers)
  ↓
Select designer by time & file type
  ↓
Submit to Profit API (POST /api/orders)
  ↓
Receive hqOrderId for tracking
```

### Phase 4: Status Updates (Future)
```
Cockpit3D sends status webhooks
  ↓
Update order status in database
  ↓
Notify customer of progress
  ↓
Tracking code received
  ↓
Update customer with tracking
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Cockpit3D Main API
COCKPIT3D_BASE_URL=https://api.cockpit3d.com
COCKPIT3D_USERNAME=your_email@example.com
COCKPIT3D_PASSWORD=your_password_or_token
COCKPIT3D_RETAIL_ID=256568874

# Profit API (3D Processing)
COCKPIT3D_PROFIT_URL=https://3d.cockpit3d.com/api
COCKPIT3D_PROFIT_USERNAME=your_email@example.com
COCKPIT3D_PROFIT_TOKEN=your_api_token

# Webhook Configuration
COCKPIT3D_STORE_KEY=your_store_key_here
COCKPIT3D_WEBHOOK_URL=https://crystalkeepsakes.com/api/cockpit3d/webhook
```

---

## Testing Recommendations

### Test Scenarios

#### 1. Basic Order Submission
```bash
# Test with minimal order
curl -X POST https://api.cockpit3d.com/rest/V2/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "retailer_id": "256568874",
    "address": {...},
    "items": [...]
  }'
```

#### 2. Designer Selection
```bash
# Get designers with 24-hour turnaround for CI files
curl -X GET https://3d.cockpit3d.com/api/designers \
  -H "Authorization: Basic {credentials}"

# Filter for: time=24 and fileType="ci"
```

#### 3. Image Processing
```bash
# Submit test image for processing
curl -X POST https://3d.cockpit3d.com/api/orders \
  -H "Authorization: Basic {credentials}" \
  -H "Content-Type: application/json" \
  -d '[{
    "order": {
      "fileType": "ci",
      "time": 24,
      "designerId": 123,
      ...
    },
    "assets": [...]
  }]'
```

---

## Error Handling

### Common Errors

#### Authentication Failed (401)
```json
{
  "error": "Invalid credentials"
}
```
**Solution:** Check username/password or token validity

#### Invalid Order Data (400)
```json
{
  "error": "Missing required field: retailer_id"
}
```
**Solution:** Validate order structure before submission

#### Designer Not Available (422)
```json
{
  "error": "Designer does not support requested time or file type"
}
```
**Solution:** Query `/api/designers` first and validate selection

#### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests"
}
```
**Solution:** Implement exponential backoff retry logic

---

## Data Mapping: Stripe → Cockpit3D

### Customer Information
```javascript
// From Stripe Checkout Session
const stripeCustomer = session.customer_details
const stripeShipping = session.shipping_details

// To Cockpit3D Order
const cockpit3dAddress = {
  email: stripeCustomer.email,
  firstname: stripeShipping.name.split(' ')[0],
  lastname: stripeShipping.name.split(' ').slice(1).join(' '),
  telephone: stripeCustomer.phone,
  street: stripeShipping.address.line1,
  city: stripeShipping.address.city,
  region: stripeShipping.address.state,
  postcode: stripeShipping.address.postal_code,
  country: stripeShipping.address.country,
  order_id: metadata.order_number,
  shipping_method: 'standard'
}
```

### Order Items
```javascript
// From Stripe Line Items
const stripeItem = session.line_items.data[0]

// To Cockpit3D Item
const cockpit3dItem = {
  sku: metadata.sku,
  qty: stripeItem.quantity.toString(),
  client_item_id: `${metadata.order_number}-${index}`,
  original_photo: customImage.url,
  cropped_photo: customImage.base64,
  special_instructions: customText.line1 + ' ' + customText.line2,
  options: [
    {
      id: 'light_base',
      qty: '1',
      value: lightBase.name
    }
  ]
}
```

---

## Security Considerations

### API Key Management
- ✅ Store all credentials in `.env` files
- ✅ Never commit credentials to Git
- ✅ Use different credentials for test/production
- ✅ Rotate API tokens periodically

### Webhook Security
- ✅ Verify webhook signature/API key
- ✅ Use HTTPS for all webhook endpoints
- ✅ Log all webhook events for audit
- ✅ Implement retry logic for failed webhooks

### Image Handling
- ✅ Validate image size and format before upload
- ✅ Compress images to reasonable size
- ✅ Use base64 encoding for API transmission
- ✅ Store original images securely

---

## Monitoring & Logging

### What to Log
```javascript
// Order Submission
logger.info('Submitting order to Cockpit3D', {
  orderNumber: 'CK-123',
  itemCount: 2,
  retailerId: '256568874'
})

// API Response
logger.success('Cockpit3D order created', {
  orderId: 12345,
  hqOrderId: 67890
})

// Errors
logger.error('Cockpit3D API error', {
  status: 400,
  message: 'Invalid SKU',
  orderNumber: 'CK-123'
})
```

### Monitoring Checklist
- [ ] Track order submission success rate
- [ ] Monitor API response times
- [ ] Alert on failed submissions
- [ ] Weekly audit of pending orders
- [ ] Monthly review of processing times

---

## Next Steps

### To Enable Automatic Submission

1. **Verify Credentials**
   ```bash
   # Test authentication
   curl -X POST https://api.cockpit3d.com/rest/V2/login \
     -H "Content-Type: application/json" \
     -d '{"username": "...", "password": "..."}'
   ```

2. **Update Environment Variables**
   - Add all Cockpit3D credentials to `.env.production`
   - Verify Profit API credentials

3. **Enable Webhook Handler**
   - Update `/api/stripe/stripe-webhook.php`
   - Uncomment Cockpit3D submission code
   - Test with Stripe test mode first

4. **Set Up Webhooks**
   - Configure webhook URL in Cockpit3D dashboard
   - Test receiving status updates
   - Implement customer notifications

5. **Test End-to-End**
   - Place test order
   - Verify submission to Cockpit3D
   - Confirm order shows in Cockpit3D dashboard
   - Test status update webhooks

---

## Support Resources

### API Documentation
- **Cockpit3D API Spec:** `/Cockpit3D API.pdf` (in project root)
- **Profit API Spec:** `/Profit API.pdf` (in project root)

### Code References
- **Order Builder:** `/src/lib/cockpit3d-order-builder.ts`
- **Webhook Handler:** `/api/stripe/stripe-webhook.php`
- **Test Script:** `/test-cockpit3d-order.js`

### Related Documentation
- `STRIPE_ORDER_FLOW.md` - Complete payment flow
- `PRODUCTION_DEPLOYMENT.md` - Deployment guide

---

**Last Updated:** 2025-01-19  
**Status:** Ready for implementation once credentials are verified  
**Maintained By:** Development Team
