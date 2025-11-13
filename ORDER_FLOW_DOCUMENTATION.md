# Crystal Keepsakes Order Flow Documentation
Version 1.0.0 - 2025-01-15

## Overview

This document explains the complete order flow from product selection to Cockpit3D fulfillment.

## Architecture

```
Customer → Product Page → Cart → Checkout (Stripe) → Cockpit3D API → Fulfillment
                ↓
          Image Editor
                ↓
          IndexedDB Storage
```

## 1. Product Selection (ProductDetailClient.tsx)

### Data Structure
When a customer configures a product, we create an `OrderLineItem`:

```typescript
OrderLineItem {
  lineItemId: string              // Unique ID
  productId: string               // Internal ID
  cockpit3d_id: string           // Cockpit3D product ID
  name: string
  sku: string
  
  // Pricing
  basePrice: number              // Product base price
  optionsPrice: number           // Sum of all option prices
  totalPrice: number             // (basePrice + optionsPrice) * quantity
  quantity: number
  
  // Configuration
  size: SizeDetails {
    sizeId: string
    sizeName: string
    basePrice: number
    cockpit3d_id?: string        // ← IMPORTANT for Cockpit3D
  }
  
  options: ProductOption[] [
    {
      category: 'lightBase' | 'background' | 'textOption'
      optionId: string
      name: string
      value: string
      priceModifier: number
      cockpit3d_option_id?: string  // ← IMPORTANT for Cockpit3D
    }
  ]
  
  // Custom Image
  customImage?: CustomImage {
    dataUrl: string              // Masked/compressed PNG
    originalDataUrl?: string     // Original for display
    filename: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    processedAt: string
    maskId?: string
    maskName?: string
  }
  
  // Custom Text
  customText?: {
    text: string                 // Combined text
    line1?: string
    line2?: string
  }
  
  // Product image (for products without custom images)
  productImage?: string
  
  // Metadata
  dateAdded: string
  lastModified: string
}
```

### Key Points
- **ALL customer options are captured** in the `options` array
- **Cockpit3D IDs** are preserved in `cockpit3d_id` and `cockpit3d_option_id` fields
- **Custom images** are processed by ImageEditor (grayscale + compressed)
- **Price calculations** include base + options

## 2. Image Processing (ImageEditor.tsx)

### Process
1. Customer uploads image
2. ImageEditor applies mask overlay
3. Converts to grayscale (black & white) for laser engraving
4. Compresses to PNG (quality 0.95, max 2400px)
5. Returns compressed image

### Storage
- **Full-resolution image**: Stored in IndexedDB
- **Thumbnail** (100x100): Created for cart display
- **Cart reference**: Only image ID stored in localStorage

## 3. Cart Storage (cartUtils.ts)

### Storage Strategy
```
localStorage (5MB limit)
├── Cart metadata (small)
└── Image IDs only

IndexedDB (50% of disk)
├── Full-resolution images
└── Thumbnails
```

### CartItem Structure
```typescript
CartItem {
  // Product info
  productId, cockpit3d_id, name, sku
  
  // Pricing (all preserved)
  basePrice, optionsPrice, price, totalPrice, quantity
  
  // Configuration (ALL preserved)
  size, sizeDetails
  options  // Array or object - both formats supported
  
  // Images
  customImageId          // Reference to IndexedDB
  customImageMetadata    // Light metadata
  productImage           // Product's own image
  
  // Custom text (preserved)
  customText
  
  // Metadata
  dateAdded, lastModified, lineItemId
}
```

### Key Functions
- `addToCart()`: Stores image in IndexedDB, saves only ID to cart
- `getCartWithImages()`: Loads images from IndexedDB for display
- `removeFromCart()`: Deletes both cart item and associated images

## 4. Checkout (Stripe)

### Flow
1. Customer clicks "Proceed to Checkout"
2. Cart data saved to sessionStorage (without full images)
3. Stripe creates PaymentIntent
4. Customer enters shipping address + payment
5. Stripe processes payment
6. On success → Submit to Cockpit3D

### Data Stored
```javascript
sessionStorage.pendingOrder = {
  cartItems: CartItem[]        // Without full image data
  subtotal: number
  total: number
  orderNumber: string
  cockpitOrderData: Partial<Cockpit3DOrder>
}
```

## 5. Cockpit3D Order Submission

### Order Structure
Based on Cockpit3D API documentation:

```typescript
Cockpit3DOrder {
  retailer_id: string            // Your Cockpit3D retailer ID
  order_id: string               // "CK-{timestamp}"
  
  address: {
    email: string
    firstname: string
    lastname: string
    telephone: string
    region: string               // State
    country: string              // "US", "CA", etc
    street: string
    city: string
    postcode: string
    shipping_method: 'air'       // or 'ground', 'express'
    destination: 'customer_home' // or 'vendor_store'
    staff_user: 'Web Order'
  }
  
  billing_address?: { ... }      // Same structure
  
  items: [
    {
      sku: string
      qty: string                // "1", "2", etc
      client_item_id: string     // Unique per line item
      
      // Custom images (URLs)
      original_photo?: string    // URL to uploaded image
      cropped_photo?: string     // URL to masked image
      
      // Product options
      options: [
        {
          id: string             // Cockpit3D option ID
          qty?: string
          value?: string | string[]
        }
      ]
      
      // Custom text / special instructions
      special_instructions?: string
      
      price: number
    }
  ]
  
  subtotal: number
  total: number
}
```

