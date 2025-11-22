# Quick Deployment Checklist

## 🧪 TEST ENVIRONMENT DEPLOY

### 1. Configure
```bash
# Edit .env.production.test
NEXT_PUBLIC_TEST_PASSWORD=TestAccess2025
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
COCKPIT3D_USERNAME=test_user
COCKPIT3D_PASSWORD=test_pass
```

### 2. Build
```bash
npm run build:test
```

### 3. Upload
```bash
# Upload /out/ contents to public_html/
# Result: https://crystalkeepsakes.com/test/
```

### 4. Test
- [ ] Visit https://crystalkeepsakes.com/test/
- [ ] Enter password: `TestAccess2025`
- [ ] Test contact form
- [ ] Test product → cart → checkout
- [ ] Verify emails arrive

---

## 🚀 PRODUCTION DEPLOY

### 1. Configure
```bash
# Edit .env.production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
COCKPIT3D_USERNAME=production_user
COCKPIT3D_PASSWORD=production_pass
```

### 2. Build
```bash
npm run build:prod
```

### 3. Backup Current Site
```bash
# Download current public_html/ to backup folder
```

### 4. Upload
```bash
# Upload /out/ contents to public_html/
# Result: https://crystalkeepsakes.com/
```

### 5. Test EVERYTHING
- [ ] Homepage loads
- [ ] All pages accessible
- [ ] Contact form works
- [ ] Products load correctly
- [ ] Add to cart works
- [ ] Checkout flow (with test card first!)
- [ ] Order emails arrive
- [ ] Mobile responsive
- [ ] No console errors

---

## 🔑 Quick Reference

### Test Site Access
- URL: https://crystalkeepsakes.com/test/
- Password: `TestAccess2025`

### Stripe Test Card
- Number: 4242 4242 4242 4242
- Date: Any future date
- CVC: Any 3 digits

### Email Recipients
- Orders: orders@crystalkeepsakes.com
- Support: support@crystalkeepsakes.com
- Contact: info@crystalkeepsakes.com

### Build Commands
- Development: `npm run dev`
- Test Build: `npm run build:test`
- Production Build: `npm run build:prod`

---

## ⚠️ IMPORTANT

### Before Production Deploy
1. ✅ Test environment fully tested
2. ✅ All API keys are LIVE (not test)
3. ✅ Backup current site
4. ✅ Inform team of deploy window
5. ✅ Test with real Stripe card (small amount)

### After Production Deploy
1. ✅ Test complete user flow
2. ✅ Monitor for errors
3. ✅ Check email delivery
4. ✅ Verify Stripe payments
5. ✅ Watch for any issues first 24hrs
