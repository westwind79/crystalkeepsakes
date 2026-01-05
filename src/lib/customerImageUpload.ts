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
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Validate input
      if (!imageData) {
        console.error(`❌ [UPLOAD ${imageType}] No image data provided!`)
        return { success: false, error: 'No image data provided' }
      }
      
      if (!imageData.startsWith('data:image/')) {
        console.error(`❌ [UPLOAD ${imageType}] Invalid image format - must be base64 data URL`)
        return { success: false, error: 'Invalid image format - must start with data:image/' }
      }
      
      // Log what we're uploading
      const imageSizeKB = Math.round(imageData.length / 1024)
      console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Attempt ${attempt}/${maxRetries}:`, {
        type: imageType,
        productId,
        orderNumber,
        sizeKB: imageSizeKB,
      })
      
      // Warn if image is very large
      if (imageSizeKB > 5000) {
        console.warn(`⚠️ [UPLOAD ${imageType.toUpperCase()}] Large image: ${imageSizeKB}KB - may take longer`)
      }
      
      // Get backend URL
      const backendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || ''
      const apiUrl = backendUrl 
        ? `${backendUrl}/api/customer-image-upload.php` 
        : '/api/customer-image-upload.php'
      
      // Create abort controller for timeout (90 seconds for large images)
      const controller = new AbortController()
      const timeoutMs = imageSizeKB > 3000 ? 90000 : 60000
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
            imageData,
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
  console.log('🖼️ [UPLOAD IMAGES] Starting upload for order:', orderNumber)
  console.log('🖼️ [UPLOAD IMAGES] Product ID:', productId)
  console.log('🖼️ [UPLOAD IMAGES] Masked image provided:', !!maskedImage, maskedImage ? `(${maskedImage.length} chars)` : '')
  console.log('🖼️ [UPLOAD IMAGES] Raw image provided:', !!rawImage, rawImage ? `(${rawImage.length} chars)` : '')
  
  // Upload masked image FIRST
  if (maskedImage) {
    console.log('🖼️ [UPLOAD IMAGES] === Uploading MASKED image ===')
    const maskedResult = await uploadCustomerImage(maskedImage, productId, 'masked', orderNumber)
    console.log('🖼️ [UPLOAD IMAGES] MASKED upload result:', JSON.stringify(maskedResult, null, 2))
    
    if (maskedResult.success && maskedResult.url) {
      maskedUrl = maskedResult.url
      console.log('✅ [UPLOAD IMAGES] MASKED image uploaded successfully:', maskedUrl)
    } else {
      const errorMsg = `Masked image upload failed: ${maskedResult.error || 'No URL returned'}`
      errors.push(errorMsg)
      console.error('❌ [UPLOAD IMAGES] MASKED image FAILED:', maskedResult.error)
      console.error('❌ [UPLOAD IMAGES] Full result:', maskedResult)
    }
  } else {
    console.warn('⚠️ [UPLOAD IMAGES] No masked image provided!')
    errors.push('No masked image provided')
  }
  
  // Upload raw image if provided
  if (rawImage) {
    console.log('🖼️ [UPLOAD IMAGES] === Uploading RAW image ===')
    const rawResult = await uploadCustomerImage(rawImage, productId, 'raw', orderNumber)
    console.log('🖼️ [UPLOAD IMAGES] RAW upload result:', JSON.stringify(rawResult, null, 2))
    
    if (rawResult.success && rawResult.url) {
      rawUrl = rawResult.url
      console.log('✅ [UPLOAD IMAGES] RAW image uploaded successfully:', rawUrl)
    } else {
      const errorMsg = `Raw image upload failed: ${rawResult.error || 'No URL returned'}`
      errors.push(errorMsg)
      console.error('❌ [UPLOAD IMAGES] RAW image FAILED:', rawResult.error)
    }
  } else {
    console.log('ℹ️ [UPLOAD IMAGES] No raw image provided (optional)')
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
