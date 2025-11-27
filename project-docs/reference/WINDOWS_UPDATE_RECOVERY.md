# 🚨 Windows Update Broke My Dev Environment - Recovery Checklist

## What Happened

**A Windows Update reset/broke:**
1. ❌ PHP PATH environment variable
2. ❌ PHP extensions (php.ini reset to default)
3. ❌ Hosts file permissions
4. ❌ MAMP admin privileges
5. ❌ File associations
6. ❌ Antivirus settings

**This is NORMAL after Windows Updates!** Especially major ones (feature updates).

---

## ⚡ Complete Recovery (Step by Step)

### Step 1: Run MAMP as Administrator

**Set permanently:**
1. Close MAMP
2. Right-click MAMP icon → Properties
3. Compatibility tab
4. ✓ Check "Run as administrator"
5. Apply → OK
6. Start MAMP

**✅ This fixes:** Hosts file blocked error

---

### Step 2: Add PHP to PATH

**Quick test:**
```bash
php -v
```

**If error "not recognized":**

1. Press `Win + R`
2. Type: `sysdm.cpl`
3. Advanced → Environment Variables
4. Edit "Path" under System Variables
5. Add: `C:\MAMP\bin\php\php8.2.0` (your version)
6. OK everything
7. **Restart Command Prompt**

**Test:**
```bash
php -v
composer --version
```

**✅ This fixes:** PHP and Composer commands

---

### Step 3: Enable PHP Extensions

**Location:**
```
C:\MAMP\bin\php\php8.2.0\php.ini
```

**Edit with Notepad, find these lines:**
```ini
;extension=curl
;extension=openssl
;extension=mbstring
;extension=fileinfo
```

**Remove semicolons:**
```ini
extension=curl
extension=openssl
extension=mbstring
extension=fileinfo
```

**Save, then restart MAMP Apache**

**Test:**
```bash
php -m | findstr curl
php -m | findstr openssl
```

**✅ This fixes:** Composer SSL/TLS, Stripe library installation

---

### Step 4: Install Dependencies

```bash
cd C:\MAMP\htdocs\crystalkeepsakes
composer install
npm install
```

**✅ This fixes:** Missing Stripe library, Node modules

---

### Step 5: Verify Project Files

**Check these exist:**
```bash
# 1. Environment file
dir .env

# 2. Stripe library
dir vendor\stripe

# 3. Node modules
dir node_modules

# 4. .htaccess (local, no HTTPS)
type .htaccess | findstr https
# Should NOT find HTTPS redirect
```

---

### Step 6: Fix .htaccess (if needed)

**Your .htaccess should have NO HTTPS redirect for local:**

```apache
# ❌ REMOVE THIS (if present):
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**Download correct local version:**
[.htaccess-mamp-root](computer:///mnt/user-data/outputs/.htaccess-mamp-root)

**✅ This fixes:** ERR_SSL_PROTOCOL_ERROR

---

### Step 7: Clear Browser Cache

**The HTTPS redirect might be cached!**

**Chrome:**
```
chrome://net-internals/#hsts
→ Delete domain: localhost, crystalkeepsakes
```

**Or use Incognito:**
```
Ctrl+Shift+N
```

**✅ This fixes:** Cached redirects

---

### Step 8: Test Everything

```bash
# 1. Test MAMP
http://localhost:8888/crystalkeepsakes/

# 2. Test PHP
http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php
# Should show: "Method not allowed" ✅

# 3. Test Next.js dev
npm run dev
# Visit: http://localhost:3000

# 4. Test build
npm run build:local
```

---

## 📋 Full Diagnostic Script

Run this to check everything:

```batch
@echo off
echo ========================================
echo Windows Update Recovery Check
echo ========================================
echo.

REM 1. Check PHP
echo [1] Checking PHP...
php -v >nul 2>&1
if errorlevel 1 (
    echo [X] PHP not in PATH
) else (
    echo [+] PHP working
)

REM 2. Check Composer
echo [2] Checking Composer...
composer --version >nul 2>&1
if errorlevel 1 (
    echo [X] Composer not working
) else (
    echo [+] Composer working
)

REM 3. Check PHP extensions
echo [3] Checking PHP extensions...
php -m | findstr curl >nul 2>&1
if errorlevel 1 (
    echo [X] curl extension missing
) else (
    echo [+] curl extension enabled
)

php -m | findstr openssl >nul 2>&1
if errorlevel 1 (
    echo [X] openssl extension missing
) else (
    echo [+] openssl extension enabled
)

REM 4. Check project files
echo [4] Checking project files...
cd C:\MAMP\htdocs\crystalkeepsakes

if exist .env (
    echo [+] .env exists
) else (
    echo [X] .env missing
)

if exist vendor\autoload.php (
    echo [+] Stripe library installed
) else (
    echo [X] Stripe library missing - run: composer install
)

if exist node_modules (
    echo [+] Node modules installed
) else (
    echo [X] Node modules missing - run: npm install
)

REM 5. Check MAMP
echo [5] Checking MAMP...
curl -s http://localhost:8888/ >nul 2>&1
if errorlevel 1 (
    echo [X] MAMP not responding
) else (
    echo [+] MAMP accessible
)

