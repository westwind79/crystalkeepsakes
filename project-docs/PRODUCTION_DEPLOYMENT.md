# Production Deployment Guide

## ✅ What's Been Done

### 1. API Routes Converted to PHP
- `/api/contact` → `/api/contact.php`
- Works with static HTML export
- Uses PHP `mail()` function (requires GoDaddy email setup)

### 2. SEO/Meta Tags Added
- Comprehensive metadata in `layout.tsx`
- Open Graph tags for social sharing
- Twitter Card support
- Structured keywords for search engines
- Robots meta for proper indexing

## 🚀 Build & Deploy Steps

### Step 1: Build for Production
```bash
cd /app
npm run build
```
This creates `/out` folder with static files.

### Step 2: Copy to GoDaddy
```bash
# Copy everything from /out to:
/public_html/crystalkeepsakes/test/
```

**Important:** Make sure to copy the `/api` folder too!

### Step 3: Configure GoDaddy Email
Update `/public_html/crystalkeepsakes/test/api/contact.php`:

Change email addresses:
- `orders@crystalkeepsakes.com`
- `support@crystalkeepsakes.com`
- `admin@crystalkeepsakes.com`
- `info@crystalkeepsakes.com`

### Step 4: Test Email
1. Go to: `https://crystalkeepsakes.com/test/contact`
2. Fill out form
3. Check your email inbox
4. Verify routing works (order problems go to orders@, etc.)

## 🧪 Testing Checklist

### Contact Form
- [ ] Submit form → email received
- [ ] Customer gets confirmation email
- [ ] Order problem → goes to orders@
- [ ] Website issue → goes to support@
- [ ] Other topics → go to info@

### SEO/Meta Tags
- [ ] View source → see meta tags
- [ ] Share link on Facebook → preview shows
- [ ] Share link on Twitter → preview shows
- [ ] Google Search Console → verify site

### Products & Cart
- [ ] Products page loads
- [ ] Product detail shows correct pricing
- [ ] Add to cart works
- [ ] Cart displays items correctly
- [ ] Images load properly

### Stripe Checkout (Need API Route)
⚠️ **Stripe checkout needs backend** - Options:
1. Convert to PHP (requires Stripe PHP SDK)
2. Keep Node.js API separate (recommended)
3. Use Stripe Payment Links (easiest)

## 📋 What Still Needs Backend

### Currently Working (Static):
✅ Contact form (PHP)
✅ Product browsing
✅ Cart management (localStorage)
✅ Image uploads (client-side)

### Needs Server/Backend:
❌ Stripe checkout processing
❌ Order submission to Cockpit3D
❌ Webhook handling

## 💡 Recommended: Stripe Payment Links

**Easiest solution for payments:**
1. Create products in Stripe Dashboard
2. Get payment link for each product
3. Replace checkout button with Stripe link
4. Stripe handles everything

**OR** keep Node.js API just for checkout:
- Deploy `/api` routes to Vercel/Railway (free)
- Point checkout to: `https://api.crystalkeepsakes.com/checkout`

## 🔧 Environment Variables Needed

Create `.htaccess` or `config.php` for:
```php
// Email settings (already in contact.php)
$emailRoutes = [
    'orders' => 'orders@crystalkeepsakes.com',
    'support' => 'support@crystalkeepsakes.com',
    'admin' => 'admin@crystalkeepsakes.com',
    'info' => 'info@crystalkeepsakes.com'
];
```

## 📊 SEO Improvements Added

### Global (All Pages):
- Site title with template
- Meta description optimized for search
- Keywords for crystal gifts industry
- Open Graph for social sharing
- Twitter Cards
- Canonical URLs
- Mobile viewport
- Robots indexing rules

### Keywords Targeting:
- "3D crystal photo"
- "personalized crystal gifts"
- "laser engraved crystals"
- "custom crystal keepsakes"
- "memorial crystals"
- "wedding gifts"
- "pet memorial"

### Next Steps for SEO:
1. Add Google Search Console
2. Submit sitemap
3. Add Google Analytics
4. Add structured data (JSON-LD)
5. Optimize product pages individually

## 🎯 Production Checklist

Before going live:
- [ ] Test all forms
- [ ] Verify email delivery
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Verify SSL certificate
- [ ] Set up 301 redirects if needed
- [ ] Add Google Analytics
- [ ] Add Facebook Pixel (if needed)
- [ ] Test Stripe checkout flow
- [ ] Verify Cockpit3D integration

## 📞 Support

If emails aren't working:
1. Check GoDaddy email setup
2. Verify PHP `mail()` is enabled
3. Check spam folders
4. Test with simple PHP mail script
5. Contact GoDaddy support if needed

## 🔐 Security Notes

- Contact form has basic validation
- Consider adding rate limiting
- Add CAPTCHA for production (Google reCAPTCHA)
- Sanitize all inputs (already done in PHP)
- Use HTTPS (SSL) - already on GoDaddy
