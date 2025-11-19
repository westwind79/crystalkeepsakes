# Stripe Checkout Implementation Guide

## Overview
This document explains the complete Stripe Hosted Checkout implementation for Crystal Keepsakes, including shipping rates, coupon codes, and proper checkout flow.

---

## ✅ What's Been Implemented

### 1. **Cart Page Improvements**
- **File:** `/app/src/app/cart/page.tsx`
- **Custom Text Display:** Fixed to show two separate lines (Line 1 and Line 2) with proper pricing
- **Checkout Button:** Now redirects to Stripe Hosted Checkout flow

### 2. **Stripe Hosted Checkout Flow**
- **File:** `/app/src/app/checkout-hosted/page.tsx`
- **Purpose:** Initiates Stripe Checkout Session and redirects customer to Stripe's hosted checkout page
- **Features:**
  - Prepares cart data (strips large images)
  - Calls PHP backend to create checkout session
  - Redirects to Stripe's secure checkout page

### 3. **Order Confirmation Page**
- **File:** `/app/src/app/order-confirmation/page.tsx`
- **Purpose:** Success page after payment completion
- **Features:**
  - Verifies payment with session ID
  - Clears cart after successful order
  - Shows order confirmation details
  - Provides next steps information

### 4. **Backend Checkout Session Creator**
- **File:** `/app/api/stripe/create-checkout-session.php`
- **Already Configured With:**
  - ✅ Shipping address collection (US & Canada)
  - ✅ 5 shipping rate options
  - ✅ Automatic tax calculation
  - ✅ Promo code support
  - ✅ Order metadata tracking

---

## 🚀 Customer Checkout Flow

```
1. Customer adds items to cart
   ↓
2. Views cart with itemized breakdown
   ↓
3. Clicks "Proceed to Checkout"
   ↓
4. Redirects to /checkout-hosted
   ↓
5. PHP backend creates Stripe Checkout Session
   ↓
6. Redirects to Stripe's hosted checkout page
   ↓
7. Customer completes:
   - Enters shipping address
   - Selects shipping method (5 options)
   - Applies promo/coupon code (optional)
   - Enters payment details
   ↓
8. Stripe processes payment
   ↓
9. Redirects to /order-confirmation?session_id=xxx
   ↓
10. Cart cleared, order confirmed
```

---

## 💳 Stripe Features Available

### **Shipping Rates** (Already Configured)
The following shipping rates are configured in Stripe:

| Rate ID | Description | Speed |
|---------|-------------|-------|
| `shr_1RRRX82YE48VQlzYpcQsdaSE` | Express Shipping | 3-5 Business Days |
| `shr_1RRRZF2YE48VQlzY3XrqHEPm` | Standard Ground | 5-7 Days |
| `shr_1RRRZp2YE48VQlzYYqNzpUQj` | Economy Ground | 7-10 Days |
| `shr_1RRRaI2YE48VQlzYUG3v8RPf` | Slow Ground | 10-14 Days |
| `shr_1RRRbE2YE48VQlzYypBEVG4V` | Postal Service | 3-4 Weeks |

### **Coupon/Promo Codes**
- **Status:** ✅ Enabled
- **Configuration:** `allow_promotion_codes: true` in PHP file
- **How to Use:**
  1. Go to Stripe Dashboard → Products → Coupons
  2. Create promotion codes (e.g., "SUMMER10" for 10% off)
  3. Customers can enter codes during checkout

### **Tax Calculation**
- **Status:** ✅ Enabled
- **Configuration:** `automatic_tax: enabled` in PHP file
- **How it Works:** Stripe automatically calculates tax based on shipping address

---

## 🔧 Configuration Files

### Cart Page
```typescript
// /app/src/app/cart/page.tsx
// Custom text displays as two separate lines with pricing
const getCustomTextDetails = (item: any): {line1: string, line2: string, price: number} | null

// Checkout redirects to hosted checkout
async function proceedToCheckout() {
  window.location.href = '/checkout-hosted'
}
```

