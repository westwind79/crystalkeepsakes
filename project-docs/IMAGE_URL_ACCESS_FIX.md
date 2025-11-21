# Image URL Access Fix
**Issue:** Images save successfully but aren't accessible via URL  
**Error:** `https://crystalkeepsakes.com/uploads/order-images/TEST-xxx/image.png` returns 404

---

## The Problem

Images are stored in: `/public_html/crystal-data/order-images/`  
But URL tries to access: `/public_html/crystalkeepsakes.com/uploads/order-images/`  

**These don't match!** Need to map the URL to actual file location.

---

## Solution 1: .htaccess RewriteRule (RECOMMENDED)

### Step 1: Upload .htaccess to Root

Upload the `.htaccess` file to:
```
/public_html/crystalkeepsakes.com/.htaccess
```

**Key line:**
```apache
RewriteRule ^uploads/order-images/(.*)$ ../crystal-data/order-images/$1 [L]
```

This maps:
- URL: `/uploads/order-images/ORDER-123/image.jpg`
- To file: `../crystal-data/order-images/ORDER-123/image.jpg`

### Step 2: Test

Visit: `https://crystalkeepsakes.com/uploads/order-images/TEST-xxx/test-item-001_raw.png`

**Expected:** Image displays  
**If 404:** Try Solution 2 below

---

## Solution 2: PHP Proxy Script (Fallback)

If .htaccess doesn't work on GoDaddy shared hosting, use PHP proxy:

### Step 1: Upload serve-image.php

Upload `serve-image.php` to:
```
/public_html/crystalkeepsakes.com/serve-image.php
```

### Step 2: Update image-storage.php

Change the `getImageUrl` function to use the proxy:

**File:** `/api/stripe/image-storage.php`

**Find:**
```php
private function getImageUrl($orderNumber, $filename) {
    $baseUrl = 'https://crystalkeepsakes.com/uploads/order-images';
    return "{$baseUrl}/{$orderNumber}/{$filename}";
}
```

**Replace with:**
```php
private function getImageUrl($orderNumber, $filename) {
    // Use PHP proxy for image serving
    $path = urlencode("{$orderNumber}/{$filename}");
    return "https://crystalkeepsakes.com/serve-image.php?path={$path}";
}
```

### Step 3: Test

Visit: `https://crystalkeepsakes.com/serve-image.php?path=TEST-xxx/test-item-001_raw.png`

**Expected:** Image displays

---

## Solution 3: Symbolic Link (If SSH Available)

If you have SSH access and server allows symlinks:

```bash
cd /public_html/crystalkeepsakes.com
mkdir -p uploads
ln -s ../crystal-data/order-images uploads/order-images
```

This creates a symbolic link so:
- URL: `/uploads/order-images/` 
- Points to: `../crystal-data/order-images/`

**Test:** Check if symlink works:
```bash
ls -la /public_html/crystalkeepsakes.com/uploads/order-images
# Should show: order-images -> ../crystal-data/order-images
```

---

## Solution 4: Direct Access (Simple but exposes path)

Change URLs to access crystal-data directly:

**Update image-storage.php:**

```php
private function getImageUrl($orderNumber, $filename) {
    // Direct access to crystal-data (exposes structure)
    return "https://crystalkeepsakes.com/../crystal-data/order-images/{$orderNumber}/{$filename}";
}
```

**Pros:** Simple, no configuration  
**Cons:** Ugly URL, exposes directory structure

---

## Testing Each Solution

### After .htaccess Upload
```bash
# Test direct URL
curl -I https://crystalkeepsakes.com/uploads/order-images/TEST-xxx/test-item-001_raw.png

# Should return:
HTTP/1.1 200 OK
Content-Type: image/png
```

### After PHP Proxy Upload
```bash
# Test proxy URL
curl -I "https://crystalkeepsakes.com/serve-image.php?path=TEST-xxx/test-item-001_raw.png"

# Should return:
HTTP/1.1 200 OK
Content-Type: image/png
```

### After Symlink Creation
```bash
# Check symlink exists
ssh user@crystalkeepsakes.com
ls -la /public_html/crystalkeepsakes.com/uploads/

# Test URL
curl -I https://crystalkeepsakes.com/uploads/order-images/TEST-xxx/test-item-001_raw.png
```

---

## Recommended Approach

**Priority order:**
1. **Try .htaccess first** (cleanest URLs)
2. **If .htaccess fails, use PHP proxy** (most reliable on shared hosting)
3. **If you have SSH, try symlink** (best performance)
4. **Direct access as last resort** (works but ugly)

---

## Quick Test

After implementing any solution:

1. **Run test upload again:**
   ```
   https://crystalkeepsakes.com/test-godaddy-upload.php
   ```

2. **Copy the URL from output**

3. **Open URL in browser:**
   - ✅ Should display image
   - ❌ If 404, try next solution

4. **Check browser console (F12):**
   - Should see no 404 errors for image

---

## For /test Subdirectory

Also update `/test/.htaccess` with same image mapping:

```apache
# Add before Next.js routing rules
RewriteRule ^uploads/order-images/(.*)$ ../../crystal-data/order-images-test/$1 [L]
```

Note: Uses `order-images-test` for testing environment.

---

## Debugging Tips

### Check if .htaccess is being read
```bash
# Add an error on purpose to test
RewriteRule ^test-error$ /nonexistent [L]

# Visit: https://crystalkeepsakes.com/test-error
# If you get 404, .htaccess is working
# If you get nothing, .htaccess isn't being read
```

### Check Apache error logs (cPanel)
1. cPanel → Metrics → Errors
2. Look for "File does not exist" or rewrite errors
3. This tells you exactly what path Apache is looking for

### Check PHP error logs
```php
// In serve-image.php, add at top:
error_log("Requested path: " . $_GET['path']);
error_log("Full image path: " . $imagePath);
error_log("File exists: " . (file_exists($imagePath) ? 'yes' : 'no'));

// Check logs in cPanel → Metrics → Errors
```

---

## Why This Happens

**Reason 1:** URL path doesn't match file system path  
- URL: `/crystalkeepsakes.com/uploads/order-images/`
- File: `/crystal-data/order-images/`

**Reason 2:** Web server doesn't know about crystal-data  
- Files outside web root need explicit mapping

**Reason 3:** Shared hosting restrictions  
- GoDaddy may not allow certain .htaccess directives
- Symlinks may be disabled
- Need workarounds like PHP proxy

---

## Final Check

Once images are accessible:

1. **Test from Order Confirmation Page:**
   - Place test order
   - Check order confirmation shows image
   - Image should load without errors

2. **Test in Email:**
   - Order confirmation email
   - Should display customer image
   - Check image URL in email source

3. **Test for Cockpit3D:**
   - Image URL must be accessible
   - Cockpit3D needs to download image
   - Must work without authentication

---

## Is This Critical?

**YES - Images must be web-accessible for:**
- ✅ Customer order confirmations
- ✅ Admin order management
- ✅ Cockpit3D order processing
- ✅ Customer service/support

**Without web access:**
- ❌ Customers can't see their order
- ❌ Cockpit3D can't retrieve images
- ❌ Orders can't be fulfilled

---

**TLDR:** Upload `.htaccess` first, test URL. If that doesn't work, use `serve-image.php` proxy.

**Current Status:** Images save ✅ | Images accessible via URL ❌ (needs fix)

**Last Updated:** 2025-01-19
