// lib/imageStorageDB.ts
// Version: 2.0.0 - 2025-01-XX
// Purpose: Handle large image storage using IndexedDB to avoid localStorage quota issues
// IndexedDB has much higher storage limits (typically 50% of free disk space)
// ✅ Added fallback handling when IndexedDB is unavailable (privacy mode, Safari, etc.)

import { logger } from '@/utils/logger'

const DB_NAME = 'CrystalKeepsakesImages'
const DB_VERSION = 1
const STORE_NAME = 'cartImages'

interface ImageRecord {
  id: string
  productId: string
  dataUrl: string // Masked/processed image (for Cockpit3D)
  thumbnail: string // Thumbnail of masked image
  rawImageDataUrl?: string // Original uploaded image (before masking)
  rawImageThumbnail?: string // Thumbnail of original image
  metadata: {
    filename?: string
    mimeType?: string
    fileSize?: number
    width?: number
    height?: number
    processedAt?: string
    maskId?: string
    maskName?: string
  }
  timestamp: number
}

class ImageStorageDB {
  private db: IDBDatabase | null = null
  private isAvailable: boolean | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Check if IndexedDB is available in this browser/context
   */
  private async checkAvailability(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return false
    }

    // Test if we can actually open a database
    return new Promise((resolve) => {
      try {
        const testRequest = indexedDB.open('__test__', 1)
        
        testRequest.onerror = () => {
          console.warn('⚠️ IndexedDB not available in this browser/context')
          resolve(false)
        }
        
        testRequest.onsuccess = () => {
          testRequest.result.close()
          // Clean up test database
          indexedDB.deleteDatabase('__test__')
          resolve(true)
        }
        
        // Timeout fallback
        setTimeout(() => {
          resolve(false)
        }, 2000)
      } catch (error) {
        console.warn('⚠️ IndexedDB check failed:', error)
        resolve(false)
      }
    })
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    // Only run initialization once
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._doInit()
    return this.initPromise
  }

  private async _doInit(): Promise<void> {
    // Check availability first
    this.isAvailable = await this.checkAvailability()
    
    if (!this.isAvailable) {
      console.warn('⚠️ IndexedDB unavailable - using fallback (server URLs only)')
      return
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = (event) => {
          const error = (event.target as IDBOpenDBRequest).error
          console.error('❌ Failed to open IndexedDB', error)
          this.isAvailable = false
          // Don't reject - just mark as unavailable and continue
          resolve()
        }

        request.onsuccess = () => {
          this.db = request.result
          
          // Handle connection loss
          this.db.onerror = (event) => {
            console.error('IndexedDB error:', event)
          }
          
          this.db.onclose = () => {
            console.warn('IndexedDB connection closed')
            this.db = null
          }
          
          logger.info('IndexedDB initialized successfully')
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            objectStore.createIndex('productId', 'productId', { unique: false })
            objectStore.createIndex('timestamp', 'timestamp', { unique: false })
            logger.info('Created IndexedDB object store')
          }
        }

        request.onblocked = () => {
          console.warn('IndexedDB blocked - another connection is open')
        }
      } catch (error) {
        console.error('❌ IndexedDB initialization error:', error)
        this.isAvailable = false
        resolve() // Don't reject - continue without IndexedDB
      }
    })
  }

  /**
   * Check if IndexedDB is available
   */
  isDbAvailable(): boolean {
    return this.isAvailable === true && this.db !== null
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase | null> {
    if (this.initPromise) {
      await this.initPromise
    } else {
      await this.init()
    }
    
    if (!this.isAvailable || !this.db) {
      return null
    }
    return this.db
  }

  /**
   * Store an image in IndexedDB
   * Returns null if IndexedDB is unavailable (graceful fallback)
   */
  async storeImage(
    productId: string,
    dataUrl: string,
    thumbnail: string,
    metadata?: ImageRecord['metadata'],
    rawImageDataUrl?: string,
    rawImageThumbnail?: string
  ): Promise<string | null> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        console.warn('⚠️ IndexedDB unavailable - image not stored locally (will use server URLs)')
        return null
      }

      const id = `${productId}_${Date.now()}`

      const imageRecord: ImageRecord = {
        id,
        productId,
        dataUrl,
        thumbnail,
        rawImageDataUrl,
        rawImageThumbnail,
        metadata: metadata || {},
        timestamp: Date.now()
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.add(imageRecord)

          request.onsuccess = () => {
            logger.success('Image stored in IndexedDB', {
              id,
              productId,
              maskedSizeKB: Math.round(dataUrl.length / 1024),
              hasRawImage: !!rawImageDataUrl
            })
            resolve(id)
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to store image in IndexedDB:', request.error)
            resolve(null)
          }

          transaction.onerror = () => {
            console.warn('⚠️ Transaction error storing image:', transaction.error)
            resolve(null)
          }
        } catch (error) {
          console.warn('⚠️ Error creating transaction:', error)
          resolve(null)
        }
      })
    } catch (error) {
      console.warn('⚠️ Error storing image:', error)
      return null
    }
  }

  /**
   * Retrieve an image from IndexedDB
   */
  async getImage(id: string): Promise<ImageRecord | null> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return null
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.get(id)

          request.onsuccess = () => {
            const result = request.result
            if (result) {
              logger.info('Image retrieved from IndexedDB', { id })
              resolve(result)
            } else {
              resolve(null)
            }
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to retrieve image:', request.error)
            resolve(null)
          }
        } catch (error) {
          console.warn('⚠️ Error retrieving image:', error)
          resolve(null)
        }
      })
    } catch (error) {
      console.warn('⚠️ Error retrieving image:', error)
      return null
    }
  }

  /**
   * Get all images for a product
   */
  async getProductImages(productId: string): Promise<ImageRecord[]> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return []
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly')
          const objectStore = transaction.objectStore(STORE_NAME)
          const index = objectStore.index('productId')
          const request = index.getAll(productId)

          request.onsuccess = () => {
            const results = request.result || []
            resolve(results)
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to retrieve product images:', request.error)
            resolve([])
          }
        } catch (error) {
          console.warn('⚠️ Error retrieving product images:', error)
          resolve([])
        }
      })
    } catch (error) {
      console.warn('⚠️ Error retrieving product images:', error)
      return []
    }
  }

  /**
   * Delete an image from IndexedDB
   */
  async deleteImage(id: string): Promise<void> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.delete(id)

          request.onsuccess = () => {
            logger.info('Image deleted from IndexedDB', { id })
            resolve()
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to delete image:', request.error)
            resolve()
          }
        } catch (error) {
          console.warn('⚠️ Error deleting image:', error)
          resolve()
        }
      })
    } catch (error) {
      console.warn('⚠️ Error deleting image:', error)
    }
  }

  /**
   * Clear all images (useful for cart clear)
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME)
          const request = objectStore.clear()

          request.onsuccess = () => {
            logger.info('All images cleared from IndexedDB')
            resolve()
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to clear images:', request.error)
            resolve()
          }
        } catch (error) {
          console.warn('⚠️ Error clearing images:', error)
          resolve()
        }
      })
    } catch (error) {
      console.warn('⚠️ Error clearing images:', error)
    }
  }

  /**
   * Clean up old images (older than 7 days)
   */
  async cleanupOldImages(): Promise<number> {
    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return 0
      }

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction.objectStore(STORE_NAME)
          const index = objectStore.index('timestamp')
          const range = IDBKeyRange.upperBound(sevenDaysAgo)
          const request = index.openCursor(range)
          
          let deletedCount = 0

          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result
            if (cursor) {
              objectStore.delete(cursor.primaryKey)
              deletedCount++
              cursor.continue()
            } else {
              if (deletedCount > 0) {
                logger.info(`Cleaned up ${deletedCount} old images`)
              }
              resolve(deletedCount)
            }
          }

          request.onerror = () => {
            console.warn('⚠️ Failed to cleanup old images:', request.error)
            resolve(0)
          }
        } catch (error) {
          console.warn('⚠️ Error cleaning up old images:', error)
          resolve(0)
        }
      })
    } catch (error) {
      console.warn('⚠️ Error cleaning up old images:', error)
      return 0
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalImages: number
    estimatedSizeMB: number
    isAvailable: boolean
  }> {
    // Return unavailable status if IndexedDB is not accessible
    if (!this.isAvailable) {
      return { 
        totalImages: 0, 
        estimatedSizeMB: 0,
        isAvailable: false 
      }
    }

    try {
      const db = await this.ensureDb()
      
      if (!db) {
        return { 
          totalImages: 0, 
          estimatedSizeMB: 0,
          isAvailable: false 
        }
      }

      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly')
          const objectStore = transaction.objectStore(STORE_NAME)
          const countRequest = objectStore.count()
          const getAllRequest = objectStore.getAll()

          countRequest.onsuccess = () => {
            const count = countRequest.result

            getAllRequest.onsuccess = () => {
              const records = getAllRequest.result || []
              const totalSize = records.reduce((sum, record) => {
                return sum + (record.dataUrl?.length || 0) + (record.thumbnail?.length || 0)
              }, 0)

              resolve({
                totalImages: count,
                estimatedSizeMB: totalSize / (1024 * 1024),
                isAvailable: true
              })
            }

            getAllRequest.onerror = () => {
              resolve({ totalImages: 0, estimatedSizeMB: 0, isAvailable: true })
            }
          }

          countRequest.onerror = () => {
            resolve({ totalImages: 0, estimatedSizeMB: 0, isAvailable: true })
          }
        } catch (error) {
          console.warn('⚠️ Error getting stats:', error)
          resolve({ totalImages: 0, estimatedSizeMB: 0, isAvailable: false })
        }
      })
    } catch (error) {
      console.warn('⚠️ Error getting database stats:', error)
      return { totalImages: 0, estimatedSizeMB: 0, isAvailable: false }
    }
  }
}

// Export singleton instance
export const imageDB = new ImageStorageDB()

// Initialize on import (non-blocking)
if (typeof window !== 'undefined') {
  // Use setTimeout to avoid blocking initial render
  setTimeout(() => {
    imageDB.init().catch((error) => {
      console.warn('⚠️ ImageStorageDB initialization warning:', error)
    })
  }, 100)
}