echo.
echo ========================================
pause
```

**Save as:** `check-after-windows-update.bat`

---

## 🛡️ Prevent This in Future

### 1. Backup Your Settings

**Create a backup script:**

```batch
@echo off
REM Backup MAMP configuration

set BACKUP_DIR=C:\MAMP-Backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%
mkdir %BACKUP_DIR%

REM Backup php.ini
copy C:\MAMP\bin\php\php8.2.0\php.ini %BACKUP_DIR%\

REM Backup project .env
copy C:\MAMP\htdocs\crystalkeepsakes\.env %BACKUP_DIR%\

REM Backup .htaccess
copy C:\MAMP\htdocs\crystalkeepsakes\.htaccess %BACKUP_DIR%\

REM Export PATH
set > %BACKUP_DIR%\environment-variables.txt

echo Backup saved to: %BACKUP_DIR%
pause
```

**Run this BEFORE Windows updates!**

---

### 2. Document Your PATH

**Save your current PATH:**
```batch
echo %PATH% > C:\my-path-backup.txt
```

**After Windows Update:**
```batch
# Compare
type C:\my-path-backup.txt
echo %PATH%
```

---

### 3. Version Lock Critical Software

**In your project:**

```json
// package.json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "next": "15.5.6",  // Lock to stable version
    "react": "19.1.0"
  }
}
```

```json
// composer.json
{
  "require": {
    "stripe/stripe-php": "^18.2.0"
  }
}
```

---

## 🎯 Quick Recovery Commands

**Copy/paste this entire block after Windows Update:**

```bash
# 1. Install dependencies
cd C:\MAMP\htdocs\crystalkeepsakes
composer install
npm install

# 2. Test PHP
php -v
php -m | findstr curl
php -m | findstr openssl

# 3. Test MAMP
curl http://localhost:8888/crystalkeepsakes/

# 4. Test Next.js
npm run dev
```

---

## 📊 Common Windows Updates That Break Things

| Update Type | What Breaks | Frequency |
|-------------|-------------|-----------|
| Feature Update (22H2, 23H2) | Everything | 1-2x/year |
| Quality Update (monthly) | PATH, permissions | Monthly |
| Cumulative Update | php.ini, settings | Monthly |
| Security Update | Antivirus, UAC | As needed |

**Feature Updates are the worst!** They basically reinstall Windows.

---

## 💡 Pro Tips

### 1. Delay Windows Updates

**Windows 11 Pro:**
- Settings → Windows Update
- Pause updates → 5 weeks
- Update when you're ready

### 2. Use WSL2 Instead

**Windows Subsystem for Linux:**
- Isolated from Windows Updates
- Linux environment (more stable)
- Still accessible from Windows

### 3. Use Docker

**Containerized development:**
- Completely isolated
- Reproducible
- Not affected by Windows

### 4. Regular Backups

**Every week:**
```bash
# Backup project
xcopy C:\MAMP\htdocs\crystalkeepsakes D:\Backups\crystalkeepsakes\ /E /I /Y

# Backup MAMP config
xcopy C:\MAMP\bin\php\php8.2.0\php.ini D:\Backups\mamp-config\ /Y
```

---

## 🚨 Emergency Recovery Files

**Keep these files handy:**

1. **[fix-mamp-php-path.bat](computer:///mnt/user-data/outputs/fix-mamp-php-path.bat)** - Fixes PHP PATH
2. **[enable-php-extensions.bat](computer:///mnt/user-data/outputs/enable-php-extensions.bat)** - Fixes php.ini
3. **[fix-mamp-hosts.bat](computer:///mnt/user-data/outputs/fix-mamp-hosts.bat)** - Fixes hosts file
4. **[.htaccess-mamp-root](computer:///mnt/user-data/outputs/.htaccess-mamp-root)** - Correct .htaccess
5. **[.env](computer:///mnt/user-data/outputs/.env)** - Environment template

**Save to USB drive or cloud!**

---

## ✅ Final Checklist

After Windows Update, verify:

- [ ] MAMP runs as administrator
- [ ] PHP in PATH (`php -v` works)
- [ ] Composer works (`composer --version`)
- [ ] PHP extensions enabled (curl, openssl)
- [ ] Stripe library installed (`vendor/stripe/`)
- [ ] Node modules installed
- [ ] .env file exists with Stripe keys
- [ ] .htaccess has NO HTTPS redirect
- [ ] Browser cache cleared
- [ ] `http://localhost:8888/crystalkeepsakes/` loads
- [ ] Checkout works

---

## 🎉 You're Not Alone!

**This happens to EVERY developer on Windows!**

Common reactions:
- 😱 "Everything was working yesterday!"
- 😤 "I didn't change anything!"
- 🤬 "Why does Windows do this?!"
- 😭 "It took hours to fix!"

**It's not your fault. It's Windows.**

---

## TL;DR

**Windows Update broke:**
1. PHP PATH
2. php.ini (extensions disabled)
3. Hosts file permissions
4. MAMP settings

**Fix everything:**
1. Run MAMP as admin
2. Add PHP to PATH
3. Enable curl/openssl in php.ini
4. Run `composer install`
5. Clear browser cache
6. Test everything

**Keep recovery scripts handy for next time!** ✅
