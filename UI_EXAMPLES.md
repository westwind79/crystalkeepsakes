# Visual Examples - Unified Design System

## 🎨 COMPONENT EXAMPLES

### 1. BREADCRUMBS - Unified Pattern

**✅ NEW STANDARD (Applied to ALL pages):**
```jsx
<nav aria-label="Breadcrumb" className="border-b border-gray-200 bg-white">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex items-center space-x-2 py-4 text-sm">
      <Link href="/" className="font-medium text-gray-500 hover:text-gray-900">
        Home
      </Link>
      <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
      </svg>
      <Link href="/products" className="font-medium text-gray-500 hover:text-gray-900">
        Products
      </Link>
      <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
      </svg>
      <span className="font-medium text-gray-500">Current Page</span>
    </div>
  </div>
</nav>
```

**Visual:**
```
┌─────────────────────────────────────────────────────┐
│ Home / Products / Current Page                      │ ← Gray-500 text, white bg
└─────────────────────────────────────────────────────┘
  ↑ 1px border-bottom (gray-200)
```

---

### 2. BUTTONS - Three Variants

**Primary Button (CTAs):**
```jsx
<button className="
  px-6 py-3 
  bg-brand-500 hover:bg-brand-600 
  text-white font-medium 
  rounded-lg 
  shadow-sm hover:shadow-md 
  transition-all duration-200
">
  Add to Cart
</button>
```

**Secondary Button (Alternative actions):**
```jsx
<button className="
  px-6 py-3 
  border border-brand-500 
  text-brand-500 hover:bg-gray-50 
  font-medium rounded-lg 
  transition-all duration-200
">
  Learn More
</button>
```

**Tertiary Button (Subtle actions):**
```jsx
<button className="
  px-6 py-3 
  text-gray-700 hover:text-gray-900 hover:bg-gray-100 
  font-medium rounded-lg 
  transition-all duration-200
">
  Cancel
</button>
```

---

### 3. HERO SECTIONS - Light & Elegant

**Homepage Hero:**
```jsx
<section className="
  relative overflow-hidden
  bg-gradient-to-br from-white via-gray-50 to-gray-100
  py-20 md:py-32
">
  <div className="container mx-auto px-4">
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="
        text-5xl md:text-6xl font-light 
        text-gray-900 mb-6
        tracking-tight
      ">
        MEMORIES PRESERVED IN CRYSTAL
      </h1>
      <p className="text-xl text-gray-600 mb-8 leading-relaxed">
        Transform your cherished photos into stunning 3D crystal art
      </p>
      <div className="flex gap-4 justify-center">
        <button className="btn-primary">Browse Designs</button>
        <button className="btn-secondary">Learn More</button>
      </div>
    </div>
    
    {/* Swiper - Right side or below on mobile */}
    <div className="mt-12 md:mt-0">
      <Swiper ... />
    </div>
  </div>
</section>
```

**Visual Style:**
```
┌────────────────────────────────────────────┐
│                                            │
│         MEMORIES PRESERVED IN CRYSTAL      │ ← Large, light font
│                                            │
│    Transform your cherished photos into    │ ← Gray-600, readable
│         stunning 3D crystal art            │
│                                            │
│    [Browse Designs]  [Learn More]         │ ← Green + outlined
│                                            │
│            [Swiper Cards Here]            │
│                                            │
└────────────────────────────────────────────┘
```

---

### 4. PRODUCT CARDS - Clean & Modern

```jsx
<div className="
  bg-white rounded-xl 
  border border-gray-200 
  overflow-hidden 
  shadow-sm hover:shadow-lg 
  transition-all duration-300 
  hover:-translate-y-1
  group
">
  {/* Image */}
  <div className="aspect-square overflow-hidden bg-gray-50">
    <img 
      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
      src="..."
      alt="..."
    />
  </div>
  
  {/* Content */}
  <div className="p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Rectangle Vertical Crystal
    </h3>
    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
      Beautiful vertical crystal perfect for portraits
    </p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-light text-brand-500">$79.99</span>
      <button className="text-sm font-medium text-brand-500 group-hover:text-brand-600">
        View Details →
      </button>
    </div>
  </div>
</div>
```

