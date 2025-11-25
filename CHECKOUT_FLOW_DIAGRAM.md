# 🛒 Crystal Keepsakes - Complete Checkout Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────┘

    ┌───────────┐
    │  HOMEPAGE │
    │  page.tsx │
    └─────┬─────┘
          │
          ▼
    ┌─────────────────┐
    │ BROWSE PRODUCTS │
    │  /products/     │
    │  page.tsx       │
    └─────┬───────────┘
          │
          ▼
    ┌──────────────────────┐
    │ SELECT PRODUCT       │
    │ /products/[slug]/    │
    │ ProductDetailClient  │
    └──────┬───────────────┘
           │
           ├─► 📷 Upload Image (if required)
           │   │
           │   ├─► ImageEditor.tsx
           │   │   ├─► Apply mask overlay
           │   │   ├─► Crop & adjust
           │   │   └─► Compress (browser-image-compression)
           │   │
           │   └─► Save to IndexedDB (temporary)
           │
           ├─► Choose Options
           │   ├─► Size (if available)
           │   ├─► Light Base
           │   ├─► Background (2D/3D/Remove)
           │   └─► Custom Text
           │
           └─► Calculate Price
               └─► pricingUtils.ts
                   ├─► Base price from selected size
                   ├─► Add option prices
                   ├─► Apply sale discount (if any)
                   └─► Total = (base + options) * quantity


┌────────────────────────────────────────────────────────────────────┐
│                         ADD TO CART                                 │
└────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  ADD TO CART    │
    │  Button Click   │
    └─────┬───────────┘
          │
          ▼
    ┌──────────────────────────┐
    │  cartUtils.ts            │
    │  addToCart()             │
    └──────┬───────────────────┘
           │
           ├─► Validate Required Fields
           │   ├─► Product has image (if required)
           │   ├─► Size selected (if has sizes)
           │   └─► All options configured
           │
           ├─► Build Cart Item Object
           │   {
           │     id: unique_id,
           │     productId, sku, name,
           │     quantity, price, totalPrice,
           │     selectedSize, selectedOptions,
           │     customImage: {
           │       data: base64_or_blob,
           │       maskId, originalFileName
           │     }
           │   }
           │
           ├─► Save Custom Image to IndexedDB
           │   └─► storeCustomImage()
           │       └─► DB: 'customImages' store
           │
           └─► Save Cart to localStorage
               └─► Key: 'cart'
                   └─► Array of cart items


┌────────────────────────────────────────────────────────────────────┐
│                         CART PAGE                                   │
└────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   VIEW CART     │
    │   /cart/        │
    │   page.tsx      │
    └─────┬───────────┘
          │
          ├─► Load cart from localStorage
          │   └─► cartUtils.ts: getCart()
          │
          ├─► Load custom images from IndexedDB
          │   └─► retrieveCustomImage() for each item
          │
          ├─► Display Items
          │   ├─► Product image (or custom image preview)
          │   ├─► Name, SKU, size, options
          │   ├─► Unit price, quantity, subtotal
          │   └─► Actions: Update qty, Remove
          │
          ├─► Show Cart Summary
          │   ├─► Subtotal (sum of all items)
          │   ├─► Tax (if applicable)
          │   ├─► Shipping: TBD at checkout
          │   └─► Total
          │
          └─► CHECKOUT Button
              └─► Validates cart not empty


┌────────────────────────────────────────────────────────────────────┐
│                    STRIPE CHECKOUT                                  │
└────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  CHECKOUT PAGE   │
    │  /checkout/      │
    │  page.tsx        │
    └──────┬───────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │  Upload Custom Images       │
    │  (before Stripe session)    │
    └──────┬──────────────────────┘
           │
           ├─► For each cart item with customImage:
           │   │
           │   ├─► Create FormData with image blob
           │   ├─► POST to /api/customer-image-upload.php
           │   │   └─► Saves to /public/img/customer-uploads/
           │   │       └─► Returns: { url: '/img/customer-uploads/xxx.jpg' }
           │   │
           │   └─► Replace customImage.data with permanent URL
           │       └─► Update cart item in memory
           │
           └─► Create Stripe Checkout Session
               │
               ├─► POST to /api/stripe/create-checkout-session.php
               │   {
               │     cartItems: [
               │       {
               │         name, description, 
               │         amount: total * 100, // cents
               │         quantity,
               │         images: [product_image_url]
               │       }
               │     ],
               │     customerEmail: optional,
               │     metadata: {
               │       orderData: JSON.stringify({
               │         items: cart_items_with_all_details,
               │         customImages: permanent_urls
               │       })
               │     }
               │   }
               │
               ├─► PHP Creates Stripe Session
               │   │
               │   ├─► Calculate line items
               │   ├─► Set shipping_address_collection: {
               │   │     allowedCountries: ['US', 'CA']
               │   │   }
               │   ├─► Set success_url: /order-confirmation?session_id={CHECKOUT_SESSION_ID}
               │   ├─► Set cancel_url: /cart
               │   └─► Store full order data in metadata
               │
               └─► Redirect to Stripe Hosted Checkout
                   └─► URL: session.url


