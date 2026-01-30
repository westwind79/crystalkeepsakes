// app/products/[slug]/page.tsx
// v3.0.0 - 2025-01-15 - Static SSG with pre-generated slugs
import { Metadata } from 'next'
import Link from 'next/link'
import ProductDetailClient from '@/components/ProductDetailClient'
import NextImage from 'next/image'
import '../../css/gallery.css'
/**
 * CRITICAL: Force static rendering for output: 'export' in production
 * In development, we use force-dynamic to allow dynamic route testing
 */
export const dynamic = 'auto'
export const dynamicParams = true

/**
 * Build-time static generation for all known slugs
 * Pre-renders all product pages at build time for SEO and performance
 * Reads from final-products.json
 */
export async function generateStaticParams() {
  try {
    // Read JSON file from filesystem at build time
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', 'data', 'final-products.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const cockpit3dProducts = JSON.parse(fileContent)
    
    if (!cockpit3dProducts || !Array.isArray(cockpit3dProducts)) {
      console.warn('⚠️ No products found in JSON file during build')
      return []
    }
    
    console.log(`✅ [BUILD] Pre-generating ${cockpit3dProducts.length} product pages`)
    
    // Return all slugs for static generation
    return cockpit3dProducts.map((p: any) => ({
      slug: p.slug
    }))
  } catch (error) {
    console.error('❌ [BUILD] Failed to load products for static generation:', error)
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
    
    // Read JSON file from filesystem
    const fs = await import('fs')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'public', 'data', 'final-products.json')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const cockpit3dProducts = JSON.parse(fileContent)
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
