'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cockpit3dProducts } from '@/data/cockpit3d-products'

interface FeaturedProductsProps {
  limit?: number
  title?: string
}

export default function FeaturedProducts({ limit = 6, title = "Featured Designs" }: FeaturedProductsProps) {
  // Get featured products or fallback to first products
  const featured = cockpit3dProducts
    .filter(p => p.featured === true)
    .slice(0, limit)
  
  const products = featured.length > 0 
    ? featured 
    : cockpit3dProducts.slice(0, limit)

  return (
    <section className="bg-dark-bg py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-50">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => {
            const mainImage = product.images?.find(img => img.isMain)?.src || product.images?.[0]?.src || '/img/placeholder.jpg'
            
            return (
              <Link 
                key={product.id}
                href={`/products/${product.slug}`}
                className="group block"
              >
                <div className="relative bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-brand-500 transition-all duration-300 h-full flex flex-col">
                  {/* Featured Badge */}
                  {product.featured && (
                    <div className="absolute top-4 right-4 z-10 bg-brand-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      Featured
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="relative h-64 bg-surface-900 overflow-hidden">
                    <Image 
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-light text-gray-50 mb-2 group-hover:text-brand-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-surface-700">
                      <span className="text-2xl font-light text-brand-400">
                        ${product.basePrice}
                      </span>
                      <span className="text-sm text-brand-500 group-hover:text-brand-400 transition-colors">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        <div className="text-center mt-12">
          <Link 
            href="/products" 
            className="inline-block px-8 py-3 border border-brand-500 text-brand-500 rounded hover:bg-brand-500 hover:text-white transition-all duration-300 font-light tracking-wide"
          >
            View All Designs
          </Link>
        </div>
      </div>
    </section>
  )
}
