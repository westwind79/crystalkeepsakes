/**
 * Customer Image Upload Utility
 * Uploads customer customized images to server for persistence
 * Works in both development and production
 */

interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  error?: string
}

/**
 * Sleep helper for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Compress a large PNG to WebP for faster upload
 * WebP is much smaller than PNG while maintaining quality
 */
async function compressForUpload(imageData: string, maxSizeKB: number = 2000): Promise<string> {
  const currentSizeKB = Math.round(imageData.length / 1024)
  
  // If already small enough, return as-is
  if (currentSizeKB <= maxSizeKB) {
    console.log(`📦 [COMPRESS] Image already small enough: ${currentSizeKB}KB <= ${maxSizeKB}KB`)
    return imageData
  }
  
  console.log(`📦 [COMPRESS] Image too large (${currentSizeKB}KB), compressing...`)
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('📦 [COMPRESS] No canvas context, returning original')
        resolve(imageData)
        return
      }
      
      // Draw image
      ctx.drawImage(img, 0, 0)
      
      // Try WebP first (best compression), then JPEG
      let quality = 0.9
      let compressed = canvas.toDataURL('image/webp', quality)
      
      // If WebP not supported or still too big, try JPEG
      if (compressed.startsWith('data:image/png') || compressed.length / 1024 > maxSizeKB) {
        compressed = canvas.toDataURL('image/jpeg', quality)
      }
      
      // Keep reducing quality until small enough
      while (compressed.length / 1024 > maxSizeKB && quality > 0.5) {
        quality -= 0.1
        compressed = canvas.toDataURL('image/jpeg', quality)
      }
      
      const newSizeKB = Math.round(compressed.length / 1024)
      console.log(`📦 [COMPRESS] Compressed: ${currentSizeKB}KB → ${newSizeKB}KB (quality: ${quality.toFixed(1)})`)
      
      resolve(compressed)
    }
    
    img.onerror = () => {
      console.warn('📦 [COMPRESS] Failed to load image for compression, returning original')
      resolve(imageData)
    }
    
    img.src = imageData
  })
}

/**
 * Upload a customer's customized image to the server
 * Includes retry logic for transient failures
 * @param imageData Base64 image data
 * @param productId Product ID
 * @param imageType Type of image ('masked' or 'raw')
 * @returns Upload result with server URL
 */
export async function uploadCustomerImage(
  imageData: string,
  productId: string,
  imageType: 'masked' | 'raw' = 'masked',
  orderNumber?: string,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: string = 'Unknown error'
  
  // Compress large images before upload (especially PNGs)
  const originalSizeKB = Math.round(imageData.length / 1024)
  let uploadData = imageData
  
  if (originalSizeKB > 2000 && typeof window !== 'undefined') {
    console.log(`📦 [UPLOAD ${imageType.toUpperCase()}] Image is ${originalSizeKB}KB, compressing before upload...`)
    uploadData = await compressForUpload(imageData, 1500) // Target 1.5MB max
  }
  
  const uploadSizeKB = Math.round(uploadData.length / 1024)
  if (uploadSizeKB !== originalSizeKB) {
    console.log(`📦 [UPLOAD ${imageType.toUpperCase()}] Compressed: ${originalSizeKB}KB → ${uploadSizeKB}KB`)
  }
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Validate input
      if (!uploadData) {
        console.error(`❌ [UPLOAD ${imageType}] No image data provided!`)
        return { success: false, error: 'No image data provided' }
      }
      
      if (!uploadData.startsWith('data:image/')) {
        console.error(`❌ [UPLOAD ${imageType}] Invalid image format - must be base64 data URL`)
        return { success: false, error: 'Invalid image format - must start with data:image/' }
      }
      
      // Log what we're uploading (using compressed size)
      console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Attempt ${attempt}/${maxRetries}:`, {
        type: imageType,
        productId,
        orderNumber,
        sizeKB: uploadSizeKB,
      })
      
      // Warn if image is still very large after compression
      if (uploadSizeKB > 3000) {
        console.warn(`⚠️ [UPLOAD ${imageType.toUpperCase()}] Large image: ${uploadSizeKB}KB - may take longer`)
      }
      
      // Get backend URL
      const backendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || ''
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/images/customer-image-upload.php` 
        : '/api/images/customer-image-upload.php'
      
      // Create abort controller for timeout (90 seconds for large images)
      const controller = new AbortController()
      const timeoutMs = uploadSizeKB > 2000 ? 90000 : 60000
      const timeoutId = setTimeout(() => {
        console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] TIMEOUT after ${timeoutMs/1000}s`)
        controller.abort()
      }, timeoutMs)
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: uploadData,  // Use compressed data
            productId,
            imageType,
            orderNumber
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Response status:`, response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] HTTP error:`, response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ [UPLOAD ${imageType.toUpperCase()}] SUCCESS on attempt ${attempt}:`, result.url)
          return {
            success: true,
            url: result.url,
            filename: result.filename
          }
        } else {
          console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] Server error:`, result.error)
          lastError = result.error || 'Server returned failure'
          // Don't retry server-side errors
          return { success: false, error: lastError }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      // Determine error type and message
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = 'Upload timed out - image may be too large'
        } else if (error.message === 'Failed to fetch') {
          lastError = 'Network error - connection failed'
        } else {
          lastError = error.message
        }
      }
      
      console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] Attempt ${attempt} failed:`, lastError)
      
      // Retry for network errors, not for validation errors
      if (attempt < maxRetries && (lastError.includes('Network') || lastError.includes('timed out') || lastError.includes('Failed to fetch'))) {
        const retryDelay = attempt * 2000 // 2s, 4s, 6s
        console.log(`🔄 [UPLOAD ${imageType.toUpperCase()}] Retrying in ${retryDelay/1000}s...`)
        await sleep(retryDelay)
      }
    }
  }
  
  // All retries exhausted
  console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] All ${maxRetries} attempts failed`)
  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts: ${lastError}`
  }
}

