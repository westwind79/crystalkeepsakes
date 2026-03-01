/**
 * Order ID Reconciliation Utility
 * @version 1.0.0
 * @date 2025-01-08
 * @description Automatically detects and fixes order ID mismatches
 */

import { getCurrentOrderSession, saveOrderSession, clearOrderSession } from './unifiedOrderId'
import type { OrderSession } from './unifiedOrderId'

interface ReconciliationResult {
  hadMismatch: boolean
  fixedOrderId: string | null
  clearedIds: string[]
  action: 'kept_newest' | 'created_new' | 'no_action'
  details: string
}

/**
 * Detect if there are order ID mismatches across storage systems
 */
function detectMismatches(): {
  hasConflict: boolean
  orderIds: Set<string>
  sources: Record<string, string | null>
} {
  if (typeof window === 'undefined') {
    return { hasConflict: false, orderIds: new Set(), sources: {} }
  }

  const sources: Record<string, string | null> = {
    unifiedSession: null,
    localStorage_pending: null,
    sessionStorage_pending: null,
    cart_items: null
  }

  // Check unified session
  const session = getCurrentOrderSession()
  if (session) {
    sources.unifiedSession = session.orderId
  }

  // Check localStorage pending_order_number
  const localPending = localStorage.getItem('pending_order_number')
  if (localPending) {
    sources.localStorage_pending = localPending
  }

  // Check sessionStorage pendingOrder
  try {
    const sessionPending = sessionStorage.getItem('pendingOrder')
    if (sessionPending) {
      const parsed = JSON.parse(sessionPending)
      if (parsed.orderNumber) {
        sources.sessionStorage_pending = parsed.orderNumber
      }
    }
  } catch {}

  // Check cart items
  try {
    const cart = localStorage.getItem('cart')
    if (cart) {
      const cartItems = JSON.parse(cart)
      const cartOrderRefs = cartItems
        .map((item: any) => item.customImage?.tempOrderRef)
        .filter(Boolean)
      
      if (cartOrderRefs.length > 0) {
        // Use first cart item's order ref
        sources.cart_items = cartOrderRefs[0]
      }
    }
  } catch {}

  // Collect all unique order IDs
  const orderIds = new Set<string>(
    Object.values(sources).filter((id): id is string => id !== null)
  )

  const hasConflict = orderIds.size > 1

  return { hasConflict, orderIds, sources }
}

/**
 * Get the "newest" order ID based on timestamp in ID
 * Format: CK_0000001_1767937473803
 */
function getNewestOrderId(orderIds: Set<string>): string | null {
  if (orderIds.size === 0) return null
  if (orderIds.size === 1) return Array.from(orderIds)[0]

  let newest: { id: string; timestamp: number } | null = null

  for (const id of orderIds) {
    // Extract timestamp from ID (last part after last underscore)
    const parts = id.split('_')
    const timestampStr = parts[parts.length - 1]
    const timestamp = parseInt(timestampStr, 10)

    if (!isNaN(timestamp)) {
      if (!newest || timestamp > newest.timestamp) {
        newest = { id, timestamp }
      }
    }
  }

  return newest ? newest.id : Array.from(orderIds)[0]
}

/**
 * Reconcile order IDs - automatically fix mismatches
 * 
 * Strategy:
 * 1. Detect all order IDs across storage
 * 2. If multiple IDs exist, keep the NEWEST one
 * 3. Clear all old IDs
 * 4. Update unified session with correct ID
 * 
 * @param options.forceNew - Force create new order ID even if valid one exists
 * @returns Result of reconciliation
 */
