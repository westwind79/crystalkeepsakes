# Crystal Keepsakes - Quick Reference Card

**v9 Static Export** | Last Updated: Nov 23, 2025

---

## ⚡ Quick Commands

```bash
# Development
npm run dev                 # Start dev server (localhost:3000)

# Build
npm run build:prod         # Production build → /out/
npm run build:test         # Test build with /test path → /out/

# Products
npm run fetch-products     # Fetch from Cockpit3D API
```

---

## 📁 Important Files

```
/src/data/final-product-list.js         Product data (single source)
/api/stripe/create-checkout-session.php Stripe checkout handler
/api/contact.php                        Contact form handler
/.env.production                        Production config
/.env.production.test                   Test environment config
```

---

## 🌐 URLs

```
Production:  https://crystalkeepsakes.com
Test:        https://crystalkeepsakes.com/test (password: TestAccess2025)
Admin:       http://localhost:3000/admin (dev only, don't deploy)
```

---

## 🚀 Deploy to GoDaddy

```bash
# 1. Build
npm run build:prod

# 2. Upload /out/ contents to:
/public_html/exposethegrove.com/crystalkeepsakes.com/

# 3. Verify at:
https://crystalkeepsakes.com
```

---

## 🧪 Test Checkout

```
Card Number:  4242 4242 4242 4242
Expiry:       Any future date
CVC:          Any 3 digits
ZIP:          Any 5 digits
```

---

## 📚 Documentation

```
/project-docs/README.md                          Start here
/project-docs/current/BUILD_FIX_V9_COMPLETE.md  Latest changes (v9)
/project-docs/current/DEPLOYMENT_GUIDE.md       How to deploy
/project-docs/current/QUICK_START.md            Quick setup
```

**Structure:**
- `/current/` - Active guides (29 files)
- `/reference/` - Technical docs (21 files)
- `/archive/` - Historical logs (74 files)

---

## 🔧 Environment Variables

**Production** (`.env.production`):
```env
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

**Test** (`.env.production.test`):
```env
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check no Next.js API routes exist |
| Checkout broken | Verify PHP backend URL in .env |
| Admin save fails | It downloads file - upload via FTP |
| Images not loading | Check /crystal-data/ folder exists |

**Full guide:** `/project-docs/reference/DEBUGGING_GUIDE.md`

---

## 📊 v9 Architecture

```
Frontend:  Static HTML (pre-rendered by Next.js)
Backend:   PHP APIs (Stripe, Cockpit3D, email)
Storage:   localStorage (cart) + IndexedDB (images)
Hosting:   GoDaddy shared (no Node.js needed)
Build:     ~5 seconds, 60 static pages
```

**Key Change:** Removed all Next.js API routes → PHP only

---

## 🎯 Project Status

✅ Build working (static export)  
✅ 47 products pre-rendered  
✅ Stripe checkout configured  
✅ GoDaddy compatible  
✅ Documentation organized  
✅ Ready for deployment

---

**Need more info?** See `/project-docs/README.md` or `/README.md`
