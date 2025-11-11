// lib/cartUtils.ts
// Version: 1.4.0 - 2025-11-08 - ENHANCED QUOTA MANAGEMENT
// Fixed: QuotaExceededError with aggressive cleanup
// Removes ALL image URLs from options object (prevents duplicates)
// Better compression: 100x100 thumbnails at 50% quality
// Automatic cleanup when approaching quota limit
// Previous: 150x150 thumbnails with basic compression

import { logger } from '@/utils/logger'

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: any
  sizeDetails?: any
  customImage?: {
    dataUrl: string          // Compressed thumbnail for cart display
    filename: string
    mimeType: string
    fileSize: number
    width: number
    height: number
    processedAt?: string
    maskId?: string
    maskName?: string
  }
  cockpit3d_id?: string
  dateAdded: string
}

/**
 * Compress image to TINY thumbnail for cart storage
 * Reduces base64 size by ~97% (e.g., 2MB -> 60KB)
 */
async function compressImageToThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_SIZE = 100 // Reduced from 150 to 100 for smaller size
      let width = img.width
      let height = img.height
      
      // Maintain aspect ratio
      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height
          height = MAX_SIZE
        }
      }
      
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      
      // Lower quality JPEG for minimal size (reduced from 0.6 to 0.5)
      resolve(canvas.toDataURL('image/jpeg', 0.5))
    }
    img.onerror = () => reject(new Error('Image compression failed'))
    img.src = dataUrl
  })
}

/**
 * Clean options object - remove ALL image data URLs
 * This prevents duplicate storage of images in both customImage AND options
 */
function cleanOptions(options: any): any {
  if (!options) return {}
  
  const cleaned = { ...options }
  
  // Remove all image data URLs from options
  delete cleaned.rawImageUrl
  delete cleaned.imageUrl
  delete cleaned.maskedImageUrl
  
  // Keep only essential metadata
  return {
    ...cleaned,
    size: cleaned.size,
    background: cleaned.background,
    lightBase: cleaned.lightBase,
    giftStand: cleaned.giftStand,
    customText: cleaned.customText,
    // Only keep image filenames, not data URLs
    originalImageFilename: cleaned.imageFilename,
    imageFilename: cleaned.imageFilename,
    maskName: cleaned.maskName
  }
}

// Add item to cart with image compression
export async function addToCart(item: CartItem | any): Promise<void> {
  logger.order('Adding item to cart', {
    hasCustomImage: !!item.customImage,
    originalImageSize: item.customImage?.dataUrl?.length || 0
  })
  
  try {
    // Check storage health BEFORE adding
    const healthCheck = checkStorageHealth()
    if (!healthCheck.isHealthy) {
      throw new Error(healthCheck.message || 'Storage quota exceeded. Please clear your cart.')
    }
    
    const cart = getCart()
    // ✅ Upload original and masked images to server
    if (item.customImage?.dataUrl) {
      const originalUrl = item.options?.rawImageUrl || item.customImage.dataUrl
      const maskedUrl = item.customImage.dataUrl

      try {
        const originalRes = await fetch('/api/upload-image.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: originalUrl,
            orderNumber: 'temp', // we’ll update this later when order is created
            cartItemId: item.productId,
            imageType: 'original'
          })
        })
        const maskedRes = await fetch('/api/upload-image.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: maskedUrl,
            orderNumber: 'temp',
            cartItemId: item.productId,
            imageType: 'masked'
          })
        })

        const originalData = await originalRes.json()
        const maskedData = await maskedRes.json()

        if (originalData.success) {
          cartItem.options.originalImageUrl = originalData.url
        }
        if (maskedData.success) {
          cartItem.options.maskedImageUrl = maskedData.url
        }
      } catch (err) {
        console.warn('Image upload failed', err)
      }
    }
    // Store full-resolution image in sessionStorage for checkout
    let originalImageUrl: string | null = null
    if (item.customImage?.dataUrl) {
      originalImageUrl = item.customImage.dataUrl
      const imageId = `${item.productId}_${Date.now()}`
      storeFullResImage(imageId, originalImageUrl)
    }
    
    // Compress custom image if present
    let compressedCustomImage = item.customImage
    if (item.customImage?.dataUrl) {
      try {
        const thumbnailUrl = await compressImageToThumbnail(item.customImage.dataUrl)
        
        compressedCustomImage = {
          ...item.customImage,
          dataUrl: thumbnailUrl, // Replace with small thumbnail
          fullResId: originalImageUrl ? `${item.productId}_${Date.now()}` : undefined
        }
        
        logger.info('Image compressed', {
          original: item.customImage.dataUrl.length,
          compressed: thumbnailUrl.length,
          reduction: ((1 - thumbnailUrl.length / item.customImage.dataUrl.length) * 100).toFixed(1) + '%'
        })
      } catch (error) {
        logger.error('Image compression failed, skipping image', error)
        // Skip image entirely rather than risk quota error
        compressedCustomImage = undefined
      }
    }
    
    // Clean options to remove duplicate image data
    const cleanedOptions = cleanOptions(item.options)
    
    // Map to CartItem format
    const cartItem: CartItem = {
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      price: item.price || item.totalPrice,
      quantity: item.quantity,
      options: cleanedOptions, // Use cleaned options
      sizeDetails: item.size || item.sizeDetails,
      customImage: compressedCustomImage,
      cockpit3d_id: item.cockpit3d_id,
      dateAdded: item.dateAdded || new Date().toISOString()
    }

    // Store original uploaded image in sessionStorage
    if (item.options?.rawImageUrl || item.options?.imageUrl) {
      const originalUrl = item.options.rawImageUrl || item.options.imageUrl
      const imageId = `original_${item.productId}_${Date.now()}`
      sessionStorage.setItem(imageId, originalUrl)

      // Save the ID in the cart item
      cartItem.options.originalImageId = imageId
    }
    
    cart.push(cartItem)
    saveCart(cart)
    
    logger.success('Item added to cart', { 
      totalItems: cart.length,
      hasImage: !!cartItem.customImage,
      cartSizeKB: (JSON.stringify(cart).length / 1024).toFixed(2)
    })
  } catch (error) {
    logger.error('Failed to add item to cart', error)
    throw error
  }
}

