# Stripe Shipping & Coupon Code Setup Guide

## Overview
This guide explains how to set up Stripe shipping rates and coupon codes for your Crystal Keepsakes store.

---

## Part 1: Stripe Dashboard Configuration

### Step 1: Create Shipping Rates

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/shipping-rates

2. **Click "Create shipping rate"**

3. **Add shipping options:**

**Standard Shipping:**
- Name: `Standard Shipping`
- Price: `$5.00` USD
- Delivery time: `5-7 business days`
- Active: ✓

**Express Shipping:**
- Name: `Express Shipping`  
- Price: `$15.00` USD
- Delivery time: `2-3 business days`
- Active: ✓

**Free Shipping:**
- Name: `Free Shipping (Orders over $100)`
- Price: `$0.00` USD
- Delivery time: `5-7 business days`
- Active: ✓

4. **Save each rate** and copy the shipping rate ID (e.g., `shr_...`)

---

### Step 2: Create Coupon Codes

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/coupons

2. **Click "Create coupon"**

**Example Coupons:**

**10% Off:**
- ID: `SAVE10`
- Discount: `10%` off
- Duration: `Once` or `Forever`
- Active: ✓

**$20 Off:**
- ID: `SAVE20`
- Discount: `$20.00` off
- Minimum amount: `$100.00`
- Duration: `Once`
- Active: ✓

**Free Shipping:**
- ID: `FREESHIP`
- Discount: `$5.00` off (shipping cost)
- Duration: `Once`
- Active: ✓

3. **Enable Promotion Codes:**
   - Click on coupon
   - Create promotion code
   - Code: `SAVE10` (customer-facing code)
   - Active: ✓

---

## Part 2: Automatic Tax (Optional)

1. **Go to:** https://dashboard.stripe.com/settings/tax
2. **Enable Stripe Tax**
3. **Configure:**
   - Select US states to collect tax
   - Add business address
   - Enable automatic calculation

**Note:** Stripe Tax costs 0.5% per transaction

---

## Part 3: Integration Code

### Frontend: Add Coupon Input

The checkout page will show:
```
┌──────────────────────────────┐
│ Have a coupon code?          │
│ [Enter code...] [Apply]      │
│ ✓ Code SAVE10 applied! (-10%)│
└──────────────────────────────┘
```

### Backend: Calculate with Stripe API

PHP will:
1. Create customer with shipping address
2. Apply promotion code if provided
3. Get shipping rates for address
4. Calculate tax automatically
5. Return total with breakdown

---

## Part 4: Shipping Rate IDs

After creating shipping rates in Stripe Dashboard, update your code with the IDs:

**In `.env` file:**
```env
STRIPE_SHIPPING_STANDARD=shr_xxxxxxxxxxxxx
STRIPE_SHIPPING_EXPRESS=shr_xxxxxxxxxxxxx
STRIPE_SHIPPING_FREE=shr_xxxxxxxxxxxxx
```

**How to get IDs:**
1. Go to https://dashboard.stripe.com/shipping-rates
2. Click on each rate
3. Copy the ID (starts with `shr_`)

---

## Part 5: Testing

### Test Coupon Codes:
```
SAVE10    → 10% off
SAVE20    → $20 off orders $100+
FREESHIP  → Free shipping
```

### Test Shipping:
1. Add items to cart ($50 subtotal)
2. Go to checkout
3. Enter shipping address
4. See shipping options:
   - Standard: $5.00
   - Express: $15.00
   - Free: (only if subtotal > $100)

### Test Tax:
1. Enter shipping address in tax-enabled state (CA, NY, TX)
2. See automatic tax calculation
3. Total updates with tax included

---

## Part 6: Order Flow with Shipping & Coupons

```
1. Customer adds items → Subtotal: $150

2. Goes to checkout
   ├─ Enters shipping address
   └─ Selects shipping option: Standard ($5)

3. Enters coupon code: SAVE10
   ├─ Discount applied: -$15 (10% off)
   └─ New subtotal: $135

4. Automatic tax calculated
   └─ Tax (CA 9.5%): $12.83

5. FINAL TOTAL
   Subtotal:  $150.00
   Discount:  -$15.00 (SAVE10)
   Shipping:   $5.00 (Standard)
   Tax:       $12.83
   ──────────────────
   TOTAL:    $152.83
```

---

## Part 7: Customer Experience

**Before checkout:**
- Browse products
- Add to cart
- See subtotal only

**At checkout:**
1. Enter shipping address
   → Stripe calculates shipping options
   
2. Select shipping method
   → Total updates with shipping cost
   
3. (Optional) Enter coupon code
   → Discount applied, total recalculates
   
4. Stripe calculates tax
   → Final total displayed
   
5. Enter payment details
   → Complete purchase

---

## Part 8: Stripe Dashboard Views

### After Purchase:

**Payment Intent shows:**
- Amount: $152.83
- Metadata:
  - order_number: ORD-123
  - coupon_code: SAVE10
  - shipping_rate: shr_standard
  - customer_email: customer@email.com
  
**Customer profile shows:**
- Name: John Doe
- Email: john@example.com
- Shipping address: Complete address
- Order history: All purchases

---

## Benefits:

1. **Stripe Manages Rates** 
   - Update prices in dashboard (no code changes)
   - Add/remove options easily
   - Track which rates are most popular

2. **Coupon Tracking**
   - See which codes are used
   - Revenue impact reports
   - Limit usage (one-time, multiple)

3. **Automatic Tax**
   - Compliance with state laws
   - Accurate calculations
   - Automatic remittance (optional)

4. **Better Customer Experience**
   - Clear pricing breakdown
   - Multiple shipping options
   - Working discount codes

5. **Order Management**
   - All data in Stripe
   - Customer profiles
   - Shipping addresses saved
   - Easy refunds/adjustments

---

## Next Steps:

1. **Create shipping rates** in Stripe Dashboard
2. **Create coupon codes** in Stripe Dashboard  
3. **Update .env** with shipping rate IDs
4. **Test checkout flow** end-to-end
5. **(Optional) Enable Stripe Tax**

---

## Support Links:

- Shipping rates: https://stripe.com/docs/payments/checkout/shipping
- Promotion codes: https://stripe.com/docs/billing/subscriptions/coupons
- Tax calculation: https://stripe.com/docs/tax
- Test cards: https://stripe.com/docs/testing
