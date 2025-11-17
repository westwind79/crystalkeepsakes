// ProductCard component with corrected pricing logic
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { addToCart as addToCartUtil } from '@/lib/cartUtils'
import { logger } from '@/utils/logger'
import { assetPath } from '@/lib/assetPath'
import { isOnSale, isFeaturedProduct, isLightbaseProduct } from '@/utils/categoriesConfig'

interface ProductCardProps {
  product: any
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const [addingToCart, setAddingToCart] = useState(false)
  
  // Use shared utility functions from categoriesConfig
  const onSale = isOnSale(product)
  const isFeatured = isFeaturedProduct(product)
  const isLightbase = isLightbaseProduct(product)

  // Get display price - prioritize size prices if available
  const getDisplayPrice = () => {
    // If product has sizes, show the price range
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes
        .filter((s: any) => s.enabled !== false)
        .map((s: any) => s.price)
      
      if (prices.length === 0) return { min: product.basePrice, max: product.basePrice, hasRange: false }
      
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      // Apply sale discount if applicable
      if (onSale) {
        // Priority 1: Fixed dollar discount (subtract from each size)
        if (product.salePrice && product.salePrice > 0) {
          return {
            min: Math.max(0, minPrice - product.salePrice),
            max: Math.max(0, maxPrice - product.salePrice),
            originalMin: minPrice,
            originalMax: maxPrice,
            hasRange: minPrice !== maxPrice
          }
        }
        // Priority 2: Percentage discount
        if (product.salePercent && product.salePercent > 0) {
          return {
            min: minPrice * (1 - product.salePercent / 100),
            max: maxPrice * (1 - product.salePercent / 100),
            originalMin: minPrice,
            originalMax: maxPrice,
            hasRange: minPrice !== maxPrice
          }
        }
      }
      
      return { min: minPrice, max: maxPrice, originalMin: minPrice, originalMax: maxPrice, hasRange: minPrice !== maxPrice }
    }
    
    // Single price product (no sizes) - salePrice is FINAL price
    const base = product.basePrice || 0
    if (onSale) {
      // Priority 1: Fixed sale price (final price for no-size products)
      if (product.salePrice && product.salePrice > 0) {
        return { min: product.salePrice, max: product.salePrice, originalMin: base, originalMax: base, hasRange: false }
      }
      // Priority 2: Percentage discount
      if (product.salePercent && product.salePercent > 0) {
        return { min: base * (1 - product.salePercent / 100), max: base * (1 - product.salePercent / 100), originalMin: base, originalMax: base, hasRange: false }
      }
    }
    
    return { min: base, max: base, originalMin: base, originalMax: base, hasRange: false }
  }

  const priceInfo = getDisplayPrice()

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (product.sizes && product.sizes.length > 0) {
      router.push(`/products/${product.slug}`)
      return
    }
    
    if (product.requiresImage) {
      router.push(`/products/${product.slug}`)
      return
    }
    
    setAddingToCart(true)
    
    try {
      const lineItem = {
        lineItemId: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: String(product.id),
        cockpit3d_id: product.cockpit3d_id || String(product.id),
        name: product.name,
        sku: product.sku,
        basePrice: priceInfo.min,
        optionsPrice: 0,
        totalPrice: priceInfo.min,
        quantity: 1,
        options: [],
        productImage: product.images?.[0]?.src || null,
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
      
      await addToCartUtil(lineItem)
      logger.success('Added to cart from product card')
      
      window.dispatchEvent(new Event('cartUpdated'))
      
      setTimeout(() => {
        setAddingToCart(false)
        router.push('/cart')
      }, 500)
    } catch (error) {
      console.error('❌ [ADD TO CART] Validation failed:', {})
      logger.error('Failed to add to cart', error)
      setAddingToCart(false)
      alert('Failed to add item to cart. Please try again.')
    }
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-[#72B01D] cursor-pointer"
    >
      {/* Badges */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {isFeatured && (
            <>
            <div className="absolute left-4 top-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide z-2">
                <svg 
                  className="w-4 h-4" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Featured</span>
            </div>
            {/*<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg">
              ⭐ FEATURED
            </span>*/}
            </>
          )}
          {onSale && (
            <>
            <div className="absolute top-0 right-2 z-2">
              <span className="labelSale shadow-lg text-white bg-gradient-to-b text-sm from-amber-800 to-[#ce0000] tracking-wide text-white bg-[#ce0000] uppercase">Sale</span>
            </div>
            {/*<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
              🔥 SALE
            </span>*/}
            </>
          )}
        </div>

        {/* Image */}
        <div className="aspect-square overflow-hidden bg-gray-50">
          <img
            src={assetPath(product.images?.find((img: any) => img.isMain)?.src || product.images?.[0]?.src || 'https://placehold.co/400x400?text=No+Image')}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#72B01D] transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.shortDescription || product.description}
        </p>
        
        {/* Show size count if product has sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            📏 {product.sizes.filter((s: any) => s.enabled !== false).length} sizes available
          </p>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex flex-col">
            {onSale && (product.salePercent || product.salePrice) ? (
              <>
                <span className="text-2xl font-medium text-[#72B01D]">
                  ${priceInfo.min.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${priceInfo.originalMin?.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium text-[#72B01D]">
                ${priceInfo.min.toFixed(2)}
              </span>
            )}
          </div>

          {!isLightbase && (             
            <span className="text-sm font-medium text-[#72B01D] group-hover:text-[#5A8E17] transition-colors">
              Customize →
            </span>
          )}
          {isLightbase && (             
            <span
                type="button"
               // onClick={handleAddToCart}
                // disabled={addingToCart}
                className="cursor-pointer px-4 py-2 bg-[#72B01D] hover:bg-[#5A8E17] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* {addingToCart ? 'Adding...' : 'Add to Cart'} */}
                Add to Cart
              </span>
          )}
        </div>
      </div>
    </Link>
  )
}
