# Debugging Guide - Console Logs for Order Flow

## Overview
Extensive console logging added throughout the order processing flow to track all payloads and data transformations.

---

## 🛒 Product Detail Page → Add to Cart

### Location: `/app/src/components/ProductDetailClient.tsx`

**Console Logs:**
- `🛒 [ADD TO CART] Starting add to cart process`
- `🛒 [ADD TO CART] Product:` - Shows product ID, name, SKU, cockpit3d_id, basePrice, requiresImage, maskImageUrl
- `❌ [ADD TO CART] Validation failed:` - Shows validation errors if any
- `📐 [ADD TO CART] Size Details:` - Shows selected size information
- `⚙️ [ADD TO CART] Product Options:` - Shows all selected options (lightbase, background, text)
- `✍️ [ADD TO CART] Custom Text:` - Shows custom text if entered
- `💰 [ADD TO CART] Pricing:` - Shows basePrice, optionsPrice, totalPrice, quantity
- `📦 [ADD TO CART] Complete Line Item:` - Shows full cart item structure with all data

**What to Check:**
- Verify all Cockpit3D IDs are present (cockpit3d_id, size cockpit3d_id, option cockpit3d_option_id)
- Verify pricing calculations are correct
- Verify custom image metadata if image was uploaded
- Verify maskImageUrl is set for products that need masks

---

## 💳 Checkout Page → Payment

### Location: `/app/src/app/checkout/page.tsx`

**Console Logs:**
- `🏗️ [CHECKOUT] Building Cockpit3D Order`
- `🏗️ [CHECKOUT] Cockpit3D Order:` - Shows order structure being built
- `💾 [CHECKOUT] Storing Pending Order:` - Shows order number, item count, customer, shipping info
- `✅ [CHECKOUT] Pending order stored successfully`

**What to Check:**
- Verify all cart items are included
- Verify customer information is complete
- Verify shipping address is captured
- Verify order is stored in sessionStorage

---

## ✅ Order Confirmation Page

### Location: `/app/src/app/order-confirmation/page.tsx`

**Console Logs:**
- `🔍 [ORDER CONFIRMATION] Starting verification for session:` - Shows Stripe session ID
- `📥 [ORDER CONFIRMATION] Retrieved Pending Order:` - Shows order number, item count, customer, shipping info
- `⚠️ [ORDER CONFIRMATION] No pending order found in sessionStorage` - Warning if order data missing
- `🔢 [ORDER CONFIRMATION] Order Number:` - Shows generated order number
- `📤 [ORDER CONFIRMATION] Sending to /api/process-order`
- `📤 [ORDER CONFIRMATION] Payload:` - Shows complete payload being sent to API
- `📨 [ORDER CONFIRMATION] API Response:` - Shows API response with Cockpit3D and email results

**What to Check:**
- Verify pending order retrieved successfully
- Verify payload includes all necessary data
- Verify API response shows success for both Cockpit3D and email

---

## 🔵 Process Order API

### Location: `/app/src/app/api/process-order/route.ts`

**Console Logs:**
- `🔵 [PROCESS ORDER API] Received request`
- `🔵 [PROCESS ORDER API] Raw body:` - Shows complete incoming request payload
- `❌ [PROCESS ORDER API] Missing required fields:` - Error if validation fails
- `✅ [PROCESS ORDER API] Validation passed`
- `🔵 [PROCESS ORDER API] Order Details:` - Shows order number, item count, customer, shipping
- `🔵 [PROCESS ORDER API] Building Cockpit3D order structure`
- `🔵 [PROCESS ORDER API] Built Cockpit3D Order:` - Shows complete Cockpit3D order structure
- `🔵 [PROCESS ORDER API] Validation result:` - Shows if Cockpit3D order is valid
- `❌ [PROCESS ORDER API] Invalid Cockpit3D order:` - Shows validation errors
- `🔵 [PROCESS ORDER API] Submitting to Cockpit3D API...`
- `✅ [PROCESS ORDER API] Cockpit3D submission successful:` - Shows Cockpit3D response
- `❌ [PROCESS ORDER API] Cockpit3D submission failed:` - Shows error if failed
- `📧 [PROCESS ORDER API] Preparing email notification`
- `📧 [PROCESS ORDER API] Email payload:` - Shows email data being sent
- `📧 [PROCESS ORDER API] Email response:` - Shows email sending result
- `✅ [PROCESS ORDER API] Email sent successfully`
- `❌ [PROCESS ORDER API] Email sending failed:` - Shows error if failed

**What to Check:**
- Verify all cart items are received
- Verify Cockpit3D order structure is correct
- Verify all option IDs are mapped correctly
- Verify email payload includes all order details

---

## 🏗️ Cockpit3D Order Builder

### Location: `/app/src/lib/cockpit3d-order-builder.ts`

**Console Logs:**
- `🏗️ [COCKPIT3D BUILDER] Starting order build`
- `🏗️ [COCKPIT3D BUILDER] Input:` - Shows order number, item count, customer, retailer ID
- `🏗️ [COCKPIT3D BUILDER] Processing cart items...`
- `🏗️ [COCKPIT3D BUILDER] Processing item X/Y:` - Shows each item being processed
- `🏗️ [COCKPIT3D BUILDER] Built order item X:` - Shows transformed item structure
- `🔧 [COCKPIT3D ITEM BUILDER] Building item X`
- `🔧 [COCKPIT3D ITEM BUILDER] Item data:` - Shows item details (SKU, IDs, prices, options)
- `🔧 [COCKPIT3D ITEM BUILDER] Built X options:` - Shows all options for the item

