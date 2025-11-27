# GoDaddy Shared Hosting Setup Guide
**Version:** 1.0.0  
**Date:** 2025-01-19  
**Hosting:** GoDaddy Shared Hosting with cPanel

---

## Your Directory Structure

### On GoDaddy Server
```
/home/username/
  ├── public_html/
  │   ├── crystal-data/              ← NEW: Store images here
  │   │   ├── order-images/          ← Production images
  │   │   └── order-images-test/     ← Testing images
  │   │
  │   └── crystalkeepsakes.com/      ← Your Next.js site
  │       ├── api/                   ← PHP backend
  │       ├── out/                   ← Build output (gets deleted/rebuilt)
  │       ├── .env.production
  │       └── .env.production.test
```

### Local MAMP
```
htdocs/
  └── crystalkeepsakes/
      ├── api/
      ├── src/
      └── .env (for local dev)
```

### Local Next.js Dev
```
Project runs on: localhost:3000
Uses: .env
```

---

## Why This Structure?

### ✅ GOOD: Store in `/public_html/crystal-data/`
- **Accessible via URL:** `https://crystalkeepsakes.com/crystal-data/order-images/`
- **Persistent:** Outside your project, survives builds
- **Web accessible:** Can serve images to customers
- **Easy backup:** Can download via FTP

### ❌ BAD: Store in `/public_html/crystalkeepsakes.com/`
- **Gets deleted:** `/out` folder rebuilt every deploy
- **Data loss:** Customer images gone on every build

---

## Step 1: Create Image Storage Directory (cPanel)

### Via cPanel File Manager
1. Log into GoDaddy cPanel
2. Open **File Manager**
3. Navigate to `/public_html/`
4. Click **+ Folder**
5. Create folder: `crystal-data`
6. Enter `crystal-data` folder
7. Create subfolder: `order-images`
8. Create subfolder: `order-images-test`
9. Set permissions to **755** for all folders

### Via FTP (FileZilla, etc.)
1. Connect to your GoDaddy FTP
2. Navigate to `/public_html/`
3. Create folder: `crystal-data`
4. Inside `crystal-data/`, create:
   - `order-images/`
   - `order-images-test/`
5. Right-click folders → File Permissions → **755**

### Via SSH (if available)
```bash
ssh username@crystalkeepsakes.com
cd public_html
mkdir -p crystal-data/order-images
mkdir -p crystal-data/order-images-test
chmod 755 crystal-data
chmod 755 crystal-data/order-images
chmod 755 crystal-data/order-images-test
```

---

## Step 2: Update PHP Image Storage

The code is already updated! `/api/stripe/image-storage.php` now:
1. Checks environment variable `CUSTOMER_IMAGE_PATH`
2. Falls back to auto-detection
3. Stores images OUTSIDE project directory

No code changes needed! Just set environment variables.

---

## Step 3: Update Environment Files

### On GoDaddy Server: `.env.production`
```bash
# Crystal Keepsakes - Production Environment
NEXT_PUBLIC_ENV_MODE=production
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com

# Stripe LIVE Keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY_HERE
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Customer Images - GoDaddy Path
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images

# Database (from cPanel)
DB_HOST=localhost
DB_NAME=yourdatabase_crystalkeepsakes
DB_USER=yourdatabase_user
DB_PASS=your_database_password
```

**Important:** Replace `/home/username/` with your actual path!

**Find your path via cPanel:**
1. File Manager → Settings → Show "Full Path" in title
2. Look at browser title bar
3. Copy the full path

### On GoDaddy Server: `.env.production.test`
```bash
# Crystal Keepsakes - Testing Environment (/test subdirectory)
NEXT_PUBLIC_ENV_MODE=testing
NEXT_PUBLIC_BASE_PATH=/test
NEXT_PUBLIC_PHP_BACKEND_URL=https://crystalkeepsakes.com/test

# Stripe TEST Keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE

# Customer Images - Testing Path
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images-test

# Database (same or separate test DB)
DB_HOST=localhost
DB_NAME=yourdatabase_crystalkeepsakes_test
DB_USER=yourdatabase_user
DB_PASS=your_database_password
```

---

## Step 4: Setup MySQL Database (cPanel)

