// app/api/admin/save-products/route.ts
// DEVELOPMENT ONLY - For local admin panel file saving
import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync } from 'fs'
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
    const { products, isBackup, timestamp } = await request.json()

    if (!products) {
      return NextResponse.json({ error: 'Missing products data' }, { status: 400 })
    }

    const appRoot = process.cwd()
    const jsonContent = JSON.stringify(products, null, 2)
    
    if (isBackup) {
      // Save timestamped backup
      const jsonPath = join(appRoot, 'public', 'data', `final-products-${timestamp}.json`)
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Backup created:', jsonPath)
      
      return NextResponse.json({ 
        success: true, 
        message: `Backup created: final-products-${timestamp}.json`,
        jsonPath
      })
    } else {
      // Save to main file
      const jsonPath = join(appRoot, 'public', 'data', 'final-products.json')
      writeFileSync(jsonPath, jsonContent, 'utf-8')
      
      console.log('✅ Products saved:', jsonPath)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Products saved to final-products.json',
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
