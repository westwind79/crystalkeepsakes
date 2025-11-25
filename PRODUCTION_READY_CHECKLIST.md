# 🚀 Crystal Keepsakes - Production Ready Checklist

## 📋 Overview
This document outlines the complete production readiness checklist for Crystal Keepsakes e-commerce site.

---

## ✅ Current Status

### Working Features
- ✅ Product catalog with 47 products
- ✅ Multi-image gallery system
- ✅ Cart functionality with IndexedDB storage
- ✅ Stripe payment integration
- ✅ Cockpit3D order fulfillment API integration
- ✅ Admin panel for product management (dev only)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Image editor with mask overlay support
- ✅ Pricing engine with sales/discounts

### Known Issues
- ⚠️ Image loading issue requiring refresh (assetPath consistency)
- ⚠️ Debug panel needs enhancement for production verification
- ⚠️ Product gallery auto-population from folders (manual JSON currently)

---

## 🎯 Critical Path to Production

### 1. Image Loading Fix (PRIORITY 1)
**Issue**: Images sometimes don't load until page refresh
**Root Cause**: Inconsistent use of `assetPath()` helper across components
**Solution**: 
- All image references MUST use `assetPath()` from `/src/lib/assetPath.ts`
- Images are stored in `/public/img/products/cockpit3d/[id]/`
- No hardcoded paths allowed

**Files Using assetPath**:
- ✅ `ProductGallery.tsx`
- ✅ `ProductCard.tsx`  
- ✅ `ProductDetailClient.tsx`
- ⚠️ **Check admin panel components**

### 2. Pricing Verification (PRIORITY 1)
**Single Source of Truth**: `final-products.json`
**Pricing Flow**:
```
Admin Panel → final-products.json → pricingUtils.ts → Display
```

**What Needs Verification**:
- [x] Base prices from admin override Cockpit3D API
- [x] Size option prices (lightbases, backgrounds, text)
- [x] Sale prices and percentage discounts
- [ ] **Test order total matches cart total in Stripe**
- [ ] **Test order total sent to Cockpit3D is correct**

**Key Files**:
- `/src/utils/pricingUtils.ts` - All price calculations
- `/src/lib/cockpit3d-pricing-map.ts` - Cockpit3D option ID mapping
- `/src/lib/cockpit3d-order-builder.ts` - Order payload construction

### 3. Cockpit3D Order Payload (PRIORITY 1)
**Order Flow**:
```
Cart → Stripe Checkout → Order Confirmation → Cockpit3D API
```

**Payload Structure** (see `/src/lib/cockpit3d-order-builder.ts`):
```typescript
{
  retailer_id: "256568874",
  order_id: "ORDER-123",
  address: {
    email, firstname, lastname, telephone,
    street, city, region, postcode, country,
    shipping_method: "air",
    destination: "customer_home"
  },
  items: [
    {
      sku: "product_sku",
      qty: "1",
      client_item_id: "unique_id",
      original_photo: "url_to_image",
      cropped_photo: "url_to_cropped",
      special_instructions: "custom text",
      options: [
        { id: "size_option_id", qty: "1" },
        { id: "lightbase_option_id", qty: "1" }
      ],
      price: 59.00
    }
  ],
  subtotal: 59.00,
  total: 59.00
}
```

**Critical Requirements**:
- ✅ Order ID must be unique (using timestamp + random)
- ✅ Customer images must be uploaded and accessible via URL
- ✅ Shipping address from Stripe must be passed to Cockpit3D
- ⚠️ **Verify option IDs match your Cockpit3D catalog**
- ⚠️ **Test with Cockpit3D sandbox before production**

### 4. Stripe Address Collection (PRIORITY 1)
**Current**: Stripe collects payment info only
**Need**: Collect shipping address during checkout

**Implementation Location**: `/src/app/checkout/page.tsx`
```typescript
// In Stripe session creation
shippingAddressCollection: {
  allowedCountries: ['US', 'CA']
}
```

**Then pass to Cockpit3D**:
- Address collected by Stripe
- Retrieved in order confirmation webhook
- Formatted and sent to Cockpit3D API

---

## 🗂️ File Structure

