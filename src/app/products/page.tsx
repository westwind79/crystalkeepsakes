// app/products/page.tsx
// v3.0.0 - 2025-11-15 - Added categories filtering with categoriesConfig
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  isLightbaseProduct, 
  isFeaturedProduct,
  PRODUCT_CATEGORIES,
  filterProductsByCategory 
} from '@/utils/categoriesConfig'

// Environment logging
const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const shouldLog = ENV_MODE === 'development' || ENV_MODE === 'testing'

// Product Type Constants
const PRODUCT_TYPES = {
  ALL: 'all',
  CRYSTALS: 'crystals',
  LIGHTBASES: 'lightbases'
} as const

type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES]

// Product interface
interface Product {
  id: number | string
  name: string
  slug: string
  basePrice: number
  description?: string
  images: Array<{ src: string; isMain: boolean }>
  categories?: string[]
  sizes?: Array<{ id: string | number; name: string; price: number }>
  sku?: string
}

/**
 * Hero Component - Single source of truth
 */
const ProductsHero = () => (
  <section className="hero px-8 py-16 text-center">
    <div className="hero-content max-w-xl mx-auto">
      <h1 className="primary-header mb-4">Our Creations</h1>
      <p className="lead text-gray-100">
        Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.
      </p>
    </div>
  </section>
)

/**
 * Breadcrumbs Component - Single source of truth
 */
