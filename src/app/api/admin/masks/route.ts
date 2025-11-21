// app/api/admin/masks/route.ts
import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const masksDir = join(process.cwd(), 'public', 'img', 'masks')
    const files = await readdir(masksDir)
    
    // Filter for image files only
    const maskFiles = files
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        path: `/img/masks/${file}`,
        displayName: file.replace(/-mask\.(png|jpg|jpeg|webp)$/i, '').replace(/[-_]/g, ' ')
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    
    return NextResponse.json({ success: true, masks: maskFiles })
  } catch (error: any) {
    console.error('Error reading masks directory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load masks', details: error.message },
      { status: 500 }
    )
  }
}
