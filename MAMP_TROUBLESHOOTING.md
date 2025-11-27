# 🔧 MAMP + Next.js Local Dev Troubleshooting

## 🔴 **Current Error:**
```
Failed to fetch
at src/app/checkout/page.tsx:69
```

**Translation**: Next.js (localhost:3000) cannot connect to MAMP (localhost:8888/crystalkeepsakes)

---

## 🎯 **Quick Diagnosis Checklist**

### **Step 1: Verify MAMP is Running**
```bash
# Open browser and test:
http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php

# Expected: HTTP 405 error (Method not allowed - needs POST)
# Bad: Connection refused / Cannot connect
```

### **Step 2: Check CORS in PHP**
The PHP file MUST allow localhost:3000. Check this:

**File**: `/api/stripe/create-checkout-session.php` (lines 14-24)
```php
$allowedOrigins = [
    'http://localhost:3000',  // ← MUST be here
    'http://localhost:8888',
    'https://crystalkeepsakes.com'
];

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

### **Step 3: Test Backend Directly**
```bash
# Use curl to test if PHP is responding
curl -X POST http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"cartItems":[],"subtotal":0,"orderNumber":"TEST"}'

# Expected: JSON error about empty cart
# Bad: Connection refused / HTML error page
```

### **Step 4: Check Frontend Environment**
Create `.env.local` in `/app/` (if not exists):
```bash
NEXT_PUBLIC_PHP_BACKEND_URL=http://localhost:8888/crystalkeepsakes
NEXT_PUBLIC_ENV_MODE=development
```

Then restart Next.js:
```bash
yarn dev
```

---

## 🛠️ **Common MAMP Issues & Fixes**

### **Issue 1: MAMP Stops After Branch Switch**

**Cause**: Git branch switching might change:
- `composer.lock` → Different vendor packages
- `.htaccess` files → Different Apache config
- `.env` files → Missing credentials

**Fix**:
```bash
# 1. Stop MAMP completely

# 2. In your MAMP project directory:
cd /Applications/MAMP/htdocs/crystalkeepsakes  # Mac
# OR
cd C:\MAMP\htdocs\crystalkeepsakes  # Windows

# 3. Reinstall composer dependencies
composer install

# 4. Check .env file exists and has correct values
cat .env

# 5. Restart MAMP
# Check Apache error logs in MAMP interface
```

### **Issue 2: Vendor Autoload Missing**

**Error**: `Failed opening required 'vendor/autoload.php'`

**Fix**:
```bash
# In your MAMP crystalkeepsakes directory
composer install

# If that fails:
composer dump-autoload
```

### **Issue 3: Port Conflicts**

**Check if port 8888 is taken**:
```bash
# Mac/Linux
lsof -i :8888

# Windows
netstat -ano | findstr :8888
```

### **Issue 4: Apache Not Starting**

**Check MAMP logs**:
- Mac: `/Applications/MAMP/logs/apache_error.log`
- Windows: `C:\MAMP\logs\apache_error.log`

**Common causes**:
- Port already in use (change to 8889)
- `.htaccess` syntax error
- PHP syntax error in any .php file
- Missing PHP extensions

---

## 🔥 **Nuclear Option: Reset MAMP**

If MAMP keeps breaking:

```bash
# 1. Export your .env file
cp .env .env.backup

# 2. Stop MAMP completely

# 3. Delete vendor directory
rm -rf vendor/

# 4. Reinstall from scratch
composer install

# 5. Restore .env
cp .env.backup .env

# 6. Restart MAMP
```

---

## 🧪 **Test Script: Verify Backend is Working**

Create this file: `/app/test-backend-connection.html`

```html
<!DOCTYPE html>
<html>
<head><title>Backend Test</title></head>
<body>
<h1>MAMP Backend Test</h1>
<button onclick="testConnection()">Test Connection</button>
<pre id="result"></pre>

