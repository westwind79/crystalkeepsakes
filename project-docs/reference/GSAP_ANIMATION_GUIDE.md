# GSAP Animation Guide - Order & Nested Components

## 📋 Does Order Matter?

**YES!** HTML must exist before GSAP can target it.

### The Correct Order:

```javascript
export default function MyComponent() {
  const sectionRef = useRef(null)

  // 1. useEffect runs AFTER component renders
  useEffect(() => {
    // 2. NOW the HTML exists, so GSAP can find it
    gsap.from('.my-element', { opacity: 0 })
  }, [])

  // 3. This renders FIRST
  return (
    <div ref={sectionRef}>
      <div className="my-element">Hello</div>
    </div>
  )
}
```

### What Happens:
1. React renders the JSX (HTML appears in DOM)
2. `useEffect` runs
3. GSAP finds `.my-element` and animates it

---

## 🎯 Nested Component Problem

### ❌ This Doesn't Work:

```javascript
// page.tsx
export default function Page() {
  useEffect(() => {
    // ❌ Can't target elements inside FeaturedProducts!
    gsap.from('.product-card', { opacity: 0 })
  }, [])

  return (
    <div>
      <FeaturedProducts /> {/* Separate component */}
    </div>
  )
}
```

**Why?** The `.product-card` elements are inside `FeaturedProducts` component, and the parent can't directly access child component internals.

---

## ✅ Solution: Animate Inside the Component

### Move GSAP to the component that has the elements:

```javascript
// FeaturedProducts.tsx
export default function FeaturedProducts() {
  const sectionRef = useRef(null)

  useEffect(() => {
    // ✅ Now we can target our own elements!
    gsap.from('.product-card', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%'
      },
      opacity: 0,
      y: 50
    })
  }, [])

  return (
    <section ref={sectionRef}>
      <div className="product-card">Product 1</div>
      <div className="product-card">Product 2</div>
    </section>
  )
}
```

---

## 🔧 How We Fixed It

### FeaturedProducts Component:

```javascript
export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLElement>(null)
  const [products, setProducts] = useState([])

  // Animation runs AFTER products load
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.featured-product-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%'
        },
        y: 80,
        opacity: 0,
        stagger: 0.15
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [products]) // Re-run when products change

  return (
    <section ref={sectionRef}>
      {products.map(product => (
        <div className="featured-product-card">
          <ProductCard product={product} />
        </div>
      ))}
    </section>
  )
}
```

### Key Points:

1. **Ref on section** - `sectionRef` for ScrollTrigger
2. **Wrapper div with class** - `.featured-product-card` for GSAP to target
3. **useEffect dependency** - Re-runs when `[products]` changes
4. **gsap.context** - Scopes animations to this component only

---

## 🎨 Testimonials Component

Same approach:

```javascript
export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cards
      gsap.from('.testimonial-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%'
        },
        y: 60,
        opacity: 0,
        stagger: 0.2
      })

      // Animate stars individually
      gsap.from('.star-icon', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%'
        },
        scale: 0,
        opacity: 0,
        stagger: 0.1,
        ease: 'back.out(2)'
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef}>
      <div className="testimonial-card">
        <div className="star-icon">⭐</div>
      </div>
    </section>
  )
}
```

---

## 📝 Best Practices

### 1. Each Component Animates Its Own Elements

✅ **Good:**
- FeaturedProducts animates its cards
- Testimonials animates its cards & stars
- Page.tsx animates hero, CTA, etc.

❌ **Bad:**
- Page.tsx tries to animate everything
- Can't reach into child components

### 2. Use Refs for ScrollTrigger

```javascript
const sectionRef = useRef(null)

gsap.from('.element', {
  scrollTrigger: {
    trigger: sectionRef.current, // Use ref!
    start: 'top 75%'
  }
})
```

### 3. Wrap with Class Names

```javascript
// Wrap ProductCard so GSAP can target it
<div className="featured-product-card">
  <ProductCard product={product} />
</div>
```

### 4. Use gsap.context for Cleanup

```javascript
useEffect(() => {
  const ctx = gsap.context(() => {
    // animations here
  }, sectionRef)

  return () => ctx.revert() // Cleanup!
}, [])
```

---

## 🚀 Summary

| Component | Animates | Ref | Class Names |
|-----------|----------|-----|-------------|
| page.tsx | Hero, CTA, About | heroRef, ctaRef | .hero-content, .cta-content |
| FeaturedProducts | Product cards, title | sectionRef | .featured-product-card |
| Testimonials | Cards, stars | sectionRef | .testimonial-card, .star-icon |

**Rule:** Each component is responsible for animating its own elements!