### Core Application Files
```
/app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Homepage
│   │   ├── products/          # Product listings & detail pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Stripe checkout
│   │   ├── order-confirmation/# Post-purchase
│   │   └── admin/             # Admin panel (DEV ONLY)
│   ├── components/            # React components
│   │   ├── ProductCard.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ProductDetailClient.tsx
│   │   ├── ImageEditor.tsx
│   │   └── EnhancedDebugOverlay.tsx
│   ├── lib/                   # Core utilities
│   │   ├── assetPath.ts       # ⚠️ CRITICAL: Asset URL helper
│   │   ├── cartUtils.ts       # Cart logic & IndexedDB
│   │   ├── products.ts        # Product loading
│   │   ├── cockpit3d.ts       # Cockpit3D API client
│   │   └── cockpit3d-order-builder.ts  # Order payload
│   ├── utils/                 # Helpers
│   │   ├── pricingUtils.ts    # ⚠️ CRITICAL: All pricing logic
│   │   └── categoriesConfig.ts # Product categorization
│   └── types/                 # TypeScript types
│       ├── productTypes.ts
│       └── orderTypes.ts
├── public/
│   ├── data/
│   │   ├── final-products.json  # ⚠️ SINGLE SOURCE OF TRUTH
│   │   └── available-masks.json
│   └── img/
│       ├── products/cockpit3d/[id]/  # Product images
│       └── masks/                     # Overlay masks
├── api/                       # PHP backend (MAMP)
│   ├── upload-image.php      # Admin image upload
│   ├── stripe/               # Stripe webhooks
│   └── cockpit3d/            # Cockpit3D integration
└── scripts/                   # Build & maintenance scripts
    ├── fetch-cockpit3d-products.js  # Sync products from API
    ├── generate-masks-list.js       # Create masks JSON
    └── prepare-build.js             # Production build prep
```

---

## 🧹 Script Cleanup (BLOAT REMOVAL)

### Keep These Scripts (Production Needed)
- ✅ `fetch-cockpit3d-products.js` - Sync product data
- ✅ `generate-masks-list.js` - Update mask list
- ✅ `prepare-build.js` - Build preparation
- ✅ `copy-api.js` - Copy PHP files to build output
- ✅ `remove-admin-from-build.js` - Exclude admin from production

### Remove/Archive These (Bloat)
- ❌ `copy-api.js.old.js` - Old backup, not needed
- ❌ `copy-env.js` - Not used in build process
- ❌ `copy-products.js` - Redundant with fetch script
- ❌ `enrich-product-prices.js` - One-time migration, archive
- ❌ `fix-wooden-base-pricing.js` - One-time fix, archive
- ❌ `migrate-to-multi-images.js` - Migration complete, archive
- ❌ `test-products.js` - Use proper testing instead
- ❌ `transform-products-complete.js` - One-time migration, archive
- ⚠️ `setup-image-storage.sh` - Only needed for initial MAMP setup

**Action**: Move to `/scripts/archive/` folder

---

## 🔍 Debug Panel Enhancement

### Current Debug Info
- Storage stats (localStorage, IndexedDB)
- Browser info (userAgent, viewport)
- Performance timing
- Environment variables

### Need to Add
- **Product Data Source Verification**
  - Which `final-products.json` is being loaded?
  - Date/timestamp of last product sync
  - Number of products loaded
  
- **Image Loading Verification**
  - assetPath base path being used
  - Sample product image URLs (resolved)
  - Failed image loads (if any)
  
- **Pricing Verification**
  - Example product price calculation breakdown
  - Sale pricing active products count
  
- **Cockpit3D Integration Status**
  - API endpoint being used
  - Retailer ID configured
  - Last successful order submission (if any)

### Implementation
Add to `/src/components/EnhancedDebugOverlay.tsx`:
```typescript
// Product verification section
const productVerification = {
  source: '/data/final-products.json',
  count: products.length,
  lastUpdated: localStorage.getItem('products_last_sync'),
  sampleProduct: products[0] ? {
    id: products[0].id,
    name: products[0].name,
    basePrice: products[0].basePrice,
    images: products[0].images?.length || 0
  } : null
}

// Image path verification
const imageVerification = {
  assetPathBase: process.env.NEXT_PUBLIC_BASE_PATH || '',
  sampleImageUrl: assetPath('/img/products/cockpit3d/104/example.jpg'),
  imagesInIndexedDB: await getImageStorageStats()
}

// Cockpit3D configuration
const cockpit3dStatus = {
  retailerId: process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID || 'NOT SET',
  apiUrl: process.env.NEXT_PUBLIC_COCKPIT3D_API_URL || 'NOT SET',
  configured: !!(process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID && process.env.NEXT_PUBLIC_COCKPIT3D_API_URL)
}
```

---

## 📦 Product Gallery Auto-Population

