// app/products/page.tsx
// v2.1.0 - 2025-11-05 - Consolidated hero section (DRY principle)
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

// Helper: Determine if product is a light base
const isLightBase = (product: Product): boolean => {
  const name = product.name.toLowerCase()
  return (
    product.categories?.includes('lightbases') ||
    name.includes('lightbase') ||
    name.includes('light base') ||
    name.includes('stand') ||
    name.includes('rotating led') ||
    name.includes('wooden premium')
  )
}

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
      case 'crystals': return prods.filter(p => !isLightBase(p))
      case 'lightbases': return prods.filter(p => isLightBase(p))
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
                className="cursor-pointer px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
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
            className={`px-3 py-2 rounded-lg font-semibold transition-all ${
              productType === 'all'
                ? 'cursor-pointer bg-brand-500 text-white border-2 border-brand-500 shadow-glow-soft'
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
            💎 Crystals ({products.filter(p => !isLightBase(p)).length})
          </button>
          <button
            onClick={() => setProductType('lightbases')}
            className={`px-2 py-2 rounded-lg font-semibold transition-all ${
              productType === 'lightbases'
                ? 'bg-brand-500 text-white border-2 border-brand-500 shadow-glow-soft'
                : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-400'
            }`}
          >
            💡 Light Bases ({products.filter(p => isLightBase(p)).length})
          </button>
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
              className="cursor-pointer px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors font-medium shadow-glow-soft"
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
 

                  {/* Light Base Badge */}
                  {isLightBase(product) && (
                    <div className="absolute top-2 right-2 bg-yellow-600/90 text-white px-2 py-1 rounded text-xs font-semibold">
                      💡 Light Base
                    </div>
                  )}

                  {/* Is Featured */}
                 {/* {isFeatured(product) && (
                    <span className="absolute top-0 left-0 inline-flex mt-3 ml-3 px-3 py-2 rounded-lg z-10 bg-red-500 text-sm font-medium text-white select-none">
                      Featured
                    </span>
                  )} 
                */}
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
                      className="block w-full px-4 py-2 btn-primary hover:bg-brand-600 text-white text-center rounded-lg transition-colors font-medium"
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