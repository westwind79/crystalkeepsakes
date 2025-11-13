# Custom Text Display - Debugging & Testing Guide

## What Was Fixed

### 1. ProductDetailClient.tsx - Data Structure
**Location:** `/app/src/components/ProductDetailClient.tsx` (lines 253-264)

**Before:**
```javascript
options.push({
  category: 'customText',
  value: `Line 1: ${customText.line1}\nLine 2: ${customText.line2}`, // ❌ Wrong format
  priceModifier: textOption?.price || 0
})
```

**After:**
```javascript
options.push({
  category: 'customText',
  optionId: 'custom-text',
  name: 'Custom Text',
  value: 'Custom Text Added',
  priceModifier: textOption?.price || 0,
  line1: customText.line1,  // ✅ Individual properties
  line2: customText.line2   // ✅ Individual properties
})
```

### 2. Cart Page - Display Function
**Location:** `/app/src/app/cart/page.tsx` (lines 183-220)

**Fixed:**
```javascript
const getCustomTextDetails = (item: any): {line1: string, line2: string, price: number} | null => {
  // Check in options array first
  if (Array.isArray(item.options)) {
    const textOption = item.options.find((opt: any) => opt.category === 'customText')
    if (textOption && (textOption.line1 || textOption.line2)) {
      return {
        line1: textOption.line1 || '',
        line2: textOption.line2 || '',
        price: textOption.priceModifier || 0
      }
    }
  }
  // ... fallback logic
}
```

### 3. Cart Page - HTML Display
**Location:** `/app/src/app/cart/page.tsx` (lines 387-405)

**Fixed to show two separate lines:**
```jsx
{customTextDetails && (
  <div className="flex justify-between items-start text-sm pt-2 border-t border-gray-300">
    <div className="flex-1">
      <strong className="text-gray-700">Custom Text:</strong>
      <div className="mt-1 space-y-1">
        {customTextDetails.line1 && (
          <p className="text-gray-600 italic">Line 1: "{customTextDetails.line1}"</p>
        )}
        {customTextDetails.line2 && (
          <p className="text-gray-600 italic">Line 2: "{customTextDetails.line2}"</p>
        )}
      </div>
    </div>
    <span className="text-gray-900 font-medium ml-3">
      +${customTextDetails.price.toFixed(2)}
    </span>
  </div>
)}
```

---

## How to Test Custom Text Display

### Step 1: Find Product with Custom Text Option
Not all products support custom text. Look for products with:
- `textOptions` array length > 1
- One option has `price > 0`

**Products confirmed to have custom text:**
- `static-product` (has custom text @ $9.50, but requires image upload)
- `static2` (check if this has custom text)

### Step 2: Add Product with Custom Text
1. Navigate to a product page with custom text option
2. Check the "Add Custom Text (+$X.XX)" checkbox
3. Fill in the text fields:
   - Line 1: Enter up to 30 characters
   - Line 2: Enter up to 30 characters
4. Complete other required options (size, image if needed)
5. Click "Add to cart"

### Step 3: Verify in Cart
1. Navigate to `/cart`
2. Look for "Configuration Details" section
3. Scroll down to see "Custom Text:" section
4. You should see:
   ```
   Custom Text:
   Line 1: "your text here"
   Line 2: "your text here"                    +$9.50
   ```

---

## Debugging Tips

### Issue: "No output" / Custom text not showing

**Check 1: Does product support custom text?**
```javascript
// Open browser console on product page
console.log(product.textOptions)
// Should show array with at least 2 items, one with price > 0
```

**Check 2: Is checkbox checked?**
- Checkbox must be checked for custom text fields to appear
- Checkbox label shows price: "Add Custom Text (+$9.50)"

**Check 3: Is text actually being saved?**
```javascript
// After adding to cart, check localStorage
const cart = JSON.parse(localStorage.getItem('cart') || '[]')
console.log(cart[0].options)
// Look for object with category: 'customText' containing line1 and line2
```

