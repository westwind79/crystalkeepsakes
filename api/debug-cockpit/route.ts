// app/api/debug-cockpit/route.ts
import { NextResponse } from 'next/server'
import { getCatalog } from '@/lib/cockpit3d'

export async function GET() {
  try {
    const catalog = await getCatalog()
    
    // Get first product from catalog for comparison
    const firstCategory = catalog[0]
    const firstProduct = firstCategory?.products?.[0]
    
    return NextResponse.json({
      success: true,
      
      // CATALOG Structure
      catalog_first_category: {
        name: firstCategory?.name,
        id: firstCategory?.id,
        product_count: firstCategory?.products?.length
      },
      
      catalog_first_product: firstProduct,
      
      // Product Options Detail
      product_options: firstProduct?.options?.map((opt: any) => ({
        name: opt.name,
        values: opt.values?.map((val: any) => ({
          id: val.id,
          name: val.name,
          price: val.price,
          price_type: typeof val.price
        }))
      })),
      
      // Full catalog summary
      catalog_summary: catalog.map((cat: any) => ({
        category: cat.name,
        products: cat.products?.length || 0,
        first_product_name: cat.products?.[0]?.name,
        first_product_price: cat.products?.[0]?.price,
        has_options: !!cat.products?.[0]?.options
      }))
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}