┌────────────────────────────────────────────────────────────────────┐
│                    STRIPE PAYMENT FLOW                              │
└────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────┐
    │  STRIPE HOSTED PAGE      │
    │  (Stripe.com domain)     │
    └──────┬───────────────────┘
           │
           ├─► Customer Enters:
           │   ├─► Email
           │   ├─► Card details
           │   ├─► Billing address
           │   └─► Shipping address (collected by Stripe)
           │
           ├─► Process Payment
           │   └─► Stripe validates & charges card
           │
           └─► Outcomes:
               ├─► SUCCESS → Redirect to success_url
               └─► CANCEL  → Redirect to cancel_url


┌────────────────────────────────────────────────────────────────────┐
│                   WEBHOOK & ORDER PROCESSING                        │
└────────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────┐
    │  Stripe Webhook Fired        │
    │  Event: checkout.session     │
    │         .completed           │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────────┐
    │  /api/stripe/webhook.php         │
    │  (Verifies webhook signature)    │
    └──────┬───────────────────────────┘
           │
           ├─► Extract Session Data:
           │   ├─► session_id
           │   ├─► customer_email
           │   ├─► amount_total
           │   ├─► payment_intent
           │   ├─► shipping_details: {
           │   │     name, address, phone
           │   │   }
           │   └─► metadata: { orderData }
           │
           ├─► Reconstruct Full Order:
           │   {
           │     orderNumber: "ORD-" + timestamp + random,
           │     customerId: customer_email,
           │     status: "paid",
           │     paymentInfo: {
           │       stripeSessionId, paymentIntent, amountPaid
           │     },
           │     shippingAddress: shipping_details.address,
           │     billingAddress: customer_details.address,
           │     items: JSON.parse(metadata.orderData).items,
           │     subtotal, tax, total
           │   }
           │
           ├─► Save Order to Database (optional)
           │   └─► Or save to JSON file for record
           │
           ├─► Submit to Cockpit3D
           │   │
           │   ├─► cockpit3d-order-builder.ts
           │   │   └─► buildCockpit3DOrder(orderNumber, items, customer)
           │   │
           │   ├─► POST to Cockpit3D API
           │   │   {
           │   │     retailer_id: "256568874",
           │   │     order_id: orderNumber,
           │   │     address: {
           │   │       email, firstname, lastname,
           │   │       street, city, region, postcode, country,
           │   │       telephone,
           │   │       shipping_method: "air",
           │   │       destination: "customer_home"
           │   │     },
           │   │     items: [
           │   │       {
           │   │         sku, qty, client_item_id,
           │   │         original_photo: customer_image_url,
           │   │         cropped_photo: customer_image_url,
           │   │         special_instructions: custom_text,
           │   │         options: [
           │   │           { id: size_option_id, qty: "1" },
           │   │           { id: lightbase_option_id, qty: "1" },
           │   │           { id: background_option_id, value: "..." },
           │   │           { id: text_option_id, value: custom_text }
           │   │         ],
           │   │         price: item_total
           │   │       }
           │   │     ],
           │   │     subtotal, total
           │   │   }
           │   │
           │   └─► Response: { success, cockpit_order_id }
           │
           ├─► Send Email Notifications
           │   ├─► Customer: Order confirmation
           │   │   ├─► Order number
           │   │   ├─► Items ordered
           │   │   ├─► Total paid
           │   │   ├─► Shipping address
           │   │   └─► Estimated delivery
           │   │
           │   └─► Admin: New order alert
           │       ├─► Order details
           │       ├─► Customer info
           │       └─► Cockpit3D submission status
           │
           └─► Return 200 OK to Stripe
               └─► (Acknowledge webhook received)


┌────────────────────────────────────────────────────────────────────┐
│                   ORDER CONFIRMATION PAGE                           │
└────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────┐
    │  Customer Redirected After     │
    │  Successful Payment            │
    │  /order-confirmation/          │
    │  ?session_id=xxx               │
    └────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────────────┐
    │  OrderConfirmationClient.tsx       │
    └────────┬───────────────────────────┘
             │
             ├─► Fetch Session from Stripe
             │   └─► GET /api/stripe/get-session.php?session_id=xxx
             │       └─► Returns: session data + order details
             │
             ├─► Display Order Confirmation:
             │   ├─► ✅ Payment Successful!
             │   ├─► Order Number: ORD-xxx
             │   ├─► Items Ordered (with images)
             │   ├─► Shipping Address
             │   ├─► Total Paid: $xxx.xx
             │   ├─► Estimated Delivery: X business days
             │   └─► Email Confirmation Sent
             │
             ├─► Clear Cart
             │   ├─► Remove from localStorage
             │   └─► Clear IndexedDB custom images
             │
             └─► Track Conversion (Analytics)
                 └─► Google Analytics / FB Pixel event


