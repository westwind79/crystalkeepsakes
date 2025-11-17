# CrystalKeepsakes - Unified Design System
## Elegant & Modern Light Theme

---

## 🎨 COLOR PALETTE

### Primary Colors (Green - Laser Theme)
```css
--brand-500: #72B01D  /* Primary green - buttons, CTAs, accents */
--brand-600: #5A8E17  /* Hover state for primary */
--brand-400: #8DC63F  /* Light green - highlights */
--brand-300: #A8D65E  /* Lighter green - subtle accents */
```

### Neutral Palette (Light Theme)
```css
--white: #FFFFFF       /* Page backgrounds */
--gray-50: #F9FAFB     /* Subtle backgrounds */
--gray-100: #F3F4F6    /* Light section backgrounds */
--gray-200: #E5E7EB    /* Borders, dividers */
--gray-300: #D1D5DB    /* Disabled states */
--gray-500: #6B7280    /* Secondary text */
--gray-700: #374151    /* Body text */
--gray-900: #111827    /* Headings, primary text */
```

### Semantic Colors
```css
--success: #10B981
--error: #EF4444
--warning: #F59E0B
```

---

## 📐 TYPOGRAPHY SYSTEM

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

### Scale (Fluid/Responsive)
```
H1: clamp(2.5rem, 5vw, 3.5rem)    /* 40px - 56px */
H2: clamp(2rem, 4vw, 2.75rem)      /* 32px - 44px */
H3: clamp(1.5rem, 3vw, 2rem)       /* 24px - 32px */
H4: clamp(1.25rem, 2.5vw, 1.5rem)  /* 20px - 24px */
Body: 1rem (16px)
Small: 0.875rem (14px)
```

### Font Weights
- Light: 300 (Headings on light backgrounds)
- Regular: 400 (Body text)
- Medium: 500 (Subheadings, buttons)
- Semibold: 600 (Important text)
- Bold: 700 (CTAs, emphasis)

---

## 🏗️ LAYOUT SYSTEM

### Container
```css
max-width: 1280px (xl)
padding: 1rem (mobile) → 2rem (desktop)
margin: 0 auto
```

### Spacing Scale (Consistent)
```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)
3xl: 4rem (64px)
4xl: 6rem (96px)
```

### Page Structure (Standard)
```
1. Header (sticky, white bg, shadow)
2. Hero Section (light gradient bg, centered content)
3. Breadcrumbs (white bg, border-bottom)
4. Main Content (white or gray-50 bg)
5. Footer (gray-100 bg)
```

---

## 🧩 COMPONENT PATTERNS

### Buttons

**Primary Button:**
```css
bg: #72B01D
text: white
hover: #5A8E17
padding: 0.75rem 1.5rem (12px 24px)
border-radius: 0.5rem (8px)
font-weight: 500
transition: all 200ms ease
shadow: 0 1px 3px rgba(0,0,0,0.1)
hover-shadow: 0 4px 6px rgba(114, 176, 29, 0.3)
```

**Secondary Button:**
```css
bg: transparent
text: #72B01D
border: 1px solid #72B01D
hover-bg: #F9FAFB
```

**Tertiary/Ghost Button:**
```css
bg: transparent
text: #6B7280
hover-text: #111827
hover-bg: #F3F4F6
```

### Breadcrumbs (STANDARD PATTERN)
```html
<nav aria-label="Breadcrumb" className="border-b border-gray-200 bg-white">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="flex items-center space-x-2 py-4 text-sm">
      <Link className="font-medium text-gray-500 hover:text-gray-900">Home</Link>
      <svg className="h-5 w-5 text-gray-300">...</svg>
      <span className="font-medium text-gray-500">Current Page</span>
    </div>
  </div>
</nav>
```

### Cards
```css
bg: white
border: 1px solid #E5E7EB
border-radius: 0.75rem (12px)
padding: 1.5rem (24px)
shadow: 0 1px 3px rgba(0,0,0,0.1)
hover-shadow: 0 8px 16px rgba(0,0,0,0.1)
hover-transform: translateY(-2px)
transition: all 250ms ease
```

