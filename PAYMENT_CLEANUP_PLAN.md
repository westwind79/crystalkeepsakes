# Payment Process Cleanup & Environment Setup

## Current State Analysis

### ✅ What's Already Good:
- Debug panel exists (`EnhancedDebugOverlay.tsx`)
- Environment mode detection (`development`, `testing`, `production`)
- Database schema defined (orders, order_status_history, order_images)
- Stripe checkout flow working
- Image upload system functional

### ⚠️ What Needs Cleanup:
1. **Console.log debugging** scattered throughout checkout process
2. **Inline debug info** displayed on error screens
3. **Missing order structure viewer** in debug panel
4. **No environment-specific banners** for testing mode
5. **Email system** not configured
6. **Database integration** not connected
7. **No privacy policy** page
8. **No data retention** policy/automation

---

## Implementation Plan

### PHASE 1: Debug Panel Enhancement ✅

**Goal**: Move ALL logging to debug panel, add order structure viewer

**Tasks**:
1. Add "Order Structure" tab to EnhancedDebugOverlay
   - Show Cockpit3D order format
   - Show Stripe session data
   - Validate against requirements
   - Copy/export functionality

2. Create `debugLog()` utility function
   - Replaces all `console.log()`
   - Automatically sends to debug panel
   - Only logs when debug is enabled

3. Clean up checkout page
   - Remove inline debugging UI
   - Use `debugStep()` for all logging
   - Show simple user-friendly messages

**Files to Modify**:
- `/app/src/components/EnhancedDebugOverlay.tsx`
- `/app/src/app/checkout/page.tsx`
- Create: `/app/src/utils/debugUtils.ts`

---

### PHASE 2: Environment Setup & Testing Mode

**Goal**: Perfect 3-environment setup with proper isolation

#### Environment Configurations:

**1. LOCAL (Development)**
- **URL**: `http://localhost:3000` or `http://localhost:8888/crystalkeepsakes`
- **Stripe**: Test keys (sk_test_*, pk_test_*)
- **Debug Panel**: Always visible
- **Banner**: None
- **Emails**: Sent to console/file
- **Database**: Local MySQL
- **ENV**: `NEXT_PUBLIC_ENV_MODE=development`

**2. TESTING (Staging)**
- **URL**: `https://crystalkeepsakes.com/test`
- **Base Path**: `/test`
- **Stripe**: Test keys (sk_test_*, pk_test_*)
- **Debug Panel**: Always visible
- **Banner**: "🧪 TESTING MODE" at top (yellow)
- **Emails**: Real delivery, marked [TEST]
- **Database**: Test database (auto-cleanup after 30 days)
- **ENV**: `NEXT_PUBLIC_ENV_MODE=testing`
- **Important**: All links/redirects stay within `/test/`
- **Stripe Return**: `https://crystalkeepsakes.com/test/order-confirmation`

**3. PRODUCTION (Live)**
- **URL**: `https://crystalkeepsakes.com`
- **Stripe**: LIVE keys (sk_live_*, pk_live_*)
- **Debug Panel**: Only with `?debug=true` URL parameter
- **Banner**: None
- **Emails**: Real delivery
- **Database**: Production (retention per policy)
- **ENV**: `NEXT_PUBLIC_ENV_MODE=production`
- **Testing**: No test mode toggle (use TEST environment instead)

#### Implementation:
1. Create environment detection utility
2. Add testing banner component
3. Update all navigation to respect base path
4. Verify Stripe redirects correctly per environment
5. Add environment indicator in debug panel

**Files**:
- Create: `/app/src/utils/envConfig.ts`
- Create: `/app/src/components/TestingBanner.tsx`
- Modify: `/app/src/app/layout.tsx`

---

### PHASE 3: Database Integration

**Goal**: Store orders in MySQL database per schema

**Schema** (Already Defined):
- `orders` - Main order data
- `order_status_history` - Status change tracking
- `order_images` - Image metadata
- `contact_submissions` - Contact form (optional)

**Implementation**:
1. Create database connection utilities (PHP)
2. Create API endpoint: `/api/database/save-order.php`
3. Update Stripe webhook to save to database
4. Create order retrieval endpoints (for admin/tracking)
5. Add database health check to debug panel

**Flow**:
```
Checkout → Stripe Payment → Webhook → Save to DB
                                  ↓
                          Email Customer & Admin
```

**Files to Create**:
- `/app/api/database/db-config.php`
- `/app/api/database/save-order.php`
- `/app/api/database/get-order.php`
- `/app/api/database/cleanup-old-orders.php` (cron job)

