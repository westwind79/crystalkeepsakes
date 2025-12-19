// app/sitemap.ts
// Version: 1.0.0 | Date: 2024-12-18
// Auto-generates sitemap.xml from navigation config + dynamic products
// Next.js automatically serves this at /sitemap.xml

import { MetadataRoute } from 'next'
import { getProducts } from '@/lib/products'
import { navItems } from '@/lib/navigation'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://crystalkeepsakes.com'
  
  console.log('[SITEMAP] Generating sitemap.xml...')
  
  // Static pages from navigation config
  const staticPages = navItems.map((item) => ({
    url: `${baseUrl}${item.href}`,
    lastModified: new Date(),
    changeFrequency: item.changeFrequency || 'monthly',
    priority: item.priority || 0.5,
  }))

  console.log(`[SITEMAP] Added ${staticPages.length} static pages`)

  // Dynamic product pages
  const products = await getProducts()
  const productUrls = products.map((product: any) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  console.log(`[SITEMAP] Added ${productUrls.length} product pages`)
  console.log(`[SITEMAP] Total URLs: ${staticPages.length + productUrls.length}`)

  return [...staticPages, ...productUrls]
}