### Option ID Mapping
Each product option needs to be mapped to Cockpit3D option IDs:

```typescript
// Size options
size.cockpit3d_id → options[].id

// Background options
"Remove Backdrop" → id: "154"
"2D Backdrop" → id: "154" 
"3D Backdrop" → id: "155"

// Text options
"No Text" → id: "198"
"Custom Text" → id: "199" with value: ["line1", "line2"]

// Light bases, gift stands
Use cockpit3d_id from product data
```

### Image Handling
Cockpit3D requires **publicly accessible URLs** for images:

**TODO**: Implement image upload service
```typescript
// Before submitting order:
1. Upload customImage.dataUrl to cloud storage (S3, Cloudinary, etc)
2. Get public URL
3. Set original_photo and cropped_photo in order item
```

**Temporary Solution**:
- Include image metadata in `special_instructions`
- Flag order for manual review
- Admin uploads images manually

## 6. Order Submission Flow

```javascript
// After successful Stripe payment:

1. Get cart items with full images from IndexedDB
2. Extract customer info from Stripe
3. Build Cockpit3D order using cockpit3d-order-builder.ts
4. Validate order structure
5. Submit to POST /api/cockpit3d/create-order
6. API route calls Cockpit3D REST API
7. Clear cart and redirect to confirmation page
```

### API Endpoint
```
POST /api/cockpit3d/create-order

Request:
{
  orderNumber: string
  cartItems: CartItem[]
  customer: CustomerInfo
  paymentIntentId: string
}

Response:
{
  success: boolean
  orderNumber: string
  cockpit3dOrderId?: string
  cockpit3dStatus?: string
  requiresManualReview?: boolean
}
```

## 7. Error Handling

### Cockpit3D Submission Failure
If Cockpit3D API fails:
1. Order still marked as successful (payment succeeded)
2. Flag: `requiresManualReview: true`
3. Admin notified to process manually
4. Customer receives confirmation with note

### Image Storage Failure
If IndexedDB fails:
1. Continue without custom image
2. Flag in order
3. Admin contacts customer for image

## 8. Data Preservation

### Critical Data Points
All of these MUST be preserved from ProductDetailClient to Cockpit3D:

✅ **Product identification**
- productId, cockpit3d_id, sku

✅ **Pricing**
- basePrice, optionsPrice, totalPrice

✅ **Size selection**
- size.sizeId, size.cockpit3d_id, size.sizeName

✅ **All options**
- Array of { category, optionId, cockpit3d_option_id, name, value, priceModifier }

✅ **Custom image**
- Full resolution dataUrl
- Metadata (filename, dimensions, maskId)

✅ **Custom text**
- Text content (line1, line2)
- Option ID for Cockpit3D

✅ **Product image**
- For products without custom images

## 9. Testing Checklist

### Product Detail Page
- [ ] All product options captured correctly
- [ ] Image editor opens for products with requiresImage
- [ ] Image editor works with and without masks
- [ ] Compressed image is grayscale
- [ ] Add to cart saves all data

### Cart Page
- [ ] All options displayed correctly
- [ ] Images load from IndexedDB
- [ ] Thumbnails displayed
- [ ] Quantity updates work
- [ ] Remove item deletes image from IndexedDB
- [ ] Total price calculated correctly

### Checkout
- [ ] Stripe loads properly
- [ ] Shipping address captured
- [ ] Payment succeeds
- [ ] Order number generated

### Cockpit3D Submission
- [ ] Order structure matches API requirements
- [ ] All options mapped to correct IDs
- [ ] Image URLs are accessible
- [ ] Customer information complete
- [ ] Order submission succeeds
- [ ] Cockpit3D order ID returned

## 10. Environment Variables

Required in `.env`:

```env
# Cockpit3D API
COCKPIT3D_BASE_URL=https://api.cockpit3d.com
COCKPIT3D_USERNAME=your_username
COCKPIT3D_PASSWORD=your_password
COCKPIT3D_RETAIL_ID=your_retailer_id
NEXT_PUBLIC_COCKPIT3D_SHOP_ID=your_retailer_id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...

# Image Upload (TODO)
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## 11. Next Steps

### Immediate
1. ✅ Fix cart to preserve all order data
2. ✅ Create Cockpit3D order builder
3. ✅ Add API route for order submission
4. ⏳ Test complete flow end-to-end

### Short Term
1. Implement image upload service (S3/Cloudinary)
2. Update Cockpit3D submission to include image URLs
3. Add order confirmation email
4. Add admin dashboard for manual review

### Long Term
1. Implement order status webhooks from Cockpit3D
2. Add order tracking for customers
3. Implement order history page
4. Add retry logic for failed submissions

## Files Modified

1. `/src/lib/cartUtils.ts` - Enhanced to preserve ALL order data
2. `/src/lib/cockpit3d-order-builder.ts` - NEW - Builds Cockpit3D orders
3. `/src/app/cart/page.tsx` - Updated to use Cockpit3D order builder
4. `/src/app/api/cockpit3d/create-order/route.ts` - NEW - API endpoint
5. `/src/components/ProductDetailClient.tsx` - Already correct
6. `/src/components/ImageEditor.tsx` - Already correct

## Support

For issues or questions:
1. Check logs in browser console (Development Mode)
2. Check cart debug panel (Development Mode)
3. Verify all environment variables are set
4. Check Cockpit3D API documentation
