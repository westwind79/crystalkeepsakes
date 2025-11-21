// app/api/admin/save-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { jsonContent, isBackup, timestamp } = await request.json()

    if (!jsonContent) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const appRoot = process.cwd()
    
    if (isBackup) {
      // Save timestamped backup (JSON only)
      const jsonPath = join(appRoot, 'public', 'data', `final-products-${timestamp}.json`)
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Backup created:', { jsonPath })
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created with timestamp ${timestamp}`,
        jsonPath
      })
    } else {
      // Save current working file (JSON only)
      const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
      
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Products saved:', { jsonPath })
      
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
