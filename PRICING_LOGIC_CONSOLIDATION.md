# Pricing Logic Consolidation

**Date:** January 2025  
**Issue:** Duplicate pricing logic and inconsistent use of utility functions

## 🔍 Problem Identified

The user correctly identified that pricing logic was duplicated between components and there were inconsistencies in how sale status was checked.

### Issues Found:

1. **Duplicated Pricing Logic:**
   - `ProductCard.tsx` had its own `getDisplayPrice()` function (lines 25-79)
   - `ProductDetailClient.tsx` had its own `calculateTotal()` function (lines 255-303)
   - Both implemented the same sale pricing logic independently

2. **Inconsistent Sale Detection:**
   - `ProductCard.tsx` line 21: ✅ Used `isOnSale(product)` utility
   - `ProductDetailClient.tsx` line 261: ❌ Used `if (product?.sale)` directly
   - `ProductDetailClient.tsx` line 446: ❌ Used `product.sale === true`
   - `ProductDetailClient.tsx` lines 642, 695, 748: ✅ Used `isOnSale(product)` for badges

3. **Violation of DRY Principle:**
   - Same sale calculation logic existed in multiple places
   - Risk of inconsistencies if one is updated but not the other
   - Harder to maintain and debug

## ✅ Solution Implemented

### Created Centralized Pricing Utility

**New File:** `/app/src/utils/pricingUtils.ts`

This file now serves as the **single source of truth** for all pricing calculations.

#### Functions Provided:

1. **`getDisplayPrice(product)`**
   - Calculates display price for product cards and listings
   - Handles both single-price products and size variations
   - Returns `PriceInfo` object with min/max prices and sale information
   - Used by: `ProductCard.tsx`

2. **`calculateTotal(product, selectedSize, optionsPrice, quantity)`**
   - Calculates total price with selected options
   - Handles sale discounts consistently
   - Returns final total price
   - Used by: `ProductDetailClient.tsx`

3. **`calculateOptionsPrice(selectedLightBase, selectedBackground, selectedTextOption, showCustomText, textOptions)`**
   - Calculates additional price from selected options
   - Returns total options price
   - Used by: `ProductDetailClient.tsx`

4. **`getSaleInfo(product, currentPrice, originalPrice)`**
   - Returns detailed sale information object
   - Includes discount amount, percentage, and saved amount
   - Used by: `ProductDetailClient.tsx`

5. **Helper Functions:**
   - `formatPrice(price)` - Format price for display
   - `getPriceRangeText(priceInfo)` - Get price range display text

### Sale Detection Logic

**Single Source:** All components now use `isOnSale(product)` from `categoriesConfig.ts`

```typescript
// categoriesConfig.ts line 225-227
export const isOnSale = (product: any): boolean => {
  return product?.sale === true;
};
```

### Updated Components

#### 1. ProductCard.tsx

**Before:**
```typescript
// Lines 25-79: Custom getDisplayPrice() function
const getDisplayPrice = () => {
  // 55 lines of duplicated pricing logic
}
```

**After:**
```typescript
// Import centralized utility
import { getDisplayPrice } from '@/utils/pricingUtils'

// Use centralized function
const priceInfo = getDisplayPrice(product)
```

**Lines Removed:** ~55 lines of duplicated code  
**Result:** Cleaner, more maintainable code

#### 2. ProductDetailClient.tsx

**Before:**
```typescript
// Lines 255-303: Custom calculateTotal() and calculateOptionsPrice()
const calculateTotal = (): number => {
  // Custom pricing logic with product?.sale check
}

const calculateOptionsPrice = (): number => {
  // Custom options calculation
}

// Line 261: if (product?.sale) ❌
// Line 446: onSale: product.sale === true ❌
```

**After:**
```typescript
// Import centralized utilities
import { calculateTotal, calculateOptionsPrice, getSaleInfo } from '@/utils/pricingUtils'
import { isOnSale } from '@/utils/categoriesConfig'

// Wrapper functions using centralized utilities
const getTotalPrice = (): number => {
  const optionsPrice = calculateOptionsPrice(...)
  return calculateTotal(product, selectedSize, optionsPrice, quantity)
}

const getOptionsPrice = (): number => {
  return calculateOptionsPrice(...)
}

// Line 446: onSale: isOnSale(product) ✅
// Line 748: {isOnSale(product) && ... ✅
```

