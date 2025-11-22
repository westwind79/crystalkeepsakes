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
      // Save timestamped backup - JSON ONLY
      const jsonPath = join(appRoot, 'public', 'data', `final-products-${timestamp}.json`)
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Backup created:', jsonPath)
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created: final-products-${timestamp}.json`,
        jsonPath
      })
    } else {
      // Save current working file - JSON ONLY
      const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Products saved:', jsonPath)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to server',
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
