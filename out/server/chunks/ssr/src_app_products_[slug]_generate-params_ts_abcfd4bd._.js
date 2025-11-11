module.exports = {

"[project]/src/app/products/[slug]/generate-params.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// app/products/[slug]/generate-params.ts
// CRITICAL: This reads the CACHED file, not the network endpoint
/**
 * Get product slugs for static generation at build time
 * Reads from the pre-generated cockpit3d-products.js file
 */ __turbopack_context__.s({
    "getProductSlugs": ()=>getProductSlugs
});
async function getProductSlugs() {
    try {
        console.log('📦 [BUILD] Loading product slugs from cached file...');
        // FIXED: Import the generated file directly (not network call)
        const { cockpit3dProducts } = await __turbopack_context__.r("[project]/src/data/cockpit3d-products.js [app-rsc] (ecmascript, async loader)")(__turbopack_context__.i);
        if (!cockpit3dProducts || !Array.isArray(cockpit3dProducts)) {
            console.warn('⚠️ No products found in cached file');
            return getFallbackSlugs();
        }
        console.log(`✅ [BUILD] Loaded ${cockpit3dProducts.length} products from cache`);
        // Extract slugs
        return cockpit3dProducts.map((p)=>({
                slug: p.slug
            }));
    } catch (error) {
        console.error('❌ [BUILD] Failed to load cached products:', error);
        return getFallbackSlugs();
    }
}
/**
 * Fallback slugs if cached file doesn't exist
 * Returns empty array so build doesn't fail, but no product pages are pre-rendered
 * They'll be generated on-demand with ISR instead
 */ function getFallbackSlugs() {
    console.log('⚠️ [BUILD] No products file found - returning empty array');
    console.log('ℹ️  Product pages will be generated on-demand (ISR)');
    console.log('💡 Run: npm run products:fetch');
    // Return empty array - Next.js will handle these routes dynamically
    return [];
}
}),

};

//# sourceMappingURL=src_app_products_%5Bslug%5D_generate-params_ts_abcfd4bd._.js.map