┌────────────────────────────────────────────────────────────────────┐
│                   FULFILLMENT & DELIVERY                            │
└────────────────────────────────────────────────────────────────────┘

    ┌────────────────────┐
    │  Cockpit3D         │
    │  Order Processing  │
    └────────┬───────────┘
             │
             ├─► Receives Order via API
             ├─► Downloads Customer Images
             ├─► Engraves Crystal Products
             ├─► Quality Check
             ├─► Packaging
             └─► Ships to Customer
                 │
                 ├─► Tracking Number Generated
                 └─► (Optional: Webhook back to you)

    ┌────────────────────┐
    │  Customer          │
    └────────┬───────────┘
             │
             ├─► Receives Shipping Notification
             ├─► Tracks Package
             └─► Receives Product
                 └─► 🎉 Happy Customer!


┌────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW SUMMARY                            │
└────────────────────────────────────────────────────────────────────┘

1. Product Selection
   └─► Data: final-products.json → ProductDetailClient
   
2. Cart Storage
   └─► Data: localStorage (cart array)
   └─► Images: IndexedDB (customImages store)
   
3. Checkout
   └─► Images: Upload to /public/img/customer-uploads/
   └─► Session: Create via Stripe API
   
4. Payment
   └─► Process: Stripe handles
   └─► Webhook: Stripe → Your server
   
5. Order Processing
   └─► Build: Stripe data → Cockpit3D format
   └─► Submit: POST to Cockpit3D API
   └─► Store: Optional database or JSON file
   
6. Confirmation
   └─► Display: Order details from Stripe session
   └─► Cleanup: Clear cart and temporary data


┌────────────────────────────────────────────────────────────────────┐
│                    IMPORTANT INTEGRATION POINTS                     │
└────────────────────────────────────────────────────────────────────┘

🔑 Environment Variables Required:
   ├─► NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   ├─► STRIPE_SECRET_KEY
   ├─► STRIPE_WEBHOOK_SECRET
   ├─► NEXT_PUBLIC_COCKPIT3D_SHOP_ID
   ├─► NEXT_PUBLIC_COCKPIT3D_API_URL
   └─► COCKPIT3D_API_KEY

📦 Key Files:
   ├─► /src/lib/cartUtils.ts - Cart logic
   ├─► /src/utils/pricingUtils.ts - Price calculations
   ├─► /src/lib/cockpit3d-order-builder.ts - Order payload
   ├─► /api/stripe/create-checkout-session.php - Session creation
   ├─► /api/stripe/webhook.php - Payment processing
   └─► /api/customer-image-upload.php - Image storage

⚠️ Critical Success Factors:
   ├─► Customer images MUST be uploaded before Stripe checkout
   ├─► Shipping address MUST be collected by Stripe
   ├─► Prices in cart MUST match Stripe session amounts
   ├─► Order metadata MUST include all product details
   ├─► Cockpit3D option IDs MUST match your catalog
   └─► Webhook signature MUST be verified for security


┌────────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING                                  │
└────────────────────────────────────────────────────────────────────┘

Cart Stage:
   ├─► Image too large → Compress before saving
   ├─► IndexedDB full → Show warning, offer to clear
   └─► Required field missing → Prevent add to cart

Checkout Stage:
   ├─► Image upload fails → Retry or cancel checkout
   ├─► Stripe session creation fails → Show error, retry button
   └─► Payment declined → Stripe handles, show message

Post-Purchase:
   ├─► Webhook missed → Stripe auto-retries
   ├─► Cockpit3D API fails → Log error, alert admin, retry
   └─► Email fails → Log warning, ensure order still processes


┌────────────────────────────────────────────────────────────────────┐
│                     TESTING CHECKLIST                               │
└────────────────────────────────────────────────────────────────────┘

□ Add product with custom image to cart
□ Cart persists across browser refresh
□ Image shows correctly in cart
□ Price calculations match manual calculation
□ Checkout creates valid Stripe session
□ Stripe test payment succeeds (card: 4242 4242 4242 4242)
□ Webhook fires and is received
□ Order is submitted to Cockpit3D (sandbox)
□ Confirmation page shows correct details
□ Cart is cleared after successful order
□ Email notifications are sent
□ Cockpit3D receives correct option IDs
□ Customer images are accessible via URLs sent to Cockpit3D

```

---

## Quick Reference URLs

### Customer-Facing
- Homepage: `/`
- Products: `/products/`
- Product Detail: `/products/[slug]/`
- Cart: `/cart/`
- Checkout: `/checkout/`
- Order Confirmation: `/order-confirmation/`

### API Endpoints (PHP)
- Create Checkout: `/api/stripe/create-checkout-session.php`
- Webhook: `/api/stripe/webhook.php`
- Get Session: `/api/stripe/get-session.php`
- Upload Image: `/api/customer-image-upload.php`
- Cockpit3D Submit: `/api/cockpit3d/submit-order.php`

### Admin (Dev Only)
- Admin Panel: `/admin/`
- Upload Product Image: `/api/upload-image.php`

---

Last Updated: 2025-11-25
