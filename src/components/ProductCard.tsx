// components/ProductCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ProductCard({ product }) {
  const [imageSrc, setImageSrc] = useState(
    product.images?.[0]?.src || 'https://placehold.co/800x800?text=No+Image'
  )
  const [hasTriedFallback, setHasTriedFallback] = useState(false)

  const isDev = process.env.NEXT_PUBLIC_ENV_MODE === 'development'

  // Try different image extensions if one fails
  const tryNextExtension = async () => {
    if (hasTriedFallback || !product.images?.[0]) return

    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const baseInfo = product.images[0]
    
    // Extract path without extension
    const matches = baseInfo.src.match(/\/cockpit3d\/(\d+)\/cockpit3d_(\d+)_(.+)\.([^.]+)$/)
    if (!matches) return
    
    const [, productId, , baseName] = matches
    const basePath = `/img/products/cockpit3d/${productId}/cockpit3d_${productId}_${baseName}`
    
    // Try all extensions
    for (const ext of extensions) {
      const testPath = `${basePath}.${ext}`
      try {
        await new Promise((resolve, reject) => {
          const img = new window.Image()
          img.onload = () => {
            setImageSrc(testPath)
            setHasTriedFallback(true)
            resolve()
          }
          img.onerror = reject
          img.src = testPath
        })
        return
      } catch (error) {
        if (isDev) {
          console.log(`❌ Failed to load ${testPath}`)
        }
      }
    }
  }

  const handleImageError = () => {
    if (isDev) {
      console.log(`❌ Image failed: ${imageSrc}`)
    }
    tryNextExtension()
  }

  return (
    <div className="crystal-product">
      <Link 
        href={`/products/${product.slug}`}
        className="crystal-product-image"
      >
        <div style={{ position: 'relative', width: '100%', height: '300px' }}>
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            onError={handleImageError}
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="crystal-product-info">
        <h3>
          <Link href={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </h3>
        <p>{product.shortDescription || product.description}</p>

        <div className="crystal-product-price">
          From ${product.basePrice?.toFixed(2) || '0.00'}
        </div>

        <Link 
          href={`/products/${product.slug}`}
          className="btn btn-primary"
        >
          Customize Item
        </Link>
      </div>
    </div>
  )
}