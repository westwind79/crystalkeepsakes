// app/api/admin/save-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { jsContent, isBackup, timestamp } = await request.json()

    if (!jsContent) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const appRoot = process.cwd()
    
    // Extract JSON array from JS content
    const match = jsContent.match(/export const finalProductList = (\[[\s\S]*?\]);/)
    if (!match) {
      return NextResponse.json({ error: 'Invalid JS content format' }, { status: 400 })
    }
    const jsonContent = match[1]
    
    if (isBackup) {
      // Save timestamped backup - BOTH FILES
      const jsPath = join(appRoot, 'src', 'data', `final-product-list-${timestamp}.js`)
      const jsonPath = join(appRoot, 'public', 'data', `final-products-${timestamp}.json`)
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Backup created:', { jsPath, jsonPath })
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created with timestamp ${timestamp}`,
        jsPath,
        jsonPath
      })
    } else {
      // Save current working files - BOTH FILES
      const jsPath = join(appRoot, 'src', 'data', 'final-product-list.js')
      const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Products saved:', { jsPath, jsonPath })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to server',
        jsPath,
        jsonPath
      })
    }

  } catch (error: any) {
    console.error('❌ Error saving products:', error)
    return NextResponse.json(
      { error: 'Failed to save products', details: error.message },
      { status: 500 }
    )
  }
}
