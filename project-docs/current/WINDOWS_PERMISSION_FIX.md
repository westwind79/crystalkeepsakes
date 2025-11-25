# 🔧 Windows Permission Issues - Complete Fix Guide

## The Problem

When uploading images via admin panel on Windows/MAMP, you may encounter:

1. **"Permission denied" when uploading**
   - Directory doesn't have write permissions
   
2. **"You don't have permission to view this file"**
   - File was created but marked as **read-only**
   - Windows file attributes blocking access
   
3. **Build fails with EPERM errors**
   - Files locked or read-only
   - Yarn cache issues

## Quick Fix (Choose One)

### Option 1: PowerShell (Recommended)
```powershell
# Right-click PowerShell > Run as Administrator
cd C:\MAMP\htdocs\crystalkeepsakes
.\fix-readonly-files.ps1
```

### Option 2: Batch File
```cmd
# Double-click or run in Command Prompt
fix-readonly-files.bat
```

### Option 3: Manual (Command Prompt)
```cmd
cd C:\MAMP\htdocs\crystalkeepsakes
attrib -R public\img\products\cockpit3d\*.* /S
```

---

## Complete Step-by-Step Fix

### Step 1: Fix Directory Permissions
**Run as Administrator:**
```cmd
fix-upload-permissions.bat
```

**What it does:**
- Gives your Windows user full control of upload directories
- Sets permissions on `/public/img/products/cockpit3d/`
- Allows PHP to create/write files

### Step 2: Remove Read-Only Flags
**Run as Administrator:**
```cmd
fix-readonly-files.bat
```
OR
```powershell
.\fix-readonly-files.ps1
```

**What it does:**
- Scans all product images
- Removes read-only flag from each file
- Makes files accessible to browser and Next.js

### Step 3: Clear Caches (If Still Issues)
```cmd
clear-caches.bat
```

**What it does:**
- Clears Next.js cache (`.next` folder)
- Clears Yarn cache
- Removes build outputs
- Fresh start for everything

### Step 4: Test Upload
1. Open admin panel: http://localhost:8888/crystalkeepsakes/admin
2. Select a product
3. Try uploading an image
4. Should succeed without errors

---

## Why This Happens

### Windows File System
- Windows marks uploaded files as **read-only** by default
- MAMP/PHP doesn't always have permission to change this
- `chmod()` in PHP doesn't work properly on Windows
- Need to use `attrib` command instead

### Yarn Cache
- Yarn caches node_modules with restrictive permissions
- Can cause issues with file operations
- `yarn cache clean` fixes most issues

### File Locks
- Windows holds file locks longer than Linux/Mac
- Antivirus can lock files during scan
- File Explorer locks files when folder is open
- Next.js dev server watches files (creates locks)

---

## Updated PHP Upload Script

The `/api/upload-image.php` script now includes:

```php
// ✅ WINDOWS FIX: Remove read-only flag using attrib command
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

**This automatically removes the read-only flag on new uploads!**

---

## Prevention Tips

### 1. Run Fix Scripts Regularly
```cmd
# After uploading multiple images:
fix-readonly-files.bat
```

### 2. Close File Explorer
- Don't keep `/public/img/products/` open in File Explorer
- Windows locks files when viewing thumbnails
- Close the folder before uploading

### 3. Stop Dev Server Before Building
```cmd
# Terminal 1: Stop dev server
Ctrl+C

# Wait 2-3 seconds

# Terminal 2: Build
yarn build:test
```

### 4. Clear Caches Periodically
```cmd
# Once a week or when weird issues occur:
clear-caches.bat
yarn install
```

### 5. Use Safe Build Script
```cmd
# Always use the safe build wrapper:
yarn build:test    # (uses safe-build.js)
```

---

## Troubleshooting

### Issue: "Upload directory is not writable"
**Fix:**
```cmd
# Run as Administrator:
fix-upload-permissions.bat
```

### Issue: "You don't have permission to view this file"
**Fix:**
```cmd
# Remove read-only flags:
fix-readonly-files.bat
```

### Issue: Build fails with EPERM
**Fix:**
```cmd
# 1. Close all file explorers
# 2. Stop dev server (Ctrl+C)
# 3. Wait 5 seconds
# 4. Use safe build:
yarn build:test
```

### Issue: Images don't show in admin gallery
**Fix:**
```cmd
# 1. Remove read-only flags:
fix-readonly-files.bat

# 2. Clear browser cache:
Ctrl+Shift+Delete (Chrome/Edge)

# 3. Hard refresh admin page:
Ctrl+F5
```

### Issue: Yarn cache errors
**Fix:**
```cmd
clear-caches.bat
yarn install
```

---

## Files Created

| File | Purpose |
|------|---------|
| `fix-upload-permissions.bat` | Set directory write permissions |
| `fix-readonly-files.bat` | Remove read-only flags (simple) |
| `fix-readonly-files.ps1` | Remove read-only flags (detailed) |
| `clear-caches.bat` | Clear all caches |
| `safe-build.js` | Build wrapper with lock handling |

---

## Manual Verification

### Check File Permissions
```cmd
# View file attributes:
attrib C:\MAMP\htdocs\crystalkeepsakes\public\img\products\cockpit3d\114\product_114_*.png

# Should NOT show 'R' (read-only)
# Good:     A    (Archive only)
# Bad:      AR   (Archive + Read-only)
```

### Check Directory Permissions
```powershell
# PowerShell:
Get-Acl C:\MAMP\htdocs\crystalkeepsakes\public\img\products | Format-List

# Should show your user with FullControl
```

### Test Upload Manually
```cmd
# Try creating a test file:
echo test > C:\MAMP\htdocs\crystalkeepsakes\public\img\products\cockpit3d\test.txt

# If it fails, permissions are wrong
# If it succeeds but file is read-only, run fix-readonly-files.bat
```

---

## When to Run Each Script

### Before First Upload (One Time)
```cmd
fix-upload-permissions.bat
```

### After Uploading Images
```cmd
fix-readonly-files.bat
```

### Before Building
```cmd
# Use the safe build (already handles locks):
yarn build:test
```

### When Weird Errors Occur
```cmd
clear-caches.bat
fix-readonly-files.bat
yarn install
```

---

## Success Criteria

✅ Upload image in admin panel → No "permission denied" error
✅ Image appears in gallery immediately
✅ Image can be viewed in browser
✅ Build succeeds without EPERM errors
✅ No yarn cache warnings

---

## Summary

The permission issue has **three parts**:

1. **Directory permissions** → Run `fix-upload-permissions.bat` once
2. **Read-only files** → Run `fix-readonly-files.bat` after uploads  
3. **File locks** → Use `yarn build:test` (safe-build.js handles it)

**New uploads are now auto-fixed** by the updated PHP script!

---

Last Updated: 2025-11-25
**Status**: ✅ FIXED - Run the fix scripts and you're good to go!
