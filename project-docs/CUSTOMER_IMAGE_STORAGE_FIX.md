# 🚨 CRITICAL: Customer Image Storage Issue
**Date:** 2025-01-19  
**Priority:** URGENT - Data Loss Risk  
**Status:** REQUIRES IMMEDIATE FIX

---

## ⚠️ THE PROBLEM

### Current Setup (WRONG!)
```
/app/
  ├── api/
  │   ├── stripe/
  │   │   └── image-storage.php
  │   └── uploads/              ← Customer images here
  │       └── order-images/
  │           └── [order-number]/
  │               └── assets/
  │
  ├── public/
  │   └── uploads/              ← OR here?
  │
  └── out/                      ← Build output
      └── uploads/              ← Gets DELETED on every build!
```

### What Happens Now
1. Customer uploads image
2. Image saved to `api/uploads/order-images/[order-number]/`
3. Build script runs: `npm run build:prod`
4. `/out` directory is DELETED and recreated
5. **❌ ALL CUSTOMER IMAGES ARE LOST!**

### Risk Level: 🔴 CRITICAL
- **Data Loss:** Customer images deleted on every deployment
- **Legal Risk:** Lost customer photos = angry customers
- **Business Risk:** Cannot fulfill orders without images

---

## ✅ THE SOLUTION

### Option 1: Store OUTSIDE Project Directory (RECOMMENDED)
```
Server filesystem:
/var/www/                      ← Web root
  ├── crystalkeepsakes/        ← Your Next.js app
  │   ├── out/                 ← Gets rebuilt
  │   └── api/                 ← PHP files
  │
  └── crystal-data/            ← NEW: Persistent storage
      └── order-images/
          └── [order-number]/
              └── assets/
```

**Pros:**
- ✅ Images never deleted
- ✅ Survives all builds/deployments
- ✅ Can be backed up separately
- ✅ Can set different permissions

**Cons:**
- ⚠️ Need to configure web server to serve from this path
- ⚠️ Need to ensure PHP has write permissions

---

### Option 2: Database Storage (BEST for Scale)
```
Store images as base64 in MySQL/PostgreSQL

orders table:
  - order_id
  - order_number
  - customer_email
  
order_images table:
  - id
  - order_id
  - image_type (raw/preview/masked)
  - image_data (MEDIUMBLOB or TEXT)
  - created_at
```

**Pros:**
- ✅ Never lost in deploys
- ✅ Easy to backup (database backups)
- ✅ Can replicate across servers
- ✅ Transactional (atomic operations)

**Cons:**
- ⚠️ Database can get large
- ⚠️ Slower than filesystem for large images
- ⚠️ Need proper indexing

---

### Option 3: Cloud Storage (BEST for Production)
```
Use AWS S3 / Google Cloud Storage / Cloudflare R2

crystalkeepsakes-orders/
  └── [order-number]/
      └── raw_image.jpg
      └── preview_image.jpg
      └── masked_image.png
```

**Pros:**
- ✅ Unlimited scalability
- ✅ Automatic backups
- ✅ CDN delivery
- ✅ Never lost
- ✅ Pay per use

**Cons:**
- ⚠️ Monthly cost
- ⚠️ Need API credentials
- ⚠️ Requires code changes

---

## 🔧 IMMEDIATE FIX (Option 1)

### Step 1: Create Persistent Upload Directory

**On your server:**
```bash
# Go to web root (parent of your project)
cd /var/www  # or wherever your site lives

# Create persistent data directory OUTSIDE project
mkdir -p crystal-data/order-images
chmod 755 crystal-data
chmod 775 crystal-data/order-images

# Give web server write permissions
chown -R www-data:www-data crystal-data/order-images  # Ubuntu/Debian
# OR
chown -R apache:apache crystal-data/order-images      # CentOS/RHEL
# OR
chown -R nginx:nginx crystal-data/order-images        # Nginx
```

### Step 2: Update PHP Upload Handler

Update `/app/api/stripe/image-storage.php`:

```php
public function __construct($uploadDir = null, $maxFileSizeMB = 5) {
    // BEFORE (WRONG - Inside project):
    // $this->uploadDir = $uploadDir ?? dirname(__DIR__) . '/uploads/order-images';
    
    // AFTER (CORRECT - Outside project):
    if ($uploadDir === null) {
        // Try to get from environment variable first
        $uploadDir = getenv('CUSTOMER_IMAGE_PATH');
        
        if (!$uploadDir) {
            // Fallback: Go up to web root and into persistent directory
            $uploadDir = dirname(dirname(dirname(__DIR__))) . '/crystal-data/order-images';
        }
    }
    
    $this->uploadDir = $uploadDir;
    $this->maxFileSize = $maxFileSizeMB * 1024 * 1024;
    
    // Create directory if it doesn't exist
    if (!file_exists($this->uploadDir)) {
        if (!mkdir($this->uploadDir, 0775, true)) {
            error_log("Failed to create upload directory: {$this->uploadDir}");
            throw new Exception('Upload directory not accessible');
        }
    }
    
    // Verify directory is writable
    if (!is_writable($this->uploadDir)) {
        error_log("Upload directory not writable: {$this->uploadDir}");
        throw new Exception('Upload directory not writable');
    }
}
```

### Step 3: Configure Web Server

