/**
 * Order Tracker - Manages pending order data from image save to checkout
 * Version: 1.0.0
 * 
 * This tracks order data that starts when customer saves their image,
 * NOT when they add to cart or checkout.
 * 
 * Flow:
 * 1. Customer uploads image → opens editor
 * 2. Customer clicks "Save" → ORDER STARTS HERE
 *    - Generate temp order ID
 *    - Upload images to server
 *    - Store order metadata
 * 3. Customer configures options → updates order data
 * 4. Customer adds to cart → order data attached to cart item
 * 5. Checkout → order data sent to Cockpit3D
 */

export interface PendingOrderImage {
  // Local base64 for display
  maskedDataUrl?: string
  rawDataUrl?: string
  // Server URLs (critical for Cockpit3D)
  maskedServerUrl?: string
  rawServerUrl?: string
  // Metadata
  filename: string
  width?: number
  height?: number
  uploadedAt: string
}

export interface PendingOrder {
  // Unique temporary order reference (used for image folder naming)
  tempOrderRef: string
  // Product info
  productId: string
  productName?: string
  productSku?: string
  cockpit3dId?: string
  // Image data
  images: PendingOrderImage
  // Timestamps
  startedAt: string  // When customer saved image (ORDER START)
  lastModifiedAt: string
  // Status
  status: 'pending_options' | 'ready_for_cart' | 'in_cart' | 'checked_out'
}

const STORAGE_KEY = 'pending_orders'

/**
 * Get all pending orders from localStorage
 */
export function getPendingOrders(): PendingOrder[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get pending orders:', error)
    return []
  }
}

/**
 * Save pending orders to localStorage
 */
function savePendingOrders(orders: PendingOrder[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch (error) {
    console.error('Failed to save pending orders:', error)
  }
}

/**
 * START AN ORDER - Called when customer saves their image in the editor
 * This is the critical moment when order tracking begins
 */
export function startOrder(
  productId: string,
  images: PendingOrderImage,
  productInfo?: {
    name?: string
    sku?: string
    cockpit3dId?: string
  }
): PendingOrder {
  const tempOrderRef = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const order: PendingOrder = {
    tempOrderRef,
    productId,
    productName: productInfo?.name,
    productSku: productInfo?.sku,
    cockpit3dId: productInfo?.cockpit3dId,
    images,
    startedAt: now,
    lastModifiedAt: now,
    status: 'pending_options'
  }
  
  // Save to pending orders
  const orders = getPendingOrders()
  
  // Remove any existing pending order for this product (user re-uploaded)
  const filtered = orders.filter(o => o.productId !== productId || o.status === 'in_cart')
  filtered.push(order)
  savePendingOrders(filtered)
  
  console.log('📦 [ORDER TRACKER] Order started:', {
    tempOrderRef,
    productId,
    hasImages: !!images.maskedServerUrl
  })
  
  return order
}

/**
 * Update order images after upload completes
 */
export function updateOrderImages(
  tempOrderRef: string,
  maskedServerUrl?: string,
  rawServerUrl?: string
): void {
  const orders = getPendingOrders()
  const orderIndex = orders.findIndex(o => o.tempOrderRef === tempOrderRef)
  
  if (orderIndex >= 0) {
    if (maskedServerUrl) {
      orders[orderIndex].images.maskedServerUrl = maskedServerUrl
    }
    if (rawServerUrl) {
      orders[orderIndex].images.rawServerUrl = rawServerUrl
    }
    orders[orderIndex].lastModifiedAt = new Date().toISOString()
    orders[orderIndex].status = 'ready_for_cart'
    savePendingOrders(orders)
    
    console.log('📦 [ORDER TRACKER] Order images updated:', {
      tempOrderRef,
      maskedServerUrl,
      rawServerUrl
    })
  }
}

/**
 * Get pending order for a product
 */
export function getPendingOrderForProduct(productId: string): PendingOrder | null {
  const orders = getPendingOrders()
  // Return most recent pending order for this product
  return orders
    .filter(o => o.productId === productId && o.status !== 'in_cart' && o.status !== 'checked_out')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null
}

/**
 * Mark order as added to cart
 */
export function markOrderInCart(tempOrderRef: string): void {
  const orders = getPendingOrders()
  const orderIndex = orders.findIndex(o => o.tempOrderRef === tempOrderRef)
  
  if (orderIndex >= 0) {
    orders[orderIndex].status = 'in_cart'
    orders[orderIndex].lastModifiedAt = new Date().toISOString()
    savePendingOrders(orders)
    
    console.log('📦 [ORDER TRACKER] Order marked as in cart:', tempOrderRef)
  }
}

/**
 * Mark orders as checked out
 */
export function markOrdersCheckedOut(tempOrderRefs: string[]): void {
  const orders = getPendingOrders()
  
  tempOrderRefs.forEach(ref => {
    const orderIndex = orders.findIndex(o => o.tempOrderRef === ref)
    if (orderIndex >= 0) {
      orders[orderIndex].status = 'checked_out'
      orders[orderIndex].lastModifiedAt = new Date().toISOString()
    }
  })
  
  savePendingOrders(orders)
  console.log('📦 [ORDER TRACKER] Orders marked as checked out:', tempOrderRefs)
}

/**
 * Clean up old pending orders (older than 7 days)
 */
export function cleanupOldOrders(): number {
  const orders = getPendingOrders()
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  const filtered = orders.filter(o => {
    const orderTime = new Date(o.startedAt).getTime()
    return orderTime > sevenDaysAgo
  })
  
  const removed = orders.length - filtered.length
  if (removed > 0) {
    savePendingOrders(filtered)
    console.log(`📦 [ORDER TRACKER] Cleaned up ${removed} old orders`)
  }
  
  return removed
}

/**
 * Get order data for cart item attachment
 */
export function getOrderDataForCart(tempOrderRef: string): {
  tempOrderRef: string
  serverUrl?: string
  originalServerUrl?: string
  orderStartedAt: string
} | null {
  const orders = getPendingOrders()
  const order = orders.find(o => o.tempOrderRef === tempOrderRef)
  
  if (!order) return null
  
  return {
    tempOrderRef: order.tempOrderRef,
    serverUrl: order.images.maskedServerUrl,
    originalServerUrl: order.images.rawServerUrl,
    orderStartedAt: order.startedAt
  }
}