**Environment Variables**:
```
DB_HOST=localhost
DB_NAME=crystal_orders
DB_USER=db_user
DB_PASS=db_password
```

---

### PHASE 4: Email System

**Goal**: Send order confirmations using PHP mail()

**Email Types**:
1. **Customer Confirmation**
   - Order received
   - Order number & summary
   - Estimated delivery
   - Tracking (when shipped)

2. **Admin Notification**
   - New order alert
   - Order details for fulfillment
   - Link to images

**Implementation**:
1. Create email templates (HTML + Text)
2. Create send email utility
3. Integrate with webhook
4. Test in all environments

**Email Behavior by Environment**:
- **Development**: Log to file, show in debug panel
- **Testing**: Real delivery, subject prefixed with `[TEST]`
- **Production**: Normal delivery

**Files to Create**:
- `/app/api/email/send-order-confirmation.php`
- `/app/api/email/templates/order-confirmation.html`
- `/app/api/email/templates/admin-notification.html`

**Environment Variables**:
```
SMTP_FROM_EMAIL=orders@crystalkeepsakes.com
SMTP_FROM_NAME=Crystal Keepsakes
ADMIN_EMAIL=admin@crystalkeepsakes.com
```

---

### PHASE 5: Privacy Policy & Data Retention

**Goal**: GDPR/CCPA compliance and user transparency

#### 5A: Privacy Policy Page
**URL**: `/privacy-policy`

**Content to Include**:
1. **Data Collection**
   - Personal info (name, email, address, phone)
   - Payment info (handled by Stripe, not stored)
   - Images uploaded for customization
   - Order history

2. **Data Usage**
   - Order fulfillment
   - Customer communication
   - Legal compliance

3. **Data Storage**
   - Secure MySQL database
   - Encrypted connections
   - Images stored on server
   - Retention period: **90 days** (configurable)

4. **Data Deletion**
   - Automatic after 90 days
   - Manual request available: privacy@crystalkeepsakes.com
   - Order history anonymized, images deleted

5. **Third-Party Services**
   - Stripe (payment processing)
   - Cockpit3D (fulfillment partner)
   - Email delivery

6. **User Rights**
   - Access your data
   - Request deletion
   - Opt-out of emails

**Files to Create**:
- `/app/src/app/privacy-policy/page.tsx`

#### 5B: Data Retention System

**Policy**: Keep order data for **90 days**, then:
- Delete customer images
- Anonymize customer info (keep order ID for accounting)
- Keep order totals for records (no personal data)

**Implementation**:
1. Create cleanup script (runs daily via cron)
2. Mark orders older than 90 days
3. Delete associated images from filesystem
4. Anonymize customer data in database
5. Log cleanup actions

**Files to Create**:
- `/app/api/database/cleanup-old-orders.php`
- `/app/scripts/setup-cron.sh`

**Cron Job** (runs daily at 2 AM):
```bash
0 2 * * * /usr/bin/php /path/to/api/database/cleanup-old-orders.php
```

---

### PHASE 6: Production Readiness Checklist

#### Code Cleanup:
- [ ] Remove ALL `console.log()` except debug panel
- [ ] Remove inline debug UI from all pages
- [ ] Verify error messages are user-friendly
- [ ] Test all flows without debug panel

#### Environment:
- [ ] `.env` configured for production
- [ ] LIVE Stripe keys loaded
- [ ] Database credentials set
- [ ] Email SMTP configured
- [ ] Cron job for cleanup scheduled

#### Testing:
- [ ] Test in `/test` environment thoroughly
- [ ] Verify Stripe webhooks work
- [ ] Confirm emails deliver correctly
- [ ] Test order storage in database
- [ ] Verify privacy policy displays
- [ ] Test data retention/cleanup

#### Documentation:
- [ ] Environment setup guide
- [ ] Database schema documented
- [ ] Email template customization guide
- [ ] Privacy policy reviewed by legal (if needed)
- [ ] Deployment checklist

#### Security:
- [ ] Database credentials in `.env` only
- [ ] API keys not exposed to client
- [ ] File uploads validated
- [ ] SQL injection prevention
- [ ] HTTPS enforced in production

---

## File Structure After Cleanup