### Current System
- Manual: Admin adds images to product via UI
- Images stored in `/public/img/products/cockpit3d/[id]/`
- Image paths saved in `final-products.json`

### Proposed Auto-Gallery
**Option A: Scan on Page Load** (Recommended)
```typescript
// In product detail page
const productImages = await scanProductFolder(product.id)
// Merge with images from JSON
const allImages = [...product.images, ...productImages]
```

**Option B: Build Time Generation**
- Add script: `generate-product-galleries.js`
- Scans all product folders during build
- Updates `final-products.json` with found images
- Run as part of `prebuild` in package.json

**Recommendation**: Option B (Build Time)
- Faster page loads
- SEO friendly (images in static JSON)
- No runtime file system access needed

---

## 📊 Checkout Flow Diagram

See `CHECKOUT_FLOW_DIAGRAM.md` for complete visual diagram.

**Quick Summary**:
```
1. Browse Products → 2. Add to Cart (IndexedDB)
                        ↓
3. View Cart → 4. Checkout (Stripe Session)
                ↓
5. Stripe Payment Page → 6. Payment Success
                           ↓
7. Webhook → Order Confirmation → 8. Submit to Cockpit3D
                                    ↓
9. Email Receipt → Customer & Admin
```

---

## 🧪 Pre-Production Testing Checklist

### Functional Tests
- [ ] Add product to cart
- [ ] Cart persists across page refreshes
- [ ] Checkout with Stripe (test mode)
- [ ] Order confirmation page displays
- [ ] Cockpit3D order submission succeeds
- [ ] Email notifications sent

### Pricing Tests
- [ ] Base price displays correctly
- [ ] Size options change price
- [ ] Light base adds correct amount
- [ ] Background options add correct amount
- [ ] Custom text adds correct amount
- [ ] Sale prices calculate correctly
- [ ] Cart total matches Stripe amount
- [ ] Cockpit3D order total matches cart

### Image Tests
- [ ] Product images load on first view
- [ ] Gallery navigation works
- [ ] Image editor opens and functions
- [ ] Cropped images save correctly
- [ ] Custom images appear in cart
- [ ] Custom images upload to server
- [ ] Cockpit3D receives image URLs

### Integration Tests
- [ ] Stripe test payment succeeds
- [ ] Stripe webhook receives event
- [ ] Cockpit3D API accepts order
- [ ] Admin receives order notification
- [ ] Customer receives confirmation email

---

## 🚨 Common Issues & Fixes

### Issue: Images not loading
**Fix**: Verify all image references use `assetPath()`
```typescript
// ❌ Wrong
<img src="/img/products/cockpit3d/104/image.jpg" />

// ✅ Correct
<img src={assetPath('/img/products/cockpit3d/104/image.jpg')} />
```

### Issue: Price doesn't match
**Fix**: Check `pricingUtils.ts` - all calculations should be there
- Never calculate prices in components
- Always use `getDisplayPrice()` and `calculateTotal()`

### Issue: Cockpit3D order fails
**Fix**: Check option IDs in `/src/lib/cockpit3d-pricing-map.ts`
- Must match your Cockpit3D catalog
- Log full order payload before sending
- Verify image URLs are accessible

### Issue: Stripe amount mismatch
**Fix**: Ensure cart total calculation matches Stripe session amount
```typescript
// In checkout page
const cartTotal = calculateCartTotal(cartItems)
// This MUST match Stripe session amount
```

---

## 📝 Environment Variables

### Required for Production
```env
# Stripe (Production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cockpit3D
NEXT_PUBLIC_COCKPIT3D_SHOP_ID=256568874
NEXT_PUBLIC_COCKPIT3D_API_URL=https://api.cockpit3d.com/
COCKPIT3D_API_KEY=your_api_key

# Email (SendGrid or similar)
SENDGRID_API_KEY=your_key
FROM_EMAIL=orders@crystalkeepsakes.com

# Base Path (if deploying to subdirectory)
NEXT_PUBLIC_BASE_PATH=    # Leave empty for root domain
```

---

## 🎯 Next Steps

1. **Fix Image Loading** - Audit all components for assetPath usage
2. **Enhance Debug Panel** - Add production verification data
3. **Test Pricing** - Verify admin prices override API prices
4. **Stripe Address** - Implement address collection
5. **Cockpit3D Test** - Submit test order to sandbox
6. **Clean Scripts** - Move bloat to archive folder
7. **Document Gallery** - Implement auto-scan or manual process
8. **Full E2E Test** - Complete checkout flow with real test order

---

Last Updated: 2025-11-25
