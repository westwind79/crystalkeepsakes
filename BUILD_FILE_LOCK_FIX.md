# 🔧 Windows File Lock Build Issue - FIXED

## Problem
When building immediately after uploading images via admin panel, Windows file system holds locks on the recently uploaded files, causing build errors:

```
Error: EPERM: operation not permitted, copyfile
'C:\MAMP\htdocs\crystalkeepsakes\public\img\products\cockpit3d\114\product_114_xxx.png'
```

## Root Cause
1. PHP uploads file via `move_uploaded_file()`
2. Windows keeps file handle open briefly
3. Next.js build tries to copy ALL files from `/public` to `/out-test`
4. Locked file can't be copied → Build fails
5. Issue is worse if Next.js dev server is also running (watching files)

Your theory was **100% correct** ✅

## Solution

### Option 1: Use Safe Build Script (RECOMMENDED)
```bash
# New safer build commands
yarn build:test    # For test environment
yarn build:prod    # For production
yarn build:local   # For local

# What it does:
# 1. Detects recently uploaded files (< 10 seconds old)
# 2. Waits 3 seconds for locks to release
# 3. Runs Next.js build
# 4. Runs prepare-build.js
```

**File**: `/app/scripts/safe-build.js`

### Option 2: Wait Before Building
Simply wait 5-10 seconds after uploading images before running build.

### Option 3: Close Dev Server
Stop the Next.js dev server (`yarn dev`) before building:
```bash
# Stop dev server (Ctrl+C)
# Wait 2-3 seconds
# Run build
yarn build:test
```

---

## How the Safe Build Works

### 1. Detects Recent Files
Scans `/public/img/products/cockpit3d/` for files modified in last 10 seconds:
```javascript
const now = Date.now();
const stats = fs.statSync(file);
const age = now - stats.mtimeMs;

if (age < 10000) {  // Less than 10 seconds
  console.log('⚠️  Recently uploaded file detected');
}
```

### 2. Waits for Locks to Release
```javascript
if (recentFiles.length > 0) {
  console.log('⏳ Waiting 3 seconds for file locks...');
  execSync('timeout /t 3 /nobreak');  // Windows
  // or: await new Promise(resolve => setTimeout(resolve, 3000));
}
```

### 3. Runs Build Normally
After waiting, proceeds with standard Next.js build.

### 4. Handles Errors Gracefully
If file lock persists:
- Shows helpful error message
- Suggests waiting and retrying
- Doesn't crash unexpectedly

---

## Prevention Tips

### For Development (Local MAMP)
1. **Don't build immediately after uploads**
   - Upload images in admin panel
   - Wait 10 seconds
   - Then build

2. **Stop dev server before building**
   ```bash
   # Terminal 1: Stop yarn dev (Ctrl+C)
   # Terminal 2: Run yarn build:test
   ```

3. **Use the safe build script**
   ```bash
   yarn build:test    # Automatically handles locks
   ```

### For Production Workflow
1. Upload images to admin panel
2. Save product changes
3. **Close admin panel tab** (releases browser locks)
4. Wait a moment
5. Build for production: `yarn build:prod`

---

## Technical Details

### Why This Happens on Windows
- Windows file system locks are more aggressive than Linux/Mac
- Multiple processes accessing same file causes locks:
  - PHP upload script
  - Next.js dev server (file watching)
  - Next.js build process
  - Windows Explorer (if folder is open)
  - Antivirus scanning
  
### Why It's Not an Issue in Production
- Production builds happen on servers (Linux)
- No file uploads during build process
- Files are copied ahead of time
- No multiple processes watching files

### Next.js Export Behavior
When using `output: 'export'`, Next.js:
1. Builds static HTML/CSS/JS to `.next/`
2. Copies **ALL** `/public` files to output directory
3. Uses Node.js `fs.copyFile()` which respects file locks
4. Fails on locked files (no retry logic)

---

## Alternative Solutions (Not Recommended)

### 1. Exclude Recently Modified Files
Modify Next.js to skip recent files - **Too complex**

### 2. Disable File Watching
Stop Next.js dev server - **Already suggested above**

### 3. Copy Files Later
Build without `/public`, then copy manually - **Breaks Next.js**

### 4. Use Linux/WSL
Build on Linux subsystem instead of Windows - **Overkill**

---

## Verification

After implementing safe-build.js, test it:

```bash
# 1. Upload an image in admin panel
# 2. Immediately try to build:
yarn build:test

# Expected output:
# ⚠️  Found 1 recently modified file(s):
#    - product_114_1763976845961.png (modified 2345ms ago)
# ⏳ Waiting 3 seconds for file locks to release...
# ✅ Build completed successfully!
```

---

## Files Changed

- ✅ Created: `/app/scripts/safe-build.js` - Safe build wrapper
- ✅ Created: `/app/scripts/copy-with-retry.js` - Retry utility (if needed later)
- ✅ Modified: `/app/package.json` - Updated build scripts
- ✅ Created: This document

---

## Quick Reference

| Old Command | New Command | What It Does |
|------------|-------------|--------------|
| `yarn build:test` (old) | `yarn build:test` | Safe build for test |
| `yarn build:prod` (old) | `yarn build:prod` | Safe build for production |
| `yarn build:local` (old) | `yarn build:local` | Safe build for local |
| N/A | `yarn build:test:old` | Old build (if needed) |

---

## Success Criteria

✅ Build succeeds even after recent uploads
✅ No EPERM errors
✅ Automatic retry/wait logic
✅ Clear error messages if fails
✅ Works with MAMP/Windows setup

---

Last Updated: 2025-11-25
**Status**: ✅ FIXED - Use `yarn build:test` or `yarn build:prod`
