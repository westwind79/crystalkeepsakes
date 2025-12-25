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
 * Upload a customer's customized image to the server
 * @param imageData Base64 image data
 * @param productId Product ID
 * @param imageType Type of image ('masked' or 'raw')
 * @returns Upload result with server URL
 */
export async function uploadCustomerImage(
  imageData: string,
  productId: string,
  imageType: 'masked' | 'raw' = 'masked',
  orderNumber?: string
): Promise<UploadResult> {
  try {
    // Validate input
    if (!imageData) {
      console.error(`❌ [UPLOAD ${imageType}] No image data provided!`)
      return { success: false, error: 'No image data provided' }
    }
    
    if (!imageData.startsWith('data:image/')) {
      console.error(`❌ [UPLOAD ${imageType}] Invalid image format - must be base64 data URL`)
      console.error(`❌ [UPLOAD ${imageType}] Received: ${imageData.substring(0, 50)}...`)
      return { success: false, error: 'Invalid image format - must start with data:image/' }
    }
    
    // Log what we're uploading
    console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Starting upload:`, {
      type: imageType,
      productId,
      orderNumber,
      dataLength: imageData.length,
      dataPreview: imageData.substring(0, 50) + '...'
    })
    
    // Get backend URL
    const backendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || ''
    const apiUrl = backendUrl 
      ? `${backendUrl}/api/customer-image-upload.php` 
      : '/api/customer-image-upload.php'
    
    console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] API URL:`, apiUrl)
    
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
      })
    })
    
    console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Response status:`, response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] HTTP error:`, response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log(`📤 [UPLOAD ${imageType.toUpperCase()}] Response:`, result)
    
    if (result.success) {
      console.log(`✅ [UPLOAD ${imageType.toUpperCase()}] SUCCESS:`, result.url)
      return {
        success: true,
        url: result.url,
        filename: result.filename
      }
    } else {
      console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] FAILED:`, result.error)
      return {
        success: false,
        error: result.error
      }
    }
  } catch (error) {
    console.error(`❌ [UPLOAD ${imageType.toUpperCase()}] EXCEPTION:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
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
  
  // Upload masked image with order number
  const maskedResult = await uploadCustomerImage(maskedImage, productId, 'masked', orderNumber)
  if (maskedResult.success) {
    maskedUrl = maskedResult.url
  } else {
    errors.push(`Masked image: ${maskedResult.error}`)
  }
  
  // Upload raw image if provided with order number
  if (rawImage) {
    const rawResult = await uploadCustomerImage(rawImage, productId, 'raw', orderNumber)
    if (rawResult.success) {
      rawUrl = rawResult.url
    } else {
      errors.push(`Raw image: ${rawResult.error}`)
    }
  }
  
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
