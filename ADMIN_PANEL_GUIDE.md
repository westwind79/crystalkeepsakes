# Product Admin Panel Guide

## Overview
The Product Admin Panel allows you to configure product details, manage multiple images, descriptions, pricing, and more. This is a **local development tool only** that generates a `final-product-list.js` file for deployment.

## Access the Admin Panel

**Local Development:**
```
http://localhost:3000/admin/products
```

## Features

### 1. Product Configuration
- ✏️ Edit product names, descriptions, and prices
- 📝 Add long descriptions for product details
- ⭐ Mark products as "featured"
- 🏷️ Configure product categories (if implemented)

### 2. Multi-Image Management
- 📸 Upload multiple images per product
- 🖼️ Reorder images with drag controls
- ⭐ Set main/featured image
- 🗑️ Remove unwanted images
- 🔄 Images automatically stored in `/public/img/products/cockpit3d/[PRODUCT_ID]/`

### 3. Cockpit3D Integration
- Configure Cockpit3D option mappings
- Link size, lightbase, and backdrop options
- Map service queue and text customization options

## How It Works

### 1. Data Flow
```
Source Products (cockpit3d-products.js)
         ↓
Admin Panel Customizations (localStorage)
         ↓
Generate final-product-list.js
         ↓
Deploy to Production
```

### 2. Storage
- **Customizations**: Saved in browser localStorage
- **Images**: Stored in `/public/img/products/cockpit3d/[ID]/`
- **Final Output**: `final-product-list.js` (download button)

### 3. Workflow

#### Step 1: Edit Products
1. Open admin panel: `http://localhost:3000/admin/products`
2. Select a product from the left column
3. Edit details in the middle column
4. See live preview in the right column (toggle with "Show Preview")

#### Step 2: Upload Images
1. Click the upload area or drag & drop images
2. Images are automatically uploaded to the product folder
3. First image becomes main image by default
4. Reorder or set different image as main using controls

#### Step 3: Generate Final File
1. Click "Generate final-product-list.js" button
2. File downloads automatically
3. Replace `/app/src/data/final-product-list.js` with the downloaded file
4. Commit and deploy

## File Structure

```
/app
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── products/
│   │   │       └── page.tsx          # Admin panel UI
│   │   └── api/
│   │       └── admin/
│   │           └── upload-image/
│   │               └── route.ts      # Image upload API
│   ├── components/
│   │   ├── admin/
│   │   │   └── ImageUpload.tsx       # Multi-image upload component
│   │   └── ProductGallery2.tsx       # Gallery display component
│   ├── types/
│   │   └── productTypes.ts           # TypeScript definitions
│   └── data/
│       ├── cockpit3d-products.js     # Source products (don't edit)
│       └── final-product-list.js     # Generated products (deploy this)
└── public/
    └── img/
        └── products/
            └── cockpit3d/
                └── [PRODUCT_ID]/     # Product images stored here
```

## Product Schema

### Multi-Image Support
```typescript
interface ProductImage {
  src: string;        // Image URL path
  isMain: boolean;    // Is this the main/featured image?
  alt?: string;       // Alt text for accessibility
  caption?: string;   // Optional caption
}
```

### Product with Images
```typescript
{
  id: "104",
  name: "Cut Corner Diamond",
  images: [
    {
      src: "/img/products/cockpit3d/104/product_104_1234567890.jpg",
      isMain: true,
      alt: "Cut Corner Diamond - Main View"
    },
    {
      src: "/img/products/cockpit3d/104/product_104_1234567891.jpg",
      isMain: false,
      alt: "Cut Corner Diamond - Side View"
    }
  ],
  ...
}
```

## Tips & Best Practices

### Image Management
- ✅ Upload high-quality images (recommended: 1200x1200px or larger)
- ✅ Use descriptive alt text for SEO
- ✅ First image should be the most representative of the product
- ✅ Include multiple angles: front, side, detail shots
- ⚠️ Keep file sizes reasonable (<2MB per image)

### Product Configuration
- ✅ Always provide both short and long descriptions
- ✅ Double-check prices before generating final file
- ✅ Test featured products appear correctly on frontend
- ✅ Preview changes before exporting

### Deployment Workflow
1. Make all changes in admin panel
2. Generate `final-product-list.js`
3. Test locally with the new file
4. Commit and push to repository
5. Deploy to production

## Troubleshooting

### Images Not Uploading
- Check browser console for errors
- Ensure `/public/img/products/cockpit3d/` folder exists
- Verify file permissions
- Try smaller image files (<5MB)

### Customizations Not Saving
- Check browser localStorage is enabled
- Try clearing localStorage and starting fresh
- Export and save `final-product-list.js` frequently

### Generated File Not Working
- Ensure proper JavaScript syntax in generated file
- Check for special characters in descriptions
- Validate JSON structure before deployment

## API Endpoints

### POST `/api/admin/upload-image`
Upload a product image

**Request:**
```javascript
FormData {
  productId: "104",
  file: File
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/img/products/cockpit3d/104/product_104_1234567890.jpg",
    "filename": "product_104_1234567890.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

## Support & Development

### Extending the Admin Panel
The admin panel is built with:
- **Next.js 15** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **localStorage** for data persistence

To add new features:
1. Update `/app/src/types/productTypes.ts` with new fields
2. Add UI controls in `/app/src/app/admin/products/page.tsx`
3. Update the `generateFinalProducts()` function to include new fields

### Integration with Existing Code
The admin panel integrates seamlessly with your existing:
- **ProductDetailClient**: Already supports multiple images with ProductGallery
- **Product Card**: Will automatically use main image
- **Cart System**: Uses main image for cart items

No changes needed to existing frontend code! 🎉

## Summary

The Product Admin Panel provides a powerful, local-only tool for:
- ✅ Managing product details and pricing
- ✅ Uploading and organizing multiple product images
- ✅ Configuring Cockpit3D options
- ✅ Generating deployment-ready product data

All changes are stored locally until you generate and deploy the final product list.
