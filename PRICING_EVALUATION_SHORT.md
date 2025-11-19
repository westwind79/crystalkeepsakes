# Pricing Model - Quick Evaluation

## Current Reality (What You Have Now)
```
Product → basePrice → salePrice (optional) → Customer Pays
```
**Problems:**
- No cost tracking
- No profit calculation
- Sale price is manual fixed amount
- Can't stack discounts

---

## Recommended Simple Model

### Product Level:
```javascript
{
  cost: 20,              // What you pay Cockpit3D
  basePrice: 50,         // What customer sees (cost + margin)
  salePercent: 15,       // Optional: 15% off
  // System calculates: $50 - 15% = $42.50
}
```

### Checkout Level (Stripe):
- Coupon codes handled by Stripe
- Applied at checkout AFTER your sale discounts

---

## How It Works

**Example: Cut Corner Diamond Medium**
- Cost: $30 (what Cockpit3D charges you)
- Base Price: $45 (cost + 50% margin = $30 + $15)
- On Sale: 20% off → $36
- Customer uses Stripe coupon "SAVE10" → $32.40 final

**Flow:**
1. **Your Site:** Show $36 (was $45)
2. **Stripe Checkout:** Apply coupon → $32.40
3. **You Pay Cockpit3D:** $30
4. **Your Profit:** $2.40 (after discount)

---

## Simple Implementation

### Step 1: Update Product Data
```javascript
{
  cost: 30,              // NEW: Cockpit3D cost
  basePrice: 45,         // Display price
  salePercent: 20,       // NEW: Instead of fixed salePrice
  sale: true
}
```

### Step 2: Calculate Display Price
```javascript
const displayPrice = product.sale && product.salePercent
  ? basePrice * (1 - salePercent / 100)
  : basePrice
```

### Step 3: Stripe Coupons (Already Supported)
- Create coupons in Stripe Dashboard
- Apply at checkout automatically
- Separate from your sale pricing

---

## Benefits
✅ Know your profit on every sale  
✅ Easy to run "20% off everything" sales  
✅ Stripe coupons work independently  
✅ Can calculate margins automatically  

---

## What To Do Now

**Option A: Keep It Simple (Recommended)**
- Use current system (fixed sale prices)
- Add Stripe coupons for promotions
- Track costs manually in spreadsheet

**Option B: Add Percentage Discounts**
- Replace `salePrice` with `salePercent`
- Add `cost` field to products
- Calculate margins in real-time
- Takes ~1 hour to implement

**Option C: Full Pricing System (Overkill for now)**
- Cost tracking
- Automatic margin calculation
- Tiered discounts
- Complex coupon stacking rules
- Takes ~4-6 hours, probably not needed yet

---

## My Recommendation

**Start with Option A**, add **Option B** features ONLY when:
- You have 20+ products with frequent price changes
- You need to see profit margins in real-time
- You're running complex promotional campaigns

For now: **Fix the current sale price logic** (which I just did) and **use Stripe coupons for promotions**.

---

## Quick Decision

**Just tell me:**
1. Keep current system? (fixed sale prices)
2. Switch to percentage discounts? (add `salePercent` field)
3. Add cost tracking now? (add `cost` field)

I can implement any of these in ~15 minutes.