const ProductsBreadcrumbs = () => (
  <nav className="breadcrumbs py-4">
    <div className="container mx-auto px-4">
      <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>  
      <span className="mx-2 text-gray-600">/</span>
      <span className="text-text-tertiary">Products</span>
    </div>
  </nav>
)

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productType, setProductType] = useState<ProductType>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Reset category when product type changes
  useEffect(() => {
    setSelectedCategory('all')
  }, [productType])

  // Development logging
  useEffect(() => {
    if (shouldLog) {
      console.log('📦 Products Page:', {
        environment: ENV_MODE,
        productsCount: products.length,
        loading,
        error: error || 'none'
      })
    }
  }, [products, loading, error])

  /**
   * Fetch products from generated file or API fallback
   */
  const fetchProducts = async () => {
    try {
      if (shouldLog) {
        console.log('📄 Loading products from generated file...')
      }

      // Import the generated products file - use relative path
      const { finalProductList: cockpit3dProducts, generatedAt, sourceInfo } = await import('../../data/final-product-list.js')
      
      if (shouldLog) {
        console.log('📦 Products loaded:', {
          count: cockpit3dProducts.length,
          generatedAt,
          sourceInfo
        })
      }

      setProducts(cockpit3dProducts || [])
      
      if (shouldLog) {
        console.log(`✅ Loaded ${cockpit3dProducts?.length || 0} products`)
      }

    } catch (err: any) {
      console.error('❌ Error loading products from file:', err)
      
      // Fallback to API if file doesn't exist
      if (shouldLog) {
        console.log('⚠️ File not found, trying API fallback...')
      }
      
      try {
        const response = await fetch('/api/products', {
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          setProducts(data.products || [])
          
          if (shouldLog) {
            console.log(`✅ Loaded ${data.products?.length || 0} products from API`)
          }
        } else {
          throw new Error(data.error || 'Failed to load products')
        }
      } catch (apiErr: any) {
        setError(apiErr.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter by product type
  const filterByType = (prods: Product[]): Product[] => {
    switch (productType) {
      case 'crystals': return prods.filter(p => !isLightbaseProduct(p))
      case 'lightbases': return prods.filter(p => isLightbaseProduct(p))
      default: return prods
    }
  }

  const typeFiltered = filterByType(products)
  
  // Get unique categories from type-filtered products
  const categories = ['all', ...new Set(
    typeFiltered.flatMap(p => p.categories?.filter(c => c !== 'lightbases') || [])
  )]

  // Filter products by category
  const filteredProducts = selectedCategory === 'all' 
    ? typeFiltered
    : typeFiltered.filter(p => p.categories?.includes(selectedCategory))

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text pt-[100px]">
        <ProductsHero />
        <ProductsBreadcrumbs />

        {/* Loading Spinner */}
        <div className="py-12">
          <div className="text-center">
            <div 
              className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" 
              role="status"
            >
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-xl text-text-secondary">
              Loading products from CockPit3D...
            </p>
            {shouldLog && (
              <p className="text-text-tertiary text-sm mt-2">Environment: {ENV_MODE}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-dark-text pt-[100px]">
        <ProductsHero />
        <ProductsBreadcrumbs />

        {/* Error Alert */}
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-red-400 mb-3">
              ⚠️ Error Loading Products
            </h4>
            <p className="text-text-secondary mb-4">{error}</p>
            <hr className="border-red-500/30 mb-4" />
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => {
                  setLoading(true)
                  setError('')
                  fetchProducts()
                }} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                🔄 Retry
              </button>
              <Link 
                href="/" 
                className="px-4 py-2 bg-transparent border border-gray-400 hover:bg-gray-800 text-white rounded-lg transition-colors font-medium"
              >
                ← Back to Home
              </Link>
            </div>
            {shouldLog && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <small className="text-text-tertiary">
                  Environment: {ENV_MODE}<br />
                  Check browser console for details
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Main Products View
   */
  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <ProductsHero />
      <ProductsBreadcrumbs />

      {/* Product Type Filter (Crystals vs Light Bases) */}
      <section className="container mx-auto px-4 mb-6">
        <div className="flex gap-1 justify-start">
          <button
            onClick={() => setProductType('all')}
            className={`px-2 py-2 rounded-lg font-semibold transition-all ${
              productType === 'all'
                ? 'bg-brand-500 text-white border-2 border-brand-500 shadow-glow-soft'
                : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-400'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setProductType('crystals')}
            className={`px-2 py-2 rounded-lg font-semibold transition-all ${
              productType === 'crystals'
                ? 'bg-brand-500 text-white border-2 border-brand-500 shadow-glow-soft'
                : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-400'
            }`}
          >
            💎 Crystals ({products.filter(p => !isLightbaseProduct(p)).length})
          </button>
          <button
            onClick={() => setProductType('lightbases')}
            className={`px-2 py-2 rounded-lg font-semibold transition-all ${
              productType === 'lightbases'
                ? 'bg-brand-500 text-white border-2 border-brand-500 shadow-glow-soft'
                : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-400'
            }`}
          >
            💡 Light Bases ({products.filter(p => isLightbaseProduct(p)).length})
          </button>
        </div>
      </section>

      {/* Category Filter Section */}
      <section className="container mx-auto px-4 mb-8">
        <div className="bg-dark-surface rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES
              .filter(cat => cat.value !== 'all' && cat.value !== 'lightbases') // Filter out 'all' and 'lightbases' since we have separate filter
              .map(category => {
                const count = filterProductsByCategory(typeFiltered, category.value).length
                const isActive = selectedCategory === category.value
                
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(isActive ? 'all' : category.value)}
                    disabled={count === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      isActive
                        ? 'bg-brand-500 text-white border-2 border-brand-500'
                        : count > 0
                        ? 'bg-dark-bg border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-400 cursor-pointer'
                        : 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {category.label} ({count})
                  </button>
                )
              })}
            
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="container mx-auto px-4 pb-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-text-primary mb-4">
              No products found in this category
            </h3>
            <button 
              onClick={() => setSelectedCategory('all')}
              className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors font-medium shadow-glow-soft"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={`${product.id}-${product.slug}`}
                className="bg-dark-surface rounded-lg overflow-hidden shadow-md hover:shadow-glow-soft transition-all duration-base h-full flex flex-col group"
              >
                {/* Product Image */}
                <div className="flex justify-center relative rounded-lg overflow-hidden h-52">
                  <div className="relative group transition-transform duration-500 transform ease-in-out hover:scale-110 w-full">
                    <Image
                    src={product.images[0]?.src || 'https://placehold.co/800x800?text=No+Image'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-base group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 35vw"
                  />
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                </div>
 

                  {/* Featured Badge */}
                  {isFeaturedProduct(product) && (
                    <div className="absolute top-2 right-2 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      FEATURED
                    </div>
                  )}

                  {/* Light Base Badge */}
                  {isLightbaseProduct(product) && (
                    <div className="absolute top-2 left-2 bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md z-10">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
                      </svg>
                      Light Base
                    </div>
                  )}
              </div>                           

                {/* Card Body */}
                <div className="flex flex-col flex-grow p-4">
                  {/* Product Title */}
                  <h4 className="text-xs font-semibold text-text-primary mb-2 line-clamp-2">
                    {product.name}
                  </h4>

                  {/* Category Badge */}
                  {product.categories && product.categories.length > 0 && (
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 bg-brand-600 text-white text-xs rounded font-medium">
                        {product.categories[0]}
                      </span>
                    </div>
                  )}

                  {/* Price and Size Info - Push to bottom */}
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-2xl font-bold text-brand-400">
                        ${product.basePrice.toFixed(2)}
                      </span>
                      {product.sizes && product.sizes.length > 1 && (
                        <small className="text-text-tertiary text-sm">
                          {product.sizes.length} sizes
                        </small>
                      )}
                    </div>

                    {/* View Details Button */}
                    <Link 
                      href={`/products/${product.slug}`}
                      className="block w-full px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-center rounded-lg transition-colors font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}