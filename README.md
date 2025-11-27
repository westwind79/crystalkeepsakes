# Crystal Keepsakes - E-Commerce Platform

**Version:** v9 (Static Export)  
**Status:** ✅ Production Ready  
**Last Updated:** November 23, 2025

A Next.js-based e-commerce platform for personalized crystal keepsakes with custom image engraving, integrated with Stripe payments and Cockpit3D fulfillment.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev
# → http://localhost:3000

# Build for production
npm run build:prod
# → Output in /out/ directory

# Build for test environment
npm run build:test
# → Output with /test base path
```

---

## 📁 Project Structure

```
/crystalkeepsakes/
├── src/
│   ├── app/              Next.js 15 pages (App Router)
│   ├── components/       React components
│   ├── lib/              Core libraries & utilities
│   ├── utils/            Helper functions
│   ├── types/            TypeScript definitions
│   └── data/             Static data files
│
├── api/                  PHP backend APIs
│   ├── stripe/           Stripe payment processing
│   ├── cockpit3d/        Cockpit3D integration
│   └── contact.php       Contact form handler
│
├── scripts/              Build & utility scripts
├── project-docs/         Documentation (123 files organized)
├── public/               Static assets
├── out/                  Build output (after npm run build)
└── [config files]        Next.js, TypeScript, Tailwind configs
```

---

## 🎯 Key Features

### Frontend
- ✅ **Static Export** - SEO-friendly pre-rendered HTML pages
- ✅ **47 Products** - Pre-rendered product pages with SSG
- ✅ **Image Editor** - Custom image upload & masking
- ✅ **Cart System** - localStorage + IndexedDB storage
- ✅ **Responsive Design** - Mobile-first with Tailwind CSS
- ✅ **Animations** - GSAP-powered smooth animations

### Backend (PHP)
- ✅ **Stripe Checkout** - Hosted payment processing
- ✅ **Cockpit3D API** - Automated order fulfillment
- ✅ **Email Handling** - Contact forms & order notifications
- ✅ **Image Storage** - Customer image management
- ✅ **Webhooks** - Stripe payment confirmation

### Deployment
- ✅ **GoDaddy Compatible** - Works on shared hosting
- ✅ **No Node.js Required** - Static HTML + PHP
- ✅ **Fast Builds** - ~5 second build time
- ✅ **Test Environment** - Password-protected staging

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router, Static Export)
- React 19
- TypeScript
- Tailwind CSS 4
- GSAP (animations)
- Swiper (carousels)

**Backend:**
- PHP 7.4+ (API endpoints)
- Stripe PHP SDK (payments)
- Composer (dependency management)

**Storage:**
- localStorage (cart items)
- IndexedDB (customer images)
- MongoDB (order history via Stripe webhook)

**Deployment:**
- GoDaddy shared hosting
- Static HTML export
- FTP deployment

---

## 📚 Documentation

All documentation is organized in `/project-docs/`:

- **[/current/](project-docs/current/)** - Active guides (28 files)
- **[/reference/](project-docs/reference/)** - Technical docs (21 files)  
- **[/archive/](project-docs/archive/)** - Historical logs (74 files)

### Essential Guides:
- **[Getting Started](project-docs/README.md)** - Documentation index
- **[Build Fix v9](project-docs/current/BUILD_FIX_V9_COMPLETE.md)** - Latest architecture
- **[Deployment Guide](project-docs/current/DEPLOYMENT_GUIDE.md)** - How to deploy
- **[GoDaddy Setup](project-docs/current/ACTUAL_GODADDY_STRUCTURE.md)** - Server structure

---

## 🚢 Deployment

### Production Deployment

1. **Build:**
   ```bash
   npm run build:prod
   ```

2. **Upload `/out/` contents to:**
   ```
   /public_html/exposethegrove.com/crystalkeepsakes.com/
   ```

3. **Verify:**
   - https://crystalkeepsakes.com
   - Test checkout with card: 4242 4242 4242 4242

### Test Environment

1. **Build:**
   ```bash
   npm run build:test
   ```

2. **Upload `/out/` contents to:**
   ```
   /public_html/exposethegrove.com/crystalkeepsakes.com/test/
   ```

3. **Access:**
   - https://crystalkeepsakes.com/test
   - Password: TestAccess2025

---

## ⚙️ Configuration

### Environment Files

**`.env.production`** (Production):
```env
NODE_ENV=production
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# Stripe LIVE keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Cockpit3D production credentials
COCKPIT3D_USERNAME=...
COCKPIT3D_PASSWORD=...
```

**`.env.production.test`** (Test environment):
```env
NODE_ENV=production
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test

