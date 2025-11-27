// app/products/[slug]/generate-params.ts
// CRITICAL: This reads from JSON file as single source of truth

import { getProducts } from '@/lib/products'

/**
 * Get product slugs for static generation at build time
 * Reads from the JSON file (single source of truth)
 */
export async function getProductSlugs() {
  try {
    console.log('📦 [BUILD] Loading product slugs from JSON...')
    
    const allProducts = await getProducts()
    
    if (!allProducts || !Array.isArray(allProducts)) {
      console.warn('⚠️ No products found in JSON file')
      return getFallbackSlugs()
    }
    
    console.log(`✅ [BUILD] Loaded ${allProducts.length} products from JSON`)
    
    // Extract slugs
    return allProducts.map((p: any) => ({ 
      slug: p.slug 
    }))
    
  } catch (error) {
    console.error('❌ [BUILD] Failed to load products from JSON:', error)
    return getFallbackSlugs()
  }
}

/**
 * Fallback slugs if cached file doesn't exist
 * Returns empty array - build will succeed but no product pages will be generated
 * IMPORTANT: With output: 'export' and dynamicParams: false, missing slugs = 404
 */
function getFallbackSlugs() {
  console.log('⚠️ [BUILD] No products file found - returning empty array')
  console.log('⚠️ [BUILD] NO PRODUCT PAGES WILL BE GENERATED!')
  console.log('💡 Run: npm run prebuild OR node scripts/fetch-cockpit3d-products.js')
  
  // Return empty array - static export will generate zero product pages
  return []
}