### Create Database
1. cPanel → **MySQL Databases**
2. Create New Database: `crystalkeepsakes`
3. Create New User: `crystal_user`
4. Add User to Database
5. Grant **ALL PRIVILEGES**
6. Note the full database name (usually: `username_crystalkeepsakes`)

### Import Schema
1. cPanel → **phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Choose file: `/schema.sql`
5. Click **Go**

**Verify tables created:**
- `orders`
- `order_status_history`
- `order_images`
- `contact_submissions`

---

## Step 5: Configure .htaccess for Image Access

Create `/public_html/.htaccess` (or add to existing):

```apache
# Crystal Keepsakes Configuration

# Allow access to customer images
<Directory "/home/username/public_html/crystal-data/order-images">
    Options -Indexes
    AllowOverride None
    Require all granted
    
    # Only serve image files
    <FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
        Require all granted
    </FilesMatch>
    
    # Deny access to other file types
    <FilesMatch "^(?!(.*\.(jpg|jpeg|png|gif|webp)$)).*$">
        Require all denied
    </FilesMatch>
</Directory>

# Redirect all to HTTPS (if not already)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js static export
# Your existing rules...
```

**Note:** Replace `/home/username/` with your actual path

---

## Step 6: Test Image Upload

### Create Test Script

Upload `test-godaddy-upload.php` to `/public_html/crystalkeepsakes.com/`:

```php
<?php
/**
 * GoDaddy Image Upload Test
 */

// Load environment
function loadEnv($envFile) {
    if (!file_exists($envFile)) {
        echo "❌ .env file not found: $envFile\n";
        return;
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        putenv("$name=$value");
    }
}

loadEnv(__DIR__ . '/.env.production');

require_once __DIR__ . '/api/stripe/image-storage.php';

echo "=== GoDaddy Image Upload Test ===\n\n";

try {
    $storage = new ImageStorage();
    
    // Test image
    $testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    $orderNumber = 'TEST-GODADDY-' . time();
    
    echo "Order Number: $orderNumber\n";
    echo "Testing upload...\n\n";
    
    $result = $storage->saveImageFromBase64(
        $testImage,
        $orderNumber,
        'test-item',
        'raw'
    );
    
    echo "✅ SUCCESS!\n\n";
    echo "File Path: {$result['filepath']}\n";
    
    // Check location
    if (strpos($result['filepath'], 'crystal-data') !== false) {
        echo "✅ File is in persistent storage!\n";
    } else {
        echo "⚠️  File might be in project directory\n";
    }
    
    // Check if accessible via URL
    $expectedUrl = "https://crystalkeepsakes.com/crystal-data/order-images/$orderNumber/{$result['filename']}";
    echo "\nExpected URL:\n$expectedUrl\n";
    echo "\nTest this URL in browser after running script.\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: {$e->getMessage()}\n";
}

echo "\n=== Test Complete ===\n";
?>
```

### Run Test
```bash
ssh username@crystalkeepsakes.com
cd public_html/crystalkeepsakes.com
php test-godaddy-upload.php
```

Or visit: `https://crystalkeepsakes.com/test-godaddy-upload.php`

---

## Step 7: Update Local Environment

### For MAMP (`htdocs/crystalkeepsakes/.env`)
```bash
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# Test Stripe Keys
STRIPE_DEVELOPMENT_SECRET_KEY=sk_test_YOUR_TEST_KEY
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY

# Local Images (inside MAMP for testing)
CUSTOMER_IMAGE_PATH=/Applications/MAMP/htdocs/crystal-data/order-images

# Local Database
DB_HOST=localhost
DB_NAME=crystalkeepsakes_local
DB_USER=root
DB_PASS=root
```

### For Next.js Dev (`project/.env`)
```bash
NEXT_PUBLIC_ENV_MODE=development
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes

# Test Stripe Keys
NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
```

---

## Deployment Workflow

### Initial Deployment
```bash
# 1. Build production
npm run build:prod

# 2. Upload via FTP/SFTP/cPanel:
#    - Upload /out/* to /public_html/crystalkeepsakes.com/
#    - Upload /api/* to /public_html/crystalkeepsakes.com/api/
#    - Upload .env.production to /public_html/crystalkeepsakes.com/

# 3. Verify .env.production paths are correct

# 4. Test upload:
php test-godaddy-upload.php
```

