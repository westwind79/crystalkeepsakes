# 🚀 Quick Start - Admin Panel

## Start the Development Server

```bash
cd /app
npm run dev
```

## Access the Admin Panel

Open your browser to:
```
http://localhost:3000/admin/products
```

## First Time Setup

### 1. Verify Everything Works
- [ ] Admin panel loads without errors
- [ ] Product list appears in left column
- [ ] Can click and select products
- [ ] Edit form appears in middle column

### 2. Test Image Upload
- [ ] Select a product
- [ ] Click upload area or drag image
- [ ] Image uploads successfully
- [ ] Thumbnail appears in gallery
- [ ] Can set as main image
- [ ] Can remove image

### 3. Test Product Editing
- [ ] Change product name
- [ ] Edit description
- [ ] Modify price
- [ ] Check "featured" checkbox
- [ ] See changes in preview panel (toggle on)

### 4. Generate Product File
- [ ] Click "Generate final-product-list.js"
- [ ] File downloads automatically
- [ ] Check file contains your changes
- [ ] Save to `/app/src/data/final-product-list.js`

## Quick Test Product

Try editing product ID **104** ("Cut Corner Diamond"):
1. Click it in the product list
2. Upload 2-3 additional images
3. Reorder them
4. Set a new main image
5. Edit the description
6. Generate the final file

## Troubleshooting

### Port Already in Use?
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors?
```bash
# Reinstall dependencies
npm install
```

### Images Not Uploading?
1. Check browser console (F12)
2. Verify directory exists: `/public/img/products/cockpit3d/`
3. Check file permissions
4. Try smaller image (<2MB)

### localStorage Issues?
```bash
# Clear localStorage in browser console
localStorage.clear()
```

Then refresh the admin panel.

## Key Features to Test

### Image Management
1. **Upload**: Drag & drop or click to upload
2. **Reorder**: Use ← → buttons on hover
3. **Set Main**: Click "Set Main" button
4. **Remove**: Click "Remove" button
5. **Preview**: Images show in gallery preview

### Product Configuration
1. **Basic Info**: Name, description, price
2. **Featured**: Mark as featured product
3. **Images**: Multiple images with main image
4. **Export**: Generate final product list

### Preview Panel
- Toggle on/off with eye icon button
- See live gallery preview
- View formatted product details
- Check image display

## File Locations

### Uploaded Images
```
/public/img/products/cockpit3d/[PRODUCT_ID]/
├── product_104_1234567890.jpg
├── product_104_1234567891.jpg
└── ...
```

### Generated Output
```
Downloads folder:
└── final-product-list.js

Move to:
/app/src/data/final-product-list.js
```

### Configuration Storage
```
Browser localStorage:
└── productCustomizations
```

## Success Indicators

✅ Admin panel loads at `/admin/products`
✅ Can select and edit products
✅ Image upload works and displays
✅ Can reorder and manage images
✅ Preview panel shows changes
✅ Generate button downloads file
✅ No console errors

## Next Steps After Verification

1. **Configure Products**
   - Upload multiple images for each product
   - Add detailed descriptions
   - Set featured products
   - Adjust prices if needed

2. **Generate Final File**
   - Click generate button
   - Save downloaded file
   - Commit to repository

3. **Test Frontend**
   - View products on frontend
   - Check image galleries display
   - Verify mobile responsive
   - Test product detail pages

4. **Deploy**
   - Push changes to git
   - Deploy as normal
   - Images deploy with app

## Pro Tips

💡 **Save Often**: Click generate button frequently to backup changes

💡 **Use Preview**: Keep preview panel open to see changes immediately

💡 **Name Images**: Use descriptive alt text for SEO

💡 **Main Image**: Choose the best product angle as main image

💡 **Multiple Angles**: Upload front, side, detail, and lifestyle shots

💡 **Consistent Style**: Use similar lighting/background for product images

---

**Ready!** Run `npm run dev` and open `/admin/products` to start! 🎉
