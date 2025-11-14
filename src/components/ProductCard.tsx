'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProductCard({ product }) {
  const [imageSrc, setImageSrc] = useState(
    product.images?.[0]?.src || 'https://placehold.co/800x800?text=No+Image'
  )

  const handleImageError = () => {
    setImageSrc('https://placehold.co/800x800?text=No+Image')
  }

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
