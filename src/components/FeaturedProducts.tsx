'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { finalProductList } from '@/data/final-product-list'
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
  const [products, setProducts] = useState(finalProductList)
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  
  useEffect(() => {
    // Load products using the environment-aware helper
    getProducts().then(loadedProducts => {
      // Filter out hidden products
      const visibleProducts = loadedProducts.filter((p: any) => p.visible !== false)
      setProducts(visibleProducts)
    }).catch(err => {
      console.error('Failed to load products:', err)
      // Fallback to static import
    })
  }, [])

  // GSAP Animations - runs after products are loaded
  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      // Animate title
      gsap.from(titleRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power3.out'
      })

      // Animate product cards - slide in from bottom with stagger
      gsap.from('.featured-product-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none'
        },
        y: 80,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.2)'
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [products]) // Re-run when products load
  
  const featured = products
    .filter(p => p.featured === true && p.visible !== false)
    .slice(0, limit)
  
  const displayProducts = featured.length > 0 ? featured : products.slice(0, limit)

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
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