// Get cart from localStorage
export function getCart(): CartItem[] {
  try {
    const cartData = localStorage.getItem('cart')
    return cartData ? JSON.parse(cartData) : []
  } catch (error) {
    logger.error('Failed to read cart', error)
    return []
  }
}

// Save cart with quota protection and auto-cleanup
export function saveCart(cart: CartItem[]): void {
  try {
    const cartJson = JSON.stringify(cart)
    const sizeKB = (cartJson.length / 1024).toFixed(2)
    
    logger.info('Saving cart', { items: cart.length, sizeKB })
    
    // Check if we're approaching quota
    const healthCheck = checkStorageHealth()
    if (healthCheck.percentUsed > 85) {
      logger.warn('Storage approaching limit, attempting cleanup')
      // Try to compress existing images further if needed
      const cleaned = cleanupOldCartData()
      if (cleaned > 0) {
        logger.info(`Cleaned up ${cleaned} bytes from cart`)
      }
    }
    
    localStorage.setItem('cart', cartJson)
    
    // Dispatch custom event to notify all listeners
    const event = new CustomEvent('cartUpdated', { 
      detail: { 
        itemCount: cart.length,
        totalItems: cart.reduce((sum, item) => sum + item.quantity, 0)
      } 
    })
    window.dispatchEvent(event)
    
  } catch (error: any) {
    if (error.name === 'QuotaExceededError') {
      logger.error('Cart storage quota exceeded', { 
        itemCount: cart.length,
        sizeKB: (JSON.stringify(cart).length / 1024).toFixed(2)
      })
      
      // Last resort: try to save without images
      try {
        const cartWithoutImages = cart.map(item => ({
          ...item,
          customImage: item.customImage ? {
            ...item.customImage,
            dataUrl: '' // Remove thumbnail data URL
          } : undefined
        }))
        localStorage.setItem('cart', JSON.stringify(cartWithoutImages))
        logger.warn('Cart saved without image thumbnails to prevent quota error')
        alert('Cart is full. Images have been removed to save your items. You can still checkout.')
      } catch (fallbackError) {
        throw new Error('Cart storage full. Please remove some items or clear cart.')
      }
    } else {
      logger.error('Failed to save cart', error)
      throw error
    }
  }
}

/**
 * Cleanup old or unnecessary data from cart
 */
