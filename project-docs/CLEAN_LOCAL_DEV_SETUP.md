# 🔧 Clean Local Dev Setup - Crystal Keepsakes

## 🚨 **Current Issues Identified:**

1. **Production paths in local .env** → `/home/uydbo2r007mb/public_html/` (Linux server)
2. **Wrong image upload paths** → `crystal-data/order-images` vs `uploads/`
3. **Multiple conflicting .env files** → `.env`, `.env.production`
4. **Parse errors in check scripts**

---

## ✅ **Clean Setup for Windows MAMP**

### **Step 1: Clean Up Conflicting Files**

**Delete these files from your MAMP crystalkeepsakes directory:**
```bash
# In C:\MAMP\htdocs\crystalkeepsakes\
rm .env.production     # Production config (not for local dev)
rm check-env-paths.php # Has parse error
rm test-image-upload.php # Causing timeout
```

---

### **Step 2: Create Clean .env for Local Dev**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\.env`

```bash
# ==================================
# LOCAL DEVELOPMENT (Windows MAMP)
# ==================================

# Environment Mode
NEXT_PUBLIC_ENV_MODE=development

# Backend URL for Next.js frontend
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# ==================================
# STRIPE TEST KEYS
# ==================================
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_51YOUR_TEST_KEY_HERE
STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_51YOUR_TEST_KEY_HERE
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_51YOUR_TEST_KEY_HERE

# Webhook secret (for local testing)
STRIPE_DEVELOPMENT_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# ==================================
# IMAGE UPLOAD PATHS (Local)
# ==================================
# For Windows MAMP - use forward slashes
CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystalkeepsakes/public/img/customer-uploads

# Or relative to project root
# CUSTOMER_IMAGE_PATH=./public/img/customer-uploads

# ==================================
# COCKPIT3D (Optional for local dev)
# ==================================
COCKPIT3D_RETAIL_ID=256568874
COCKPIT3D_USERNAME=your_email@example.com
COCKPIT3D_PASSWORD=your_password

# Use DEV endpoint for testing
COCKPIT3D_BASE_URL=https://c3d-profit-dev.host.alva.tools

# ==================================
# DATABASE (Optional)
# ==================================
DB_HOST=localhost
DB_PORT=8889
DB_NAME=crystal_orders
DB_USER=root
DB_PASSWORD=root
```

---

### **Step 3: Fix Image Upload Directory**

**Create the correct directory structure:**

```bash
# In C:\MAMP\htdocs\crystalkeepsakes\

# Option 1: Use public/img/customer-uploads (RECOMMENDED)
mkdir public\img\customer-uploads

# Option 2: Use uploads/ in project root
mkdir uploads\order-images
```

**Why `public/img/customer-uploads`?**
- ✅ Already web-accessible
- ✅ Next.js serves `/public/` automatically
- ✅ No path confusion
- ✅ Works in both dev and production

---

### **Step 4: Update customer-image-upload.php**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\api\customer-image-upload.php`

**Find this section (around line 20-40):**

```php
// Determine upload directory
$uploadDir = null;

// Check environment variable first
if (isset($_ENV['CUSTOMER_IMAGE_PATH'])) {
    $uploadDir = $_ENV['CUSTOMER_IMAGE_PATH'];
}

// If not set, auto-detect based on environment
if (!$uploadDir) {
    if (strpos(__DIR__, 'MAMP') !== false) {
        // Local MAMP development
        $uploadDir = dirname(__DIR__) . '/public/img/customer-uploads';
    } else {
        // Production server
        $uploadDir = '/home/uydbo2r007mb/public_html/crystal-data/order-images';
    }
}
```

**Replace with:**

```php
// Load environment loader
require_once __DIR__ . '/env-loader.php';

// Determine upload directory
$uploadDir = getEnvVar('CUSTOMER_IMAGE_PATH');

// Fallback: Use public/img/customer-uploads
if (!$uploadDir) {
    // Convert to absolute path
    $projectRoot = dirname(__DIR__);
    $uploadDir = $projectRoot . '/public/img/customer-uploads';
}

// Ensure directory exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
    error_log("Created upload directory: $uploadDir");
}

error_log("Using upload directory: $uploadDir");
```

