# Pricing and Sale Logic - Fixed

## The Problem

Products with both **sizes** and **sale prices** were displaying incorrect prices. The logic was using the `salePrice` as the base price even when a size with its own price was selected.

### Example Issue:
**Product: Cut Corner Diamond**
- `basePrice`: 24.75
- `sale`: true
- `salePrice`: 21
- Sizes:
  - Small (5x5cm): $35
  - Medium (6x6cm): $45
  - Large (8x8cm): $55

**Problem:** When a user selected the Medium size ($45), the system was showing $21 (the salePrice) instead of $45.

---

## The Fix

### Pricing Logic Rules:

1. **Products WITH Sizes:**
   - Use the selected size's price
   - Ignore `salePrice` field (sizes already have correct pricing)
   - Add any options (lightbase, background, text) on top

2. **Products WITHOUT Sizes:**
   - Use `salePrice` if `sale: true` and `salePrice` exists
   - Otherwise use `basePrice`
   - Add any options on top

### Updated Code Logic:

```javascript
const calculateTotal = (): number => {
  // Get the base price from selected size or product basePrice
  let basePrice = selectedSize?.price || product?.basePrice || 0
  
  // Apply sale price ONLY if product doesn't have sizes
  if (product?.sale && product?.salePrice && !selectedSize) {
    basePrice = product.salePrice
  }
  
  let total = basePrice
  if (selectedLightBase?.price) total += selectedLightBase.price
  if (selectedBackground?.price) total += selectedBackground.price
  if (showCustomText && textOption?.price) total += textOption.price
  
  return total * quantity
}
```

---

## Pricing Display

### Product Cards (ProductCard.tsx)
Shows sale pricing for products without sizes:
- Sale price in green
- Original price with strikethrough
- "Sale" badge

### Product Detail Page (ProductDetailClient.tsx)
Shows appropriate pricing based on configuration:
- If product has sizes: Shows size price (no sale discount display)
- If product is on sale without sizes: Shows sale price with savings badge

---

## Data Structure

### Product with NO Sizes (on sale):
```json
{
  "id": "001",
  "name": "Simple Crystal",
  "basePrice": 99,
  "sale": true,
  "salePrice": 45,
  "sizes": []  // Empty or undefined
}
```
**Display:** $45 (was $99) - Save 55%

### Product WITH Sizes (on sale):
```json
{
  "id": "104",
  "name": "Cut Corner Diamond",
  "basePrice": 24.75,
  "sale": true,
  "salePrice": 21,  // IGNORED when sizes exist
  "sizes": [
    { "id": "202", "name": "Small (5x5cm)", "price": 35 },
    { "id": "549", "name": "Medium (6x6cm)", "price": 45 },
    { "id": "550", "name": "Large (8x8cm)", "price": 55 }
  ]
}
```
**Display:** $45 (for Medium size selected)

---

## Testing Checklist

### Test Case 1: Product with Sizes (on sale)
- [ ] Navigate to product with sizes (e.g., Cut Corner Diamond)
- [ ] Select different sizes
- [ ] Price should change to reflect the SIZE price (not salePrice)
- [ ] Add to cart
- [ ] Cart should show correct size price

### Test Case 2: Product without Sizes (on sale)
- [ ] Navigate to product without sizes (e.g., Laser Engraving)
- [ ] Price should show salePrice with strikethrough on basePrice
- [ ] Add to cart
- [ ] Cart should show sale price

### Test Case 3: Product with Options
- [ ] Select lightbase ($25)
- [ ] Select background option
- [ ] Add custom text ($9.50)
- [ ] Total should be: (size or base price) + lightbase + background + text
- [ ] Verify in cart

### Test Case 4: Quantity Changes
- [ ] Change quantity to 2
- [ ] Total should be: (base + options) × quantity
- [ ] Verify in cart

---

## Admin Panel Notes

When setting up products in the admin panel:

### For Products with Multiple Sizes:
- Set `basePrice` to the lowest size price (for reference)
- Define each size with its own price
- If marking as "on sale", the `salePrice` will be ignored in favor of size prices
- Consider this for future: Maybe remove sale flag for products with sizes, OR allow per-size sale prices

### For Single Products:
- Set `basePrice` to the regular price
- If on sale, set `salePrice` to the discounted price
- The system will automatically show the discount percentage

---

## Future Enhancements

Consider implementing:
1. **Per-Size Sale Pricing**: Allow each size to have its own sale price
2. **Percentage Discounts**: Instead of fixed salePrice, use discount percentage
3. **Tiered Pricing**: Discounts based on quantity
4. **Coupon Codes**: Additional discounts at checkout
5. **Bundle Pricing**: Discounts for buying multiple items together

---

## Files Modified
- `/app/src/components/ProductDetailClient.tsx` - Fixed calculateTotal() logic
- `/app/src/components/ProductCard.tsx` - Already correct (shows basePrice vs salePrice)

## Status
✅ Fixed - Ready for testing