---

### 5. SWIPER - FIXED SIZING

**Current Issue:**
- Images have inconsistent sizes
- Some are stretched, some are too small
- Aspect ratios not maintained

**Solution:**
```css
/* /app/src/app/css/swiper.css */
.mySwiper {
  width: 100%;
  max-width: 450px; /* Consistent max width */
  height: 550px; /* Fixed height */
  margin: 0 auto;
  padding: 40px 0 60px;
}

.mySwiper .swiper-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.mySwiper .swiper-slide img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Preserve aspect ratio */
  object-position: center;
  padding: 20px; /* Breathing room */
}
```

---

### 6. GSAP ANIMATIONS - Examples

**Page Load:**
```javascript
useEffect(() => {
  // Fade in page content
  gsap.from("main", {
    opacity: 0,
    y: 30,
    duration: 0.6,
    ease: "power2.out"
  })
  
  // Animate hero headline
  gsap.from(".hero h1", {
    opacity: 0,
    y: 50,
    duration: 0.8,
    delay: 0.2,
    ease: "power3.out"
  })
}, [])
```

**Product Grid Reveal:**
```javascript
useEffect(() => {
  gsap.from(".product-card", {
    scrollTrigger: {
      trigger: ".product-grid",
      start: "top 80%",
    },
    opacity: 0,
    y: 30,
    scale: 0.95,
    duration: 0.5,
    stagger: 0.1,
    ease: "power2.out"
  })
}, [])
```

**Section Transitions:**
```javascript
// Sections fade/slide in as you scroll
gsap.utils.toArray("section").forEach(section => {
  gsap.from(section, {
    scrollTrigger: {
      trigger: section,
      start: "top 85%",
      toggleActions: "play none none none"
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: "power2.out"
  })
})
```

---

### 7. FORM FIELDS - Consistent Style

```jsx
<div className="space-y-6">
  {/* Input Field */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Your Name <span className="text-red-500">*</span>
    </label>
    <input
      type="text"
      className="
        w-full px-4 py-3 
        border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        transition-all duration-200
        placeholder:text-gray-400
      "
      placeholder="John Doe"
    />
  </div>
  
  {/* Textarea */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Message <span className="text-red-500">*</span>
    </label>
    <textarea
      rows={5}
      className="
        w-full px-4 py-3 
        border border-gray-300 rounded-lg 
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        transition-all duration-200
        placeholder:text-gray-400
        resize-none
      "
      placeholder="Tell us about your project..."
    />
  </div>
</div>
```

---

## 📐 SPACING EXAMPLES

**Section Spacing:**
```
Hero:         py-20 md:py-32 (80px-128px)
Content:      py-12 md:py-16 (48px-64px)
Cards:        p-6 (24px)
Buttons:      px-6 py-3 (24px 12px)
Inputs:       px-4 py-3 (16px 12px)
```

**Gap/Space Between:**
```
Card grid:    gap-6 (24px)
Button group: gap-4 (16px)
Form fields:  space-y-6 (24px)
```

---

## 🎯 COLOR USAGE GUIDE

**Backgrounds:**
- Page: `bg-white`
- Sections (alternating): `bg-gray-50`
- Cards: `bg-white`
- Inputs: `bg-white`
- Hero: `bg-gradient-to-br from-white via-gray-50 to-gray-100`

**Text:**
- Headings: `text-gray-900`
- Body: `text-gray-700`
- Secondary: `text-gray-600`
- Muted: `text-gray-500`
- Links: `text-brand-500 hover:text-brand-600`

**Borders:**
- Default: `border-gray-200`
- Hover: `border-gray-300`
- Focus: `border-brand-500`

**Accents (Green):**
- Buttons: `bg-brand-500`
- Links: `text-brand-500`
- Badges: `bg-brand-100 text-brand-700`
- Icons: `text-brand-500`

---

**This design system ensures consistency across ALL pages while maintaining an elegant, modern, and professional appearance!**
