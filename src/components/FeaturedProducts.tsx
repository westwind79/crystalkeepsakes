'use client'

import React from 'react'
import Link from 'next/link'
import { finalProductList } from '@/data/final-product-list'
import ProductCard from './ProductCard'

interface FeaturedProductsProps {
  limit?: number
  title?: string
}

export default function FeaturedProducts({ limit = 6, title = "Featured Designs" }: FeaturedProductsProps) {
  const featured = finalProductList
    .filter(p => p.featured === true)
    .slice(0, limit)
  
  const products = featured.length > 0 ? featured : finalProductList.slice(0, limit)

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
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
