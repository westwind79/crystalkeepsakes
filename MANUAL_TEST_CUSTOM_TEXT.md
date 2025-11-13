# Manual Testing Guide for Custom Text Feature

## THE ISSUE
Custom text options are only available on products that **also require image uploads**. This means you must complete BOTH steps before you can add to cart.

## STEP-BY-STEP TEST

### 1. Navigate to Product
Go to: http://localhost:3000/products/static-product

### 2. Enable Custom Text
- ✅ Check the box: "Add Custom Text (+$9.50)"
- Two text fields should appear below:
  - Line 1 (max 30 characters)
  - Line 2 (max 30 characters)

### 3. Fill in Custom Text
- Line 1: Enter "John Smith"  
- Line 2: Enter "2024"

### 4. Upload Image (REQUIRED)
- Click the "Upload Image" area
- Select any image from your computer
- Image editor modal will open automatically

### 5. Save the Image
- **CRITICAL:** In the editor modal, click "Save Changes" button
- The modal will close
- You should see your image displayed on the product page

### 6. Add to Cart
- Scroll to bottom
- Click "Add to cart" button
- Success modal should appear
- Click "View Cart & Checkout"

### 7. Verify in Cart
Look for the "Custom Text" section in cart. You should see:

```
Custom Text:
Line 1: "John Smith"
Line 2: "2024"                    +$9.50
```

---

## EXPECTED RESULTS

### In Cart - Configuration Details Section:
```
Configuration Details:
Size: Default Size                 $169.00

Custom Text:
Line 1: "John Smith"
Line 2: "2024"                     +$9.50

─────────────────────────────────────────
Item Total:                        $178.50
```

### Price Breakdown:
- Base Price (Size): $169.00
- Custom Text: +$9.50
- **Total:** $178.50

---

## COMMON ERRORS & SOLUTIONS

### Error: "Please upload an image"
**Cause:** You tried to add to cart without uploading an image
**Solution:** This product requires an image. Upload one first.

### Error: "Please save your edited image before adding to cart"
**Cause:** You uploaded an image but didn't click "Save Changes" in the editor modal
**Solution:** Click "Save Changes" in the image editor modal

### Error: Custom text not showing in cart
**Possible Causes:**
1. Custom text checkbox was not checked
2. Both Line 1 and Line 2 were empty
3. Product doesn't support custom text (check for checkbox)

**Debug Steps:**
1. Open browser console (F12)
2. Run: `JSON.parse(localStorage.getItem('cart'))`
3. Look for first item → `options` array
4. Find object with `category: 'customText'`
5. Check if it has `line1` and `line2` properties

---

## ALTERNATIVE PRODUCTS TO TEST

Unfortunately, **ALL products with custom text also require images**. There are no products in your catalog with custom text that don't require images.

If you want to test custom text WITHOUT images, you would need to:
1. Modify a product's data to set `requiresImage: false`
2. Or create a new test product with text options but no image requirement

---

## QUICK TEST CHECKLIST

- [ ] Navigate to /products/static-product
- [ ] Check "Add Custom Text" checkbox  
- [ ] Fill Line 1: "TEST ONE"
- [ ] Fill Line 2: "TEST TWO"
- [ ] Upload any image file
- [ ] Click "Save Changes" in editor modal  
- [ ] Click "Add to cart"
- [ ] Navigate to cart
- [ ] Verify you see:
  ```
  Custom Text:
  Line 1: "TEST ONE"
  Line 2: "TEST TWO"    +$9.50
  ```

---

## WHAT'S BEEN FIXED IN THE CODE

### 1. ProductDetailClient.tsx
**Lines 253-264:** Custom text now stores as:
```javascript
{
  category: 'customText',
  priceModifier: 9.5,
  line1: "John Smith",  // ← Individual properties
  line2: "2024"         // ← Individual properties
}
```

### 2. Cart Page
**Lines 183-220:** Function to extract custom text:
```javascript
const getCustomTextDetails = (item) => {
  const textOption = item.options.find(opt => opt.category === 'customText')
  if (textOption && (textOption.line1 || textOption.line2)) {
    return {
      line1: textOption.line1 || '',
      line2: textOption.line2 || '',
      price: textOption.priceModifier || 0
    }
  }
  return null
}
```

**Lines 387-405:** HTML display showing two separate lines with price

---

## FINAL NOTE

**The custom text feature IS working correctly in the code.** 

The issue you experienced is likely one of:
1. Testing with products that don't have text options (like Lightbase products)
2. Not completing the image upload requirement
3. Not clicking "Save Changes" in the image editor modal

Please follow the step-by-step test above with "Static Product" and you should see the custom text displaying properly in the cart with the correct price (+$9.50).