function cleanupOldCartData(): number {
  try {
    const cart = getCart()
    let savedBytes = 0
    
    const originalSize = JSON.stringify(cart).length
    
    // Remove image thumbnails from oldest items if needed
    const updatedCart = cart.map((item, index) => {
      if (index < cart.length - 3 && item.customImage?.dataUrl) {
        // Keep only the 3 most recent items with images
        savedBytes += item.customImage.dataUrl.length
        return {
          ...item,
          customImage: {
            ...item.customImage,
            dataUrl: '' // Remove thumbnail from older items
          }
        }
      }
      return item
    })
    
    if (savedBytes > 0) {
      localStorage.setItem('cart', JSON.stringify(updatedCart))
      logger.info('Cleaned up old cart images', { savedBytes })
    }
    
    return savedBytes
  } catch (error) {
    logger.error('Cleanup failed', error)
    return 0
  }
}

// Remove item from cart by index
export function removeFromCart(index: number): CartItem[] {
  const cart = getCart()
  cart.splice(index, 1)
  saveCart(cart)
  return cart
}

// Clear entire cart
export function clearCart(): void {
  localStorage.removeItem('cart')
  
  // Also clear sessionStorage images
  try {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith('fullimg_')) {
        sessionStorage.removeItem(key)
      }
    })
  } catch (error) {
    logger.warn('Could not clear session images', error)
  }
  
  window.dispatchEvent(new CustomEvent('cartUpdated', { 
    detail: { itemCount: 0, totalItems: 0 } 
  }))
}

// Get total item count
export function getCartItemCount(): number {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

// Get cart total price
export function getCartTotal(): number {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * Check localStorage health and available space
 * localStorage typically has 5-10MB limit
 */
export function checkStorageHealth(): { 
  isHealthy: boolean
  usedSpace: number
  totalSpace: number
  percentUsed: number
  message?: string
} {
  try {
    // Estimate total localStorage size
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    
    // Most browsers have 5MB (5,242,880 bytes) limit
    const STORAGE_LIMIT = 5242880
    const percentUsed = (totalSize / STORAGE_LIMIT) * 100
    
    logger.info('Storage health check', {
      usedBytes: totalSize,
      usedKB: (totalSize / 1024).toFixed(2),
      usedMB: (totalSize / 1024 / 1024).toFixed(2),
      percentUsed: percentUsed.toFixed(1) + '%'
    })
    
    // Warning at 80%, error at 90%
    if (percentUsed > 90) {
      return {
        isHealthy: false,
        usedSpace: totalSize,
        totalSpace: STORAGE_LIMIT,
        percentUsed,
        message: 'Storage critically full (>90%). Please clear your cart.'
      }
    }
    
    if (percentUsed > 80) {
      logger.warn('Storage approaching limit', { percentUsed: percentUsed.toFixed(1) + '%' })
      return {
        isHealthy: true,
        usedSpace: totalSize,
        totalSpace: STORAGE_LIMIT,
        percentUsed,
        message: 'Storage nearly full (>80%). Consider clearing cart soon.'
      }
    }
    
    return {
      isHealthy: true,
      usedSpace: totalSize,
      totalSpace: STORAGE_LIMIT,
      percentUsed
    }
    
  } catch (error) {
    logger.error('Storage health check failed', error)
    return {
      isHealthy: false,
      usedSpace: 0,
      totalSpace: 0,
      percentUsed: 100,
      message: 'Unable to check storage. Your browser may be blocking localStorage.'
    }
  }
}

/**
 * Estimate size of data to be stored
 */
export function estimateSize(data: any): number {
  try {
    return JSON.stringify(data).length
  } catch (error) {
    logger.error('Failed to estimate data size', error)
    return 0
  }
}

/**
 * Store full-resolution image separately for checkout
 * Uses sessionStorage (larger limit) or IndexedDB
 */
export function storeFullResImage(productId: string, dataUrl: string): void {
  try {
    sessionStorage.setItem(`fullimg_${productId}`, dataUrl)
    logger.info('Full-res image stored in sessionStorage', { 
      productId, 
      sizeKB: (dataUrl.length / 1024).toFixed(2) 
    })
  } catch (error) {
    logger.warn('Could not store full-res image in sessionStorage', error)
    // Fallback: store a heavily compressed version
    try {
      compressImageToThumbnail(dataUrl).then(compressed => {
        sessionStorage.setItem(`fullimg_${productId}`, compressed)
        logger.info('Stored compressed fallback image')
      })
    } catch (e) {
      logger.error('All image storage methods failed', e)
    }
  }
}

/**
 * Retrieve full-resolution image at checkout
 */
export function getFullResImage(productId: string): string | null {
  try {
    return sessionStorage.getItem(`fullimg_${productId}`)
  } catch (error) {
    logger.error('Could not retrieve full-res image', error)
    return null
  }
}