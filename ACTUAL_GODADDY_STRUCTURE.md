# Your ACTUAL GoDaddy Directory Structure
**Critical:** crystalkeepsakes.com is a FOLDER inside exposethegrove.com

---

## Your Real Structure

```
/home/username/public_html/
  ├── exposethegrove.com/              ← Your main domain
  │   ├── (exposethegrove files)
  │   │
  │   └── crystalkeepsakes.com/        ← Addon domain as folder
  │       ├── api/
  │       ├── out/
  │       ├── test/
  │       └── .env.production
  │
  └── crystal-data/                     ← NEW: Store images here!
      ├── order-images/                 ← Production images
      └── order-images-test/            ← Testing images
```

## Why This Structure?

### ✅ Option 1: `/public_html/crystal-data/` (RECOMMENDED)
**Path:** `/home/username/public_html/crystal-data/`

**Pros:**
- Above BOTH domains (exposethegrove.com AND crystalkeepsakes.com)
- Not tied to either website
- Can be accessed by both if needed
- Still in public_html so web-accessible

**Cons:**
- None really - this is the best option

**URL:** `https://exposethegrove.com/crystal-data/` OR `https://crystalkeepsakes.com/../crystal-data/` (with proper config)

### ⚠️ Option 2: Inside exposethegrove.com folder
**Path:** `/home/username/public_html/exposethegrove.com/crystal-data/`

**Pros:**
- Easy to find
- Same level as crystalkeepsakes.com folder

**Cons:**
- Tied to exposethegrove.com domain
- Confusing - why are crystalkeepsakes images in exposethegrove folder?
- If you ever remove exposethegrove, images are gone

**URL:** `https://exposethegrove.com/crystal-data/`

### ❌ Option 3: Outside public_html
**Path:** `/home/username/crystal-data/`

**Pros:**
- Completely isolated from websites

**Cons:**
- NOT web-accessible (can't serve images via URL)
- Would need complex proxy setup
- Not recommended for shared hosting

---

## RECOMMENDED SETUP

### Step 1: Create Directory at Root of public_html

**Via cPanel File Manager:**
1. Navigate to `/public_html/` (NOT into exposethegrove.com)
2. Create folder: `crystal-data`
3. Inside `crystal-data/`, create:
   - `order-images/`
   - `order-images-test/`
4. Set permissions: 755 for all

**Via FTP:**
```
Connect to: yourdomain.com
Navigate to: /public_html/
Create: crystal-data/
Create: crystal-data/order-images/
Create: crystal-data/order-images-test/
```

### Step 2: Update .env.production

```bash
# CORRECT path for your setup
CUSTOMER_IMAGE_PATH=/home/username/public_html/crystal-data/order-images

# NOT this (would be inside exposethegrove):
# CUSTOMER_IMAGE_PATH=/home/username/public_html/exposethegrove.com/crystal-data/order-images
```

### Step 3: Configure Web Access

You need to make images accessible via crystalkeepsakes.com URL.

**Option A: Direct Access (if GoDaddy allows)**

Images automatically accessible at:
`https://crystalkeepsakes.com/../../crystal-data/order-images/`

But that's ugly. Use .htaccess instead:

**Option B: .htaccess Alias (RECOMMENDED)**

Create `/public_html/crystalkeepsakes.com/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Serve images from crystal-data
    RewriteRule ^uploads/order-images/(.*)$ ../../crystal-data/order-images/$1 [L]
    
    # Your other rules...
</IfModule>
```

Now images are accessible at:
`https://crystalkeepsakes.com/uploads/order-images/ORDER-123/image.jpg`

Which actually serves from:
`/public_html/crystal-data/order-images/ORDER-123/image.jpg`

---

## Alternative: Symbolic Link (if allowed)

Some shared hosting allows symlinks:

```bash
cd /home/username/public_html/exposethegrove.com/crystalkeepsakes.com/
ln -s ../../crystal-data/uploads ./uploads
```

This creates a link so:
- Path `/crystalkeepsakes.com/uploads/` 
- Points to `/public_html/crystal-data/uploads/`

Test if this works on your GoDaddy account.

---

## Verify Your Current Structure

**1. Find your actual path:**
```bash
# SSH into server
cd ~/public_html
pwd
# Should show: /home/username/public_html

ls -la
# Look for: exposethegrove.com/

cd exposethegrove.com
ls -la
# Look for: crystalkeepsakes.com/
```

**2. Check where crystalkeepsakes files are:**
```bash
find ~/public_html -name "api" -type d
# Should show: /home/username/public_html/exposethegrove.com/crystalkeepsakes.com/api/
```

**3. Verify the path in PHP:**

Upload this file to crystalkeepsakes.com folder: `check-path.php`

```php
<?php
echo "Current file location:\n";
echo __FILE__ . "\n\n";

echo "Directory structure:\n";
echo __DIR__ . "\n";
echo dirname(__DIR__) . "\n";
echo dirname(dirname(__DIR__)) . "\n";
echo dirname(dirname(dirname(__DIR__))) . "\n";

echo "\nRecommended crystal-data path:\n";
$publicHtml = dirname(dirname(dirname(__DIR__)));
echo "$publicHtml/crystal-data/order-images/\n";
?>
```

Visit: `https://crystalkeepsakes.com/check-path.php`

This will show you the EXACT paths to use.

---

## Update image-storage.php for Your Structure

The current auto-detection should work, but let's make it explicit:

```php
public function __construct($uploadDir = null, $maxFileSizeMB = 5) {
    if ($uploadDir === null) {
        $uploadDir = getenv('CUSTOMER_IMAGE_PATH');
        
        if (!$uploadDir) {
            // For your specific structure:
            // Current: /home/username/public_html/exposethegrove.com/crystalkeepsakes.com/api/stripe/
            // Target:  /home/username/public_html/crystal-data/order-images/
            
            $currentDir = __DIR__;  // /api/stripe/
            $apiDir = dirname($currentDir);  // /api/
            $projectRoot = dirname($apiDir);  // /crystalkeepsakes.com/
            $exposethegroveDir = dirname($projectRoot);  // /exposethegrove.com/
            $publicHtml = dirname($exposethegroveDir);  // /public_html/
            
            $uploadDir = $publicHtml . '/crystal-data/order-images';
            
            error_log("Auto-detected path: $uploadDir");
        }
    }
    
    $this->uploadDir = $uploadDir;
    // ... rest of code
}
```

---

## Test It

1. **Create crystal-data at public_html root:**
   `/home/username/public_html/crystal-data/order-images/`

2. **Update .env.production with correct path**

3. **Run test:**
   `php test-godaddy-upload.php`

4. **Verify:**
   - File saved to: `/home/username/public_html/crystal-data/order-images/TEST-xxx/`
   - NOT in: `/public_html/exposethegrove.com/` or `/crystalkeepsakes.com/`

5. **Check web access:**
   Try: `https://crystalkeepsakes.com/uploads/order-images/TEST-xxx/image.jpg`
   Or: `https://exposethegrove.com/crystal-data/order-images/TEST-xxx/image.jpg`

---

## Summary

**Your structure is:**
```
public_html/
  ├── exposethegrove.com/
  │   └── crystalkeepsakes.com/  ← Your site here
  │
  └── crystal-data/  ← Images here (same level as exposethegrove.com folder)
      └── order-images/
```

**NOT:**
```
public_html/
  └── exposethegrove.com/
      ├── crystalkeepsakes.com/
      └── crystal-data/  ← DON'T put it here!
```

**Why:** crystal-data should be independent of both domains, at the public_html root level.

---

**Next:** Run `check-path.php` to confirm your exact structure!
