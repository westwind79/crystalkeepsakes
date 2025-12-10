// app/api/admin/upload-image/route.ts
// DEVELOPMENT ONLY - Image upload for admin panel
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const formData = await request.formData()
    const productId = formData.get('productId') as string
    const file = formData.get('image') as File

    if (!productId || !file) {
      return NextResponse.json(
        { error: 'Missing productId or image file' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()
    const timestamp = Date.now()
    const filename = `product_${productId}_${timestamp}.${extension}`

    // Define upload directory
    const appRoot = process.cwd()
    const uploadDir = join(appRoot, 'public', 'img', 'products', 'cockpit3d', productId)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
      console.log('✅ Created directory:', uploadDir)
    }

    // Save file
    const uploadPath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(uploadPath, buffer)

    console.log('✅ Image uploaded:', uploadPath)

    // Return URL (relative path for frontend)
    const fileUrl = `/img/products/cockpit3d/${productId}/${filename}`

    return NextResponse.json({
      success: true,
      filename: filename,
      url: fileUrl,
      size: file.size,
      originalSize: file.size,
      mimeType: file.type,
      compressed: false,
      compressionError: 'Not implemented in Next.js version',
      productId: productId,
      debug: {
        uploadDir: uploadDir,
        uploadPath: uploadPath,
        fileExists: existsSync(uploadPath),
        fileSize: buffer.length
      }
    })

  } catch (error: any) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error.message },
      { status: 500 }
    )
  }
}

// Route segment config for Next.js App Router
// Note: dynamic routes don't work with static export, so this is dev-only
