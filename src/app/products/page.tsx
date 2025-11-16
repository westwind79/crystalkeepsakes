// app/products/page.tsx
// v3.0.0 - 2025-11-15 - Added categories filtering with categoriesConfig
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import Breadcrumbs from '@/components/BreadCrumbs'

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
  <section  
    className="hero relative overflow-hidden bg-[#0a0a0a] pb-8 pt-16"
    style={{
      background: `linear-gradient(
        45deg, 
        rgba(17, 17, 17, 0.9) 30%,
        rgba(28, 200, 28, 0.2) 125%
      ), url('/img/flag-background-2.png') center/cover no-repeat`
    }}
  >
    <div className="container mx-auto px-4 xl:max-w-7xl">
      <div className="flex justify-center items-center">

        <div className="hero-content text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-tight">Our <span className="text-[#8DC63F] font-normal">Creations</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-100 mb-16 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Transform your cherished photos into stunning 3D crystal art pieces. 
            Our precision laser technology creates beautiful, lasting memories.
          </p>
        </div>           
      </div>
    </div>
  </section>
)

/**
 * Breadcrumbs Component - Single source of truth
 */
const ProductsBreadcrumbs = () => (
  <Breadcrumbs items={[{ label: 'Products' }]} />
)

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productType, setProductType] = useState<ProductType>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Read category from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const categoryParam = urlParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [])

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  // Reset category when product type changes
  useEffect(() => {
    setSelectedCategory('all')
  }, [productType])

  // Update URL when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    
    // Update URL
    const url = new URL(window.location.href)
    if (category === 'all') {
      url.searchParams.delete('category')
    } else {
      url.searchParams.set('category', category)
    }
    window.history.pushState({}, '', url)
  }

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

  // Filter products by category using categoriesConfig helper
  const filteredProducts = selectedCategory === 'all' 
    ? typeFiltered
    : filterProductsByCategory(typeFiltered, selectedCategory)

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="products min-h-screen bg-dark-bg text-dark-text pt-[100px]">
        <ProductsHero />
        <ProductsBreadcrumbs />

        {/* Loading Spinner */}
        <section className="bg-white py-8">
          <div className="text-center">
            <div 
              className="inline-block w-12 h-12 border-4 border-[var(--brand-500)] border-t-transparent rounded-full animate-spin" 
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
        </section>
      </div>
    )
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="products min-h-screen bg-dark-bg text-dark-text pt-[100px]">
        <ProductsHero />
        <ProductsBreadcrumbs />

        {/* Error Alert */}
        <section className="bg-white py-8">
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
        </section>
      </div>
    )
  }

  /**
   * Main Products View
   */
  return (
    <div className="products min-h-screen">
      
      <ProductsHero />
      <ProductsBreadcrumbs />

      <div className="container-full mx-auto bg-white px-4 relative">       
        
        {/* Product Type Filter (Crystals vs Light Bases) */}
        <section className="my-4 sticky bg-white py-4 top-[var(--header-height)] z-10">
          <div className="flex gap-1 justify-start">
            <button
              onClick={() => setProductType('all')}
              className={`px-2 py-2 rounded-lg font-semibold transition-all ${
                productType === 'all'
                  ? 'bg-[var(--brand-500)] text-white border-2 border-[var(--brand-500)] shadow-glow-soft'
                  : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-[var(--brand-500)]/10 hover:text-brand-400'
              }`}
            >
              All Products ({products.length})
            </button>
            <button
              onClick={() => setProductType('crystals')}
              className={`px-2 py-2 rounded-lg font-semibold transition-all ${
                productType === 'crystals'
                  ? 'bg-[var(--brand-500)] text-white border-2 border-[var(--brand-500)] shadow-glow-soft'
                  : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-[var(--brand-500)]/10 hover:text-brand-400'
              }`}
            >
              💎 Crystals ({products.filter(p => !isLightbaseProduct(p)).length})
            </button>
            <button
              onClick={() => setProductType('lightbases')}
              className={`px-2 py-2 rounded-lg font-semibold transition-all ${
                productType === 'lightbases'
                  ? 'bg-[var(--brand-500)] text-white border-2 border-[var(--brand-500)] shadow-glow-soft'
                  : 'cursor-pointer bg-transparent border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-[var(--brand-500)]/10 hover:text-brand-400'
              }`}
            >
              💡 Light Bases ({products.filter(p => isLightbaseProduct(p)).length})
            </button>
          </div>
        </section>

        <div className="grid sm:grid-cols-4 md:grid-cols-6 gap-3">

          <div className="sm:col-span-2">            
            {/* Category Filter Section */}
            <section className="xs:relative md:sticky top-40">
              <div className="">

                <h3 className="text-lg font-semibold text-text-primary mb-4">Filter by Category</h3>
                <div className="flex flex-col gap-2">
                  {PRODUCT_CATEGORIES
                    .filter(cat => cat.value !== 'all' && cat.value !== 'lightbases') // Filter out 'all' and 'lightbases' since we have separate filter
                    .map(category => {
                      const count = filterProductsByCategory(typeFiltered, category.value).length
                      const isActive = selectedCategory === category.value
                      
                      return (
                        <button
                          key={category.value}
                          onClick={() => handleCategoryChange(isActive ? 'all' : category.value)}
                          disabled={count === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                            isActive
                              ? 'bg-[var(--brand-500)] text-white border-2 border-[var(--brand-500)]'
                              : count > 0
                              ? 'bg-dark-bg border-2 border-gray-600 text-text-secondary hover:border-brand-400 hover:bg-[var(--brand-500)]/10 hover:text-brand-400 cursor-pointer'
                              : 'bg-gray-800 border-2 border-gray-700 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {category.label} ({count})
                        </button>
                      )
                    })}
                  
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="px-4 py-2 rounded-lg font-medium text-sm bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      ✕ Clear Filter
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="sm:col-span-3 md:col-span-5">
            {/* Products Grid Section */}
            <section className="product-grid">
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">
                    No products found in this category
                  </h3>
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="px-6 py-3 bg-[var(--brand-500)] hover:bg-brand-600 text-white rounded-lg transition-colors font-medium shadow-glow-soft"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

            </section>
          </div>

        </div>
      </div>
    </div>
  )
}