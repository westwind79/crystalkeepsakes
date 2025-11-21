# 🔒 Production Security Guide

**CRITICAL: Admin Panel Protection**

## ⚠️ Admin Panel Must NEVER Reach Production

The admin panel at `/admin` is **DEVELOPMENT ONLY** and contains sensitive product management features that must never be accessible on your live website.

---

## 🛡️ Security Layers Implemented

### Layer 1: Build Script Exclusion ✅
**File:** `scripts/prepare-production.sh`

The production build script automatically removes:
- `/admin` directory
- `/api/admin` routes  
- Development documentation
- Test files
- Backup files

**Usage:**
```bash
npm run build:prod
```

This command:
1. Builds the Next.js site
2. Copies API files
3. **Runs prepare-production.sh** (removes admin)
4. Creates clean `/out` directory ready for deployment

### Layer 2: JavaScript Safeguard ⚠️
**File:** `src/app/admin/page.tsx` (lines 23-25)

```javascript
if (typeof window !== 'undefined' && 
    window.location.hostname !== 'localhost' && 
    !window.location.hostname.includes('127.0.0.1')) {
  window.location.href = '/';
}
```

**Note:** This is a backup only. The admin folder should not be deployed at all.

### Layer 3: SEO Protection ✅
**File:** `src/app/admin/layout.tsx`

```typescript
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
```

Prevents search engines from indexing even if accidentally deployed.

---

## 🚀 Deployment Process

### ✅ CORRECT: Production Deployment

```bash
# Step 1: Build with production script
npm run build:prod

# Step 2: Verify admin is removed
ls out/admin  # Should return "No such file or directory"

# Step 3: Check build contents
du -sh out/*

# Step 4: Upload /out directory to server
# Via FTP, SSH, or your hosting platform
```

### ❌ WRONG: Never Do This

```bash
# DON'T use regular build for production
npm run build  # ❌ This keeps admin panel!

# DON'T upload these folders
src/  # ❌ Source code
node_modules/  # ❌ Dependencies
_archive/  # ❌ Old files
project-docs/  # ❌ Documentation
```

---

## 📋 Pre-Deployment Checklist

Before uploading to production:

- [ ] Run `npm run build:prod` (not `npm run build`)
- [ ] Verify `out/admin` does NOT exist
- [ ] Verify `out/api/admin` does NOT exist
- [ ] Check `out/_archive` does NOT exist
- [ ] Verify `out/index.html` exists
- [ ] Verify `out/products/` exists
- [ ] Verify `out/api/` exists (should have stripe, cockpit3d, contact.php)
- [ ] Test production build locally: `npx serve out`
- [ ] Try accessing `http://localhost:3000/admin` (should 404)
- [ ] Only then upload to production server

---

## 🧪 Testing Production Build Locally

```bash
# Build for production
npm run build:prod

# Serve locally to test
npx serve out

# In browser, test these URLs:
# ✅ http://localhost:3000/ (should work)
# ✅ http://localhost:3000/products (should work)
# ✅ http://localhost:3000/about (should work)
# ❌ http://localhost:3000/admin (should 404)
```

---

## 📁 What Gets Deployed

### ✅ Include in Production:
```
out/
├── index.html
├── products/
├── cart/
├── checkout/
├── about/
├── contact/
├── faq/
├── api/
│   ├── contact.php
│   ├── stripe/
│   ├── cockpit3d/
│   └── utils/
├── _next/
├── img/
└── data/
```

### ❌ Exclude from Production:
```
❌ out/admin/           # NEVER DEPLOY
❌ out/api/admin/       # NEVER DEPLOY
❌ out/_archive/        # NEVER DEPLOY
❌ out/project-docs/    # NEVER DEPLOY
❌ out/*.md             # Documentation files
❌ out/test-*.html      # Test files
```

---

## 🔍 Verification Commands

### After Building:
```bash
# Check if admin exists (should fail)
ls out/admin
# Expected output: ls: cannot access 'out/admin': No such file or directory

# Check build size
du -sh out/
# Should be reasonable (not including source files)

# List top-level contents
ls -la out/
# Should NOT see: admin/, _archive/, project-docs/
```

### On Production Server:
```bash
# Via SSH, check deployed files
ls /path/to/deployed/site/admin
# Should return: No such file or directory

# Try accessing admin URL
curl https://crystalkeepsakes.com/admin
# Should return: 404 Not Found
```

---

## 🚨 If Admin Panel is Accidentally Deployed

**Immediate Actions:**

1. **Remove immediately via FTP/SSH:**
   ```bash
   rm -rf /path/to/site/admin
   rm -rf /path/to/site/api/admin
   ```

2. **Verify removal:**
   ```bash
   curl https://crystalkeepsakes.com/admin
   # Must return 404
   ```

3. **Rebuild and redeploy:**
   ```bash
   npm run build:prod
   # Upload new /out directory
   ```

4. **Check access logs:**
   - Review server logs for any access to `/admin`
   - Check if anyone accessed the admin panel
   - Consider changing admin API keys if exposed

---

## 🎯 Different Build Commands

| Command | Purpose | Admin Included? | Use Case |
|---------|---------|----------------|----------|
| `npm run dev` | Development | ✅ Yes | Local development |
| `npm run build` | Regular build | ⚠️ Yes | Testing only |
| `npm run build:test` | Test environment | ⚠️ Yes | Test subdirectory |
| `npm run build:prod` | **Production** | ✅ **NO** | **Live deployment** |

**Always use `build:prod` for production!**

---

## 🔐 Additional Security Recommendations

### 1. .htaccess Protection (Apache)
Add to `/public_html/.htaccess`:
```apache
# Block admin access (backup protection)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^admin(/|$) - [F,L]
</IfModule>
```

### 2. Nginx Configuration
Add to nginx config:
```nginx
# Block admin access
location /admin {
    return 404;
}
```

### 3. Environment Variables
**Never commit:**
- `.env` files with real credentials
- API keys
- Database passwords

**Do commit:**
- `.env.example` (with placeholder values)

### 4. File Permissions
On server:
```bash
# PHP files
chmod 644 api/*.php

# Directories
chmod 755 api/

# Environment files (if any on server)
chmod 600 .env
```

---

## 📞 Emergency Contacts

If admin panel is found in production:
1. Remove immediately
2. Check access logs
3. Review security
4. Consider incident response procedures

---

## ✅ Quick Reference

**Development:**
```bash
npm run dev
# Visit: http://localhost:3000/admin ✅
```

**Production Build:**
```bash
npm run build:prod
# Admin is removed automatically ✅
```

**Verify:**
```bash
ls out/admin
# Should fail: No such file or directory ✅
```

**Deploy:**
```
Upload /out directory only
Admin will not be included ✅
```

---

## 📝 Summary

| ✅ Safe | ❌ Unsafe |
|---------|----------|
| `npm run build:prod` | `npm run build` |
| Upload `/out` only | Upload entire project |
| Test before deploy | Deploy without testing |
| Verify admin removed | Assume it's removed |
| Use production scripts | Use dev builds |

---

**Last Updated:** January 2025  
**Status:** Production security layers active  
**Admin Panel:** Automatically excluded from production builds ✅

**Remember:** The admin panel is a powerful tool for development. Keep it secure by never deploying it to production!