### Forms
```css
input/textarea:
  bg: white
  border: 1px solid #D1D5DB
  border-radius: 0.5rem
  padding: 0.75rem 1rem
  focus-border: #72B01D
  focus-ring: 2px rgba(114, 176, 29, 0.2)
```

---

## ✨ ANIMATION STRATEGY (GSAP)

### Page Transitions
```javascript
// Page load: Fade in + slide up
gsap.from("main", {
  opacity: 0,
  y: 30,
  duration: 0.6,
  ease: "power2.out"
})
```

### Section Reveals (ScrollTrigger)
```javascript
// Fade in sections as they enter viewport
gsap.from(".fade-in-section", {
  scrollTrigger: {
    trigger: ".fade-in-section",
    start: "top 80%"
  },
  opacity: 0,
  y: 50,
  duration: 0.8,
  stagger: 0.2
})
```

### Product Cards
```javascript
// Stagger animation for product grid
gsap.from(".product-card", {
  scrollTrigger: {
    trigger: ".product-grid",
    start: "top 80%"
  },
  opacity: 0,
  scale: 0.95,
  duration: 0.5,
  stagger: 0.1
})
```

### Hero Headlines
```javascript
// Split text animation for headlines
gsap.from(".hero h1", {
  opacity: 0,
  y: 30,
  duration: 1,
  ease: "power3.out"
})
```

---

## 🎠 SWIPER FIXES

### Image Size Issues - Solution:
```css
.swiper-slide {
  width: 100% !important;
  max-width: 450px;
  aspect-ratio: 3/4; /* Consistent ratio */
  display: flex;
  align-items: center;
  justify-content: center;
}

.swiper-slide img {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Preserve aspect ratio */
  object-position: center;
}
```

### Improved Settings:
```javascript
<Swiper
  effect="cards"
  cardsEffect={{
    perSlideOffset: 8,
    perSlideRotate: 2,
    slideShadows: true
  }}
  speed={700}
  autoplay={{ delay: 4000 }}
  className="max-w-md"
/>
```

---

## 📄 PAGE SPECIFIC PATTERNS

### Homepage
- Hero: Light gradient (white → gray-50), centered text
- Featured products: White bg with cards
- Testimonials: Gray-50 bg
- Process section: White bg
- CTA section: Green gradient bg

### Product List
- Hero: Minimal, light
- Breadcrumbs: Standard pattern
- Filters: Horizontal pills with green active state
- Grid: White cards on gray-50 bg

### Product Detail
- Breadcrumbs: Standard pattern
- Layout: 2-column (image left, form right)
- Background: White
- Sticky image gallery

### Forms (Contact, etc)
- Hero: Minimal
- Breadcrumbs: Standard pattern
- Form: Centered, max-width 640px, white card

---

## 🎯 IMPLEMENTATION PRIORITIES

1. **Phase 1: Core Styles**
   - Update globals.css with new color system
   - Standardize breadcrumbs component
   - Fix Swiper image sizes
   - Update button styles

2. **Phase 2: Page Layouts**
   - Homepage updates
   - Products page
   - Product detail page
   - About/Contact pages

3. **Phase 3: Animations**
   - GSAP page transitions
   - ScrollTrigger reveals
   - Micro-interactions

4. **Phase 4: Polish**
   - Fine-tune spacing
   - Shadow refinements
   - Hover states
   - Loading states

---

## ✅ QUALITY CHECKLIST

- [ ] Consistent breadcrumbs across all pages
- [ ] Unified button styles (3 variants max)
- [ ] Swiper images properly sized
- [ ] GSAP animations smooth (60fps)
- [ ] All text readable (WCAG AA contrast)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Hover states on all interactive elements
- [ ] Loading states for async actions
- [ ] Focus states for accessibility
- [ ] Professional spacing (no cramped areas)

---

**Ready to implement? Let me know if you'd like any adjustments to this system!**
