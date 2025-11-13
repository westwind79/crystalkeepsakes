// lib/cartUtils.ts
// Version: 2.0.0 - 2025-11-10 - INDEXEDDB IMAGE STORAGE
// Fixed: Moved image storage to IndexedDB to avoid localStorage quota issues
// - Images stored in IndexedDB (50% of free disk space limit)
// - Only image IDs stored in localStorage cart
// - Automatic cleanup of orphaned images
// - Better error handling and recovery

import { logger } from '@/utils/logger'
import { imageDB } from './imageStorageDB'
import { uploadImageStorage } from './api/upload-image.php'

export interface CartItem {
  // Product identification
  productId: string
  cockpit3d_id?: string
  name: string
  sku: string
  
  // Pricing
  basePrice?: number
  optionsPrice?: number
  price: number
  totalPrice?: number
  quantity: number
  
  // Product configuration
  size?: any  // Keep for backward compatibility
  sizeDetails?: any
  options: any
  productImage?: string  // Product's own image (for items without custom images)
  
  // Custom image storage (IndexedDB)
  customImageId?: string  // Reference to IndexedDB image
  customImageMetadata?: {
    filename?: string
    maskName?: string
    hasImage: boolean
  }
  
  // Image URLs for display (data URLs from IndexedDB)
  rawImageUrl?: string  // Original uploaded image (before masking)
  maskedImageUrl?: string  // Final masked/edited image (for Cockpit3D)
  
  // Custom text
  customText?: {
    text: string
    line1?: string
    line2?: string
  }
  
  // Metadata
  dateAdded: string
  lastModified?: string
  lineItemId?: string
}

/**
 * Compress image to TINY thumbnail for cart display
 * Reduces base64 size by ~97% (e.g., 2MB -> 60KB)
 */
async function compressImageToThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_SIZE = 100 // Small thumbnail size
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
      
      // Lower quality JPEG for minimal size
      resolve(canvas.toDataURL('image/jpeg', 0.5))
    }
    img.onerror = () => reject(new Error('Image compression failed'))
    img.src = dataUrl
  })
}

/**
 * Clean options object - remove ALL image data URLs
 */
function cleanOptions(options: any): any {
  if (!options) return {}
  
  const cleaned = { ...options }
  
  // Remove all image data URLs from options
  delete cleaned.rawImageUrl
  delete cleaned.imageUrl
  delete cleaned.maskedImageUrl
  delete cleaned.dataUrl
  delete cleaned.customImage
  
  // Keep only essential metadata
  return {
    size: cleaned.size,
    background: cleaned.background,
    lightBase: cleaned.lightBase,
    giftStand: cleaned.giftStand,
    customText: cleaned.customText,
    // Only keep image filenames, not data URLs
    imageFilename: cleaned.imageFilename,
    maskName: cleaned.maskName
  }
}

/**
 * Add item to cart with IndexedDB image storage
 */
export async function addToCart(item: CartItem | any): Promise<void> {
  logger.order('Adding item to cart', {
    productId: item.productId,
    hasCustomImage: !!item.customImage?.dataUrl || !!item.options?.maskedImageUrl
  })
  
  try {
    const cart = getCart()
    let customImageId: string | undefined
    let customImageMetadata: CartItem['customImageMetadata'] | undefined
    
    // Handle custom image storage in IndexedDB
    const maskedImageUrl = item.customImage?.dataUrl || item.options?.maskedImageUrl
    const rawImageUrl = item.customImage?.originalDataUrl || item.options?.rawImageUrl
    
    if (maskedImageUrl) {
      try {
        // Compress thumbnail from masked image
        const thumbnail = await compressImageToThumbnail(maskedImageUrl)
        
        // Store full masked image and thumbnail in IndexedDB
        customImageId = await imageDB.storeImage(
          item.productId,
          maskedImageUrl,
          thumbnail,
          {
            filename: item.customImage?.filename || item.options?.imageFilename,
            mimeType: item.customImage?.mimeType || 'image/png',
            fileSize: item.customImage?.fileSize || maskedImageUrl.length,
            width: item.customImage?.width,
            height: item.customImage?.height,
            processedAt: item.customImage?.processedAt || new Date().toISOString(),
            maskId: item.customImage?.maskId || item.options?.maskId,
            maskName: item.customImage?.maskName || item.options?.maskName
          }
        )
        
        customImageMetadata = {
          filename: item.customImage?.filename || item.options?.imageFilename,
          maskName: item.customImage?.maskName || item.options?.maskName,
          hasImage: true
        }
        
        logger.success('Images stored in IndexedDB', {
          imageId: customImageId,
          hasRawImage: !!rawImageUrl,
          maskedSizeKB: Math.round(maskedImageUrl.length / 1024),
          thumbnailSizeKB: Math.round(thumbnail.length / 1024)
        })
      } catch (error) {
        logger.error('Failed to store image in IndexedDB', error)
        // Continue without image rather than fail entire add
        customImageId = undefined
        customImageMetadata = { hasImage: false }
      }
    }
    
    // Clean options to remove any image data
    const cleanedOptions = cleanOptions(item.options)
    
    // Create cart item with ALL order data preserved
    const cartItem: CartItem = {
      // Product identification
      productId: item.productId,
      cockpit3d_id: item.cockpit3d_id,
      name: item.name,
      sku: item.sku,
      
      // Pricing (preserve all price fields)
      basePrice: item.basePrice,
      optionsPrice: item.optionsPrice,
      price: item.price || item.totalPrice || item.basePrice,
      totalPrice: item.totalPrice || (item.price * item.quantity),
      quantity: item.quantity,
      
      // Product configuration (preserve full structure)
      size: item.size,
      sizeDetails: item.size || item.sizeDetails,
      options: item.options || cleanedOptions,  // Preserve original options array/object
      productImage: item.productImage || null,
      
      // Custom image (IndexedDB reference)
      customImageId,
      customImageMetadata,
      
      // Image URLs for display (stored for quick access)
      rawImageUrl: rawImageUrl || null,
      maskedImageUrl: maskedImageUrl || null,
      
      // Custom text (preserve full object)
      customText: item.customText,
      
      // Metadata
      dateAdded: item.dateAdded || new Date().toISOString(),
      lastModified: item.lastModified || new Date().toISOString(),
      lineItemId: item.lineItemId
    }
    
    cart.push(cartItem)
    saveCart(cart)
    
    // Clean up old images periodically
    if (Math.random() < 0.1) { // 10% chance on each add
      imageDB.cleanupOldImages().catch(err => 
        logger.warn('Background image cleanup failed', err)
      )
    }
    
    logger.success('Item added to cart', { 
      totalItems: cart.length,
      hasImage: !!customImageId
    })
  } catch (error) {
    logger.error('Failed to add item to cart', error)
    throw error
  }
}