**Apache (.htaccess or virtualhost):**
```apache
# Allow access to persistent upload directory
Alias /uploads/order-images /var/www/crystal-data/order-images

<Directory /var/www/crystal-data/order-images>
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all denied
    
    # Only allow access from your PHP scripts
    <FilesMatch "\.(jpg|jpeg|png|gif)$">
        Require all granted
    </FilesMatch>
</Directory>
```

**Nginx:**
```nginx
# In your server block
location /uploads/order-images {
    alias /var/www/crystal-data/order-images;
    
    # Deny directory listing
    autoindex off;
    
    # Only serve images
    location ~ \.(jpg|jpeg|png|gif)$ {
        try_files $uri =404;
    }
    
    # Deny access to anything else
    location ~ .* {
        deny all;
    }
}
```

### Step 4: Add to Environment Variables

Add to `.env.production`:
```bash
# Customer Image Storage
CUSTOMER_IMAGE_PATH=/var/www/crystal-data/order-images
```

### Step 5: Test Upload

```php
// Test script: test-upload.php
<?php
require_once 'api/stripe/image-storage.php';

$storage = new ImageStorage();

// Test base64 image (1x1 red pixel)
$testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

try {
    $result = $storage->saveImageFromBase64(
        $testImage,
        'TEST-' . time(),
        'test-item',
        'raw'
    );
    
    echo "✅ Success!\n";
    echo "File saved to: {$result['filepath']}\n";
    echo "File size: {$result['size']} bytes\n";
    
    // Verify file exists
    if (file_exists($result['filepath'])) {
        echo "✅ File verified on filesystem\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
}
```

---

## 📋 MIGRATION PLAN

### If You Already Have Customer Images

```bash
# 1. Find current images
cd /var/www/crystalkeepsakes
find . -name "order-images" -type d

# 2. Copy to new location (DON'T MOVE - keep backup!)
cp -r api/uploads/order-images/* /var/www/crystal-data/order-images/
# OR
cp -r public/uploads/order-images/* /var/www/crystal-data/order-images/

# 3. Verify copy
ls -la /var/www/crystal-data/order-images/

# 4. Test that images are accessible
curl https://crystalkeepsakes.com/uploads/order-images/TEST-123/test.jpg

# 5. Only after confirming working, remove old location
# rm -rf api/uploads/order-images  # BE CAREFUL!
```

---

## 🔒 SECURITY CONSIDERATIONS

### Direct Access Protection
Customer images should NOT be directly accessible to everyone:

```php
// Create image-proxy.php
<?php
// Only serve images to authorized users or for specific purposes

$requestedFile = $_GET['file'] ?? '';
$orderNumber = $_GET['order'] ?? '';

// Validate order number matches file path
// Verify user has permission (order confirmation link, admin, etc.)

if (/* authorized */) {
    $imagePath = "/var/www/crystal-data/order-images/{$orderNumber}/{$requestedFile}";
    
    if (file_exists($imagePath)) {
        header('Content-Type: image/jpeg');
        header('Content-Length: ' . filesize($imagePath));
        readfile($imagePath);
    }
}
```

### Permissions Best Practice
```bash
# Uploads directory
chmod 755 /var/www/crystal-data
chmod 775 /var/www/crystal-data/order-images

# Individual order directories (created by PHP)
# Should be 755 - readable by web server, writable by PHP

# Individual images
# Should be 644 - readable by all, writable by owner
```

---

## 📊 MONITORING & BACKUP

### Disk Space Monitoring
```bash
# Check upload directory size
du -sh /var/www/crystal-data/order-images

# Monitor growth
watch -n 300 'du -sh /var/www/crystal-data/order-images'
```

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/var/backups/crystal-images"
SOURCE_DIR="/var/www/crystal-data/order-images"
DATE=$(date +%Y%m%d)

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/images-$DATE.tar.gz" "$SOURCE_DIR"

# Keep only last 30 days
find "$BACKUP_DIR" -name "images-*.tar.gz" -mtime +30 -delete
```

Add to crontab:
```bash
# Daily at 2 AM
0 2 * * * /path/to/backup-images.sh
```

---

## 🧪 TESTING CHECKLIST

- [ ] Create persistent upload directory outside project
- [ ] Update image-storage.php with new path
- [ ] Configure web server alias/location
- [ ] Test upload with test script
- [ ] Verify file appears in new location
- [ ] Test image is accessible via URL
- [ ] Deploy code update
- [ ] Run build: `npm run build:prod`
- [ ] Verify images still exist after build
- [ ] Place test order with real image
- [ ] Confirm image saved correctly
- [ ] Verify image accessible in order confirmation
- [ ] Check Cockpit3D receives correct image
- [ ] Set up backup script
- [ ] Monitor disk space

---

## 📞 ROLLBACK PLAN

If new storage location fails:

1. **Stop accepting new orders** (temporarily)
2. Copy images back to old location
3. Revert PHP code changes
4. Restart web server
5. Test with existing order
6. Debug issue
7. Try again with fix

---

## Related Files

- `/app/api/stripe/image-storage.php` - Main upload handler
- `/app/api/stripe/create-checkout-session.php` - Creates orders
- `/app/api/stripe/stripe-webhook.php` - Processes webhooks
- `/app/src/lib/cockpit3d-order-builder.ts` - Builds Cockpit3D orders

---

**URGENCY:** This should be fixed BEFORE processing any real customer orders!

**Last Updated:** 2025-01-19  
**Status:** Requires immediate implementation