**What to Check:**
- Verify each item has correct SKU and Cockpit3D ID
- Verify size option has cockpit3d_id
- Verify lightbase option has cockpit3d_id (if selected)
- Verify background option has cockpit3d_option_id (if selected)
- Verify text option has cockpit3d_option_id (if selected)
- Verify custom images are referenced
- Verify special instructions include custom text

---

## 🎭 Mask Images

### Location: Admin Panel `/admin/products`

**Available Masks:**
All masks are in `/public/img/masks/`:
- 2d-ornament-mask.png
- 3CRS-portrait-mask.png
- 3D-crystal-prestige-iceberg-mask.png
- 3d-crystal-block-wide.png
- 3d-crystal-cut-corner-diamond_o.png
- 3d-crystal-diamond-cut-corner-2.png
- 3d-crystal-monument_o.png
- 3d-crystal-oval_mask.png
- 3d-crystal-rectangle-wide-mask.png
- 3d-crystal-urn-small-mask.png
- 3d-rectangle-tall-mask.png
- cat-shape-large-mask.png
- crystal-heart-mask.png
- crystal-urn-large-mask.png
- desk-lamp-mask.png
- diamond-mask.png
- dogbone-horizontal-mask.png
- dogbone-vertical-mask.png
- globe-mask.png
- heart-keychain-mask.png
- heart-mask.png
- heart-necklace-mask.png
- notched-horizontal-mask.png
- notched-vertical-mask.png
- ornament-mask.png
- photo-crystal-ornament-with-a-hole.png
- prestige-mask.png
- rectangle-horizontal-mask.png
- rectangle-keychain-horizontal-mask.png
- rectangle-keychain-vertical-mask.png
- rectangle-necklace-mask.png
- rectangle-vertical-mask.png

**How to Assign:**
1. Go to `/admin/products`
2. Select a product
3. Go to "📝 Basic" tab
4. Find "🎭 Mask Image" dropdown
5. Select appropriate mask or "No mask (free crop)"
6. Generate final-product-list.js
7. Replace file in `/app/src/data/final-product-list.js`

---

## 🐛 Troubleshooting with Console Logs

### Issue: Product not adding to cart
**Check:**
- `🛒 [ADD TO CART]` logs in browser console
- Look for validation errors
- Verify product data is complete

### Issue: Options not showing on product page
**Check:**
- Admin panel - verify options are enabled
- final-product-list.js - verify product has options array
- Browser console for any loading errors

### Issue: Wrong prices in cart
**Check:**
- `💰 [ADD TO CART] Pricing:` log
- Verify basePrice, optionsPrice, totalPrice calculations
- Check admin panel pricing settings

### Issue: Cockpit3D submission failed
**Check:**
- `🔵 [PROCESS ORDER API]` logs
- Look for "Submitting to Cockpit3D API..." message
- Check for validation errors
- Verify all option IDs are present
- Check Cockpit3D API credentials in .env

### Issue: Email not received
**Check:**
- `📧 [PROCESS ORDER API]` logs
- Look for "Email sent successfully" message
- Check PHP error log: `/app/api/order_notification_errors.log`
- Verify email address: orders@crystalkeepsakes.com

### Issue: Order data missing in confirmation
**Check:**
- `📥 [ORDER CONFIRMATION] Retrieved Pending Order:` log
- Verify pendingOrder was stored in sessionStorage during checkout
- Check `💾 [CHECKOUT] Storing Pending Order:` log

---

## 📊 Complete Flow Check

Open browser console and complete a test order. You should see logs in this order:

1. **Product Detail Page:**
   - `🛒 [ADD TO CART]` logs when adding to cart

2. **Checkout Page:**
   - `🏗️ [CHECKOUT]` logs when initializing payment
   - `💾 [CHECKOUT]` logs when storing pending order

3. **Order Confirmation Page:**
   - `🔍 [ORDER CONFIRMATION]` logs when verifying payment
   - `📥 [ORDER CONFIRMATION]` logs when retrieving order
   - `📤 [ORDER CONFIRMATION]` logs when submitting to API
   - `📨 [ORDER CONFIRMATION]` logs showing API response

4. **Backend (check browser Network tab → process-order):**
   - `🔵 [PROCESS ORDER API]` logs showing order processing
   - `🏗️ [COCKPIT3D BUILDER]` logs showing order build
   - `📧 [PROCESS ORDER API]` logs showing email notification

---

## 🔍 Key Data Points to Verify

### Product Configuration:
- ✅ maskImageUrl is set for products that need masks
- ✅ All prices are correct (base + options)
- ✅ Only enabled options are present

### Cart Item:
- ✅ cockpit3d_id present
- ✅ size.cockpit3d_id present (if product has sizes)
- ✅ options array has cockpit3d_option_id for each option
- ✅ customImage.maskId matches product.maskImageUrl
- ✅ pricing calculations correct

### Cockpit3D Order:
- ✅ retailer_id set
- ✅ order_id unique (CK-timestamp)
- ✅ items array has all cart items
- ✅ Each item has sku, qty, client_item_id
- ✅ Each item.options has correct IDs
- ✅ customer address complete

### Email:
- ✅ orderId present
- ✅ cartItems with all details
- ✅ shippingInfo complete
- ✅ receipt_email set

---

All console logs use emoji prefixes for easy filtering:
- 🛒 = Add to Cart
- 🏗️ = Building/Construction
- 💾 = Storage
- 📤 = Sending
- 📥 = Receiving
- 🔵 = API Processing
- 📧 = Email
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 🔧 = Item Building
- 💰 = Pricing
- 📐 = Size
- ⚙️ = Options
- ✍️ = Text

Filter console by emoji to see specific flow!
