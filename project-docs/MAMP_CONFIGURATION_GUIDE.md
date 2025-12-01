# MAMP Configuration Guide

## 🎯 Understanding Your Setup

You have **ONE MAMP server** that serves your PHP backend. You don't need multiple servers.

---

## 📋 Recommended Setup (What You Should Use)

### MAMP is ONLY for PHP Backend

```
MAMP (port 8888):
└── C:\MAMP\htdocs\crystalkeepsakes\
    └── api/                           ← PHP files ONLY
        ├── stripe/
        ├── cockpit3d/
        └── contact.php
```

**MAMP serves:** Your PHP backend APIs  
**URL:** `http://localhost:8888/crystalkeepsakes/api/`

### Next.js Dev Server for Frontend

```bash
npm run dev
```

**Dev server serves:** Your React frontend  
**URL:** `http://localhost:3000`

---

## 🚀 Development Workflow (RECOMMENDED)

### For Daily Development:

```bash
# 1. Start MAMP (just leave it running)
#    - Serves PHP backend on port 8888

# 2. Run Next.js dev server
npm run dev
#    - Serves frontend on port 3000
#    - Hot reload enabled
#    - Calls MAMP PHP backend for checkout

# 3. Access your site
http://localhost:3000
```

**How it works:**
```
Browser
  ↓
http://localhost:3000 (Next.js dev server)
  ↓ (when checkout button clicked)
http://localhost:8888/crystalkeepsakes/api/stripe/... (MAMP PHP)
```

---

## 🧪 Testing Built Sites (Optional)

If you want to test the actual built static sites locally (not required for development):

### Option 1: Switch MAMP Document Root

**For Production Build:**
```
MAMP Preferences → Web Server
Document Root: C:\MAMP\htdocs\crystalkeepsakes\out
Access: http://localhost:8888/
```

**For Test Build:**
```
MAMP Preferences → Web Server
Document Root: C:\MAMP\htdocs\crystalkeepsakes\out-test
Access: http://localhost:8888/
```

### Option 2: Use Subpaths

Leave MAMP pointing to `C:\MAMP\htdocs\crystalkeepsakes\`

Access:
```
Production: http://localhost:8888/crystalkeepsakes/out/
Test:       http://localhost:8888/crystalkeepsakes/out-test/
```

### Option 3: Virtual Hosts (Advanced)

Create two virtual hosts in MAMP:
```apache
# Production
<VirtualHost *:8888>
    ServerName crystalkeepsakes.local
    DocumentRoot "C:/MAMP/htdocs/crystalkeepsakes/out"
</VirtualHost>

# Test
<VirtualHost *:8888>
    ServerName test.crystalkeepsakes.local
    DocumentRoot "C:/MAMP/htdocs/crystalkeepsakes/out-test"
</VirtualHost>
```

Then edit your `hosts` file and access:
- `http://crystalkeepsakes.local:8888`
- `http://test.crystalkeepsakes.local:8888`

---

## ⚠️ Important: You DON'T Need This!

**For normal development, you do NOT need to serve built sites from MAMP.**

Just use:
1. MAMP for PHP backend
2. `npm run dev` for frontend

The `/out/` and `/out-test/` folders are ONLY for deploying to GoDaddy.

---

## 📂 Your Current MAMP Setup Should Be:

```
MAMP Document Root: C:\MAMP\htdocs\crystalkeepsakes\

What's in that folder:
├── api/              ← MAMP serves these PHP files
│   ├── stripe/
│   ├── cockpit3d/
│   └── contact.php
│
├── src/              ← Next.js dev server uses these
├── public/           ← Next.js dev server uses these
│
├── out/              ← Ignore (for GoDaddy production)
└── out-test/         ← Ignore (for GoDaddy test)
```

**MAMP access:**
- PHP backend: `http://localhost:8888/crystalkeepsakes/api/`
- That's it!

**Next.js dev server:**
- Frontend: `http://localhost:3000`

---

## 🎯 Summary

### What You Need:

**One MAMP server:**
- Document Root: `C:\MAMP\htdocs\crystalkeepsakes\`
- Purpose: Serve PHP backend APIs
- URL: `http://localhost:8888/crystalkeepsakes/api/`

**One Dev Server:**
- Command: `npm run dev`
- Purpose: Serve React frontend (development)
- URL: `http://localhost:3000`

### What You Don't Need:

❌ Two MAMP servers  
❌ MAMP serving `/out/` or `/out-test/`  
❌ Accessing built sites locally

### Build Outputs Are For Deployment Only:

- `/out/` → Upload to GoDaddy production
- `/out-test/` → Upload to GoDaddy test environment
- Don't run these locally (unless testing specific deployment issues)

---

## 🔧 Your .env File Should Have:

```env
# This tells Next.js dev server where MAMP PHP backend is
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# Rest of your variables...
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_...
```

---

## ✅ Quick Start (Right Now)

```bash
# 1. Make sure MAMP is running (Apache started)

# 2. Add to your .env:
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# 3. Comment out HTTPS redirect in .htaccess (lines 20-21)

# 4. Run dev server:
npm run dev

# 5. Access:
http://localhost:3000

# 6. Test checkout - it will call:
http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php
```

---

## 📝 When to Build

**Build production:**
```bash
npm run build:prod
# Upload /out/ to GoDaddy
```

**Build test:**
```bash
npm run build:test
# Upload /out-test/ to GoDaddy test folder
```

**But for daily development:**
```bash
npm run dev
# No build needed, just code and refresh!
```

---

**TL;DR:** One MAMP (for PHP), one dev server (for React). Don't serve built sites from MAMP.
