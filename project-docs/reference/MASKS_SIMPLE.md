# Masks System - SIMPLE VERSION

## ✅ What Works Now

Admin panel loads masks from: `/public/data/available-masks.json`

---

## 📂 To Add New Masks

### Step 1: Add PNG files to folder
```bash
cp my-new-mask.png /app/public/img/masks/
```

### Step 2: Run generation script
```bash
node scripts/generate-masks-list.js
```

This scans the folder and updates the JSON file.

### Step 3: Refresh admin panel
Masks dropdown will show the new mask.

---

## 📝 Summary

- ✅ Masks load from static JSON file
- ✅ Works in dev AND production
- ✅ No API routes needed
- ✅ Just run script when you add masks

**One command updates everything:**
```bash
node scripts/generate-masks-list.js
```