```
/app/
├── api/
│   ├── stripe/
│   │   ├── create-checkout-session.php
│   │   └── webhook.php (✨ enhanced with DB + email)
│   ├── database/
│   │   ├── db-config.php (✨ new)
│   │   ├── save-order.php (✨ new)
│   │   ├── get-order.php (✨ new)
│   │   └── cleanup-old-orders.php (✨ new)
│   ├── email/
│   │   ├── send-order-confirmation.php (✨ new)
│   │   └── templates/ (✨ new)
│   │       ├── order-confirmation.html
│   │       └── admin-notification.html
│   └── upload-image.php (existing)
│
├── src/
│   ├── app/
│   │   ├── checkout/
│   │   │   └── page.tsx (♻️ cleaned - no console.log)
│   │   ├── order-confirmation/
│   │   │   └── page.tsx (♻️ cleaned)
│   │   ├── privacy-policy/
│   │   │   └── page.tsx (✨ new)
│   │   └── layout.tsx (♻️ add TestingBanner)
│   │
│   ├── components/
│   │   ├── EnhancedDebugOverlay.tsx (✨ enhanced with Order tab)
│   │   └── TestingBanner.tsx (✨ new)
│   │
│   ├── utils/
│   │   ├── debugUtils.ts (✨ new - replaces console.log)
│   │   └── envConfig.ts (✨ new - environment detection)
│   │
│   └── lib/
│       └── cockpit3d-order-builder.ts (♻️ use debugUtils)
│
├── scripts/
│   └── setup-cron.sh (✨ new)
│
└── docs/
    ├── PAYMENT_CLEANUP_PLAN.md (this file)
    ├── DATABASE_SCHEMA.md (✨ new)
    └── DEPLOYMENT_GUIDE.md (✨ new)
```

---

## Testing Protocol

### Local Testing:
1. Set `NEXT_PUBLIC_ENV_MODE=development`
2. Use test Stripe keys
3. Debug panel always visible
4. Test full checkout flow
5. Verify order logs to debug panel
6. Check email logs to console

### Testing Environment (`/test`):
1. Deploy to `https://crystalkeepsakes.com/test`
2. Set `NEXT_PUBLIC_ENV_MODE=testing`
3. Set `NEXT_PUBLIC_BASE_PATH=/test`
4. Use test Stripe keys
5. Verify banner shows "TESTING MODE"
6. Test complete purchase flow
7. Verify Stripe redirects to `/test/order-confirmation`
8. Check emails deliver with [TEST] prefix
9. Verify order saves to test database
10. Test with `?debug=true` parameter

### Production Deployment:
1. Verify `NEXT_PUBLIC_ENV_MODE=production`
2. Verify LIVE Stripe keys loaded
3. **Test first purchase personally** (real payment)
4. Monitor webhook delivery
5. Verify email confirmation received
6. Check order in database
7. Test `?debug=true` access (for your testing only)
8. Monitor for first few customer orders

---

## Data Retention Policy Summary

**Storage Duration**: 90 days

**After 90 Days**:
- ✅ Keep: Order ID, order total, date (for accounting)
- ❌ Delete: Customer images from filesystem
- ❌ Anonymize: Name, email, address, phone
- ❌ Delete: Payment details (already not stored)

**Manual Deletion**:
- Customer can request deletion anytime
- Email: privacy@crystalkeepsakes.com
- Process within 30 days

**Backup Policy**:
- Database backups retained for 1 year (encrypted)
- Backups also subject to deletion/anonymization

---

## Questions & Answers

**Q: Data Retention Duration?**
A: **90 days** - sufficient for order fulfillment, returns, and support

**Q: Test mode in production?**
A: NO - use `/test` environment for testing, keeps production clean

**Q: Debug panel access in production?**
A: Only with `?debug=true` URL parameter (for admin testing)

**Q: Email provider?**
A: PHP `mail()` function (works with server's SMTP)

**Q: Database?**
A: MySQL (already have schema) - need connection credentials

---

## Next Steps

1. **Phase 1**: Enhance debug panel (30 min)
2. **Phase 2**: Environment setup & testing banner (30 min)
3. **Phase 3**: Database integration (1-2 hours)
4. **Phase 4**: Email system (1 hour)
5. **Phase 5**: Privacy policy (30 min)
6. **Phase 6**: Testing & deployment (varies)

**Total Estimated Time**: 4-6 hours

---

## Success Criteria

✅ **User Experience**:
- Clean, professional checkout (no debug UI)
- Clear error messages
- Order confirmation email received
- Tracking information available

✅ **Testing Environment**:
- Isolated from production
- All links stay in `/test/`
- Clear "TESTING" indicators
- Test payments only

✅ **Production**:
- No debugging visible to customers
- LIVE payments working
- Orders save correctly
- Emails deliver reliably
- Privacy policy accessible
- Data retention automated

✅ **Admin**:
- Debug panel accessible with `?debug=true`
- Order structure viewable
- Database queries working
- Cleanup cron job running

---

Ready to implement! 🚀
