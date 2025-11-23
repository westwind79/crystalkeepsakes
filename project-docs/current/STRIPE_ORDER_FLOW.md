# Stripe Order Processing Flow
**Version:** 2.0.0  
**Date:** 2025-01-19  
**Status:** Production Ready

## Overview
Crystal Keepsakes uses **Stripe Checkout (Hosted)** for payment processing. This means customers are redirected to Stripe's secure checkout page, and Stripe handles all payment, shipping, and tax calculations.

---

## Complete Order Flow

### 1. Customer Journey
```
Cart Page → Click "Proceed to Checkout" 
  ↓
/checkout page (loads)
  ↓
Frontend creates Stripe Checkout Session via PHP
  ↓
Redirects to Stripe's hosted checkout page
  ↓
Customer enters payment, shipping info
  ↓
Stripe processes payment
  ↓
Redirects back to /order-confirmation?session_id=xxx
```

### 2. Backend Processing (Webhook)
```
Stripe Payment Success
  ↓
Stripe sends webhook to /api/stripe/stripe-webhook.php
  ↓
Webhook verifies signature
  ↓
Retrieves full session details (items, customer, shipping)
  ↓
Builds Cockpit3D order payload
  ↓
Sends to Cockpit3D API (optional - can be disabled for manual review)
  ↓
Saves order to database (optional)
  ↓
Sends order confirmation email
```

---

## Key Files

### Frontend
- **`/src/app/checkout/page.tsx`** - Initiates Stripe Checkout Session
- **`/src/app/order-confirmation/page.tsx`** - Displays order confirmation
- **`/src/lib/stripe.ts`** - Stripe client utilities

### Backend (PHP)
- **`/api/stripe/create-checkout-session.php`** - Creates Stripe Checkout Session
- **`/api/stripe/stripe-webhook.php`** - Handles payment success webhooks
- **`/api/stripe/db-connect.php`** - Database connection (optional)

### API Routes (Next.js)
- **`/src/app/api/process-order/route.ts`** - Order processing API
- **`/src/app/api/order-email/route.ts`** - Email notifications

### Utilities
- **`/src/lib/cockpit3d-order-builder.ts`** - Builds Cockpit3D order payloads
- **`/src/utils/logger.ts`** - Environment-aware logging

---

## Payment Intent vs Checkout Session

### ❌ Payment Intent (NOT USED)
- Payment happens ON your website
- You collect card details
- You're responsible for PCI compliance
- More control but more liability

### ✅ Checkout Session (CURRENT SETUP)
- Payment happens ON Stripe's website
- Stripe collects card details
- Stripe handles PCI compliance
- Less control but much safer

**Why we use Checkout Session:** You explicitly stated "I DO NOT want to be responsible for payments ON the website" - this is the correct approach!

---

## Environment Configuration

### Development (.env)
```bash
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_xxx
```

### Testing (.env.production.test)
```bash
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://https://crystalkeepsakes.com/test
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_xxx
```

### Production (.env.production)
```bash
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## Stripe Dashboard Configuration

### 1. Create Shipping Rates
Go to: **Stripe Dashboard → Products → Shipping rates**

Create these rates (already configured):
- `shr_1RRRX82YE48VQlzYpcQsdaSE` - 3-5 Business Days
- `shr_1RRRZF2YE48VQlzY3XrqHEPm` - 5-7 Ground Ship
- `shr_1RRRZp2YE48VQlzYYqNzpUQj` - 7-10 Ground Ship
- `shr_1RRRaI2YE48VQlzYUG3v8RPf` - 10-14 Ground Ship
- `shr_1RRRbE2YE48VQlzYypBEVG4V` - 3-4 Weeks Postal

### 2. Enable Automatic Tax
Go to: **Stripe Dashboard → Settings → Tax**
- Enable automatic tax calculation
- Configure tax jurisdictions (US, CA)

### 3. Configure Webhook
Go to: **Stripe Dashboard → Developers → Webhooks**

**Endpoint URL:**
```
https://crystalkeepsakes.com/api/stripe/stripe-webhook.php
```

**Events to listen for:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Get webhook secret** and add to `.env.production`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Cockpit3D Integration

### Current Status: Manual Review Mode
Orders are built and validated but NOT automatically sent to Cockpit3D. This allows you to:
1. Review order details
2. Verify customer images
3. Manually submit to Cockpit3D when ready

### Order Data Structure
The webhook builds a complete Cockpit3D order with:
- Customer information (name, email, phone)
- Shipping address
- Order items (SKU, quantity, price)
- Custom images (base64 encoded)
- Custom text (engraving)
- Order metadata

### Enabling Automatic Submission
When ready to auto-submit orders to Cockpit3D:

1. Verify credentials in `.env.production`:
```bash
COCKPIT3D_RETAIL_ID=your_retail_id
COCKPIT3D_USERNAME=your_email@example.com
COCKPIT3D_PASSWORD=your_api_token
```

2. The webhook is already configured to submit - just uncomment if disabled

3. Test first in testing environment

---

## Debugging Production Issues

### Issue: Debug logs showing in production
**Cause:** Direct `console.log()` calls bypass environment checks

**Fix Applied:**
- ✅ Replaced all `console.log()` with `logger.*()` calls
- ✅ Added `isDevelopment` check for debug UI components
- ✅ Logger respects `NEXT_PUBLIC_ENV_MODE` and only logs in dev/test

### Issue: Orders not processing
**Check these:**
1. Webhook endpoint is reachable: `https://crystalkeepsakes.com/api/stripe/stripe-webhook.php`
2. Webhook secret is correct in `.env.production`
3. Check webhook logs in Stripe Dashboard
4. Check server error logs: `/api/stripe/webhook_errors.log`

