# Product Pricing & Data Flow Documentation
**Version:** 2.0.0  
**Date:** 2025-01-XX  
**Status:** Complete Implementation

---

## 🎯 Overview

This document explains the complete **pricing control system** and **data consistency flow** from product configuration to order fulfillment.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT DATA FLOW                             │
└─────────────────────────────────────────────────────────────────┘

1. npm run build
   ├─> fetch-cockpit3d-products.js (pulls from Cockpit3D API)
   └─> Generates: cockpit3d-products.js (RAW DATA)

2. Admin Panel (/app/admin/products)
   ├─> Load: cockpit3d-products.js
   ├─> Edit: Prices, Options, Descriptions, Images
   └─> Generate: final-product-list.js (CONFIGURED DATA)

3. Frontend (Products Page & Detail Page)
   ├─> Load: final-product-list.js (SOURCE OF TRUTH)
   ├─> Display: Only configured/enabled options
   └─> Capture: All selections with Cockpit3D IDs

4. Cart
   ├─> Store: All configuration + Cockpit3D IDs
   └─> Preserve: Size, lightbase, background, text options

5. Checkout (Stripe)
   ├─> Collect: Shipping info
   ├─> Store: pendingOrder in sessionStorage
   └─> Process: Payment via Stripe

6. Order Confirmation
   ├─> Retrieve: pendingOrder from sessionStorage
   ├─> Submit: POST /api/process-order
   │   ├─> Build Cockpit3D payload
   │   ├─> Submit to Cockpit3D API
   │   └─> Send email notification
   └─> Clear: Cart + sessionStorage

7. Email Notification
   ├─> To: orders@crystalkeepsakes.com
   ├─> Contains: Order #, Customer info, Items, Images
   └─> Endpoint: /api/send-order-notification.php
```

---

## 🛠️ Implementation Details

### 1. Enhanced Admin Panel

**File:** `/app/src/app/admin/products/page.tsx`

**Features:**
- ✅ **Tabbed Interface** (Basic, Pricing, Options, Images)
- ✅ **Complete Price Control**:
  - Base product price
  - Individual size prices
  - Lightbase prices
  - Background option prices
  - Text option prices
- ✅ **Option Configuration**:
  - Enable/disable specific sizes
  - Enable/disable lightbases
  - Enable/disable backgrounds
  - Enable/disable text options
- ✅ **Live Preview**
- ✅ **Generate final-product-list.js**

**Usage:**
1. Navigate to `/admin/products`
2. Select a product from the list
3. Edit prices and options in each tab
4. Click "💾 Generate final-product-list.js"
5. Replace `/app/src/data/final-product-list.js` with downloaded file

---

### 2. Product Display (ProductDetailClient)

**File:** `/app/src/components/ProductDetailClient.tsx`

**Changes:**
- ✅ Now loads from `final-product-list.js` (line 119)
- ✅ Only shows configured/enabled options
- ✅ Respects admin panel settings

**Data Source:**
```typescript
// OLD (don't use)
const { cockpit3dProducts } = await import('@/data/cockpit3d-products.js')

// NEW (current implementation)
const { finalProductList } = await import('@/data/final-product-list.js')
```

---

### 3. Checkout Flow

**File:** `/app/src/app/checkout/page.tsx`

**Changes:**
- ✅ Generates order number: `CK-{timestamp}`
- ✅ Stores pendingOrder in sessionStorage:
  ```javascript
  {
    orderNumber: "CK-1234567890",
    cartItems: [...],
    customer: { ... },
    shippingInfo: { ... },
    receipt_email: "customer@email.com"
  }
  ```
- ✅ Passes to Stripe payment

---

### 4. Order Processing API

**File:** `/app/src/app/api/process-order/route.ts`

**Endpoint:** `POST /api/process-order`

**Flow:**
1. **Build Cockpit3D Order**
   - Uses `/app/src/lib/cockpit3d-order-builder.ts`
   - Maps all options to Cockpit3D IDs
   - Validates order structure

2. **Submit to Cockpit3D**
   - POST to Cockpit3D API
   - Uses Basic Auth (username/password)
   - Returns Cockpit3D order ID

3. **Send Email Notification**
   - Calls PHP endpoint: `/api/send-order-notification.php`
   - Includes: Order number, customer info, items, images
   - Sends to: `orders@crystalkeepsakes.com`

**Response:**
```json
{
  "success": true,
  "orderNumber": "CK-1234567890",
  "cockpit3d": {
    "submitted": true,
    "orderId": "C3D-9876",
    "error": null
  },
  "email": {
    "sent": true,
    "error": null
  }
}
```

---

### 5. Order Confirmation

**File:** `/app/src/app/order-confirmation/page.tsx`

**Changes:**
- ✅ Retrieves pendingOrder from sessionStorage
- ✅ Calls `/api/process-order` to submit order
- ✅ Displays order number and status
- ✅ Clears cart and sessionStorage

---

### 6. Email Notification

**File:** `/app/api/send-order-notification.php`

**Features:**
- ✅ HTML email with order details
- ✅ Customer information
- ✅ Order items with options
- ✅ Images (if available from database)
- ✅ Order number and payment ID

**Email Format:**
```
Subject: New Order: CK-1234567890

Order Number: #CK-1234567890
Date: 2025-01-15 10:30:00
Payment ID: pi_abc123...

Customer Information:
Name: John Doe
Email: john@example.com
Phone: (555) 123-4567
Address: 123 Main St, City, State 12345

