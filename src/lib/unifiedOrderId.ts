/**
 * Unified Order ID System
 * Creates ONE consistent ID used across: session, images, cart, Stripe, Cockpit3D, emails
 * 
 * Format: CK_XXXXXXX_TIMESTAMP
 * Example: CK_0000001_1766640024369
 * 
 * This ID is generated:
 * - When customer lands on product page (session start)
 * - OR when they upload their first image
 * 
 * The SAME ID flows through:
 * 1. Browser session (localStorage)
 * 2. Image upload folder names on server
 * 3. Cart item reference
 * 4. Stripe payment metadata
 * 5. Cockpit3D order_id
 * 6. Email confirmations
 */

const STORAGE_KEY = 'ck_order_session'
const COUNTER_KEY = 'ck_order_counter'

export interface OrderSession {
  orderId: string           // The unified ID: CK_0000001_1766640024369
  createdAt: string         // ISO timestamp
  productId?: string        // First product viewed
  status: 'browsing' | 'customizing' | 'in_cart' | 'checkout' | 'completed'
  images: {
    masked?: string         // Server URL
    raw?: string            // Server URL
  }
  stripeSessionId?: string  // Added during checkout
  cockpit3dOrderId?: string // Added after submission
}

/**
 * Generate sequential order number with zero-padding
 * Stored in localStorage to persist across sessions
 */
function getNextOrderNumber(): string {
  if (typeof window === 'undefined') return '0000001'
  
  try {
    const current = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10)
    const next = current + 1
    localStorage.setItem(COUNTER_KEY, next.toString())
    return next.toString().padStart(7, '0')  // 0000001, 0000002, etc.
  } catch {
    // Fallback to random if localStorage fails
    return Math.floor(Math.random() * 9999999).toString().padStart(7, '0')
  }
}

/**
 * Generate a new unified order ID
 * Format: CK_0000001_1766640024369
 */
export function generateOrderId(): string {
  const number = getNextOrderNumber()
  const timestamp = Date.now()
  return `CK_${number}_${timestamp}`
}

/**
 * Get or create current order session
 * Returns existing session if still valid, otherwise creates new one
 */
export function getOrCreateOrderSession(productId?: string): OrderSession {
  if (typeof window === 'undefined') {
    return createNewSession(productId)
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const session: OrderSession = JSON.parse(stored)
      
      // Check if session is still valid (not completed, not too old)
      const sessionAge = Date.now() - new Date(session.createdAt).getTime()
      const MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours
      
      if (session.status !== 'completed' && sessionAge < MAX_AGE) {
        // Update product if provided
        if (productId && !session.productId) {
          session.productId = productId
          saveOrderSession(session)
        }
        return session
      }
    }
  } catch (e) {
    console.warn('Failed to read order session:', e)
  }
  
  // Create new session
  return createNewSession(productId)
}

/**
 * Create a brand new order session
 */
function createNewSession(productId?: string): OrderSession {
  const session: OrderSession = {
    orderId: generateOrderId(),
    createdAt: new Date().toISOString(),
    productId,
    status: 'browsing',
    images: {}
  }
  
  saveOrderSession(session)
  console.log('🆕 [ORDER] New session created:', session.orderId)
  return session
}

/**
 * Save order session to localStorage
 */
export function saveOrderSession(session: OrderSession): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch (e) {
    console.error('Failed to save order session:', e)
  }
}

/**
 * Get current order session (returns null if none exists)
 */
export function getCurrentOrderSession(): OrderSession | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * Update session status
 */
export function updateOrderStatus(
  status: OrderSession['status'],
  additionalData?: Partial<OrderSession>
): OrderSession | null {
  const session = getCurrentOrderSession()
  if (!session) return null
  
  session.status = status
  if (additionalData) {
    Object.assign(session, additionalData)
  }
  
  saveOrderSession(session)
  console.log(`📦 [ORDER] Status updated: ${status}`, session.orderId)
  return session
}

/**
 * Update session with image URLs (called after upload)
 */
export function updateOrderImages(maskedUrl?: string, rawUrl?: string): OrderSession | null {
  const session = getCurrentOrderSession()
  if (!session) return null
  
  if (maskedUrl) session.images.masked = maskedUrl
  if (rawUrl) session.images.raw = rawUrl
  session.status = 'customizing'
  
  saveOrderSession(session)
  console.log('📸 [ORDER] Images updated:', session.images)
  return session
}

/**
 * Mark order as added to cart
 */
export function markOrderInCart(): OrderSession | null {
  return updateOrderStatus('in_cart')
}

/**
 * Mark order as in checkout with Stripe session ID
 */
export function markOrderCheckout(stripeSessionId: string): OrderSession | null {
  return updateOrderStatus('checkout', { stripeSessionId })
}

/**
 * Mark order as completed
 */
export function markOrderCompleted(cockpit3dOrderId?: string): OrderSession | null {
  return updateOrderStatus('completed', { cockpit3dOrderId })
}

/**
 * Clear session after order completion (start fresh)
 */
export function clearOrderSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  console.log('🧹 [ORDER] Session cleared')
}

/**
 * Get order ID for use in API calls
 * Creates session if needed
 */
export function getOrderIdForUpload(productId?: string): string {
  const session = getOrCreateOrderSession(productId)
  return session.orderId
}

/**
 * Get all order data for Cockpit3D/Stripe payload
 */
export function getOrderDataForPayload(): {
  orderId: string
  images: { masked?: string; raw?: string }
  createdAt: string
} | null {
  const session = getCurrentOrderSession()
  if (!session) return null
  
  return {
    orderId: session.orderId,
    images: session.images,
    createdAt: session.createdAt
  }
}
