// app/api/admin/save-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { jsonContent, jsContent, isBackup, timestamp } = await request.json()

    if (!jsonContent || !jsContent) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const appRoot = process.cwd()
    
    if (isBackup) {
      // Save timestamped backups
      const jsonPath = join(appRoot, 'public', 'data', `final-products-${timestamp}.json`)
      const jsPath = join(appRoot, 'src', 'data', `final-products-${timestamp}.js`)
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Backup created:', { jsonPath, jsPath })
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created with timestamp ${timestamp}`,
        files: { json: jsonPath, js: jsPath }
      })
    } else {
      // Save current working files
      const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
      const jsPath = join(appRoot, 'src', 'data', 'final-product-list.js')
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Products saved:', { jsonPath, jsPath })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to server',
        files: { json: jsonPath, js: jsPath }
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
