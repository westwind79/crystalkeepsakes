# 🖼️ Fix Customer Image Uploads & Display

## 🔴 **Current Issues:**
1. ❌ Images not saving (broken links in cart)
2. ❌ Wrong path configuration
3. ❌ Cart displays broken image links

---

## ✅ **What I Fixed:**

### **1. Updated `/api/customer-image-upload.php`**
- ✅ Now uses `env-loader.php` for paths
- ✅ Reads `CUSTOMER_IMAGE_PATH` from `.env`
- ✅ Proper dev vs production handling
- ✅ Better error logging

### **2. Created `.env` Templates**
- ✅ `.env.local.template` (for your Windows MAMP)
- ✅ `.env.production.template` (for GoDaddy server)

---

## 🛠️ **Fix Your Local Setup NOW:**

### **Step 1: Update Your Local .env**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\.env`

**Add or update this line:**
```bash
# For local dev - in project folder (web-accessible)
CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystalkeepsakes/public/img/customer-uploads
```

**Why this path?**
- ✅ In your project
- ✅ Web-accessible (images load in browser)
- ✅ No permission issues
- ✅ Easy to debug

---

### **Step 2: Create Upload Directory**

```bash
# In C:\MAMP\htdocs\crystalkeepsakes\

# Create the directory
mkdir public\img\customer-uploads

# Test if it's writable (open cmd in project folder)
echo test > public\img\customer-uploads\test.txt
```

If file created successfully → ✅ Good to go!

---

### **Step 3: Restart MAMP**

Stop and start MAMP servers so PHP picks up the .env change.

---

### **Step 4: Test Image Upload**

1. **Start Next.js:**
   ```bash
   yarn dev
   ```

2. **Open:** http://localhost:3000

3. **Add product to cart with custom image:**
   - Upload an image
   - Click "Add to Cart"
   
4. **Check the browser console:**
   - Should see successful upload response
   - Should show `url: "/img/customer-uploads/customer_..."`

5. **Check the cart page:**
   - Images should display (not broken)

6. **Verify file was saved:**
   ```bash
   dir public\img\customer-uploads
   ```
   - Should see `customer_*.jpg` files

---

## 🌐 **Production Setup (For Later)**

### **On GoDaddy Server:**

**File**: `/home/uydbo2r007mb/public_html/crystalkeepsakes/.env`

```bash
NEXT_PUBLIC_ENV_MODE=production
CUSTOMER_IMAGE_PATH=/home/uydbo2r007mb/crystal-data/order-images
```

**Why `/home/uydbo2r007mb/crystal-data/`?**
- ✅ Outside `public_html` folder
- ✅ Won't be deleted by project updates
- ✅ Persists across deployments
- ✅ Still accessible via web server

**Create directory via SSH or cPanel:**
```bash
mkdir -p /home/uydbo2r007mb/crystal-data/order-images
chmod 755 /home/uydbo2r007mb/crystal-data/order-images
```

---

## 🔍 **How to Debug Image Issues**

### **Check PHP Error Logs:**

**Local MAMP:**
```bash
tail -20 C:/MAMP/logs/php_error.log
```

**Look for:**
```
🖼️  Image Upload - Mode: development
Using CUSTOMER_IMAGE_PATH from .env: C:/MAMP/htdocs/...
Creating directory: ...
✓ Directory created successfully
Saving image to: ...
✓ Image saved successfully: 45678 bytes
```

### **Test Upload Directly:**

Create this file: `/api/test-image-upload.html`

```html
<!DOCTYPE html>
<html>
<head><title>Test Image Upload</title></head>
<body>
<h1>Test Customer Image Upload</h1>
<input type="file" id="imageInput" accept="image/*">
<button onclick="uploadImage()">Upload</button>
<pre id="result"></pre>

<script>
async function uploadImage() {
  const file = document.getElementById('imageInput').files[0];
  if (!file) return alert('Select a file first');
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64 = e.target.result;
    
    const response = await fetch('http://localhost:8888/crystalkeepsakes/api/customer-image-upload.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: base64,
        productId: 'test-product',
        imageType: 'raw'
      })
    });
    
    const result = await response.json();
    document.getElementById('result').textContent = JSON.stringify(result, null, 2);
    
    if (result.success) {
      alert('Upload successful! Check: public/img/customer-uploads/');
    }
  };
  
  reader.readAsDataURL(file);
}
</script>
</body>
</html>
```

**Use:**
1. Open this file in browser
2. Select an image
3. Click Upload
4. Check `public/img/customer-uploads/` for the file

---

## 🎯 **Cart Image Display Fix**

If images still don't show in cart, check your cart component:

**File**: `/src/app/cart/page.tsx` (or wherever cart displays images)

**Should look like:**

```typescript
// Get image URL from cart item
const imageUrl = item.images?.displayUrl || item.images?.thumbnailUrl;

// Display image
<img 
  src={imageUrl} 
  alt={item.name}
  onError={(e) => {
    console.error('Image failed to load:', imageUrl);
    e.target.src = '/img/placeholder.png'; // Fallback
  }}
/>
```

**The URL format should be:**
- Local dev: `/img/customer-uploads/customer_product_masked_123456_abc.jpg`
- Production: `/crystal-data/order-images/customer_product_masked_123456_abc.jpg`

---

## 🧪 **Complete Test Checklist:**

### **Local Dev:**
- [ ] `.env` has `CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystalkeepsakes/public/img/customer-uploads`
- [ ] Directory exists: `public/img/customer-uploads/`
- [ ] Directory is writable
- [ ] MAMP restarted
- [ ] Can upload image via test page
- [ ] Image file appears in directory
- [ ] Cart displays images (not broken)
- [ ] Checkout works with images
- [ ] Order confirmation shows images

---

## 🚨 **Common Issues:**

### **Issue 1: "Failed to create upload directory"**
**Cause:** Wrong path or no permissions

**Fix:**
```bash
# Create manually
mkdir public\img\customer-uploads

# Or use absolute path in .env
CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystalkeepsakes/public/img/customer-uploads
```

### **Issue 2: "Upload directory not writable"**
**Cause:** Windows permissions

**Fix:**
```bash
# Right-click folder → Properties → Security
# Give "Everyone" Write permissions (for local dev only!)
```

### **Issue 3: Images save but don't display**
**Cause:** Wrong URL path

**Check:**
- URL returned by API: `/img/customer-uploads/...`
- Browser trying to load: `http://localhost:3000/img/customer-uploads/...`
- File exists at: `C:\MAMP\htdocs\crystalkeepsakes\public\img\customer-uploads\...`

**If mismatch:**
- Next.js serves `/public/` as root
- So `/img/customer-uploads/` maps to `public/img/customer-uploads/`
- ✅ This should work automatically

### **Issue 4: Cart shows old broken links**
**Cause:** Old cart data in localStorage

**Fix:**
```javascript
// In browser console
localStorage.clear();
// Then refresh page and add items again
```

---

## 🎯 **After This Fix:**

1. **Test locally** with the steps above
2. **Complete a full checkout** with custom images
3. **Verify images persist** after payment
4. **Then we'll tackle:**
   - Webhook getting full cart data
   - Cockpit3D integration with images
   - Production deployment

Let me know when images are saving and displaying correctly! 🚀
