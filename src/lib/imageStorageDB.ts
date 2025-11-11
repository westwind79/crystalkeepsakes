// lib/imageStorageDB.ts
// Version: 1.0.0 - 2025-11-10
// Purpose: Handle large image storage using IndexedDB to avoid localStorage quota issues
// IndexedDB has much higher storage limits (typically 50% of free disk space)

import { logger } from '@/utils/logger'

const DB_NAME = 'CrystalKeepsakesImages'
const DB_VERSION = 1
const STORE_NAME = 'cartImages'

interface ImageRecord {
  id: string
  productId: string
  dataUrl: string
  thumbnail: string
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

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
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
    })
  }

  /**
   * Ensure database is initialized
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Failed to initialize database')
    }
    return this.db
  }

  /**
   * Store an image in IndexedDB
   */
  async storeImage(
    productId: string,
    dataUrl: string,
    thumbnail: string,
    metadata?: ImageRecord['metadata']
  ): Promise<string> {
    try {
      const db = await this.ensureDb()
      const id = `${productId}_${Date.now()}`

      const imageRecord: ImageRecord = {
        id,
        productId,
        dataUrl,
        thumbnail,
        metadata: metadata || {},
        timestamp: Date.now()
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.add(imageRecord)

        request.onsuccess = () => {
          logger.success('Image stored in IndexedDB', {
            id,
            productId,
            sizeKB: Math.round(dataUrl.length / 1024)
          })
          resolve(id)
        }

        request.onerror = () => {
          logger.error('Failed to store image', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error storing image', error)
      throw error
    }
  }

  /**
   * Retrieve an image from IndexedDB
   */
  async getImage(id: string): Promise<ImageRecord | null> {
    try {
      const db = await this.ensureDb()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.get(id)

        request.onsuccess = () => {
          const result = request.result
          if (result) {
            logger.info('Image retrieved from IndexedDB', { id })
            resolve(result)
          } else {
            logger.warn('Image not found', { id })
            resolve(null)
          }
        }

        request.onerror = () => {
          logger.error('Failed to retrieve image', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error retrieving image', error)
      return null
    }
  }

  /**
   * Get all images for a product
   */
  async getProductImages(productId: string): Promise<ImageRecord[]> {
    try {
      const db = await this.ensureDb()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly')
        const objectStore = transaction.objectStore(STORE_NAME)
        const index = objectStore.index('productId')
        const request = index.getAll(productId)

        request.onsuccess = () => {
          const results = request.result || []
          logger.info(`Retrieved ${results.length} images for product`, { productId })
          resolve(results)
        }

        request.onerror = () => {
          logger.error('Failed to retrieve product images', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error retrieving product images', error)
      return []
    }
  }

  /**
   * Delete an image from IndexedDB
   */
  async deleteImage(id: string): Promise<void> {
    try {
      const db = await this.ensureDb()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.delete(id)

        request.onsuccess = () => {
          logger.info('Image deleted from IndexedDB', { id })
          resolve()
        }

        request.onerror = () => {
          logger.error('Failed to delete image', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error deleting image', error)
      throw error
    }
  }

  /**
   * Clear all images (useful for cart clear)
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.ensureDb()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.clear()

        request.onsuccess = () => {
          logger.info('All images cleared from IndexedDB')
          resolve()
        }

        request.onerror = () => {
          logger.error('Failed to clear images', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error clearing images', error)
      throw error
    }
  }

  /**
   * Clean up old images (older than 7 days)
   */
  async cleanupOldImages(): Promise<number> {
    try {
      const db = await this.ensureDb()
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

      return new Promise((resolve, reject) => {
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
            logger.info(`Cleaned up ${deletedCount} old images`)
            resolve(deletedCount)
          }
        }

        request.onerror = () => {
          logger.error('Failed to cleanup old images', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      logger.error('Error cleaning up old images', error)
      return 0
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalImages: number
    estimatedSizeMB: number
  }> {
    try {
      const db = await this.ensureDb()

      return new Promise((resolve, reject) => {
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
              estimatedSizeMB: totalSize / (1024 * 1024)
            })
          }
        }

        countRequest.onerror = () => {
          reject(countRequest.error)
        }
      })
    } catch (error) {
      logger.error('Error getting database stats', error)
      return { totalImages: 0, estimatedSizeMB: 0 }
    }
  }
}

// Export singleton instance
export const imageDB = new ImageStorageDB()

// Initialize on import
if (typeof window !== 'undefined') {
  imageDB.init().catch((error) => {
    logger.error('Failed to initialize ImageStorageDB', error)
  })
}