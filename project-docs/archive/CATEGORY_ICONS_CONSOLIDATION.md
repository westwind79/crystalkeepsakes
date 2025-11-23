# Category Icons Consolidation

## Problem
Category icons were hardcoded inline in the products page component, making them:
- Not reusable across components
- Difficult to maintain (change icons in one place only)
- Inconsistent if used elsewhere
- Part of component logic instead of data configuration

## Solution
Moved category icons to the centralized configuration file where all category data lives.

## Changes Made

### 1. Added to categoriesConfig.ts

**New Exports:**
```typescript
// Icon mapping object
export const CATEGORY_ICONS: Record<string, string> = {
  'anniversary': '🥳',
  'baby': '👨‍❤️‍💋‍👨',
  'birthday': '🎂',
  'featured': '⭐',
  '3d-crystals': '🔮',
  '2d-crystals': '💎',
  'keychains-necklaces': '🔑',
  'ornaments': '🎄',
  'heart-shapes': '❤️',
  'memorial': '🕊️',
  'pet': '🐾',
  'custom': '⚙️',
  'sale': '💰',
  'wedding': '💍',
  'holiday': '🎀',
  'retirement': '💼',
  'graduation': '🎉',
  'lightbases': '🌟'
}

// Helper function with fallback
export const getCategoryIcon = (categoryValue: string): string => {
  return CATEGORY_ICONS[categoryValue] || '🛍️'
}
```

### 2. Updated Products Page

**Before:**
```typescript
const categoryIcons = {
  'anniversary': '🥳',
  'baby': '👨‍❤️‍💋‍👨',
  // ... 15+ more lines
}

<span className="text-lg">{categoryIcons[category.value] || '🛍️'}</span>
```

**After:**
```typescript
import { getCategoryIcon } from '@/utils/categoriesConfig'

<span className="text-lg">{getCategoryIcon(category.value)}</span>
```

**Lines Removed:** ~20 lines of inline object definition

## Benefits

✅ **Single Source of Truth**: All category data (labels, icons, paths) in one place
✅ **Reusable**: Any component can now display category icons
✅ **Maintainable**: Change icon in one place, applies everywhere
✅ **Type-Safe**: TypeScript Record type ensures consistency
✅ **Default Fallback**: Returns 🛍️ if icon not found
✅ **Cleaner Components**: Less clutter, more focused on UI logic

## Usage

### Get a Category Icon:
```typescript
import { getCategoryIcon } from '@/utils/categoriesConfig'

const icon = getCategoryIcon('wedding') // Returns '💍'
const icon = getCategoryIcon('unknown') // Returns '🛍️' (default)
```

### Access All Icons:
```typescript
import { CATEGORY_ICONS } from '@/utils/categoriesConfig'

Object.entries(CATEGORY_ICONS).forEach(([key, icon]) => {
  console.log(`${key}: ${icon}`)
})
```

## File Structure

```
/app/src/utils/categoriesConfig.ts
├── CATEGORY_ICONS          - Icon mapping object
├── getCategoryIcon()       - Helper function with fallback
├── PRODUCT_CATEGORIES      - Category definitions
├── isOnSale()             - Product status checks
├── isFeaturedProduct()
├── isLightbaseProduct()
└── filterProductsByCategory() - Filtering logic
```

## Future Use Cases

Now that icons are centralized, they can be used in:

1. **Breadcrumbs**: Show icon next to category name
   ```typescript
   {getCategoryIcon(category)} {categoryName}
   ```

2. **Product Cards**: Add category badge with icon
   ```typescript
   <span>{getCategoryIcon(product.category)}</span>
   ```

3. **Admin Panel**: Display icons in category selector
   ```typescript
   <option value={cat}>{getCategoryIcon(cat)} {catLabel}</option>
   ```

4. **Navigation Menus**: Category links with icons
   ```typescript
   {categories.map(cat => (
     <Link>{getCategoryIcon(cat.value)} {cat.label}</Link>
   ))}
   ```

## Adding New Categories

To add a new category with icon:

1. Add to `CATEGORY_ICONS`:
```typescript
export const CATEGORY_ICONS: Record<string, string> = {
  // ... existing icons
  'newcategory': '🆕',
}
```

2. Add to `PRODUCT_CATEGORIES`:
```typescript
{
  value: 'newcategory',
  label: 'New Category',
  description: 'Description here',
  path: '/products?category=newcategory',
}
```

Done! Icon will automatically appear everywhere it's used.

## Testing

✅ Build succeeds with no errors
✅ Products page uses shared icon function
✅ Default fallback works (🛍️ for unknown categories)
✅ Type-safe with TypeScript Record type
✅ ~20 lines removed from products page