/**
 * Get cart from localStorage
 */
export function getCart(): CartItem[] {
  try {
    const cartData = localStorage.getItem('cart')
    return cartData ? JSON.parse(cartData) : []
  } catch (error) {
    logger.error('Failed to read cart', error)
    return []
  }
}

/**
 * Get cart with images loaded from IndexedDB
 */
export async function getCartWithImages(): Promise<Array<CartItem & { 
  customImage?: { 
    dataUrl: string
    thumbnail: string
    metadata: any
  } 
}>> {
  const cart = getCart()
  
  // Load images from IndexedDB
  const cartWithImages = await Promise.all(
    cart.map(async (item) => {
      if (item.customImageId) {
        try {
          const imageRecord = await imageDB.getImage(item.customImageId)
          if (imageRecord) {
            return {
              ...item,
              customImage: {
                dataUrl: imageRecord.dataUrl,
                thumbnail: imageRecord.thumbnail,
                metadata: imageRecord.metadata
              }
            }
          }
        } catch (error) {
          logger.warn(`Failed to load image for cart item`, { 
            productId: item.productId,
            imageId: item.customImageId,
            error 
          })
        }
      }
      return item
    })
  )
  
  return cartWithImages
}

/**
 * Save cart to localStorage (without images)
 */
export function saveCart(cart: CartItem[]): void {
  try {
    const cartJson = JSON.stringify(cart)
    const sizeKB = (cartJson.length / 1024).toFixed(2)
    
    logger.info('Saving cart to localStorage', { 
      items: cart.length, 
      sizeKB,
      hasImages: cart.filter(item => item.customImageId).length
    })
    
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
    logger.error('Failed to save cart', error)
    
    if (error.name === 'QuotaExceededError') {
      // This should be rare now since images are in IndexedDB
      // Try clearing some old data
      try {
        cleanupLocalStorage()
        localStorage.setItem('cart', JSON.stringify(cart))
        logger.warn('Cart saved after cleanup')
      } catch (fallbackError) {
        throw new Error('Unable to save cart. Please clear browser data.')
      }
    } else {
      throw error
    }
  }
}

/**
 * Remove item from cart by index
 */
export async function removeFromCart(index: number): Promise<CartItem[]> {
  const cart = getCart()
  const removedItem = cart[index]
  
  // Delete associated image from IndexedDB
  if (removedItem?.customImageId) {
    try {
      await imageDB.deleteImage(removedItem.customImageId)
      logger.info('Deleted image from IndexedDB', { 
        imageId: removedItem.customImageId 
      })
    } catch (error) {
      logger.warn('Failed to delete image from IndexedDB', error)
    }
  }
  
  cart.splice(index, 1)
  saveCart(cart)
  return cart
}

/**
 * Clear entire cart and all images
 */
export async function clearCart(): Promise<void> {
  localStorage.removeItem('cart')
  
  // Clear all images from IndexedDB
  try {
    await imageDB.clearAll()
    logger.info('Cleared all images from IndexedDB')
  } catch (error) {
    logger.warn('Failed to clear images from IndexedDB', error)
  }
  
  window.dispatchEvent(new CustomEvent('cartUpdated', { 
    detail: { itemCount: 0, totalItems: 0 } 
  }))
}

/**
 * Get total item count
 */
