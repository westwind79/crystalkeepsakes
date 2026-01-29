'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getProducts } from '@/lib/products'
import ProductCard from './ProductCard'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface FeaturedProductsProps {
  limit?: number
  title?: string
}

export default function FeaturedProducts({ limit = 6, title = "Featured Designs" }: FeaturedProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  
  useEffect(() => {
    setMounted(true)
    
    // Load products from JSON
    getProducts().then(loadedProducts => {
      // Filter out hidden products
      const visibleProducts = loadedProducts.filter((p: any) => p.visible !== false)
      setProducts(visibleProducts)
    }).catch(err => {
      console.error('Failed to load products:', err)
      setProducts([])
    })
  }, [])

  // GSAP Animations - runs after products are loaded
  useEffect(() => {
    if (!mounted || !sectionRef.current || products.length === 0) return

    // Small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Set initial state to ensure visibility
        gsap.set('.featured-product-card', { opacity: 1, y: 0 })
        gsap.set(titleRef.current, { opacity: 1, y: 0 })

        // Animate title
        gsap.from(titleRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%', // Changed from 75% for better mobile triggering
            toggleActions: 'play none none none',
            // markers: true, // Uncomment to debug
          },
          opacity: 0,
          y: 30,
          duration: 0.6,
          ease: 'power3.out'
        })

        // Animate product cards - slide in from bottom with stagger
        const cards = gsap.utils.toArray('.featured-product-card')
        if (cards.length > 0) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%', // Changed from 70% for better mobile triggering
              toggleActions: 'play none none none',
              // markers: true, // Uncomment to debug
            },
            y: 60,
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power2.out'
          })
        }

        // Single refresh after animation setup
        ScrollTrigger.refresh()
      }, sectionRef)

      return () => ctx.revert()
    }, 150)

    return () => clearTimeout(timer)
  }, [products, mounted]) // Re-run when products load
  
  const featured = products
    .filter(p => p.featured === true && p.visible !== false)
    .slice(0, limit)
  
  const displayProducts = featured.length > 0 ? featured : products.slice(0, limit)

  // Show loading state or empty state properly
  if (!mounted) {
    return (
      <section className="bg-white py-16 md:py-20">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
            {title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-xl"></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className="bg-white py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 ref={titleRef} className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
          {title}
        </h2>
        
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProducts.map((product, index) => (
              <div key={product.id} className="featured-product-card">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-[#72B01D] text-[#72B01D] hover:bg-[#72B01D] hover:text-white rounded-lg transition-all duration-200 font-medium"
          >
            View All Designs
          </Link>
        </div>
      </div>
    </section>
  )
}