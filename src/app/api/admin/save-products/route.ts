// app/api/admin/save-products/route.ts
// DEVELOPMENT ONLY - For local admin panel file saving
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, chmodSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const { jsContent, isBackup, timestamp } = await request.json()

    if (!jsContent) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const appRoot = process.cwd()
    
    if (isBackup) {
      // Save timestamped backup - JS file
      const jsPath = join(appRoot, 'src', 'data', `final-product-list-${timestamp}.js`)
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Backup created:', jsPath)
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created: final-product-list-${timestamp}.js`,
        jsPath
      })
    } else {
      // Save current working file - JS file
      const jsPath = join(appRoot, 'src', 'data', 'final-product-list.js')
      
      // Also save JSON version for static export
      const match = jsContent.match(/export const finalProductList = (\[[\s\S]*?\]);/)
      if (match) {
        const jsonContent = match[1]
        const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
        writeFileSync(jsonPath, jsonContent, 'utf-8')
        console.log('✅ JSON saved:', jsonPath)
      }
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Products saved:', jsPath)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to project (JS + JSON)',
        jsPath
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