Order Items:
┌────────────────────┬─────────────┬─────┬────────┐
│ Product            │ Options     │ Qty │ Price  │
├────────────────────┼─────────────┼─────┼────────┤
│ Cut Corner Diamond │ Size: 5x5cm │ 1   │ $70.00 │
│                    │ Base: LED   │     │        │
│                    │ Text: Yes   │     │        │
└────────────────────┴─────────────┴─────┴────────┘
                               Total: $70.00
```

---

## 🔧 Configuration

### Environment Variables Required

**Backend (.env):**
```env
# Cockpit3D API
COCKPIT3D_BASE_URL=https://api.cockpit3d.com
COCKPIT3D_USERNAME=your_username
COCKPIT3D_PASSWORD=your_password
COCKPIT3D_RETAIL_ID=your_retailer_id

# Application
NEXT_PUBLIC_BASE_URL=https://yoursite.com
NEXT_PUBLIC_COCKPIT3D_SHOP_ID=your_retailer_id

# Stripe (already configured)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
```

---

## ✅ Data Consistency Checklist

### Product Configuration (Admin Panel)
- ✅ Set base price
- ✅ Configure size prices
- ✅ Configure lightbase prices  
- ✅ Configure background prices
- ✅ Configure text option prices
- ✅ Enable/disable specific options
- ✅ Generate final-product-list.js

### Product Display (Frontend)
- ✅ Loads from final-product-list.js
- ✅ Only shows enabled options
- ✅ Displays correct prices

### Cart
- ✅ Preserves all option selections
- ✅ Includes Cockpit3D IDs
- ✅ Stores in IndexedDB (for images)

### Checkout
- ✅ Calculates correct totals
- ✅ Collects shipping information
- ✅ Stores pendingOrder in sessionStorage

### Order Processing
- ✅ Builds Cockpit3D payload with all option IDs
- ✅ Submits to Cockpit3D API
- ✅ Sends email notification
- ✅ Handles errors gracefully

### Email Notification
- ✅ Contains order number
- ✅ Contains customer information
- ✅ Contains all items with options
- ✅ Contains images (if available)
- ✅ Sent to orders@crystalkeepsakes.com

---

## 📋 Testing Checklist

### Admin Panel Testing
- [ ] Navigate to `/admin/products`
- [ ] Select a product
- [ ] Edit prices in Pricing tab
- [ ] Enable/disable options in Options tab
- [ ] Generate final-product-list.js
- [ ] Replace file in `/app/src/data/final-product-list.js`
- [ ] Verify changes appear on frontend

### Product Page Testing
- [ ] Navigate to a product detail page
- [ ] Verify only enabled options show
- [ ] Verify prices match admin settings
- [ ] Select all options
- [ ] Add to cart
- [ ] Verify cart shows correct total

### Checkout Testing
- [ ] Add items to cart
- [ ] Navigate to checkout
- [ ] Fill shipping information
- [ ] Complete payment (use test card: 4242 4242 4242 4242)
- [ ] Verify redirect to order confirmation

### Order Confirmation Testing
- [ ] Verify order number displays
- [ ] Check browser console for API logs
- [ ] Verify cart is cleared
- [ ] Check email inbox (orders@crystalkeepsakes.com)

### Email Testing
- [ ] Verify email received at orders@crystalkeepsakes.com
- [ ] Verify order number present
- [ ] Verify customer information
- [ ] Verify item details with options
- [ ] Verify total amount

---

## 🐛 Troubleshooting

### Issue: Product options not showing

**Solution:**
1. Check if options are enabled in admin panel
2. Verify final-product-list.js was regenerated
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)

### Issue: Email not received

**Solution:**
1. Check PHP error log: `/app/api/order_notification_errors.log`
2. Verify SMTP settings on server
3. Check spam folder
4. Test PHP mail() function on server

### Issue: Cockpit3D submission failed

**Solution:**
1. Check environment variables (username, password, retailer_id)
2. Verify Cockpit3D API credentials
3. Check browser console for API response
4. Review order payload structure in logs

### Issue: Prices don't match

**Solution:**
1. Verify final-product-list.js has correct prices
2. Check if file was replaced after admin panel edit
3. Clear Next.js cache: `rm -rf .next`
4. Rebuild: `npm run build`

---

## 🔄 Workflow Summary

### Daily Operations

1. **Adjust Prices (if Cockpit3D prices wrong)**
   - Open admin panel
   - Edit prices for affected products
   - Generate and replace final-product-list.js
   - Restart frontend: `sudo supervisorctl restart frontend`

2. **Monitor Orders**
   - Check email: orders@crystalkeepsakes.com
   - Review order details
   - Process manually if Cockpit3D submission failed

3. **Handle Issues**
   - Check browser console logs
   - Check server logs: `/var/log/supervisor/backend.*.log`
   - Check PHP error logs: `/app/api/order_notification_errors.log`

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check server logs
4. Contact Cockpit3D support for API issues

---

## 🎉 Summary

**What was implemented:**

✅ **Enhanced Admin Panel** with complete control over:
   - Product prices (base + all option prices)
   - Option availability (enable/disable)
   - Product descriptions and images

✅ **Data Consistency** across entire flow:
   - Admin Panel → final-product-list.js → Frontend → Cart → Stripe → Cockpit3D → Email

✅ **Order Processing**:
   - Automatic Cockpit3D order submission
   - Email notifications to orders@crystalkeepsakes.com
   - Complete order details with customer images

✅ **Error Handling**:
   - Graceful fallback if Cockpit3D fails
   - Orders still saved for manual processing
   - Email sent regardless of Cockpit3D status

**Result:** Complete control over product pricing and seamless data flow from configuration to order fulfillment! 🚀