**Check 4: Cart page data structure**
```javascript
// On cart page, open console
console.log('Cart items:', cart)
// Expand each item → options → find customText category
// Should have: { category: 'customText', line1: '...', line2: '...', priceModifier: 9.5 }
```

---

## Expected Data Flow

### 1. Product Page → Adding to Cart
```
User enters text:
  Line 1: "John Smith"
  Line 2: "2024"
    ↓
buildProductOptions() creates:
  {
    category: 'customText',
    optionId: 'custom-text',
    name: 'Custom Text',
    value: 'Custom Text Added',
    priceModifier: 9.5,
    line1: "John Smith",
    line2: "2024"
  }
    ↓
Added to cart item's options array
```

### 2. Cart Page → Displaying
```
Cart loads item from localStorage
    ↓
getCustomTextDetails() finds option with category === 'customText'
    ↓
Extracts: line1, line2, priceModifier
    ↓
Returns: { line1: "John Smith", line2: "2024", price: 9.5 }
    ↓
HTML renders:
  Custom Text:
  Line 1: "John Smith"
  Line 2: "2024"              +$9.50
```

---

## Test Cases

### Test Case 1: Both Lines Filled
- **Input:** Line 1: "Anniversary", Line 2: "2024"
- **Expected Cart Display:**
  ```
  Custom Text:
  Line 1: "Anniversary"
  Line 2: "2024"                +$9.50
  ```

### Test Case 2: Only Line 1 Filled
- **Input:** Line 1: "Happy Birthday", Line 2: (empty)
- **Expected Cart Display:**
  ```
  Custom Text:
  Line 1: "Happy Birthday"      +$9.50
  ```

### Test Case 3: Only Line 2 Filled
- **Input:** Line 1: (empty), Line 2: "2024"
- **Expected Cart Display:**
  ```
  Custom Text:
  Line 2: "2024"                +$9.50
  ```

### Test Case 4: No Text (Checkbox Unchecked)
- **Expected:** No "Custom Text:" section in cart

---

## Common Issues & Solutions

### Issue: Price shows $0.00 instead of $9.50
**Cause:** textOption price not being found
**Solution:** Check product data has correct textOptions structure:
```javascript
"textOptions": [
  { "id": "none", "name": "No Text", "price": 0 },
  { "id": "customText", "name": "Custom Text", "price": 9.5 }  // ← Must have price
]
```

### Issue: Lines showing as "undefined"
**Cause:** line1/line2 not being passed correctly
**Solution:** Verify ProductDetailClient.tsx line 253-264 has the fix applied

### Issue: Custom text section not appearing at all
**Cause:** getCustomTextDetails() returning null
**Solution:** 
1. Check item.options array exists and has customText category
2. Verify at least one of line1 or line2 has content
3. Check browser console for errors

---

## Manual Test Script

```javascript
// Run in browser console on product page after filling custom text:

// 1. Check product has text options
console.log('Text Options:', product.textOptions)

// 2. Check state
console.log('Custom Text State:', { line1: customText.line1, line2: customText.line2 })

// 3. After adding to cart, check localStorage
const cart = JSON.parse(localStorage.getItem('cart') || '[]')
console.log('Cart Item Options:', cart[0]?.options)

// 4. Find custom text option
const textOpt = cart[0]?.options.find(o => o.category === 'customText')
console.log('Custom Text Option:', textOpt)

// Expected output:
// {
//   category: "customText",
//   optionId: "custom-text",
//   name: "Custom Text",
//   value: "Custom Text Added",
//   priceModifier: 9.5,
//   line1: "your text",
//   line2: "your text"
// }
```

---

## Summary

✅ **Fixed:** Custom text now stores line1 and line2 as separate properties  
✅ **Fixed:** Cart displays two separate lines with labels  
✅ **Fixed:** Price always shows actual cost (not "Included")  

**To verify the fix works:**
1. Use "static-product" or another product with textOptions
2. Enable custom text checkbox
3. Fill in Line 1 and/or Line 2  
4. Add to cart
5. View cart - should see both lines displayed with +$9.50 price
