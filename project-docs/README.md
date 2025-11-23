# Crystal Keepsakes - Documentation

**Last Updated:** November 23, 2025  
**Project Version:** v9 (Static Export)

---

## 📚 Quick Start

### New to the Project?
1. Start with [PROJECT_STRUCTURE.md](current/PROJECT_STRUCTURE.md) - Understand the codebase
2. Read [QUICK_START.md](current/QUICK_START.md) - Get up and running
3. Review [BUILD_FIX_V9_COMPLETE.md](current/BUILD_FIX_V9_COMPLETE.md) - Latest architecture changes

### Ready to Deploy?
1. [DEPLOYMENT_GUIDE.md](current/DEPLOYMENT_GUIDE.md) - Complete deployment walkthrough
2. [DEPLOY_CHECKLIST.md](current/DEPLOY_CHECKLIST.md) - Pre-deployment checklist
3. [ACTUAL_GODADDY_STRUCTURE.md](current/ACTUAL_GODADDY_STRUCTURE.md) - GoDaddy-specific setup

---

## 📁 Documentation Structure

### `/current/` - Active Guides (28 files)
Essential documentation for current development and deployment.

**Setup & Deployment:**
- `DEPLOYMENT_GUIDE.md` - Main deployment guide
- `ACTUAL_GODADDY_STRUCTURE.md` - GoDaddy directory structure
- `GODADDY_SETUP_GUIDE.md` - Server setup instructions
- `FTP_GUIDE.md` - FTP upload instructions
- `ENV_SETUP.md` - Environment configuration
- `DEPLOY_CHECKLIST.md` - Pre-launch checklist
- `PRE_LAUNCH_CHECKLIST.md` - Final verification steps

**Architecture & Build:**
- `BUILD_FIX_V9_COMPLETE.md` - ⭐ Latest v9 architecture (MUST READ)
- `PROJECT_STRUCTURE.md` - Complete file organization
- `QUICK_START.md` - Quick setup guide
- `SIMPLE_TRUTH.md` - Core concepts explained simply

**Features & Integrations:**
- `COMPLETE_CART_CHECKOUT_GUIDE.md` - Cart and checkout system
- `STRIPE_CHECKOUT_IMPLEMENTATION.md` - Stripe payment integration
- `STRIPE_ORDER_FLOW.md` - Order processing flow
- `COCKPIT3D_INTEGRATION.md` - Cockpit3D API integration
- `CONTACT_FORM_GODADDY.md` - Contact form setup

**Admin & Management:**
- `ADMIN_PANEL_GUIDE.md` - Admin panel usage
- `START_ADMIN_PANEL.md` - Admin setup instructions

**Technical Details:**
- `PRICING_LOGIC_EXPLAINED.md` - Pricing calculations
- `PRODUCT_PRICING_AND_DATA_FLOW.md` - Product data flow
- `ORDER_FLOW_DOCUMENTATION.md` - Order processing details

**Security & Production:**
- `PRODUCTION_DEPLOYMENT.md` - Production deployment
- `PRODUCTION_SECURITY.md` - Security considerations
- `SECURITY_CHECKLIST.md` - Security audit checklist
- `SEO_REVIEW.md` - SEO optimization guide

### `/reference/` - Technical Reference (21 files)
Detailed technical documentation for specific features.

**System Components:**
- `AUTO_MASKS_SYSTEM.md` - Mask selection system
- `DATA_LOADING_SOLUTION.md` - Data loading patterns
- `EMAIL_SETUP.md` - Email configuration
- `FILE_UPLOAD_GUIDE_CORRECT.md` - File upload implementation
- `ORDER_DATA_STRUCTURE.md` - Order data schemas

**Testing & Debugging:**
- `DEBUGGING_GUIDE.md` - Debugging procedures
- `DEBUG_GUIDE.md` - Debug utilities
- `CUSTOM_TEXT_DEBUGGING_GUIDE.md` - Text customization debugging
- `ORDER_FLOW_TESTING_GUIDE.md` - Testing order flows

**UI & Styling:**
- `FONT_IMPLEMENTATION.md` - Font system
- `GSAP_ANIMATION_GUIDE.md` - Animation implementation
- `UI_DESIGN_SYSTEM.md` - Design system reference

**Pricing & Products:**
- `PRICING_CATEGORIES_PLAN.md` - Pricing structure
- `PRICING_LOGIC_CONSOLIDATION.md` - Pricing logic details
- `PRICING_SALE_LOGIC.md` - Sale price calculations
- `PRODUCT_FILES_EXPLAINED.md` - Product file structure

**Build & Checkout:**
- `BUILD_PROCESS_GUIDE.md` - Build process details
- `CHECKOUT_FLOW_IMPLEMENTATION.md` - Checkout implementation
- `STRIPE_CHECKOUT_SETUP.md` - Stripe setup details

### `/archive/` - Historical Records (74 files)
Old session logs, fix reports, and outdated documentation.

**Contains:**
- Session summaries (SESSION_*.md)
- Bug fix logs (*_FIX_*.md)
- Status reports (STATUS_*.md)
- Old implementation details
- Migration logs
- Deprecated guides

**Note:** Archive files are kept for historical reference but may contain outdated information.

---

## 🎯 Common Tasks

### I want to...

**Deploy to production:**
1. Read: [DEPLOYMENT_GUIDE.md](current/DEPLOYMENT_GUIDE.md)
2. Check: [DEPLOY_CHECKLIST.md](current/DEPLOY_CHECKLIST.md)
3. Follow: [ACTUAL_GODADDY_STRUCTURE.md](current/ACTUAL_GODADDY_STRUCTURE.md)

