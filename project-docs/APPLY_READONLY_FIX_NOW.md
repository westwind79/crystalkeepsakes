# 🚨 URGENT: Apply Read-Only Fix to Your Local MAMP

## The Problem
Uploaded images still have read-only flag, causing copy/view issues.

## Quick Fix (Apply Immediately)

### Step 1: Update Your PHP Upload Script

Open your local file:
```
C:\MAMP\htdocs\crystalkeepsakes\api\upload-image.php
```

Find this section (around line 210-220):
```php
// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
    throw new Exception('Failed to save uploaded file');
}

// ✅ FIX PERMISSIONS: Make file readable by everyone (Next.js needs to read it)
chmod($uploadPath, 0644);
chmod($uploadDir, 0755);
```

**Add this code RIGHT AFTER the chmod lines:**

```php
// ✅ WINDOWS FIX: Remove read-only flag using attrib command
// Windows sometimes marks uploaded files as read-only
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    $escapedPath = escapeshellarg($uploadPath);
    exec("attrib -R $escapedPath", $output, $returnCode);
    
    // Also try via PowerShell as backup
    if ($returnCode !== 0) {
        $psCommand = "Set-ItemProperty -Path $escapedPath -Name IsReadOnly -Value \$false";
        exec("powershell -Command \"$psCommand\"", $output2, $returnCode2);
    }
}
```

Save the file.

---

### Step 2: Fix Existing Images

**Run this command in Command Prompt:**
```cmd
cd C:\MAMP\htdocs\crystalkeepsakes
attrib -R public\img\products\cockpit3d\*.* /S
```

OR double-click:
```
fix-readonly-files.bat
```

---

### Step 3: Test Upload

1. Go to admin panel: http://localhost:8888/crystalkeepsakes/admin
2. Upload a new image
3. Check if it's visible immediately (no permission error)

---

## Alternative: Pull from Git (If you're syncing with this environment)

```bash
cd C:\MAMP\htdocs\crystalkeepsakes
git pull origin v9
```

This will get the updated `api/upload-image.php` file.

---

## Verification

After uploading a new image, check if it's read-only:

```cmd
attrib C:\MAMP\htdocs\crystalkeepsakes\public\img\products\cockpit3d\114\product_114_*.png
```

**Should show:**
```
    A    C:\...\product_114_xxx.png
```

**Should NOT show:**
```
   AR    C:\...\product_114_xxx.png  ❌ (R = read-only)
```

---

## Why This Works

The fix runs Windows `attrib -R` command immediately after upload to remove the read-only flag before Next.js or browser tries to access it.

---

Last Updated: 2025-11-25
