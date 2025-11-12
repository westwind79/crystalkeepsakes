// app/products/[slug]/page.tsx
// v2.0.0 - 2025-01-15 - Fixed dev mode routing
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
 * CRITICAL FIX: Enable dynamic params for dev mode
 * This allows routes not in generateStaticParams to work in both dev and production
 * - In build: Pre-generates all known product pages
 * - In dev: Allows accessing any product from the data file dynamically
 */
export const dynamicParams = true

/**
 * Server Component wrapper
 * Simply renders the ProductDetailClient component
 */
export default function ProductPage() {
  return <ProductDetailClient />
}
