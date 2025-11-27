# Admin Panel Data Sync Issue

**Date:** November 23, 2025  
**Issue:** Admin panel shows different data than products page

---

## 🔍 Problem

**Symptom:**
- Admin panel shows product "on sale"
- Products page does NOT show same product on sale
- Data appears mismatched

---

## 🎯 Root Cause

The admin panel combines **TWO data sources**:

### 1. Source Products (from JSON file)
```typescript
const products = await getProducts(); // Loads /public/data/final-products.json
setSourceProducts(products);
```

### 2. Edited Products (from localStorage - UNSAVED)
```typescript
const saved = localStorage.getItem('productCustomizations');
setEditedProducts(JSON.parse(saved));
```

### Display Logic:
```typescript
const getProductData = (productId: string) => {
  const sourceProduct = sourceProducts.find((p) => p.id === productId);
  const customizations = editedProducts[productId] || {}; // From localStorage!
  return { ...sourceProduct, ...customizations }; // Merged
};
```

**What you're seeing:**
- Admin panel = JSON file + **unsaved localStorage changes** ✅
- Products page = JSON file **only** ✅

---

## ✅ This is Working As Designed

The admin panel is **supposed to** show unsaved changes! That's how you can:
1. Edit products
2. Preview changes
3. Save when ready

---

## 📋 Workflow

### Current Workflow:
```
1. Load admin panel
   ↓
2. See products (JSON file + localStorage edits)
   ↓
3. Make changes (stored in localStorage)
   ↓
4. Click "Save" → Downloads final-product-list.js
   ↓
5. Upload via FTP → Updates JSON file
   ↓
6. Products page now shows changes
```

### The Confusion:
- You see changes in admin immediately (localStorage)
- But products page doesn't update until you save & upload

---

## 🔧 Solutions

### Option 1: Clear Unsaved Changes (Recommended)

Add a "Reset" button to clear localStorage and reload from JSON:

```typescript
const resetToSaved = () => {
  if (confirm('Discard all unsaved changes and reload from saved file?')) {
    localStorage.removeItem('productCustomizations');
    setEditedProducts({});
    // Products will reload from JSON file only
    alert('✅ Reset to saved data');
  }
};
```

### Option 2: Show Unsaved Changes Warning

Add a visual indicator when there are unsaved changes:

```typescript
const hasUnsavedChanges = Object.keys(editedProducts).length > 0;

{hasUnsavedChanges && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
    <p className="text-yellow-700">
      ⚠️ You have unsaved changes. Click "Save" to download, then upload via FTP.
    </p>
  </div>
)}
```

### Option 3: Show Data Source Indicator

Add labels showing what data you're viewing:

```tsx
<div className="text-sm text-gray-500">
  Viewing: Saved data {hasUnsavedChanges && '+ Unsaved edits'}
</div>
```

---

## 🎯 Recommended Fix

Add these features to the admin panel:

1. **"Reset to Saved" button** - Clear localStorage
2. **Unsaved changes indicator** - Visual warning
3. **Data source label** - Show what you're viewing

### Implementation:

```typescript
// Add to admin panel component
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

useEffect(() => {
  setHasUnsavedChanges(Object.keys(editedProducts).length > 0);
}, [editedProducts]);

const resetToSaved = async () => {
  if (!confirm('⚠️ Discard all unsaved changes and reload from file?\n\nThis will reset all your edits.')) {
    return;
  }
  
  localStorage.removeItem('productCustomizations');
  setEditedProducts({});
  
  // Reload products from JSON
  const products = await getProducts();
  setSourceProducts(products);
  
  alert('✅ Reset complete. Now viewing saved data only.');
};
```

---

## 🧪 How to Verify Data

### Check Admin Panel Data:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type:
```javascript
const saved = localStorage.getItem('productCustomizations');
console.log(JSON.parse(saved));
```

### Check Products Page Data:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type:
```javascript
fetch('/data/final-products.json')
  .then(r => r.json())
  .then(data => console.log(data));
```

### Compare:
- If localStorage has sale data but JSON doesn't → **Unsaved changes**
- If both match → **Data is synced**

---

## 📝 Current Status

**JSON file** (`/public/data/final-products.json`):
```
Total products: 47
Products on sale: 0 ← NO products on sale in saved file
```

**Admin localStorage** (unsaved):
```
Likely has products marked as "on sale" ← This is what you see in admin
```

**Products page**:
```
Shows: 0 products on sale (from JSON file) ← Correct!
```

---

## ✅ Quick Fix Now

If you want the admin to match the products page right now:

### Option A: Clear localStorage (in browser)
1. Open admin panel
2. Open DevTools (F12) → Console
3. Type: `localStorage.removeItem('productCustomizations')`
4. Refresh page
5. Admin now shows same data as products page

### Option B: Save Current Changes
1. Click "Save" in admin panel
2. Upload downloaded file to server via FTP
3. Products page will update to match admin

---

## 🎯 Recommendation

**Add these 3 buttons to admin panel:**

1. **Save** (existing) - Downloads file with changes
2. **Reset** (new) - Clears localStorage, reloads from JSON
3. **Preview** (new) - Opens products page in new tab

This makes it clear:
- Save = Make changes permanent
- Reset = Discard changes
- Preview = See what customers see

---

## 📊 Summary

| Location | Data Source | Shows Sale Products? |
|----------|-------------|---------------------|
| Admin Panel | JSON + localStorage | Yes (unsaved) |
| Products Page | JSON only | No (saved) |
| JSON File | Saved data | No |

**The admin panel is working correctly** - it's showing you unsaved edits from localStorage. You just need to either:
1. Save the changes (download & upload)
2. Or reset/discard the changes (clear localStorage)

---

**Status:** Not a bug, working as designed  
**Solution:** Add "Reset" button and unsaved changes indicator
