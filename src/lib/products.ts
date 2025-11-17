import { assetPath } from './assetPath'

/**
 * Get products with environment-aware data loading:
 * - Development: Load from static JS file (fast, supports hot-reload)
 * - Production: Fetch from JSON file (allows FTP updates without rebuild)
 */
export async function getProducts() {
  // In development, load from static JS file
  if (process.env.NODE_ENV === 'development') {
    const { finalProductList } = await import('@/data/final-product-list')
    return finalProductList
  }
  
  // In production, fetch from JSON file
  const res = await fetch(assetPath('/data/products.json'))
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`)
  }
  return res.json()
}
