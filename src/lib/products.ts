import { assetPath } from './assetPath'

/**
 * Get products - ALWAYS uses JSON file for consistency
 * Works in development AND production
 * Allows FTP updates without rebuild
 */
export async function getProducts() {
  const res = await fetch(assetPath('/data/final-products.json'))
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`)
  }
  return res.json()
}
