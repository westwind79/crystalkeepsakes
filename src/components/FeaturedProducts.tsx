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
    <section className="bg-white py-16 md:py-20">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-center mb-12 text-3xl md:text-4xl font-light tracking-wide text-gray-900">
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
                <div className="relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  {/* Featured Badge */}
                  {product.featured && (
                    <div className="absolute top-4 right-4 z-10 bg-brand-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md">
                      Featured
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="relative h-64 bg-gray-50 overflow-hidden">
                    <Image 
                      src={mainImage}
                      alt={product.name}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-2xl font-light text-brand-500">
                        ${product.basePrice}
                      </span>
                      <span className="text-sm font-medium text-brand-500 group-hover:text-brand-600 transition-colors">
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
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white rounded-lg transition-all duration-200 font-medium tracking-wide"
          >
            View All Designs
          </Link>
        </div>
      </div>
    </section>
  )
}