export function reconcileOrderIds(options: { forceNew?: boolean } = {}): ReconciliationResult {
  console.log('🔍 [RECONCILE] Starting order ID reconciliation...')

  const detection = detectMismatches()
  
  console.log('🔍 [RECONCILE] Detection:', {
    hasConflict: detection.hasConflict,
    foundIds: Array.from(detection.orderIds),
    sources: detection.sources
  })

  // No conflict and not forcing new - all good!
  if (!detection.hasConflict && !options.forceNew && detection.orderIds.size > 0) {
    const orderId = Array.from(detection.orderIds)[0]
    console.log('✅ [RECONCILE] No conflicts detected. Current ID:', orderId)
    return {
      hadMismatch: false,
      fixedOrderId: orderId,
      clearedIds: [],
      action: 'no_action',
      details: 'No mismatches found'
    }
  }

  // Force new OR no IDs exist
  if (options.forceNew || detection.orderIds.size === 0) {
    console.log('🆕 [RECONCILE] Creating fresh order ID')
    clearAllOrderIds()
    
    // Let unified system create new one
    const session = getCurrentOrderSession()
    const newId = session?.orderId || `CK_FALLBACK_${Date.now()}`
    
    console.log('✅ [RECONCILE] Created new order ID:', newId)
    return {
      hadMismatch: detection.hasConflict,
      fixedOrderId: newId,
      clearedIds: Array.from(detection.orderIds),
      action: 'created_new',
      details: 'Cleared all old IDs and created new'
    }
  }

  // Multiple IDs exist - keep newest
  const newestId = getNewestOrderId(detection.orderIds)
  if (!newestId) {
    console.error('❌ [RECONCILE] Could not determine newest ID')
    return {
      hadMismatch: true,
      fixedOrderId: null,
      clearedIds: [],
      action: 'no_action',
      details: 'Failed to determine newest ID'
    }
  }

  console.log('🔧 [RECONCILE] Keeping newest ID:', newestId)
  console.log('🗑️ [RECONCILE] Clearing old IDs:', Array.from(detection.orderIds).filter(id => id !== newestId))

  // Clear all old IDs
  const clearedIds = Array.from(detection.orderIds).filter(id => id !== newestId)
  clearAllOrderIds()

  // Set the newest ID as the canonical one
  const session: OrderSession = {
    orderId: newestId,
    createdAt: new Date().toISOString(),
    status: 'customizing',
    images: {}
  }
  saveOrderSession(session)

  // Also update localStorage pending_order_number for legacy compatibility
  localStorage.setItem('pending_order_number', newestId)

  console.log('✅ [RECONCILE] Fixed! Canonical ID:', newestId)

  return {
    hadMismatch: true,
    fixedOrderId: newestId,
    clearedIds,
    action: 'kept_newest',
    details: `Consolidated to newest ID: ${newestId}`
  }
}

/**
 * Clear all order IDs from all storage locations
 */
function clearAllOrderIds(): void {
  console.log('🗑️ [RECONCILE] Clearing all order IDs')

  // Clear unified session
  clearOrderSession()

  // Clear localStorage
  localStorage.removeItem('pending_order_number')
  localStorage.removeItem('ck_order_session')

  // Clear sessionStorage
  sessionStorage.removeItem('pendingOrder')

  // Don't clear cart - just the order refs in items will be updated naturally
}

/**
 * Auto-reconcile on app initialization
 * Call this early in your app lifecycle (e.g., in root layout or main component)
 */
export function autoReconcileOnInit(): void {
  if (typeof window === 'undefined') return

  console.log('🚀 [RECONCILE] Auto-reconcile on init')
  
  const result = reconcileOrderIds()
  
  if (result.hadMismatch) {
    console.warn('⚠️ [RECONCILE] Fixed order ID mismatch on init:', result)
  }
}

/**
 * Check for mismatches without fixing (for debugging)
 */
export function checkOrderIdHealth(): {
  healthy: boolean
  issues: string[]
  sources: Record<string, string | null>
} {
  const detection = detectMismatches()
  
  const issues: string[] = []
  
  if (detection.hasConflict) {
    issues.push(`Multiple order IDs found: ${Array.from(detection.orderIds).join(', ')}`)
  }
  
  // Check for old sessions (> 2 hours)
  const session = getCurrentOrderSession()
  if (session) {
    const age = Date.now() - new Date(session.createdAt).getTime()
    const hoursOld = age / (60 * 60 * 1000)
    
    if (hoursOld > 2) {
      issues.push(`Order session is ${hoursOld.toFixed(1)} hours old (stale)`)
    }
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    sources: detection.sources
  }
}