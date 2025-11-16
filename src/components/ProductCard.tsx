'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { isLightbaseProduct, isFeaturedProduct, isOnSale } from '@/utils/categoriesConfig'

export default function ProductCard({ product }) {
  const [imageSrc, setImageSrc] = useState(
    product.images?.[0]?.src || 'https://placehold.co/800x800?text=No+Image'
  )

  const handleImageError = () => {
    setImageSrc('https://placehold.co/800x800?text=No+Image')
  }

  const isLightbase = isLightbaseProduct(product)
  const isFeatured = isFeaturedProduct(product)
  // const onSale = isOneSale(product)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-[#72B01D] hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-64 bg-gray-50 overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* On Sale Badge */}
        {isOnSale && (
          <div className="absolute top-0 right-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide z-10">
            <div class="productLable"><span class="labelSale">Sale</span></div>
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute right-4 bottom-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide z-10">
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Featured</span>
          </div>
        )}
        
        {/* Lightbase Badge */}
        {isLightbase && (
          <div className="absolute top-3 left-3 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold z-10">
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <span>Light Base</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#72B01D] transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <span className="text-2xl font-light text-[#72B01D]">
            ${product.basePrice?.toFixed(2) || '0.00'}
          </span>
          <span className="text-sm font-medium text-[#72B01D] group-hover:text-[#5A8E17] transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  )
}
