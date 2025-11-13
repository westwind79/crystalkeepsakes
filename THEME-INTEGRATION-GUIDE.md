# Product Page Theme Integration Guide

## 📁 File Structure for Next.js

Place your CSS files in your Next.js `app/` directory:

```
your-nextjs-project/
├── app/
│   ├── globals.css              ← Import the theme files here
│   ├── css/
│   │   ├── variables.css        ← Your brand colors
│   │   ├── hero.css            ← Hero section styles
│   │   ├── navigation.css      ← Navigation styles
│   │   ├── buttons.css         ← Button styles
│   │   ├── animations.css      ← Animations
│   │   ├── product-detail-theme.css  ← ✨ NEW: Product page theme
│   │   └── product-options.css       ← ✨ NEW: Form controls theme
│   └── layout.tsx
```

## 🎨 Import Order in `app/globals.css`

```css
/* Tailwind directives */
@import "tailwindcss";

/* Your custom CSS files - ORDER MATTERS! */
@import './css/variables.css';      /* 1. Variables first */
@import './css/buttons.css';        /* 2. Buttons */
@import './css/animations.css';     /* 3. Animations */
@import './css/hero.css';           /* 4. Hero */
@import './css/navigation.css';     /* 5. Navigation */
@import './css/product-detail-theme.css';  /* 6. Product page */
@import './css/product-options.css';       /* 7. Form controls */

/* @theme block (Tailwind v4 syntax) */
@theme {
  --color-brand-500: #72B01D;
  /* ...rest of your theme */
}
```

## 🎯 Key CSS Classes Reference

### Product Page Layout
```tsx
<div className="product-page">           {/* Full page wrapper */}
  <div className="product-container">    {/* Max-width container */}
    <div className="product-grid">       {/* 2-column grid */}
      {/* Image column */}
      {/* Info column */}
    </div>
  </div>
</div>
```

### Product Info Section
```tsx
<h1 className="product-title">Product Name</h1>
<p className="product-description">Description here...</p>
<div className="product-price">
  <span className="product-price-currency">$</span>
  99.99
</div>
```

### Form Sections
```tsx
<div className="product-option-section">
  <label className="option-label option-label-required">
    Select Size
  </label>
  <div className="radio-option-group">
    {/* Radio options here */}
  </div>
</div>
```

### Radio Buttons (Glass-morphism Style)
```tsx
<label className="crystal-radio">
  <input type="radio" name="size" value="large" />
  <span>Large (4" x 4")</span>
  <span className="option-price-tag">$129.99</span>
</label>
```

### File Upload
```tsx
<input 
  type="file" 
  accept="image/jpeg,image/png,image/gif"
  className="file-upload-input"
/>

<div className="image-requirements">
  <p><strong>Image Requirements:</strong></p>
  <ul>
    <li>File type: JPG, PNG, or GIF</li>
    <li>Maximum size: 5MB</li>
  </ul>
</div>
```

### Text Inputs
```tsx
<input 
  type="text" 
  placeholder="Custom text"
  className="text-input"
  maxLength={30}
/>
```

### Quantity Control
```tsx
<div className="quantity-control">
  <button className="quantity-btn">-</button>
  <input type="number" value="1" className="quantity-input" />
  <button className="quantity-btn">+</button>
</div>
```

### Buttons
```tsx
<button className="btn btn-primary">Add to Cart</button>
<button className="btn btn-secondary">Edit Image</button>
```

### Alerts
```tsx
<div className="alert alert-success">Success message</div>
<div className="alert alert-error">Error message</div>
<div className="alert alert-warning">Warning message</div>

<span className="error-message">Field error message</span>
```

## 🎨 Color Palette

Your brand colors are already configured:

- **Primary Green**: `#72B01D` (var(--brand-500))
- **Light Green**: `#A8D65E` (var(--brand-300))
- **Dark Green**: `#5A8E17` (var(--brand-600))
- **Background**: `#0a0a0a` / `#1a1a1a`
- **Text**: `#f5f5f5` / `#d4d4d4` / `#a3a3a3`

## 🔧 Tailwind Integration

The theme works seamlessly with Tailwind. You can mix classes:

```tsx
<div className="product-option-section mb-6 md:mb-8">
  <label className="option-label text-lg md:text-xl">
    Select Size
  </label>
</div>
```

## 📱 Responsive Behavior

All components are mobile-responsive by default:
- Product grid: 1 column on mobile, 2 columns on tablet+
- Radio buttons: Stack vertically on mobile
- Images: Full width on mobile, sticky on desktop
- Buttons: Full width on mobile

## ✨ Special Effects

### Glass-morphism Radio Buttons
- Shimmer effect on hover
- Smooth check animation
- Gradient backgrounds
- Glow effects when selected

### Interactive States
- All buttons have hover, active, and disabled states
- Inputs have focus states with glow
- Smooth transitions throughout

## 🎭 Component Examples

### ProductDetailClient.tsx Integration

Replace your component's className attributes with the new theme classes:

**Before:**
```tsx
<div className="container bg-slate-600 mx-auto pt-4 pb-16 px-4">
```

**After:**
```tsx
<div className="product-container">
```

**Before:**
```tsx
<label key={size.id} className="crystal-radio flex items-center cursor-pointer">
```

**After:**
```tsx
<label className="crystal-radio">
  {/* The flex, items-center, cursor-pointer are already in CSS */}
```

## 🚀 Quick Start

1. **Copy CSS files** to `app/css/` directory
2. **Update imports** in `app/globals.css`
3. **Replace class names** in ProductDetailClient.tsx
4. **Test** the page - it should look beautiful!

## 🎨 Customization

Want to change colors? Update in `css/variables.css`:

```css
:root {
  --brand-500: #YOUR_COLOR;  /* Change primary color */
}
```

Want different spacing? Adjust in `product-detail-theme.css`:

```css
.product-option-section {
  padding: 1.5rem;  /* Change padding */
}
```

## 📋 Checklist

- [ ] CSS files placed in correct directory
- [ ] Imports added to globals.css
- [ ] Component class names updated
- [ ] Page loads without errors
- [ ] Mobile view looks good
- [ ] Radio buttons have glass effect
- [ ] Hover states work
- [ ] Colors match brand theme

## 💡 Pro Tips

1. **Keep the order**: Import variables.css first, always
2. **Use the classes**: Don't mix inline styles with theme classes
3. **Test mobile**: Check responsive breakpoints
4. **Brand consistency**: Use CSS variables for colors
5. **Performance**: The CSS is optimized and lightweight

---

## Need Help?

Check the example HTML file: `product-page-example.html`

It shows all components and classes in action!
