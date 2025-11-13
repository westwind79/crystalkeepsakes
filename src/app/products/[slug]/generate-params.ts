// app/products/[slug]/generate-params.ts
// CRITICAL: This reads the CACHED file, not the network endpoint

/**
 * Get product slugs for static generation at build time
 * Reads from the pre-generated cockpit3d-products.js file
 */
export async function getProductSlugs() {
  try {
    console.log('📦 [BUILD] Loading product slugs from cached file...')
    
    // FIXED: Import the generated file directly (not network call)
    const { cockpit3dProducts } = await import('../../../data/cockpit3d-products.js')
    
    if (!cockpit3dProducts || !Array.isArray(cockpit3dProducts)) {
      console.warn('⚠️ No products found in cached file')
      return getFallbackSlugs()
    }
    
    console.log(`✅ [BUILD] Loaded ${cockpit3dProducts.length} products from cache`)
    
    // Extract slugs
    return cockpit3dProducts.map((p: any) => ({ 
      slug: p.slug 
    }))
    
  } catch (error) {
    console.error('❌ [BUILD] Failed to load cached products:', error)
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