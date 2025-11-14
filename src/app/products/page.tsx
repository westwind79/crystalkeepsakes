'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Breadcrumbs from '@/components/BreadCrumbs'

const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const shouldLog = ENV_MODE === 'development' || ENV_MODE === 'testing'

const PRODUCT_TYPES = {
  ALL: 'all',
  CRYSTALS: 'crystals',
  LIGHTBASES: 'lightbases'
} as const

type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES]

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productType, setProductType] = useState<ProductType>('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    setSelectedCategory('all')
  }, [productType])

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

  const filterByType = (prods: Product[]): Product[] => {
    switch (productType) {
      case 'crystals': return prods.filter(p => !isLightBase(p))
      case 'lightbases': return prods.filter(p => isLightBase(p))
      default: return prods
    }
  }

  const typeFiltered = filterByType(products)
  const filteredProducts = selectedCategory === 'all' 
    ? typeFiltered
    : typeFiltered.filter(p => p.categories?.includes(selectedCategory))

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero px-8 py-16 text-center">
          <h1 className="text-4xl font-light text-white mb-4">Our Creations</h1>
        </section>
        <Breadcrumbs items={[{ label: 'Products' }]} />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero px-8 py-16 text-center">
          <h1 className="text-4xl font-light text-white mb-4">Our Creations</h1>
        </section>
        <Breadcrumbs items={[{ label: 'Products' }]} />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="text-xl font-semibold text-red-600 mb-3">Error Loading Products</h4>
            <p className="text-gray-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
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
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-400'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setProductType('crystals')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                productType === 'crystals'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-400'
              }`}
            >
              💎 Crystals ({products.filter(p => !isLightBase(p)).length})
            </button>
            <button
              onClick={() => setProductType('lightbases')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                productType === 'lightbases'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-brand-400'
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
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-xl border border-gray-200 hover:border-brand-500 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="relative h-52 bg-gray-50">
                  <Image
                    src={product.images[0]?.src || 'https://placehold.co/800x800?text=No+Image'}
                    alt={product.name}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  {isLightBase(product) && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">💡</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-brand-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-2xl font-light text-brand-500">${product.basePrice}</span>
                    <span className="text-sm text-brand-500 font-medium">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