/**
 * Upload both masked and raw images for a cart item
 * Uploads in PARALLEL for better reliability
 * @param maskedImage Masked/processed image base64
 * @param rawImage Original uploaded image base64
 * @param productId Product ID
 * @returns Object with both URLs
 */
export async function uploadCustomerImages(
  maskedImage: string,
  rawImage: string | undefined,
  productId: string,
  orderNumber?: string
): Promise<{
  maskedUrl?: string
  rawUrl?: string
  errors: string[]
}> {
  const errors: string[] = []
  let maskedUrl: string | undefined
  let rawUrl: string | undefined
  
  console.log('🖼️ [UPLOAD IMAGES] =============================================')
  console.log('🖼️ [UPLOAD IMAGES] Starting PARALLEL upload for order:', orderNumber)
  console.log('🖼️ [UPLOAD IMAGES] Product ID:', productId)
  console.log('🖼️ [UPLOAD IMAGES] Masked image:', maskedImage ? `${Math.round(maskedImage.length/1024)}KB` : 'NONE')
  console.log('🖼️ [UPLOAD IMAGES] Raw image:', rawImage ? `${Math.round(rawImage.length/1024)}KB` : 'NONE')
  
  // Build array of upload promises
  const uploadPromises: Promise<{ type: 'masked' | 'raw', result: UploadResult }>[] = []
  
  if (maskedImage) {
    uploadPromises.push(
      uploadCustomerImage(maskedImage, productId, 'masked', orderNumber)
        .then(result => ({ type: 'masked' as const, result }))
    )
  }
  
  if (rawImage) {
    uploadPromises.push(
      uploadCustomerImage(rawImage, productId, 'raw', orderNumber)
        .then(result => ({ type: 'raw' as const, result }))
    )
  }
  
  if (uploadPromises.length === 0) {
    console.warn('⚠️ [UPLOAD IMAGES] No images to upload!')
    errors.push('No images provided')
    return { maskedUrl, rawUrl, errors }
  }
  
  // Execute all uploads in parallel
  console.log(`🚀 [UPLOAD IMAGES] Starting ${uploadPromises.length} parallel uploads...`)
  const results = await Promise.allSettled(uploadPromises)
  
  // Process results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { type, result: uploadResult } = result.value
      
      if (uploadResult.success && uploadResult.url) {
        if (type === 'masked') {
          maskedUrl = uploadResult.url
          console.log('✅ [UPLOAD IMAGES] MASKED succeeded:', maskedUrl)
        } else {
          rawUrl = uploadResult.url
          console.log('✅ [UPLOAD IMAGES] RAW succeeded:', rawUrl)
        }
      } else {
        const errorMsg = `${type} image upload failed: ${uploadResult.error || 'No URL returned'}`
        errors.push(errorMsg)
        console.error(`❌ [UPLOAD IMAGES] ${type.toUpperCase()} FAILED:`, uploadResult.error)
      }
    } else {
      // Promise rejected (shouldn't happen with our error handling, but just in case)
      const errorMsg = `Upload rejected: ${result.reason}`
      errors.push(errorMsg)
      console.error('❌ [UPLOAD IMAGES] Promise rejected:', result.reason)
    }
  }
  
  console.log('🖼️ [UPLOAD IMAGES] ========== UPLOAD SUMMARY ==========')
  console.log('🖼️ [UPLOAD IMAGES] Masked URL:', maskedUrl || '❌ FAILED/MISSING')
  console.log('🖼️ [UPLOAD IMAGES] Raw URL:', rawUrl || '(not provided or failed)')
  console.log('🖼️ [UPLOAD IMAGES] Errors:', errors.length > 0 ? errors : 'None')
  console.log('🖼️ [UPLOAD IMAGES] =============================================')
  
  return {
    maskedUrl,
    rawUrl,
    errors
  }
}

/**
 * Check if image needs to be uploaded to server
 * (If it's base64, it needs upload. If it's URL, it's already uploaded)
 */
export function needsUpload(imageData: string | undefined): boolean {
  if (!imageData) return false
  return imageData.startsWith('data:image/')
}
