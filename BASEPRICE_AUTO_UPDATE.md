# Base Price = Smallest Size Price (Auto-Update)

## The Rule
For products WITH sizes, `basePrice` automatically equals the smallest enabled size price.

## Examples

### Product WITHOUT Sizes (e.g., Laser Engraving)
```json
{
  "basePrice": 99,
  "sizes": []
}
```
**Display:** $99 (manually set in admin)

### Product WITH Sizes (e.g., Cut Corner Diamond)
```json
{
  "basePrice": 35,  // AUTO-SET to smallest size
  "sizes": [
    { "name": "Small", "price": 35, "enabled": true },
    { "name": "Medium", "price": 45, "enabled": true },
    { "name": "Large", "price": 55, "enabled": true }
  ]
}
```
**Display on Products Page:** $35 - $55
**Display on Detail Page:** $35 (when Small selected), $45 (when Medium selected), etc.

## Admin Panel Changes

### Pricing Tab

**Base Price Field:**
- For products WITHOUT sizes: Editable
- For products WITH sizes: **Disabled** (shows auto-calculated value)

**Size Prices Section:**
- Shows all sizes with checkboxes and price inputs
- Blue hint: "💡 Base Price will auto-update to the smallest enabled size price"
- Live preview shows: "Auto-calculated Base Price: $35.00"

**When you change a size price:**
1. Type new price (e.g., change Small from $35 to $30)
2. basePrice instantly updates to $30
3. Products page will now show: $30 - $55

## How It Works (Technical)

### In `updateSize()` function:
```javascript
const updateSize = (productId, sizeIndex, updates) => {
  // Update the size
  sizes[sizeIndex] = { ...sizes[sizeIndex], ...updates }
  
  // Find smallest enabled size
  const enabledSizes = sizes.filter(s => s.enabled !== false)
  const minPrice = Math.min(...enabledSizes.map(s => s.price))
  
  // Auto-update basePrice
  updateProduct(productId, { sizes, basePrice: minPrice })
}
```

## Benefits

✅ **Consistency** - basePrice always reflects actual minimum price
✅ **No manual sync** - Can't forget to update basePrice when changing sizes
✅ **Accurate displays** - Product cards show correct starting price
✅ **Less confusion** - One source of truth for minimum price

## What About Sale Prices?

Sale discounts still apply as percentages:
```json
{
  "basePrice": 35,  // Auto-set from sizes
  "salePercent": 20,
  "sizes": [
    { "name": "Small", "price": 35 },  // Shows as $28 (20% off)
    { "name": "Medium", "price": 45 }, // Shows as $36 (20% off)
    { "name": "Large", "price": 55 }   // Shows as $44 (20% off)
  ]
}
```

Products page displays: ~~$35 - $55~~ **$28 - $44** (20% OFF)

## Edge Cases Handled

### All sizes disabled
- basePrice remains at last calculated value
- Warning should show: "No enabled sizes"

### Only one size
- basePrice = that size's price
- No range shown, just single price

### Sizes removed
- basePrice becomes manually editable again
- Keeps last value

## Files Modified
- `/app/src/app/admin/products/page.tsx` - Auto-update logic in `updateSize()`
- Admin UI - Shows auto-calculation hint and disables field for sized products

## Status
✅ Implemented and ready to test
