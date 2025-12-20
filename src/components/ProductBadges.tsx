// components/ProductBadges.tsx
// Centralized product badges (Featured, Sale, etc.) with consistent styling
'use client'

import { isFeaturedProduct, isOnSale, isLightbaseProduct } from '@/utils/categoriesConfig'

interface ProductBadgesProps {
  product: any
  position?: 'card' | 'detail' | 'gallery'
  className?: string
}

/**
 * ProductBadges Component
 * 
 * Single source of truth for product badges (Featured, Sale, Light Base)
 * Ensures consistent styling and logic across:
 * - Product cards (listings page)
 * - Product detail page
 * - Gallery views
 * 
 * @param product - The product object
 * @param position - Where the badge is displayed ('card' | 'detail' | 'gallery')
 * @param className - Additional CSS classes
 */
export default function ProductBadges({ product, position = 'card', className = '' }: ProductBadgesProps) {
  if (!product) return null

  const isFeatured = isFeaturedProduct(product)
  const onSale = isOnSale(product)
  const isLightbase = isLightbaseProduct(product)

  // Position-specific styling
  const getContainerClass = () => {
    switch (position) {
      case 'card':
        return 'productcard'
      case 'detail':
        return 'detail'
      case 'gallery':
        return 'gallery'
      default:
        return 'default'
    }
  }

  // Featured badge styling - consistent across all views
  const featuredBadge = isFeatured && (
    <div className="absolute z-6 right-4 top-4 pointer-events-auto">
      <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
        <svg 
          className="w-4 h-4" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>Featured</span>
      </div>
    </div>
  )

  // Sale badge styling - consistent across all views
  const saleBadge = onSale && (
    <div className="absolute z-6 left-4 top-0">
    <span className="labelSale shadow-lg text-white bg-gradient-to-b leading-none text-sm from-amber-800 to-[#ce0000] tracking-wide uppercase">
      Sale
    </span>
    </div> 
  )

  // Light Base badge - only for detail/gallery views
  const lightbaseBadge = isLightbase && (position === 'detail' || position === 'gallery') && (
    <div className="absolute top-4 left-4 pointer-events-auto">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full shadow-sm text-sm font-semibold">
        <svg 
          className="w-4 h-4" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
        </svg>
        Light Base
      </span>
    </div>
  )

  // Return container with all badges
  return (
    <div className={`${getContainerClass()} ${className}`}>
      {featuredBadge}
      {saleBadge}
      {lightbaseBadge}
    </div>
  )
}

/**
 * Usage Examples:
 * 
 * // In ProductCard.tsx
 * <div className="relative">
 *   <img src={...} />
 *   <ProductBadges product={product} position="card" />
 * </div>
 * 
 * // In ProductDetailClient.tsx
 * <div className="relative">
 *   <img src={...} />
 *   <ProductBadges product={product} position="detail" />
 * </div>
 * 
 * // In ProductGallery.tsx
 * <div className="relative">
 *   <img src={...} />
 *   <ProductBadges product={product} position="gallery" />
 * </div>
 */