### Checkout Hosted Page
```typescript
// /app/src/app/checkout-hosted/page.tsx
// Creates Stripe Checkout Session via PHP backend
const response = await fetch('/api/stripe/create-checkout-session.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cartItems: cartForCheckout,
    subtotal: subtotal,
    orderNumber: `CK-${Date.now()}`
  })
})
```

### PHP Backend
```php
// /app/api/stripe/create-checkout-session.php
$sessionParams = [
  'line_items' => $lineItems,
  'mode' => 'payment',
  'success_url' => $successUrl,
  'cancel_url' => $cancelUrl,
  'shipping_address_collection' => [
    'allowed_countries' => ['US', 'CA'],
  ],
  'shipping_options' => [
    ['shipping_rate' => 'shr_1RRRX82YE48VQlzYpcQsdaSE'],
    // ... 4 more shipping rates
  ],
  'allow_promotion_codes' => true,
  'automatic_tax' => ['enabled' => true],
];
```

---

## 🧪 Testing

### Test Cards (Stripe Test Mode)
- **Successful payment:** `4242 4242 4242 4242`
- **Declined payment:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

### Test Flow
1. Add items to cart
2. Click "Proceed to Checkout"
3. Should redirect to `/checkout-hosted`
4. Should redirect to Stripe's checkout page
5. Enter test card details
6. Complete payment
7. Should redirect to `/order-confirmation?session_id=xxx`
8. Cart should be cleared

---

## 📝 Next Steps for Production

### 1. **Create Promotion Codes in Stripe Dashboard**
   - Go to: https://dashboard.stripe.com/coupons
   - Create coupons (e.g., percentage off, fixed amount)
   - Create promotion codes linked to coupons
   - Customers can enter these codes at checkout

### 2. **Verify Shipping Rates**
   - Go to: https://dashboard.stripe.com/shipping-rates
   - Ensure all 5 shipping rates are properly configured
   - Update rates in PHP file if needed

### 3. **Enable Tax Calculation**
   - Go to: https://dashboard.stripe.com/settings/tax
   - Configure tax settings for your business
   - Automatic tax is already enabled in code

### 4. **Set Up Webhooks** (Optional but Recommended)
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Listen for: `checkout.session.completed`
   - Use webhook to send order to Cockpit3D, send confirmation emails, etc.

### 5. **Update Environment Variables**
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx (for production)
   STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_xxxxx (for testing)
   NEXT_PUBLIC_ENV_MODE=production (or development)
   ```

---

## 🐛 Troubleshooting

### Issue: Checkout button doesn't redirect
- **Check:** Browser console for errors
- **Verify:** Cart has items
- **Solution:** Clear browser cache and localStorage

### Issue: Can't enter promo code on Stripe checkout
- **Check:** `allow_promotion_codes: true` in PHP file (line 213)
- **Verify:** Promotion codes exist in Stripe Dashboard
- **Solution:** Create promotion codes in Stripe Dashboard

### Issue: Shipping rates not showing
- **Check:** Shipping rate IDs in PHP file (lines 202-206)
- **Verify:** Rates exist in Stripe Dashboard
- **Solution:** Update rate IDs or create missing rates

### Issue: Tax not calculating
- **Check:** Tax settings in Stripe Dashboard
- **Verify:** `automatic_tax: enabled` in PHP file (line 217)
- **Solution:** Configure tax settings in Stripe Dashboard

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Shipping Rates Guide](https://stripe.com/docs/payments/checkout/shipping)
- [Promotion Codes Guide](https://stripe.com/docs/billing/subscriptions/coupons)
- [Tax Calculation Guide](https://stripe.com/docs/tax)

---

## 🎯 Summary

✅ **Custom text pricing fixed** - Shows proper price, not "Included"  
✅ **Two separate lines displayed** - Line 1 and Line 2 shown individually  
✅ **Stripe Hosted Checkout** - Full checkout on Stripe's secure page  
✅ **5 shipping options** - Customer can choose shipping method  
✅ **Coupon support** - Customers can apply promo codes  
✅ **Automatic tax** - Tax calculated based on shipping address  
✅ **Order confirmation** - Success page with order details  

**The checkout process is now production-ready! 🚀**
