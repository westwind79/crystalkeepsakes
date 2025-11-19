# ProductCard Logic Consolidation

## Problem
Duplicate logic existed for determining product attributes:

**Products Page:**
```typescript
import { isOnSale, isFeaturedProduct, isLightbaseProduct } from '@/utils/categoriesConfig'
// Uses shared utility functions
```

**ProductCard (Before):**
```typescript
const onSale = product.sale === true
const isFeatured = product.featured === true  
const isLightbase = product.sku?.toLowerCase().includes('lightbase') || 
                    product.name?.toLowerCase().includes('lightbase') ||
                    product.name?.toLowerCase().includes('light base')
```

This duplication meant:
- Logic could get out of sync
- Changes needed in multiple places
- Harder to maintain
- Potential for inconsistent behavior

## Solution
Consolidated all product type/status checking logic to use the shared utility functions from `/app/src/utils/categoriesConfig.ts`

## Changes Made

### ProductCard.tsx
**Before:**
```typescript
const onSale = product.sale === true
const isFeatured = product.featured === true
const isLightbase = product.sku?.toLowerCase().includes('lightbase') || ...
```

**After:**
```typescript
import { isOnSale, isFeaturedProduct, isLightbaseProduct } from '@/utils/categoriesConfig'

const onSale = isOnSale(product)
const isFeatured = isFeaturedProduct(product)
const isLightbase = isLightbaseProduct(product)
```

## Benefits

✅ **Single Source of Truth**: All product status logic in one place (`categoriesConfig.ts`)
✅ **Consistency**: Products page and ProductCard use identical logic
✅ **Maintainability**: Change logic once, applies everywhere
✅ **Testability**: Shared functions can be unit tested
✅ **Scalability**: Add new product types/categories in one place

## Utility Functions Location

**File:** `/app/src/utils/categoriesConfig.ts`

Available utilities:
- `isOnSale(product)` - Checks if product.sale === true
- `isFeaturedProduct(product)` - Checks if product.featured === true
- `isLightbaseProduct(product)` - Checks if product is a light base
- `isKeychainOrNecklace(product)` - Checks product name
- `isOrnament(product)` - Checks product name
- `isHeartShape(product)` - Checks product name
- `filterProductsByCategory(products, category)` - Filters array by category

## Usage Across Components

### Components Now Using Shared Logic:
1. **Products Page** (`/app/src/app/products/page.tsx`)
   - Filtering products by category
   - Counting products by type
   - Breadcrumb generation

2. **ProductCard** (`/app/src/components/ProductCard.tsx`)
   - Displaying sale badges
   - Showing featured badges
   - Conditional "Add to Cart" vs "Customize"

3. **ProductDetailClient** (`/app/src/components/ProductDetailClient.tsx`)
   - Uses `product.sale` directly for pricing calculations
   - No separate utility needed (just checks the property)

## Future Additions

To add new product type logic:

1. Add function to `categoriesConfig.ts`:
```typescript
export const isNewType = (product: any): boolean => {
  return product?.newProperty === true
}
```

2. Import and use in any component:
```typescript
import { isNewType } from '@/utils/categoriesConfig'
const newType = isNewType(product)
```

## Testing

✅ Build succeeds with no errors
✅ ProductCard imports shared utilities
✅ Logic consistent across all components
✅ No duplicate code
