'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Breadcrumbs from '@/components/BreadCrumbs'
import ProductCard from '@/components/ProductCard'

const isLightBase = (product: any): boolean => {
  const name = product.name.toLowerCase()
  return (
    product.categories?.includes('lightbases') ||
    name.includes('lightbase') ||
    name.includes('light base') ||
    name.includes('stand')
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productType, setProductType] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { finalProductList } = await import('@/data/final-product-list.js')
      setProducts(finalProductList || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterByType = (prods: any[]): any[] => {
    switch (productType) {
      case 'crystals': return prods.filter(p => !isLightBase(p))
      case 'lightbases': return prods.filter(p => isLightBase(p))
      default: return prods
    }
  }

  const filteredProducts = filterByType(products)

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero px-8 py-16 text-center products">
          <h1 className="text-4xl font-light text-white mb-4">Our Creations</h1>
          <p className="text-lg text-gray-200">Discover stunning 3D laser-engraved crystal designs</p>
        </section>
        <Breadcrumbs items={[{ label: 'Products' }]} />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#72B01D] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

<<<<<<< HEAD
=======
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
>>>>>>> origin/frontend-edits
  return (
    <div className="min-h-screen bg-white products">
      <section className="hero px-8 py-16 text-center">
        <h1 className="text-4xl font-light text-white mb-4">Our Creations</h1>
        <p className="text-lg text-gray-200">Discover stunning 3D laser-engraved crystal designs</p>
      </section>

<<<<<<< HEAD
      <Breadcrumbs items={[{ label: 'Products' }]} />

      <section className="border-b border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setProductType('all')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                productType === 'all'
                  ? 'bg-[#72B01D] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#72B01D]'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setProductType('crystals')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                productType === 'crystals'
                  ? 'bg-[#72B01D] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#72B01D]'
              }`}
            >
              💎 Crystals ({products.filter(p => !isLightBase(p)).length})
            </button>
            <button
              onClick={() => setProductType('lightbases')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                productType === 'lightbases'
                  ? 'bg-[#72B01D] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-[#72B01D]'
              }`}
            >
              💡 Light Bases ({products.filter(p => isLightBase(p)).length})
            </button>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
=======
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
>>>>>>> origin/frontend-edits
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
