// app/products/page.tsx
// v3.0.0 - 2025-11-15 - Added categories filtering with categoriesConfig
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import ProductCard from '@/components/ProductCard'
import Breadcrumbs from '@/components/BreadCrumbs'
import { assetPath } from '@/lib/assetPath'
import { getProducts } from '@/lib/products'

import { 
  isLightbaseProduct, 
  isFeaturedProduct,
  isOnSale,
  PRODUCT_CATEGORIES,
  filterProductsByCategory,
  getCategoryIcon
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
 * Breadcrumbs Component - Formats breadcrumb items
 * NOTE: Breadcrumbs component automatically adds "Home" first
 */
const ProductsBreadcrumbs = ({ breadcrumbs }: { breadcrumbs?: string[] }) => {
  const items = breadcrumbs 
    ? breadcrumbs.map((label, index) => {
        // First item is "Products"
        if (index === 0) {
          // If there's only one item (just "Products"), make it non-clickable (current page)
          // If there are more items (Products > Category), make "Products" clickable
          return breadcrumbs.length > 1 ? { label, href: '/products' } : { label }
        }
        // Other items (categories) are not clickable (current page)
        return { label }
      })
    : [{ label: 'Products' }];
  
  return <Breadcrumbs items={items} />;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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

  // Product type filtering removed - now using category filtering only

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
   * Fetch products from JSON (single source of truth)
   */
  const fetchProducts = async () => {
    try {
      if (shouldLog) {
        console.log('📄 Loading products from JSON...')
      }

      // Use getProducts() which always fetches from JSON file
      const allProducts = await getProducts()
      
      if (shouldLog) {
        console.log('📦 Products loaded:', {
          count: allProducts.length,
          environment: process.env.NODE_ENV
        })
      }

      // Filter out hidden products (visible !== false)
      const visibleProducts = allProducts.filter((p: any) => p.visible !== false)

      setProducts(visibleProducts || [])
      
      if (shouldLog) {
        console.log(`✅ Loaded ${allProducts?.length || 0} products`)
      }

    } catch (err: any) {
      console.error('❌ Error loading products from JSON:', err)
      
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

  // Filter products by category using categoriesConfig helper
  const filteredProducts = selectedCategory === 'all' 
    ? products
    : filterProductsByCategory(products, selectedCategory)

  /**
   * Get breadcrumb path based on current filters
   * NOTE: Don't include "Home" - the Breadcrumbs component adds it automatically
   */
  const getBreadcrumbPath = () => {
    const path = ['Products'];
    
    if (selectedCategory !== 'all') {
      const categoryLabel = PRODUCT_CATEGORIES.find(cat => cat.value === selectedCategory)?.label;
      if (categoryLabel) {
        path.push(categoryLabel);
      }
    }
    
    return path;
  };

  /**
   * Main Products View - Always renders structure
   */
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  
  return (
    <div className="products min-h-screen relative">
      
      <ProductsHero />
      <ProductsBreadcrumbs breadcrumbs={getBreadcrumbPath()} />

      <div className="container-full bg-slate-100 px-4 py-6 relative">        
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#72B01D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                {selectedCategory === 'all' ? 'Filter by Category' : PRODUCT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </span>
              <svg className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            
            {/* Mobile Filter Panel */}
            {showMobileFilters && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => { handleCategoryChange('all'); setShowMobileFilters(false); }}
                      className="col-span-2 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200 flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Clear
                    </button>
                  )}
                  {PRODUCT_CATEGORIES
                    .filter(cat => cat.value !== 'all')
                    .map(category => {
                      const count = filterProductsByCategory(products, category.value).length
                      const isActive = selectedCategory === category.value
                      return (
                        <button
                          key={category.value}
                          onClick={() => { handleCategoryChange(isActive ? 'all' : category.value); setShowMobileFilters(false); }}
                          disabled={count === 0}
                          className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                            isActive
                              ? 'bg-[#72B01D] text-white'
                              : count > 0
                              ? 'bg-gray-50 text-gray-700 border border-gray-200'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <span>{getCategoryIcon(category.value)}</span>
                            <span>{category.label}</span>
                          </span>
                          <span className="text-xs opacity-75">{count}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sidebar - Sticky */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h5 className="text-lg tracking-wide text-gray-900 mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)', fontVariant: 'small-caps' }}>
                  <svg className="w-5 h-5 text-[#72B01D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                  </svg>
                  Categories
                </h5>

                <div className="space-y-1.5">
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Clear Filter
                    </button>
                  )}
                  {PRODUCT_CATEGORIES
                    .filter(cat => cat.value !== 'all')
                    .map(category => {
                      const count = filterProductsByCategory(products, category.value).length
                      const isActive = selectedCategory === category.value
                      
                      return (
                        <button
                          key={category.value}
                          onClick={() => handleCategoryChange(isActive ? 'all' : category.value)}
                          disabled={count === 0}
                          className={`w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 text-left flex items-center justify-between group ${
                            isActive
                              ? 'bg-[#72B01D] text-white shadow-sm'
                              : count > 0
                              ? 'bg-gray-50 text-gray-700 hover:bg-[#72B01D]/10 hover:text-[#72B01D] border border-gray-100'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{getCategoryIcon(category.value)}</span>
                            <span>{category.label}</span>
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            isActive 
                              ? 'bg-white/20' 
                              : 'bg-gray-200/50'
                          }`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}               
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0"> 
            {/* Products Grid Section */}
            <section className="product-grid">
              
              {/* Loading State */}
              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-pulse inline-block">
                    <div className="w-16 h-16 bg-[#72B01D] rounded-full mx-auto mb-4 opacity-75"></div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">Loading Products...</h3>
                    <p className="text-gray-500">Fetching products from CockPit3D</p>
                  </div>
                </div>
              ) : error ? (
                <div className="max-w-2xl mx-auto py-16">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
                    <h4 className="text-xl font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      Error Loading Products
                    </h4>
                    <p className="text-gray-700 mb-4">{error}</p>
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
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                      >
                        ← Back to Home
                      </Link>
                    </div>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="text-2xl font-semibold text-text-primary mb-4">
                    No products found in this category
                  </h3>
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className="px-6 py-3 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white rounded-lg transition-colors font-medium shadow-glow-soft"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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