# MAMP Setup for Crystal Keepsakes

## Your Issue
`http://localhost:8888/crystalkeepsakes/` isn't working.

## Understanding Your Setup

You have TWO ways to run the site:

### Option 1: Development Server (Recommended for Development)
```bash
npm run dev
```
- Runs on: `http://localhost:3000`
- Hot reload (changes appear instantly)
- PHP backend: `http://localhost:8888/crystalkeepsakes/api/` (via MAMP)

### Option 2: Built Static Site (For Testing Production)
```bash
npm run build:prod
```
- Builds to: `/out/` directory
- Needs to be served by Apache/MAMP
- No hot reload

## The Problem
You're trying to access `http://localhost:8888/crystalkeepsakes/` which expects:
- MAMP to serve from: `C:\MAMP\htdocs\crystalkeepsakes\`
- But your built files are in: `C:\MAMP\htdocs\crystalkeepsakes\out\`

## Solutions

### Solution A: Use npm run dev (RECOMMENDED)
```bash
# In your crystalkeepsakes folder:
npm run dev

# Access at:
http://localhost:3000           ← Frontend
http://localhost:8888/crystalkeepsakes/api/  ← PHP backend (MAMP)
```

**Benefits:**
- Fast hot reload
- Best for development
- Admin panel works
- Checkout works (calls MAMP PHP backend)

### Solution B: Configure MAMP to Serve /out/ Folder

**Option B1: Change MAMP Document Root**
1. Open MAMP
2. Preferences → Web Server
3. Change Document Root to: `C:\MAMP\htdocs\crystalkeepsakes\out`
4. Restart MAMP
5. Access: `http://localhost:8888/`

**Option B2: Create Virtual Host**
1. Create virtual host pointing to `/out/` folder
2. Access via custom domain (e.g., `http://crystalkeepsakes.local`)

**Option B3: Copy .htaccess to Project Root**
Create this file at `C:\MAMP\htdocs\crystalkeepsakes\.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /crystalkeepsakes/
  
  # Redirect everything to /out/ folder
  RewriteRule ^$ out/ [L]
  RewriteRule ^(?!out/)(.*)$ out/$1 [L]
</IfModule>
```

Then access: `http://localhost:8888/crystalkeepsakes/`

### Solution C: Serve Out Folder Directly
Instead of accessing `/crystalkeepsakes/`, access `/crystalkeepsakes/out/`:

```
http://localhost:8888/crystalkeepsakes/out/
```

But this requires updating your `.env`:
```env
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
```

---

## Recommended Development Workflow

### During Development:
```bash
# Terminal 1: Start MAMP (for PHP backend)
# Just make sure MAMP is running

# Terminal 2: Run Next.js dev server
cd C:\MAMP\htdocs\crystalkeepsakes
npm run dev

# Access:
http://localhost:3000  ← Your site
```

### For Testing Production Build:
```bash
# 1. Build
npm run build:prod

# 2. Either:
#    A) Configure MAMP to serve /out/ folder (see above)
#    B) Or access: http://localhost:8888/crystalkeepsakes/out/
```

---

## Current State

**Your files:**
```
C:\MAMP\htdocs\crystalkeepsakes\
├── src/              ← Source code
├── public/           ← Static assets
├── out/              ← Built site (after npm run build)
├── api/              ← PHP backend files
└── .htaccess         ← Production .htaccess (not for MAMP root)
```

**What MAMP sees at `http://localhost:8888/crystalkeepsakes/`:**
- Project root (source files, not built site)
- .htaccess file designed for production
- No index.html (it's in /out/)

**What should happen:**
- Use `npm run dev` for development OR
- Configure MAMP to serve `/out/` folder

---

## Quick Fix (Right Now)

**If you want to use MAMP:**
```bash
# Option 1: Access the out folder directly
http://localhost:8888/crystalkeepsakes/out/

# Option 2: Just use npm run dev instead
npm run dev
# Then go to: http://localhost:3000
```

**If you want checkout to work:**
1. Add to your `.env` file:
   ```env
   NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
   ```
2. Restart: `npm run dev`
3. Checkout will call MAMP PHP backend

---

## Summary

**For development, you should be using:**
```bash
npm run dev               # Frontend on :3000
# MAMP running             # PHP backend on :8888
```

**Not:**
```bash
http://localhost:8888/crystalkeepsakes/  # This is project root, not built site
```

The built site is in `/out/` and is meant for deployment to GoDaddy, not for daily development.