**Consistency:** All sale checks now use `isOnSale(product)` utility

## 📊 Benefits

### 1. Single Source of Truth
- All pricing logic in one place: `/app/src/utils/pricingUtils.ts`
- Changes to pricing logic only need to be made once
- Guaranteed consistency across all components

### 2. Consistent Sale Detection
- All components use `isOnSale(product)` utility
- No more direct checks of `product.sale`
- Badge display and pricing calculations use same logic

### 3. Improved Maintainability
- ~100 lines of duplicate code eliminated
- Clear, documented utility functions
- TypeScript interfaces for type safety

### 4. Easier Testing
- Pricing logic can be tested independently
- Clear function boundaries
- Predictable inputs and outputs

### 5. Better Code Organization
```
/src/utils/
├── categoriesConfig.ts  → Category detection & filtering
├── pricingUtils.ts      → All pricing calculations (NEW)
└── logger.ts            → Logging utilities
```

## 🔧 Technical Details

### PriceInfo Interface
```typescript
export interface PriceInfo {
  min: number                 // Minimum price (after discounts)
  max: number                 // Maximum price (after discounts)
  originalMin: number         // Original minimum price
  originalMax: number         // Original maximum price
  hasRange: boolean           // True if min !== max
  discount?: number           // Dollar amount discount
  discountPercent?: number    // Percentage discount
}
```

### Sale Pricing Priority

Both components now follow the same priority:

1. **Priority 1:** Fixed dollar discount (`salePrice`)
   - For products WITH sizes: Subtract from each size price
   - For products WITHOUT sizes: Use as final price

2. **Priority 2:** Percentage discount (`salePercent`)
   - Apply percentage to base/size prices

### Consistency Checks

| Component | Sale Detection | Pricing Logic | Status |
|-----------|---------------|---------------|--------|
| ProductCard | `isOnSale(product)` ✅ | `pricingUtils.getDisplayPrice()` ✅ | FIXED |
| ProductDetailClient | `isOnSale(product)` ✅ | `pricingUtils.calculateTotal()` ✅ | FIXED |
| Badge Display | `isOnSale(product)` ✅ | N/A | ✅ |
| Cart Items | `isOnSale(product)` ✅ | Uses stored values | ✅ |

## 🧪 Testing Checklist

After this change, verify:

- [ ] Product cards display correct prices
- [ ] Sale badges appear on correct products
- [ ] Product detail page shows correct totals
- [ ] Sale discounts calculate properly
- [ ] Size variations show correct price ranges
- [ ] Options (lightbase, background, text) add correctly
- [ ] Cart displays correct line item prices
- [ ] Featured badge appears on featured products
- [ ] On Sale badge appears only on sale products

## 📝 Files Modified

1. **Created:** `/app/src/utils/pricingUtils.ts` (264 lines)
   - New centralized pricing utility

2. **Modified:** `/app/src/components/ProductCard.tsx`
   - Removed: ~55 lines of duplicate pricing logic
   - Added: Import and use of `getDisplayPrice()`
   - Status: ✅ Simplified and consistent

3. **Modified:** `/app/src/components/ProductDetailClient.tsx`
   - Removed: ~50 lines of duplicate pricing logic
   - Added: Imports of centralized utilities
   - Fixed: All `product.sale` checks → `isOnSale(product)`
   - Added: Wrapper functions `getTotalPrice()` and `getOptionsPrice()`
   - Status: ✅ Consistent with utilities

## 🎯 Summary

**Problem:** Duplicate pricing logic and inconsistent sale detection  
**Solution:** Centralized pricing utilities in `/app/src/utils/pricingUtils.ts`  
**Result:** Single source of truth for all pricing calculations

**Lines of Code:**
- Removed: ~105 lines of duplicate code
- Added: 264 lines of well-documented, reusable utility code
- Net: +159 lines (but with much better organization)

**Consistency:**
- ✅ All components use `isOnSale(product)` utility
- ✅ All pricing calculations use centralized functions
- ✅ Same sale logic applied everywhere

**Maintainability:**
- ✅ Single place to update pricing logic
- ✅ TypeScript interfaces for type safety
- ✅ Well-documented functions
- ✅ Easy to test independently

---

**Status:** ✅ Complete  
**Ready for Testing:** Yes  
**Breaking Changes:** None (same behavior, better structure)
