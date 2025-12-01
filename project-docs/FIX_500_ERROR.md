# 🔧 Fix 500 Internal Server Error

## 🎯 **The Problem:**
```
Response: 500 Internal Server Error
Response body: (empty)
```

This means PHP is **crashing** before it can return JSON. Most likely:
- Missing Stripe library (`vendor/autoload.php`)
- Missing `.env` file
- PHP syntax error
- Missing environment variables

---

## 🔍 **Step 1: Check PHP Error Logs**

### **Find MAMP Error Logs:**

**Mac:**
```bash
# Apache error log
tail -f /Applications/MAMP/logs/apache_error.log

# PHP error log
tail -f /Applications/MAMP/logs/php_error.log
```

**Windows:**
```bash
# Apache error log
type C:\MAMP\logs\apache_error.log

# PHP error log
type C:\MAMP\logs\php_error.log
```

**Or in MAMP interface:**
- Open MAMP
- Click "Open Logs"
- Look for latest errors

---

## 🔍 **Step 2: Check Custom Error Log**

The checkout PHP file creates its own log:

```bash
# Check if this file exists
cat /Applications/MAMP/htdocs/crystalkeepsakes/api/stripe/checkout_session_errors.log

# OR Windows
type C:\MAMP\htdocs\crystalkeepsakes\api\stripe\checkout_session_errors.log
```

---

## 🔧 **Most Likely Fix: Missing Composer Dependencies**

### **Check if vendor/ exists:**
```bash
cd /Applications/MAMP/htdocs/crystalkeepsakes  # Mac
# OR
cd C:\MAMP\htdocs\crystalkeepsakes  # Windows

# Check vendor directory
ls -la vendor/
```

### **If vendor/ is missing or empty:**
```bash
# Install Stripe PHP library
composer require stripe/stripe-php

# OR reinstall everything
composer install
```

---

## 🔧 **Fix #2: Create Missing .env File**

### **Check if .env exists:**
```bash
ls -la .env
```

### **If missing, create it:**
```bash
# Copy from example
cp .env.example .env

# Edit with your test Stripe keys
nano .env  # or use any text editor
```

### **Minimum required in .env:**
```bash
# Environment
NEXT_PUBLIC_ENV_MODE=development

# Stripe TEST keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Cockpit3D (optional for testing)
COCKPIT3D_RETAIL_ID=256568874
```

---

## 🔧 **Fix #3: Enable PHP Error Display (Temporarily)**

Add this to the TOP of `/api/stripe/create-checkout-session.php`:

```php
<?php
// TEMPORARY: Show errors for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Rest of your code...
```

Then run Test 4 again - you'll see the actual error!

---

## 🧪 **Quick Debug Test**

Create this file: `/Applications/MAMP/htdocs/crystalkeepsakes/api/test-env.php`

```php
<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo json_encode([
    'php_version' => phpversion(),
    'vendor_exists' => file_exists(__DIR__ . '/../vendor/autoload.php'),
    'env_exists' => file_exists(__DIR__ . '/../.env'),
    'stripe_key_set' => !empty(getenv('STRIPE_DEVELOPMENT_SECRET_KEY')),
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'script_path' => __FILE__
], JSON_PRETTY_PRINT);
```

Then test: `http://localhost:8888/crystalkeepsakes/api/test-env.php`

**Expected output:**
```json
{
    "php_version": "8.x.x",
    "vendor_exists": true,
    "env_exists": true,
    "stripe_key_set": true,
    "document_root": "/Applications/MAMP/htdocs/crystalkeepsakes",
    "script_path": "/Applications/MAMP/htdocs/crystalkeepsakes/api/test-env.php"
}
```

---

## 🎯 **Action Plan - Do These NOW:**

### **1. Check vendor directory**
```bash
cd /Applications/MAMP/htdocs/crystalkeepsakes
ls -la vendor/stripe
```

**If missing:**
```bash
composer install
```

### **2. Check .env file**
```bash
cat .env | grep STRIPE_DEVELOPMENT_SECRET_KEY
```

**If empty or missing:**
- Copy from `.env.example`
- Add your test Stripe keys from https://dashboard.stripe.com/test/apikeys

### **3. Enable error display**
Add to top of `create-checkout-session.php`:
```php
ini_set('display_errors', 1);
error_reporting(E_ALL);
```

### **4. Restart MAMP**
Stop and start servers

### **5. Run test again**
Open `test-mamp-connection.html` → Test 4

---

## 💡 **Common Issues & Solutions**

### **Issue: "vendor/autoload.php not found"**
```bash
composer install
```

### **Issue: "Stripe secret key not found"**
```bash
# Check .env file
cat .env

# Add if missing
echo "STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_KEY" >> .env
```

### **Issue: "Class 'Stripe\Stripe' not found"**
```bash
composer require stripe/stripe-php
```

---

## 📞 **Share With Me:**

After trying the fixes above, share:

1. **Output from test-env.php:**
   ```
   http://localhost:8888/crystalkeepsakes/api/test-env.php
   ```

2. **Last 10 lines of error log:**
   ```bash
   tail -10 /Applications/MAMP/logs/apache_error.log
   ```

3. **Result from Test 4 after fixes**

Then I can pinpoint the exact issue! 🚀