### Issue: Stripe redirecting to localhost
**Fix Applied:**
- ✅ Dynamic URL detection in `create-checkout-session.php`
- ✅ Checks `HTTP_ORIGIN` header first (most reliable)
- ✅ Fallbacks to `HTTP_REFERER` with subdirectory support
- ✅ Final fallback to environment-based detection

---

## Testing Checklist

### Local Development
- [ ] Cart adds items correctly
- [ ] Checkout redirects to Stripe test mode
- [ ] Can complete test payment (use 4242 4242 4242 4242)
- [ ] Redirects back to order confirmation
- [ ] Order confirmation shows correct details

### Test Environment (/test subdirectory)
- [ ] Checkout uses test Stripe keys
- [ ] Redirects to `/test/order-confirmation` (not root)
- [ ] Webhook receives events
- [ ] Order email sent

### Production
- [ ] Checkout uses LIVE Stripe keys
- [ ] No debug logs in browser console
- [ ] No debug UI components visible
- [ ] Webhook processes real payments
- [ ] Customer receives confirmation email
- [ ] Order appears in Stripe Dashboard
- [ ] Order ready for Cockpit3D submission

---

## API Endpoints Reference

### Create Checkout Session
**Endpoint:** `POST /api/stripe/create-checkout-session.php`

**Request:**
```json
{
  "cartItems": [
    {
      "name": "Crystal Heart",
      "sku": "CRYSTAL-HEART-M",
      "price": 89.99,
      "quantity": 1
    }
  ],
  "subtotal": 89.99,
  "orderNumber": "CK-1234567890",
  "customerEmail": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx",
  "order_number": "CK-1234567890"
}
```

### Webhook Handler
**Endpoint:** `POST /api/stripe/stripe-webhook.php`

**Headers:**
```
Stripe-Signature: t=xxx,v1=xxx
```

**Handles:**
- `checkout.session.completed` - Main order processing
- `payment_intent.succeeded` - Payment confirmation
- `payment_intent.payment_failed` - Payment failures

---

## Support & Troubleshooting

### Common Issues

**1. "Stripe publishable key not found"**
- Check `.env.production` has `NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY`
- Verify environment mode is set correctly
- Rebuild after changing env vars

**2. "Checkout session creation failed"**
- Check PHP backend URL is correct
- Verify API endpoint is accessible
- Check PHP error logs

**3. "Payment succeeded but no order email"**
- Check webhook is configured in Stripe
- Verify webhook secret matches
- Check email configuration (SMTP or PHP mail)

**4. "Order not sent to Cockpit3D"**
- Check Cockpit3D credentials
- Verify API endpoint is correct
- Check webhook logs for errors

### Getting Help
1. Check browser console (dev/test only)
2. Check server logs: `/api/stripe/*.log`
3. Check Stripe Dashboard → Events → Webhooks
4. Review this documentation

---

## Security Notes

### PCI Compliance
✅ **You are PCI compliant** because:
- Stripe handles all card data
- No card details touch your server
- Customer enters payment on Stripe's page

### Webhook Security
✅ **Webhooks are secure** because:
- Stripe signs every request
- Your webhook verifies the signature
- Invalid signatures are rejected

### Environment Separation
✅ **Test/Prod are isolated** because:
- Different API keys for each environment
- Different webhook endpoints
- Different database connections

---

## Maintenance & Updates

### Updating Stripe Library
```bash
composer update stripe/stripe-php
```

### Rotating API Keys
1. Generate new keys in Stripe Dashboard
2. Update `.env.production`
3. Restart services
4. Test thoroughly before fully switching

### Monitoring
- Check Stripe Dashboard daily for failed payments
- Monitor webhook success rate
- Review order processing logs weekly

---

## Future Enhancements

### Potential Improvements
- [ ] Add order tracking page
- [ ] Implement subscription/recurring payments
- [ ] Add gift card support
- [ ] Multi-currency support
- [ ] Save customer payment methods
- [ ] Automatic Cockpit3D submission (when ready)
- [ ] Admin dashboard for order management

---

## Related Documentation
- `COCKPIT3D_INTEGRATION.md` - Cockpit3D API details
- `PRODUCTION_DEPLOYMENT.md` - Deployment guide
- `PRICING_LOGIC_EXPLAINED.md` - Product pricing
- `SESSION_COMPLETE_V8.1.md` - Version history

**Last Updated:** 2025-01-19
**Maintained By:** Development Team
