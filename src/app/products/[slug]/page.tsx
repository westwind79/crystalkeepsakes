// app/products/[slug]/page.tsx
// v1.0.0 - 2025-01-03 - No changes needed (Bootstrap-free wrapper)
import { Metadata } from 'next'
import Link from 'next/link'
import ProductDetailClient from '@/components/ProductDetailClient'
import NextImage from 'next/image' 

/**
 * Build-time static generation for all known slugs
 * This pre-renders all product pages at build time for better performance
 */
export async function generateStaticParams() {
  const { getProductSlugs } = await import('./generate-params')
  // returns [{ slug: 'cut-corner-diamond' }, ...]
  const slugs = await getProductSlugs()

  // Fallback in case your Cockpit PHP endpoint isn't reachable at build time
  // if (!slugs || slugs.length === 0) {
  //   return [
  //     { slug: 'cut-corner-diamond' },
  //     { slug: 'rectangle-vertical-crystals' },
  //     // add a couple of your core products here so build never hard-fails
  //   ]
  // }

  return slugs
}

/**
 * Server Component wrapper
 * Simply renders the ProductDetailClient component
 */
export default function ProductPage() {
  return <ProductDetailClient />
}