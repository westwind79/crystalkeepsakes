# 🎯 Final Image Upload Setup (NO Public Folder!)

## ✅ **Correct Structure for Local Dev:**

```
C:/MAMP/htdocs/
├── crystalkeepsakes/          ← Your project
│   ├── api/
│   ├── src/
│   └── public/                ← NO test images here!
│
└── crystal-data/              ← Test images HERE (outside project)
    └── order-images-test/     ← Local test images
        └── customer_xxx.jpg
```

---

## 🛠️ **Setup Steps:**

### **Step 1: Create Directory Outside Project**

```bash
# Create directory at MAMP htdocs level (NOT in project)
mkdir C:\MAMP\htdocs\crystal-data
mkdir C:\MAMP\htdocs\crystal-data\order-images-test
```

### **Step 2: Update Your .env**

**File**: `C:\MAMP\htdocs\crystalkeepsakes\.env`

**Add or update:**
```bash
CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystal-data/order-images-test
```

**OR leave it blank** (will auto-detect):
```bash
# Leave CUSTOMER_IMAGE_PATH empty - it will auto-use:
# C:/MAMP/htdocs/crystal-data/order-images-test
```

### **Step 3: Make Web-Accessible via MAMP**

MAMP already serves everything under `htdocs/`, so this works automatically!

**Images accessible at:**
```
http://localhost:8888/crystal-data/order-images-test/customer_xxx.jpg
```

### **Step 4: Restart MAMP**

Stop and start MAMP servers.

---

## 🧪 **How It Works:**

### **When You Upload Image:**

1. Image saved to: `C:/MAMP/htdocs/crystal-data/order-images-test/customer_product_masked_xxx.jpg`

2. API returns URL: `http://localhost:8888/crystal-data/order-images-test/customer_product_masked_xxx.jpg`

3. Cart displays image using this full URL

4. Next.js frontend (port 3000) loads image from MAMP (port 8888) - works because CORS is configured!

---

## ✅ **Benefits:**

- ✅ Test images separate from project
- ✅ Mimics production structure
- ✅ No pollution of public folder
- ✅ Easy to delete all test images: `del C:\MAMP\htdocs\crystal-data\order-images-test\*`
- ✅ Production ready (same structure)

---

## 🌐 **Production Structure (For Reference):**

```
/home/uydbo2r007mb/
├── public_html/
│   └── crystalkeepsakes/      ← Your deployed project
│       └── public/            ← NO customer images here!
│
└── crystal-data/              ← Customer images HERE (outside public_html)
    └── order-images/          ← Production images
        └── customer_xxx.jpg
```

**Production .env:**
```bash
CUSTOMER_IMAGE_PATH=/home/uydbo2r007mb/crystal-data/order-images
```

---

## 🧪 **Test Now:**

1. **Create directory:**
   ```bash
   mkdir C:\MAMP\htdocs\crystal-data\order-images-test
   ```

2. **Update .env:**
   ```bash
   CUSTOMER_IMAGE_PATH=C:/MAMP/htdocs/crystal-data/order-images-test
   ```

3. **Restart MAMP**

4. **Test checkout:**
   - Add product with custom image
   - Proceed to checkout
   - Check console: `📤 Uploading customer images...`
   - Check directory: `dir C:\MAMP\htdocs\crystal-data\order-images-test`
   - Should see: `customer_xxx.jpg` files

5. **Verify cart displays images:**
   - Images should load (not broken)
   - Right-click image → "Open in new tab"
   - URL should be: `http://localhost:8888/crystal-data/order-images-test/customer_xxx.jpg`

---

## 🎯 **Perfect! Now:**

- ✅ Test images isolated
- ✅ Same structure as production
- ✅ No public folder pollution
- ✅ Easy cleanup

Test it and confirm! 🚀