### Deploy to /test Subdirectory
```bash
# 1. Build testing
npm run build:test

# 2. Upload to /test:
#    - Upload /out/* to /public_html/crystalkeepsakes.com/test/
#    - Upload /api/* to /public_html/crystalkeepsakes.com/test/api/
#    - Upload .env.production.test to /public_html/crystalkeepsakes.com/test/
```

### Regular Updates
```bash
# 1. Build
npm run build:prod

# 2. Upload only changed files
#    - /out/* (static files)
#    - /api/* (if PHP changed)
#    
# 3. DO NOT touch crystal-data/ folder!
#    Customer images are there and should never be deleted
```

---

## Database Connection

### Update `/api/stripe/db-connect.php`

Already exists, just verify it reads from .env:

```php
<?php
function getEnvVariable($key) {
    // Load from .env.production
    static $env = null;
    if ($env === null) {
        $envFile = __DIR__ . '/../.env.production';
        if (file_exists($envFile)) {
            $env = parse_ini_file($envFile);
        }
    }
    return $env[$key] ?? getenv($key);
}

$host = getEnvVariable('DB_HOST');
$name = getEnvVariable('DB_NAME');
$user = getEnvVariable('DB_USER');
$pass = getEnvVariable('DB_PASS');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    throw new Exception('Database connection failed');
}
?>
```

---

## Verification Checklist

### Before Going Live
- [ ] MySQL database created with `schema.sql`
- [ ] `/public_html/crystal-data/order-images/` exists (755)
- [ ] `.env.production` has correct paths
- [ ] `.env.production` has LIVE Stripe keys (sk_live_*)
- [ ] `test-godaddy-upload.php` runs successfully
- [ ] Test image accessible via URL
- [ ] Debug panel hidden on production
- [ ] Console clean (no debug logs)

### Testing Environment
- [ ] `/public_html/crystal-data/order-images-test/` exists
- [ ] `.env.production.test` configured
- [ ] `/test` subdirectory has separate build
- [ ] Debug panel visible on /test
- [ ] Test Stripe keys working

### Database
- [ ] Tables created: orders, order_status_history, order_images, contact_submissions
- [ ] Test order inserts successfully
- [ ] Images table records file paths correctly

---

## Backup Strategy

### Database Backup (cPanel)
1. cPanel → **phpMyAdmin**
2. Select database
3. Click **Export**
4. Format: SQL
5. Download
6. Store safely

**Automate:** Use cPanel **Backup Wizard** for scheduled backups

### Image Backup (FTP)
```bash
# Download entire image directory
ftp crystalkeepsakes.com
cd public_html/crystal-data
get -r order-images/ ./local-backup/
```

**Schedule:** Download monthly or after major sales

---

## Troubleshooting

### Images Not Saving
```bash
# Check directory exists
ls -la /home/username/public_html/crystal-data/

# Check permissions
ls -la /home/username/public_html/crystal-data/order-images/

# Should be: drwxr-xr-x (755)
```

### Images Not Accessible via URL
1. Check `.htaccess` configuration
2. Verify path in .htaccess matches actual path
3. Test direct URL: `https://crystalkeepsakes.com/crystal-data/order-images/test.jpg`

### Database Connection Failed
1. Verify database name in cPanel (has prefix)
2. Check user has ALL PRIVILEGES
3. Verify .env.production has correct credentials
4. Test: `php -r "require 'api/stripe/db-connect.php'; echo 'Connected!';"`

### "Permission Denied" Errors
```bash
# Set correct permissions
chmod 755 /home/username/public_html/crystal-data
chmod 755 /home/username/public_html/crystal-data/order-images
```

---

## Support

### GoDaddy Resources
- **cPanel:** https://yourdomain.com:2083
- **Support:** 1-480-505-8877
- **Help:** https://www.godaddy.com/help

### File Paths
- **Home:** `/home/username/`
- **Web Root:** `/home/username/public_html/`
- **Project:** `/home/username/public_html/crystalkeepsakes.com/`
- **Images:** `/home/username/public_html/crystal-data/order-images/`

---

**Last Updated:** 2025-01-19  
**Next Step:** Run database setup and test image upload!
