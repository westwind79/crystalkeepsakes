// app/products/[slug]/page.tsx
// v3.0.0 - 2025-01-15 - Static SSG with pre-generated slugs
import { Metadata } from 'next'
import Link from 'next/link'
import ProductDetailClient from '@/components/ProductDetailClient'
import NextImage from 'next/image'

/**
 * CRITICAL: Force static rendering for output: 'export'
 * This prevents the "dynamic routes cannot coexist with static export" error
 */
export const dynamic = 'force-static'
export const dynamicParams = false  // Required for output: 'export'

/**
 * Build-time static generation for all known slugs
 * Pre-renders all product pages at build time for SEO and performance
 * Reads from cached cockpit3d-products.js file
 */
export async function generateStaticParams() {
  try {
    // Import the cached products file (populated by prebuild script)
    const { finalProductList: cockpit3dProducts } = await import('../../../data/final-product-list.js')
    
    if (!cockpit3dProducts || !Array.isArray(cockpit3dProducts)) {
      console.warn('⚠️ No products found in cached file during build')
      return []
    }
    
    console.log(`✅ [BUILD] Pre-generating ${cockpit3dProducts.length} product pages`)
    
    // Return all slugs for static generation
    return cockpit3dProducts.map((p: any) => ({
      slug: p.slug
    }))
  } catch (error) {
    console.error('❌ [BUILD] Failed to load products for static generation:', error)
    console.error('⚠️ Run: npm run prebuild OR node scripts/fetch-cockpit3d-products.js')
    // Return empty array - build will succeed but no product pages will be generated
    return []
  }
}

/**
 * Generate metadata for each product page (SEO)
 * Next.js 15: params must be awaited before accessing properties
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    // Await params (Next.js 15 requirement)
    const { slug } = await params
    
    const { finalProductList: cockpit3dProducts } = await import('../../../data/final-product-list.js')
    const product = cockpit3dProducts.find((p: any) => p.slug === slug)
    
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.'
      }
    }
    
    return {
      title: `${product.name} | Crystal Keepsakes`,
      description: product.description || product.longDescription || `Shop ${product.name}`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.images?.[0]?.src ? [product.images[0].src] : [],
      }
    }
  } catch (error) {
    return {
      title: 'Product | Crystal Keepsakes',
      description: 'View product details'
    }
  }
}

/**
 * Server Component wrapper
 * Renders the client-side product detail component
 * 
 * NOTE: This is a static page - all data is baked in at build time
 * No runtime API calls, no dynamic params, SEO-friendly
 */
export default function ProductPage() {
  return <ProductDetailClient />
}
