// app/api/admin/save-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    // Save to src/data/final-product-list.js
    const filePath = join(process.cwd(), 'src', 'data', 'final-product-list.js')
    writeFileSync(filePath, content, 'utf-8')

    console.log('✅ Saved final-product-list.js to:', filePath)

    return NextResponse.json({ 
      success: true, 
      path: filePath,
      message: 'Products saved successfully'
    })

  } catch (error: any) {
    console.error('❌ Error saving products:', error)
    return NextResponse.json(
      { error: 'Failed to save products', details: error.message },
      { status: 500 }
    )
  }
}