# Stripe TEST keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🔑 Key Changes in v9

### What Changed:
- ❌ **Removed:** All Next.js API routes (`/src/app/api/`)
- ✅ **Added:** PHP-only backend APIs
- ✅ **Fixed:** Static export now works perfectly
- ✅ **Updated:** Checkout always uses PHP backend
- ✅ **Improved:** Admin panel downloads files (no server save)

### Why:
- Next.js API routes require Node.js server
- GoDaddy shared hosting = no Node.js
- Static export = SEO-friendly flat HTML files
- PHP APIs = compatible with shared hosting

### Result:
- ✅ Build succeeds in ~5 seconds
- ✅ 60 static pages generated
- ✅ Works on GoDaddy without Node.js
- ✅ Perfect SEO with pre-rendered HTML

**Full details:** [BUILD_FIX_V9_COMPLETE.md](project-docs/current/BUILD_FIX_V9_COMPLETE.md)

---

## 📝 Development Workflow

### Local Development (MAMP)
```bash
# 1. Start MAMP (PHP server on port 8888)

# 2. Install dependencies
npm install
composer install  # For PHP dependencies

# 3. Configure environment
cp .env.example .env
# Update with your local settings

# 4. Start dev server
npm run dev

# 5. Access
http://localhost:3000
```

### Making Changes
```bash
# Frontend changes
# → Edit files in /src/
# → Hot reload enabled

# Backend changes  
# → Edit files in /api/
# → Restart MAMP if needed

# Documentation
# → Add to /project-docs/current/ or /reference/
```

### Testing
```bash
# Test product loading
npm run test-products

# Test Cockpit3D connection
php api/cockpit3d/check-cockpit3d-prices.php

# Test Stripe (use test keys)
# → Go through checkout with card: 4242 4242 4242 4242
```

---

## 🐛 Troubleshooting

### Build Fails
- Check: [BUILD_FIX_V9_COMPLETE.md](project-docs/current/BUILD_FIX_V9_COMPLETE.md)
- Ensure no Next.js API routes exist
- Verify `output: 'export'` in `next.config.ts`

### Checkout Not Working
- Verify PHP backend URL in `.env`
- Check Stripe keys are correct
- Test PHP API directly with curl

### Admin Panel Save Doesn't Work
- Expected behavior: Downloads file to browser
- Upload via FTP to `/src/data/final-product-list.js`

### Images Not Loading
- Check `/public_html/crystal-data/` directory exists
- Verify permissions: 755
- Check `CUSTOMER_IMAGE_PATH` in `.env`

**Full guide:** [DEBUGGING_GUIDE.md](project-docs/reference/DEBUGGING_GUIDE.md)

---

## 📊 Performance

- **Build Time:** ~5 seconds
- **Pages Generated:** 60 static pages
- **First Load JS:** 99.7 kB (shared)
- **Homepage:** 76.1 kB
- **Product Pages:** ~34 kB each

---

## 🔐 Security

- ✅ Environment variables for secrets
- ✅ Stripe webhook signature verification
- ✅ Input sanitization on PHP endpoints
- ✅ CORS configuration
- ✅ Test environment password protection

**Checklist:** [SECURITY_CHECKLIST.md](project-docs/current/SECURITY_CHECKLIST.md)

---

## 📜 License

Proprietary - Crystal Keepsakes

---

## 📞 Support

**Documentation:** See `/project-docs/README.md`  
**Issues:** Check troubleshooting guides first  
**Architecture:** See `BUILD_FIX_V9_COMPLETE.md`

---

**Built with ❤️ for Crystal Keepsakes**
