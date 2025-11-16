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
        <section className="my-6 sticky bg-white py-6 top-[var(--header-height)] z-10 border-b border-gray-200">
          <div className="flex flex-wrap gap-3 justify-start items-center">
            {/* Main Type Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setProductType('all')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  productType === 'all'
                    ? 'bg-[#72B01D] text-white shadow-lg hover:bg-[#5A8E17]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                All Products <span className="ml-1.5 font-normal text-sm opacity-90">({products.length})</span>
              </button>
              <button
                onClick={() => setProductType('crystals')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  productType === 'crystals'
                    ? 'bg-[#72B01D] text-white shadow-lg hover:bg-[#5A8E17]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                💎 Crystals <span className="ml-1.5 font-normal text-sm opacity-90">({products.filter(p => !isLightbaseProduct(p)).length})</span>
              </button>
              <button
                onClick={() => setProductType('lightbases')}
                className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  productType === 'lightbases'
                    ? 'bg-[#72B01D] text-white shadow-lg hover:bg-[#5A8E17]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                💡 Light Bases <span className="ml-1.5 font-normal text-sm opacity-90">({products.filter(p => isLightbaseProduct(p)).length})</span>
              </button>
            </div>

            {/* Quick Filters - Featured & Sale */}
            <div className="flex gap-2 ml-auto">
              {sourceProducts.filter(p => {
                const productData = editedProducts[p.id] || p;
                return productData.featured === true;
              }).length > 0 && (
                <button
                  onClick={() => handleCategoryChange(selectedCategory === 'featured' ? 'all' : 'featured')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedCategory === 'featured'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  Featured
                </button>
              )}
              {sourceProducts.filter(p => {
                const productData = editedProducts[p.id] || p;
                return productData.sale === true;
              }).length > 0 && (
                <button
                  onClick={() => handleCategoryChange(selectedCategory === 'sale' ? 'all' : 'sale')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    selectedCategory === 'sale'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                  </svg>
                  On Sale
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-4 md:grid-cols-6 gap-3">

          <div className="sm:col-span-2">            
            {/* Category Filter Section */}
            <section className="xs:relative md:sticky top-40">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">

                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#72B01D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  Categories
                </h3>

                <div className="space-y-2">
                  {PRODUCT_CATEGORIES
                    .filter(cat => cat.value !== 'all' && cat.value !== 'lightbases') // Filter out 'all' and 'lightbases' since we have separate filter
                    .map(category => {
                      const count = filterProductsByCategory(typeFiltered, category.value).length
                      const isActive = selectedCategory === category.value
                      
                      // Category icons
                      const categoryIcons = {
                        'featured': '⭐',
                        '3d-crystals': '🔮',
                        '2d-crystals': '💎',
                        'keychains-necklaces': '🔑',
                        'ornaments': '🎄',
                        'heart-shapes': '❤️',
                        'memorial': '🕊️',
                        'pet': '🐾',
                        'custom': '⚙️',
                        'sale': '💰'
                      };
                      
                      return (
                        <button
                          key={category.value}
                          onClick={() => handleCategoryChange(isActive ? 'all' : category.value)}
                          disabled={count === 0}
                          className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left flex items-center justify-between group ${
                            isActive
                              ? 'bg-[#72B01D] text-white shadow-md'
                              : count > 0
                              ? 'bg-white text-gray-700 hover:bg-gray-100 hover:text-[#72B01D] hover:shadow-sm border border-gray-200 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-lg">{categoryIcons[category.value] || '📦'}</span>
                            <span className="font-medium">{category.label}</span>
                          </span>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : count > 0
                              ? 'bg-gray-100 text-gray-600 group-hover:bg-[#72B01D]/10 group-hover:text-[#72B01D]'
                              : 'bg-gray-200 text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  
                  {selectedCategory !== 'all' && selectedCategory !== 'featured' && selectedCategory !== 'sale' && (
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="w-full mt-4 px-4 py-3 rounded-lg font-medium text-sm bg-white text-red-600 hover:bg-red-50 border-2 border-red-200 hover:border-red-300 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Clear Filter
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