---

### **Step 5: Clean Up Stripe Webhook**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\api\stripe\stripe-webhook.php`

**Update the `getEnvVariable` function calls:**

Find and replace ALL instances:
```php
getEnvVariable('KEY_NAME')  → getEnvVar('KEY_NAME')
```

**Add at the top (after opening <?php):**
```php
// Load centralized environment loader
require_once dirname(__DIR__) . '/env-loader.php';
```

---

### **Step 6: Update Next.js Frontend Environment**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\.env.local` (create if doesn't exist)

```bash
# Next.js environment variables
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_KEY
```

---

## 🧪 **Test the Clean Setup**

### **Test 1: Environment Variables**
```
http://localhost:8888/crystalkeepsakes/api/debug-env.php
```

**Should show:**
- ✅ .env found at: `C:\MAMP\htdocs\crystalkeepsakes\.env`
- ✅ CUSTOMER_IMAGE_PATH = `C:/MAMP/htdocs/crystalkeepsakes/public/img/customer-uploads`
- ✅ Stripe keys loaded

### **Test 2: Image Upload Directory**
```
http://localhost:8888/crystalkeepsakes/api/test-upload-path.php
```

Create this file:
```php
<?php
require_once __DIR__ . '/env-loader.php';

$uploadDir = getEnvVar('CUSTOMER_IMAGE_PATH');
echo "Upload Directory: $uploadDir\n";
echo "Exists: " . (is_dir($uploadDir) ? "YES" : "NO") . "\n";
echo "Writable: " . (is_writable($uploadDir) ? "YES" : "NO") . "\n";
```

### **Test 3: Checkout Session**

Open `/app/test-mamp-connection.html` and run Test 4

**Expected:**
- ✅ Status 200
- ✅ JSON response with `success: true` and `url`

---

## 📁 **Final Directory Structure**

```
C:\MAMP\htdocs\crystalkeepsakes\
├── .env                          ← SINGLE .env file for local dev
├── api/
│   ├── env-loader.php           ← Centralized env loader
│   ├── debug-env.php            ← Debug tool
│   ├── customer-image-upload.php
│   └── stripe/
│       ├── create-checkout-session.php
│       └── stripe-webhook.php
├── public/
│   └── img/
│       ├── products/             ← Product images
│       └── customer-uploads/    ← Customer uploaded images (local dev)
├── src/                          ← Next.js frontend
└── package.json
```

---

## 🎯 **Quick Recovery Commands**

**In your MAMP crystalkeepsakes directory:**

```bash
# 1. Remove conflicting files
del .env.production
del check-env-paths.php
del test-image-upload.php

# 2. Create upload directory
mkdir public\img\customer-uploads

# 3. Check if vendor exists
dir vendor\stripe

# 4. If vendor missing:
composer install

# 5. Restart MAMP
# (Use MAMP interface)

# 6. Test
# Open: http://localhost:8888/crystalkeepsakes/api/debug-env.php
```

---

## ⚠️ **Production vs Development**

### **Local Dev (MAMP):**
- Single `.env` file
- Paths use `C:/MAMP/htdocs/crystalkeepsakes/`
- Test Stripe keys (`sk_test_...`)
- Images in `public/img/customer-uploads/`

### **Production (Server):**
- `.env.production` file
- Paths use `/home/uydbo2r007mb/public_html/`
- Live Stripe keys (`sk_live_...`)
- Images in `crystal-data/order-images/`

**NEVER mix these configurations!**

---

## 🔧 **Next Steps:**

1. **Clean up** → Remove `.env.production` from local
2. **Create clean .env** → Copy the template above
3. **Fix image path** → Use `public/img/customer-uploads`
4. **Test** → Open debug-env.php
5. **Run checkout test** → test-mamp-connection.html

Let me know what debug-env.php shows after cleanup! 🚀
