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
    
    if (isBackup) {
      // Save timestamped backup - JS ONLY
      const jsPath = join(appRoot, 'src', 'data', `final-product-list-${timestamp}.js`)
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Backup created:', jsPath)
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created with timestamp ${timestamp}`,
        jsPath
      })
    } else {
      // Save current working file - JS ONLY
      const jsPath = join(appRoot, 'src', 'data', 'final-product-list.js')
      
      writeFileSync(jsPath, jsContent, 'utf-8')
      
      console.log('✅ Products saved:', jsPath)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to server',
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
