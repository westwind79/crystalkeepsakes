# 🧪 Testing Instructions - Changes to Verify

## What's Been Updated

### 1. ✅ **Frontend Startup Fixed**
**What Changed**: Fixed supervisor config to run `yarn dev` from `/app` instead of `/app/frontend`
**Status**: ✅ Already working
**How to Test**: Frontend should load at http://localhost:3000 without issues

---

### 2. ✅ **Mask Loading Fixed** 
**What Changed**: Confirmed masks load from `/data/available-masks.json` (32 masks)
**Status**: ✅ Already working
**How to Test**:
1. Go to http://localhost:3000/admin
2. Select any product
3. Scroll to "Mask Image" dropdown
4. Should see 32+ mask options (not empty)
5. No 404 errors in browser console

---

### 3. 🆕 **Enhanced Debug Panel**
**What Changed**: Added production verification data
**New Data Displayed**:
- Cart items count
- Product source file path
- assetPath base configuration  
- Cockpit3D configured status
- Stripe configured status

**How to Test**:
1. Go to any page (homepage, products, etc.)
2. Click "Debug Panel" button (bottom right)
3. Look for new "Production" section
4. Verify it shows:
   ```
   Production:
   - cartItems: 0 (or your cart count)
   - productSource: /data/final-products.json
   - assetPathBase: (root) or /test or /prod
   - cockpit3dConfigured: true/false
   - stripeConfigured: true/false
   ```

---

### 4. 📄 **New Documentation Created**

#### **PRODUCTION_READY_CHECKLIST.md**
- Complete production readiness guide
- Critical priorities identified
- File structure documented  
- Script cleanup recommendations
- Testing checklist
- Environment variables reference

**Location**: `/app/PRODUCTION_READY_CHECKLIST.md`

#### **CHECKOUT_FLOW_DIAGRAM.md**
- Visual ASCII diagram of entire checkout flow
- Step-by-step customer journey
- Cart → Stripe → Cockpit3D flow
- Data flow at each stage
- Integration points
- Error handling
- Testing checklist

**Location**: `/app/CHECKOUT_FLOW_DIAGRAM.md`

---

## 🧪 Recommended Test Flow

### Test 1: Image Loading
**Purpose**: Verify images load without requiring refresh

**Steps**:
1. Clear browser cache
2. Go to http://localhost:3000/products
3. Browse multiple products
4. **Check**: Do product images load immediately?
5. **Check**: Any broken images or 404s in console?
6. **Expected**: All images should load on first view

**If images don't load**:
- Check console for errors
- Verify `/public/img/products/cockpit3d/[id]/` folders exist
- Check if `assetPath()` is being used in all components

---

### Test 2: Admin Panel Masks
**Purpose**: Verify mask dropdown is populated

**Steps**:
1. Go to http://localhost:3000/admin
2. Click on any product (e.g., "2D Crystal Cat Ornament")
3. Scroll down to "Mask Image" field
4. Open dropdown
5. **Expected**: Should see 30+ mask options
6. **Expected**: No console errors about `/img/masks/` 404

---

### Test 3: Debug Panel Production Data
**Purpose**: Verify new production verification data

**Steps**:
1. Add a product to cart
2. Go to http://localhost:3000
3. Click "Debug Panel" button
4. Switch to "System" tab (or wherever production data shows)
5. **Expected**: Should see:
   - cartItems: 1
   - productSource: /data/final-products.json
   - assetPathBase: (root)
   - cockpit3dConfigured: true (if env var set)
   - stripeConfigured: true (if env var set)

---

### Test 4: Pricing Flow (Manual Verification)
**Purpose**: Ensure admin panel prices flow correctly

**Steps**:
1. In admin panel, note a product's base price (e.g., $59.00)
2. Go to that product page on frontend
3. **Check**: Price matches admin panel? ✅
4. Select options (size, lightbase, etc.)
5. **Check**: Price updates correctly? ✅
6. Add to cart
7. **Check**: Cart shows correct total? ✅
8. View `/app/public/data/final-products.json`
9. **Check**: Product price matches JSON? ✅

**Formula**:
```
Total = (selectedSize.price OR product.basePrice) + optionsPrice
      - saleDiscount (if on sale)
      * quantity
```

---

### Test 5: Gallery Images (If Multiple)
**Purpose**: Verify multi-image products display gallery

**Steps**:
1. Find a product with multiple images in folder
2. Example: `/public/img/products/cockpit3d/104/`
3. Check if multiple images exist
4. Go to that product page
5. **Expected**: Gallery navigation should appear
6. **Expected**: Can click through images

**Note**: Currently images must be in `final-products.json`. Auto-gallery feature is documented but not yet implemented.

---

## 🔍 What to Look For

### Browser Console
- ❌ No 404 errors for `/img/masks/`
- ❌ No 404 errors for product images
- ✅ Masks loaded successfully log
- ✅ Products loaded successfully log

### Network Tab
- ✅ `/data/final-products.json` loads (200 OK)
- ✅ `/data/available-masks.json` loads (200 OK)
- ✅ Product images load (200 OK)
- ❌ No failed requests

### Debug Panel
- ✅ Storage shows healthy status
- ✅ Production section shows correct config
- ✅ Cart items count is accurate
- ✅ Environment variables are set

---

## 📝 Report Back

After testing, please report:

1. **Images Loading**
   - ✅ Works perfectly / ⚠️ Sometimes fails / ❌ Broken

2. **Masks Dropdown**
   - ✅ Populated with options / ❌ Empty

3. **Debug Panel**
   - ✅ Shows production data / ❌ Missing section

4. **Pricing**
   - ✅ Matches admin panel / ❌ Incorrect

5. **Any Console Errors?**
   - (Share screenshot or error message)

---

## 🚀 Next Steps After Testing

Based on your test results, I can:

1. **Fix Image Loading Issues** (if found)
   - Audit components for assetPath usage
   - Fix any hardcoded paths

2. **Implement Gallery Auto-Scan**
   - Create build script to scan product folders
   - Auto-populate `final-products.json` with images

3. **Add Stripe Address Collection**
   - Modify checkout to collect shipping address
   - Pass to Cockpit3D order payload

4. **Clean Up Scripts**
   - Move bloat to `/scripts/archive/`
   - Update build process

5. **Full E2E Test**
   - Test complete checkout flow
   - Verify Cockpit3D order submission

---

## 📚 Documentation Reference

- **Production Checklist**: `/app/PRODUCTION_READY_CHECKLIST.md`
- **Checkout Flow Diagram**: `/app/CHECKOUT_FLOW_DIAGRAM.md`
- **This Testing Guide**: `/app/TESTING_INSTRUCTIONS.md`

---

Last Updated: 2025-11-25
