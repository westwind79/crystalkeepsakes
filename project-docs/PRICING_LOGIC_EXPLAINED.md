# Pricing Logic - Complete Guide

## Two Types of Sale Pricing

### 1. Percentage Discount (`salePercent`)
**How it works:** Applies percentage off to all prices
- Works for both single-price and multi-size products
- Example: 20% off

**Single-price product:**
- Base: $100
- Sale Percent: 20%
- **Result:** $80

**Multi-size product:**
- Sizes: $45, $55, $85
- Sale Percent: 20%
- **Result:** $36, $44, $68

---

### 2. Fixed Dollar Amount (`salePrice`)
**How it works:** Different behavior based on product type

#### For Products WITH Sizes:
`salePrice` = **DISCOUNT AMOUNT** (subtracted from each size)

**Example:**
- Sizes: $45, $55, $85
- Sale Price: $30 (means "$30 off each")
- **Result:** $15, $25, $55

#### For Products WITHOUT Sizes:
`salePrice` = **FINAL PRICE** (what customer pays)

**Example:**
- Base: $100
- Sale Price: $75
- **Result:** $75 (not $100 - $75 = $25)

---

## Priority System

When BOTH are set, system uses:
1. **Priority 1:** `salePrice` (if > 0)
2. **Priority 2:** `salePercent` (if > 0)

Admin panel ensures only one is set at a time (setting one clears the other).

---

## Admin Panel Guide

### Product WITH Sizes (e.g., Cut Corner Diamond)

**Scenario:** Original sizes are $45, $55, $85. You want $30 off each.

**Admin Panel Settings:**
- ✅ Check "On Sale"
- Leave "Sale Percentage" blank
- Enter "Dollar Discount": `30`
- Click "Save Products"

**Result:**
- Customer sees: $15, $25, $55
- Savings shown: "$30 off"

### Product WITHOUT Sizes (e.g., Light Base)

**Scenario:** Original price $100. Sale price should be $75.

**Admin Panel Settings:**
- ✅ Check "On Sale"
- Leave "Sale Percentage" blank
- Enter "Fixed Sale Price": `75`
- Click "Save Products"

**Result:**
- Customer sees: ~~$100~~ → $75
- Savings shown: "$25 (25% off)"

---

## Where Pricing is Calculated

### 1. Product Cards (Listing Page)
File: `/src/components/ProductCard.tsx`
- Shows price range for multi-size products
- Applies sale logic for preview

### 2. Product Detail Page
File: `/src/components/ProductDetailClient.tsx`
- Recalculates when size is selected
- Adds customization costs (lightbase, text, etc.)

### 3. Cart
File: `/src/lib/cartUtils-2.ts`
- Stores final price paid
- Includes all customizations

### 4. Admin Panel Preview
File: `/src/app/admin/products/page.tsx`
- Shows what customer will see
- Different labels for size vs no-size products

---

## Testing Your Changes

### Step 1: Edit Product
1. Go to `/admin/products`
2. Select "Cut Corner Diamond"
3. Verify sizes: $45, $55, $85

### Step 2: Set $30 Discount
1. Check "On Sale"
2. Enter "Dollar Discount": `30`
3. Preview should show: "Discount Amount: -$30.00"
4. Click "Save Products"

### Step 3: Verify Frontend
1. Go to `/products`
2. Find "Cut Corner Diamond"
3. Should show: "$15.00 - $55.00" with "SALE" badge
4. Click product → Detail page
5. Select each size:
   - Small: $15
   - Medium: $25  
   - Large: $55

### Step 4: Test Cart
1. Add to cart with size "Large"
2. Cart should show: $55 (not $85)

---

## Common Mistakes

❌ **Mistake 1:** Entering discount amount for no-size products
- Product: Light Base (no sizes)
- You enter: Sale Price = $10 (thinking "$10 off")
- Customer sees: $10 (not $90)

✅ **Fix:** For no-size products, enter the FINAL price ($90)

❌ **Mistake 2:** Mixing percentage and fixed price
- You set: 20% off AND $30 off
- System uses: Only $30 off (percentage ignored)

✅ **Fix:** Use only ONE sale method

❌ **Mistake 3:** Not clicking "Save Products"
- Changes in admin panel don't appear on site

✅ **Fix:** Always click "Save Products" after editing

---

## Order Data (for Cockpit3D)

Each cart item stores:
```json
{
  "productId": "104",
  "productName": "Cut Corner Diamond",
  "size": "Large",
  "basePrice": 85,
  "saleDiscount": 30,
  "finalPrice": 55,
  "quantity": 1
}
```

This data is sent to:
1. Order confirmation email
2. Cockpit3D API (when available)
3. Stripe checkout

---

## Files Modified

1. `/src/components/ProductCard.tsx` - Price display on listing
2. `/src/components/ProductDetailClient.tsx` - Price calculation on detail page
3. `/src/app/admin/products/page.tsx` - Admin labels and preview
4. This document for reference

---

## Quick Reference

| Product Type | salePrice Meaning | Example |
|-------------|-------------------|---------|
| **With Sizes** | Discount amount (subtract from each) | $30 off → sizes $45, $55, $85 become $15, $25, $55 |
| **No Sizes** | Final sale price (what customer pays) | $75 → customer pays $75 (was $100) |

| Priority | Field | Applies To |
|---------|-------|-----------|
| 1st | `salePrice` | All products |
| 2nd | `salePercent` | All products |