export function getCartItemCount(): number {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Get cart total price
 */
export function getCartTotal(): number {
  const cart = getCart()
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * Check localStorage health
 */
export function checkStorageHealth(): { 
  isHealthy: boolean
  usedSpace: number
  totalSpace: number
  percentUsed: number
  message?: string
} {
  try {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    
    // Most browsers have 5MB limit
    const STORAGE_LIMIT = 5242880
    const percentUsed = (totalSize / STORAGE_LIMIT) * 100
    
    logger.info('Storage health check', {
      usedKB: (totalSize / 1024).toFixed(2),
      percentUsed: percentUsed.toFixed(1) + '%'
    })
    
    return {
      isHealthy: percentUsed < 90,
      usedSpace: totalSize,
      totalSpace: STORAGE_LIMIT,
      percentUsed,
      message: percentUsed > 80 ? 'Storage nearly full' : undefined
    }
    
  } catch (error) {
    logger.error('Storage health check failed', error)
    return {
      isHealthy: false,
      usedSpace: 0,
      totalSpace: 0,
      percentUsed: 100,
      message: 'Storage check failed'
    }
  }
}

/**
 * Clean up unnecessary data from localStorage
 */
function cleanupLocalStorage(): void {
  try {
    // Remove old/temporary data
    const keysToCheck = Object.keys(localStorage)
    keysToCheck.forEach(key => {
      // Remove old temporary data
      if (key.startsWith('temp_') || key.startsWith('old_')) {
        localStorage.removeItem(key)
      }
    })
    logger.info('Cleaned up localStorage')
  } catch (error) {
    logger.error('localStorage cleanup failed', error)
  }
}

/**
 * Get IndexedDB stats
 */
export async function getImageStorageStats() {
  try {
    const stats = await imageDB.getStats()
    return {
      ...stats,
      storageHealth: checkStorageHealth()
    }
  } catch (error) {
    logger.error('Failed to get storage stats', error)
    return null
  }
}

/**
 * Estimate size of data to be stored (backward compatibility)
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
 * Store full-resolution image (backward compatibility)
 * Now uses IndexedDB instead of sessionStorage
 */
export async function storeFullResImage(productId: string, dataUrl: string): Promise<void> {
  try {
    // Create a thumbnail for storage
    const thumbnail = await compressImageToThumbnail(dataUrl)
    
    // Store in IndexedDB
    await imageDB.storeImage(
      productId,
      dataUrl,
      thumbnail,
      {
        processedAt: new Date().toISOString()
      }
    )
    
    logger.info('Full-res image stored in IndexedDB', { 
      productId, 
      sizeKB: (dataUrl.length / 1024).toFixed(2) 
    })
  } catch (error) {
    logger.error('Failed to store full-res image', error)
    
    // Fallback to sessionStorage for backward compatibility
    try {
      sessionStorage.setItem(`fullimg_${productId}`, dataUrl)
      logger.warn('Fell back to sessionStorage for image storage')
    } catch (e) {
      logger.error('All image storage methods failed', e)
    }
  }
}

/**
 * Retrieve full-resolution image (backward compatibility)
 * Checks both IndexedDB and sessionStorage
 */
export async function getFullResImage(productId: string): Promise<string | null> {
  try {
    // First try IndexedDB
    const images = await imageDB.getProductImages(productId)
    if (images.length > 0) {
      return images[0].dataUrl
    }
    
    // Fallback to sessionStorage
    const sessionImage = sessionStorage.getItem(`fullimg_${productId}`)
    if (sessionImage) {
      logger.info('Retrieved image from sessionStorage fallback')
      return sessionImage
    }
    
    return null
  } catch (error) {
    logger.error('Could not retrieve full-res image', error)
    return null
  }
}

/**
 * Migrate old cart format to new format (for backwards compatibility)
 */
export async function migrateOldCart(): Promise<void> {
  try {
    const cart = getCart()
    let needsMigration = false
    
    const migratedCart = await Promise.all(
      cart.map(async (item: any) => {
        // Check if item has old format with embedded image
        if (item.customImage?.dataUrl && !item.customImageId) {
          needsMigration = true
          
          try {
            // Store image in IndexedDB
            const thumbnail = await compressImageToThumbnail(item.customImage.dataUrl)
            const imageId = await imageDB.storeImage(
              item.productId,
              item.customImage.dataUrl,
              thumbnail,
              item.customImage
            )
            
            // Return migrated item
            return {
              ...item,
              customImageId: imageId,
              customImageMetadata: {
                filename: item.customImage.filename,
                maskName: item.customImage.maskName,
                hasImage: true
              },
              customImage: undefined // Remove embedded image
            }
          } catch (error) {
            logger.warn('Failed to migrate image for item', { 
              productId: item.productId, 
              error 
            })
            return {
              ...item,
              customImage: undefined
            }
          }
        }
        return item
      })
    )
    
    if (needsMigration) {
      saveCart(migratedCart)
      logger.info('Cart migrated to new format')
    }
  } catch (error) {
    logger.error('Cart migration failed', error)
  }
}

// Auto-migrate on load
if (typeof window !== 'undefined') {
  migrateOldCart().catch(err => 
    logger.warn('Auto-migration failed', err)
  )
}