**Set up development environment:**
1. Read: [QUICK_START.md](current/QUICK_START.md)
2. Configure: [ENV_SETUP.md](current/ENV_SETUP.md)
3. Understand: [PROJECT_STRUCTURE.md](current/PROJECT_STRUCTURE.md)

**Understand the latest changes:**
1. Read: [BUILD_FIX_V9_COMPLETE.md](current/BUILD_FIX_V9_COMPLETE.md) ⭐

**Configure Stripe payments:**
1. Read: [STRIPE_CHECKOUT_IMPLEMENTATION.md](current/STRIPE_CHECKOUT_IMPLEMENTATION.md)
2. Setup: [STRIPE_ORDER_FLOW.md](current/STRIPE_ORDER_FLOW.md)

**Work with the admin panel:**
1. Setup: [START_ADMIN_PANEL.md](current/START_ADMIN_PANEL.md)
2. Guide: [ADMIN_PANEL_GUIDE.md](current/ADMIN_PANEL_GUIDE.md)

**Debug an issue:**
1. Check: [DEBUGGING_GUIDE.md](reference/DEBUGGING_GUIDE.md)
2. Review: [DEBUG_GUIDE.md](reference/DEBUG_GUIDE.md)

**Understand pricing:**
1. Overview: [PRICING_LOGIC_EXPLAINED.md](current/PRICING_LOGIC_EXPLAINED.md)
2. Details: [PRODUCT_PRICING_AND_DATA_FLOW.md](current/PRODUCT_PRICING_AND_DATA_FLOW.md)

---

## 🚀 Quick Reference

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build:prod

# Test environment build
npm run build:test

# Fetch products from Cockpit3D
npm run fetch-products
```

### Important Files
```
/src/data/final-product-list.js    - Product data (single source of truth)
/api/stripe/create-checkout-session.php  - Stripe checkout
/api/contact.php                    - Contact form handler
/.env.production                    - Production configuration
```

### GoDaddy Structure
```
public_html/
└── exposethegrove.com/
    └── crystalkeepsakes.com/      ← Deploy /out/ contents here
        ├── api/                    ← PHP files
        ├── products/               ← Product pages
        └── index.html              ← Homepage
```

### Key URLs
- **Production:** https://crystalkeepsakes.com
- **Test:** https://crystalkeepsakes.com/test (password: TestAccess2025)
- **Admin:** http://localhost:3000/admin (dev only)

---

## 📝 Documentation Guidelines

### When Adding New Documentation:

1. **Active guides** → Save to `/current/`
   - Deployment procedures
   - Setup instructions
   - Current architecture
   - Active features

2. **Technical details** → Save to `/reference/`
   - Implementation details
   - Code patterns
   - API documentation
   - Debugging procedures

3. **Historical records** → Save to `/archive/`
   - Session summaries
   - Bug fix logs
   - Old implementation notes
   - Deprecated features

### File Naming Conventions:
- Use UPPERCASE with underscores: `MY_GUIDE.md`
- Be descriptive: `STRIPE_CHECKOUT_IMPLEMENTATION.md` not `STRIPE.md`
- Version if needed: `BUILD_FIX_V9_COMPLETE.md`

---

## 🎯 Project Status

### Current Version: v9
- ✅ Static export working (SEO-friendly)
- ✅ PHP APIs for GoDaddy shared hosting
- ✅ No Node.js server required
- ✅ 60 static pages, 47 products pre-rendered
- ✅ Build time: ~5 seconds

### Key Technologies:
- **Frontend:** Next.js 15 (static export), React 19, Tailwind CSS
- **Backend:** PHP (Stripe, Cockpit3D, email)
- **Database:** MongoDB (via Stripe webhook), localStorage (cart)
- **Hosting:** GoDaddy shared hosting
- **Payments:** Stripe Checkout (hosted)
- **Fulfillment:** Cockpit3D API

### Architecture:
- Static HTML pages (pre-rendered)
- Client-side cart (localStorage + IndexedDB)
- PHP backend APIs (server-side processing)
- No API routes in Next.js (removed in v9)

---

## 🔗 External Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Cockpit3D:** (Internal API documentation)

---

## 📞 Support

### Issue Troubleshooting:
1. Check [DEBUGGING_GUIDE.md](reference/DEBUGGING_GUIDE.md)
2. Review recent changes in `/archive/`
3. Check build output for errors
4. Review server logs (GoDaddy cPanel)

### Common Issues:
- **Build fails:** Check [BUILD_FIX_V9_COMPLETE.md](current/BUILD_FIX_V9_COMPLETE.md)
- **Stripe issues:** Check [STRIPE_CHECKOUT_IMPLEMENTATION.md](current/STRIPE_CHECKOUT_IMPLEMENTATION.md)
- **Deployment issues:** Check [DEPLOYMENT_GUIDE.md](current/DEPLOYMENT_GUIDE.md)
- **GoDaddy setup:** Check [ACTUAL_GODADDY_STRUCTURE.md](current/ACTUAL_GODADDY_STRUCTURE.md)

---

## 📊 Documentation Stats

- **Total files:** 123
- **Current guides:** 28 (active)
- **Reference docs:** 21 (technical)
- **Archived:** 74 (historical)

**Last cleanup:** November 23, 2025

---

**Need help?** Start with the guides in `/current/` - they're kept up-to-date with the latest architecture.

**Contributing?** Add new docs to appropriate folders and update this README.
