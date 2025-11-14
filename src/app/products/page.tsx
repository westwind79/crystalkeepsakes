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

  return (
    <div className="min-h-screen bg-white products">
      <section className="hero px-8 py-16 text-center">
        <h1 className="text-4xl font-light text-white mb-4">Our Creations</h1>
        <p className="text-lg text-gray-200">Discover stunning 3D laser-engraved crystal designs</p>
      </section>

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
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