<script>
async function testConnection() {
  const result = document.getElementById('result');
  result.textContent = 'Testing...';
  
  try {
    const response = await fetch('http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartItems: [],
        subtotal: 0,
        orderNumber: 'TEST'
      })
    });
    
    const text = await response.text();
    result.textContent = `Status: ${response.status}\n\n${text}`;
  } catch (error) {
    result.textContent = `❌ ERROR: ${error.message}\n\nPossible causes:\n- MAMP not running\n- Wrong URL\n- CORS not configured`;
  }
}
</script>
</body>
</html>
```

**How to use:**
1. Open this HTML file in browser
2. Click "Test Connection"
3. If it fails → MAMP issue
4. If it succeeds → Frontend config issue

---

## 🎯 **Step-by-Step Recovery Process**

### **Right Now - Get MAMP Working Again:**

1. **Open MAMP interface → Stop Servers**

2. **Check Apache port** (MAMP Preferences → Ports)
   - Apache: 8888
   - MySQL: 8889

3. **Check document root** (MAMP Preferences → Web Server)
   - Should point to: `htdocs/crystalkeepsakes`

4. **In your crystalkeepsakes directory:**
   ```bash
   # Check if vendor exists
   ls -la vendor/
   
   # If missing or broken:
   composer install
   ```

5. **Check critical PHP file exists:**
   ```bash
   ls -la api/stripe/create-checkout-session.php
   ```

6. **Start MAMP → Start Servers**

7. **Test in browser:**
   ```
   http://localhost:8888/crystalkeepsakes/
   ```

8. **If you see MAMP start page instead:**
   - Go to MAMP Preferences → Web Server → Document Root
   - Change to: `/Applications/MAMP/htdocs/crystalkeepsakes` (Mac)
   - Or: `C:\MAMP\htdocs\crystalkeepsakes` (Windows)

---

## 🔍 **Debug Next.js → MAMP Connection**

Add this to your checkout page temporarily:

**File**: `/app/src/app/checkout/page.tsx` (before fetch)

```typescript
// TEMPORARY DEBUG
console.log('🔍 DEBUG INFO:');
console.log('Backend URL:', phpBackendUrl);
console.log('Full API URL:', apiUrl);
console.log('Cart items:', cart.length);

// Test if backend is reachable
try {
  const testResponse = await fetch(phpBackendUrl + '/api/contact.php');
  console.log('✅ Backend is reachable:', testResponse.status);
} catch (testError) {
  console.error('❌ Backend NOT reachable:', testError);
  alert('MAMP backend is not running! Please start MAMP and refresh.');
  return;
}
```

---

## 💡 **Prevention: Stable Local Dev Setup**

### **Option 1: Docker Instead of MAMP**
(More stable, no "nuking")

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  php:
    image: php:8.1-apache
    ports:
      - "8888:80"
    volumes:
      - ./:/var/www/html
  mysql:
    image: mysql:8.0
    ports:
      - "8889:3306"
```

### **Option 2: Separate PHP Built-in Server**
```bash
# Instead of MAMP
cd /path/to/crystalkeepsakes
php -S localhost:8888
```

### **Option 3: Use Next.js API Routes** (Recommended)
Move PHP logic to `/app/src/app/api/` as TypeScript:
- No MAMP needed
- No CORS issues
- Stripe SDK works in Node.js
- Better for production deployment

---

## 🚨 **If MAMP Still Won't Work:**

**Alternative for RIGHT NOW:**

1. **Use the Emergent preview environment**
   - Your code is already deployed there
   - Test checkout flow in preview
   - Verify webhook receives data

2. **Or temporarily use Next.js API routes**
   - I can convert the PHP to TypeScript
   - Test locally without MAMP
   - Move back to PHP later if needed

---

## 📞 **What to try RIGHT NOW:**

1. **Restart MAMP completely**
2. **Run**: `composer install` in crystalkeepsakes directory
3. **Open**: http://localhost:8888/crystalkeepsakes/
4. **If that works, try**: http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php
5. **Check browser console** for CORS errors

Let me know what you see and I'll help you fix it! 🚀
