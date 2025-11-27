# FIX: ERR_SSL_PROTOCOL_ERROR on Localhost

## The Problem
Your .htaccess file is forcing HTTPS redirect, which breaks localhost (MAMP uses HTTP).

---

## Quick Fix - Do This Now:

### Step 1: Edit .htaccess File

Open: `C:\MAMP\htdocs\crystalkeepsakes\.htaccess`

Find these lines (around line 18-21):
```apache
# HTTPS REDIRECT
# ============================================
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Comment them out** (add # at the start):
```apache
# HTTPS REDIRECT - DISABLED FOR LOCAL DEV
# ============================================
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

Save the file.

---

### Step 2: Clear Browser Cache

Your browser remembers the HTTPS redirect (HSTS). Clear it:

**Chrome/Edge:**
1. Type in address bar: `chrome://net-internals/#hsts`
2. In "Delete domain security policies" section
3. Enter: `localhost`
4. Click "Delete"
5. Do the same for: `127.0.0.1`

**Firefox:**
1. Close ALL Firefox windows
2. Delete this file: `C:\Users\YourUsername\AppData\Roaming\Mozilla\Firefox\Profiles\[your-profile]\SiteSecurityServiceState.txt`
3. Restart Firefox

**Safari:**
1. Close Safari
2. Delete: `~/Library/Cookies/HSTS.plist`
3. Restart Safari

---

### Step 3: Access with HTTP (not HTTPS)

Make sure you're typing:
```
http://localhost:8888/crystalkeepsakes/api/test-mamp.php
```

**NOT:**
```
https://localhost:8888/...  ← Wrong! (This causes the error)
```

---

### Step 4: Restart MAMP

1. Stop MAMP servers
2. Start them again
3. Try accessing: `http://localhost:8888/crystalkeepsakes/api/test-mamp.php`

---

## Alternative: Use .htaccess.local

I created a local-safe version. Replace your .htaccess:

```bash
# In: C:\MAMP\htdocs\crystalkeepsakes\
copy .htaccess .htaccess.production
copy .htaccess.local .htaccess
```

This version has HTTPS redirect disabled for local dev.

---

## Why This Happened

Your production .htaccess has:
```apache
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

This forces ALL requests to HTTPS, including localhost.

MAMP uses HTTP (port 8888), not HTTPS, so this breaks local development.

---

## After You Fix It

You should be able to access:
- `http://localhost:8888/crystalkeepsakes/api/test-mamp.php` ✅
- `http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php` ✅
- `http://localhost:3000` (npm run dev) ✅

---

## For Production Deployment

When deploying to GoDaddy, use the production .htaccess with HTTPS enabled:
```bash
copy .htaccess.production .htaccess
# Then upload to GoDaddy
```

Or keep separate .htaccess files:
- `.htaccess` = Local (no HTTPS redirect)
- `.htaccess.production` = Production (with HTTPS redirect)
- Copy the right one when deploying
