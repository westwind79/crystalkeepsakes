# 📤 Where to FTP Your Product File

## The ONE File You Need

**File:** `/src/data/final-product-list.js`

## GoDaddy FTP Path

Upload to:
```
/public_html/crystalkeepsakes.com/src/data/final-product-list.js
```

## Step-by-Step FTP

1. **Open FileZilla** (or your FTP client)
2. **Connect to GoDaddy:**
   - Host: Your GoDaddy FTP host
   - Username: Your FTP username
   - Password: Your FTP password
3. **Navigate to:** `/public_html/crystalkeepsakes.com/src/data/`
4. **Upload:** Drag `final-product-list.js` from your local computer
5. **Overwrite** the existing file
6. **Done!** Your products are live

## After Admin Panel Save

When you click "Save Products" in the admin panel:
- File is saved to: `/app/src/data/final-product-list.js`
- Alert shows the FTP path
- FTP this ONE file to GoDaddy

## Backup Files

When you click "Backup":
- Creates: `final-product-list-2025-11-21T14-30-00.js` (with timestamp)
- Saved to: `/app/src/data/` (same folder)
- **Keep these as restore points** - don't FTP them unless you want to restore

## Summary

✅ **ONE file** = `final-product-list.js`
✅ **FTP to** = `/public_html/crystalkeepsakes.com/src/data/`
✅ **Backup** = Timestamped copies in same folder
