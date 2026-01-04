'use client'

/**
 * COMPREHENSIVE DEBUG OVERLAY
 * Shows ALL system state, order IDs, cart data, environment, storage, etc.
 * This is the "single source of truth" for debugging
 */

import { useState, useEffect, useCallback } from 'react'
import { getImageStorageStats, checkStorageHealth, getCartWithImages, getCart } from '@/lib/cartUtils'
import { buildCockpit3DOrder, validateCockpit3DOrder, type Cockpit3DOrder } from '@/lib/cockpit3d-order-builder'
import { getCurrentOrderSession, getOrCreateOrderSession, clearOrderSession, type OrderSession } from '@/lib/unifiedOrderId'

// ============================================================================
// TYPES
// ============================================================================

interface OrderIdState {
  unifiedSession: OrderSession | null
  localStorage: {
    pending_order_number: string | null
    ck_order_session: string | null
    ck_order_counter: string | null
  }
  sessionStorage: {
    pendingOrder: any | null
  }
  cartItems: Array<{
    productId: string
    tempOrderRef?: string
    serverUrl?: string
  }>
  mismatchWarnings: string[]
}

interface EnvironmentState {
  mode: string
  basePath: string
  phpBackendUrl: string
  stripePublishableKey: string
  stripeKeyType: 'LIVE' | 'TEST' | 'NOT SET'
  cockpit3dRetailerId: string
  cockpit3dApiUrl: string
  nodeEnv: string
  buildTime: string
}

interface StorageState {
  localStorage: {
    used: number
    limit: number
    percentUsed: number
    keys: string[]
  }
  sessionStorage: {
    used: number
    keys: string[]
  }
  indexedDB: {
    available: boolean
    totalImages: number
    estimatedSizeMB: number
  }
}

interface CartState {
  itemCount: number
  totalQuantity: number
  totalPrice: number
  items: Array<{
    productId: string
    name: string
    sku: string
    quantity: number
    price: number
    hasCustomImage: boolean
    serverUrl?: string
    originalServerUrl?: string
    tempOrderRef?: string
    options: any[]
  }>
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComprehensiveDebugOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<'order-ids' | 'env' | 'storage' | 'cart' | 'cockpit3d' | 'logs'>('order-ids')
  const [mounted, setMounted] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  // State for each section
  const [orderIdState, setOrderIdState] = useState<OrderIdState | null>(null)
  const [envState, setEnvState] = useState<EnvironmentState | null>(null)
  const [storageState, setStorageState] = useState<StorageState | null>(null)
  const [cartState, setCartState] = useState<CartState | null>(null)
  const [cockpit3dOrder, setCockpit3dOrder] = useState<Cockpit3DOrder | null>(null)
  const [cockpit3dValidation, setCockpit3dValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null)
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string }>>([])
  
  // Test submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<any>(null)

  // ============================================================================
  // DATA GATHERING FUNCTIONS
  // ============================================================================

  const gatherOrderIdState = useCallback(async (): Promise<OrderIdState> => {
    const session = getCurrentOrderSession()
    const cart = getCart()
    
    // Check localStorage
    const pending_order_number = localStorage.getItem('pending_order_number')
    const ck_order_session = localStorage.getItem('ck_order_session')
    const ck_order_counter = localStorage.getItem('ck_order_counter')
    
    // Check sessionStorage
    let pendingOrder = null
    try {
      const stored = sessionStorage.getItem('pendingOrder')
      pendingOrder = stored ? JSON.parse(stored) : null
    } catch (e) {}
    
    // Extract cart item order refs
    const cartItems = cart.map(item => ({
      productId: item.productId,
      tempOrderRef: item.customImage?.tempOrderRef,
      serverUrl: item.customImage?.serverUrl
    }))
    
    // Check for mismatches
    const mismatchWarnings: string[] = []
    const uniqueRefs = new Set(cartItems.map(i => i.tempOrderRef).filter(Boolean))
    
    if (session && pending_order_number && session.orderId !== pending_order_number) {
      mismatchWarnings.push(`⚠️ Session ID (${session.orderId}) != localStorage pending_order_number (${pending_order_number})`)
    }
    
    if (pendingOrder?.orderNumber && session && pendingOrder.orderNumber !== session.orderId) {
      mismatchWarnings.push(`⚠️ Session ID (${session.orderId}) != sessionStorage pendingOrder.orderNumber (${pendingOrder.orderNumber})`)
    }
    
    if (uniqueRefs.size > 1) {
      mismatchWarnings.push(`⚠️ Multiple different order refs in cart: ${Array.from(uniqueRefs).join(', ')}`)
    }
    
    if (session && uniqueRefs.size === 1) {
      const cartRef = Array.from(uniqueRefs)[0]
      if (cartRef && cartRef !== session.orderId) {
        mismatchWarnings.push(`⚠️ Cart item ref (${cartRef}) != Session ID (${session.orderId})`)
      }
    }
    
    return {
      unifiedSession: session,
      localStorage: {
        pending_order_number,
        ck_order_session,
        ck_order_counter
      },
      sessionStorage: {
        pendingOrder
      },
      cartItems,
      mismatchWarnings
    }
  }, [])

  const gatherEnvState = useCallback((): EnvironmentState => {
    const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    let stripeKeyType: 'LIVE' | 'TEST' | 'NOT SET' = 'NOT SET'
    if (stripeKey.startsWith('pk_live_')) stripeKeyType = 'LIVE'
    else if (stripeKey.startsWith('pk_test_')) stripeKeyType = 'TEST'
    
    return {
      mode: process.env.NEXT_PUBLIC_ENV_MODE || 'development',
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || '(root)',
      phpBackendUrl: process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'NOT SET',
      stripePublishableKey: stripeKey 
        ? `${stripeKey.substring(0, 12)}...${stripeKey.slice(-4)}`
        : 'NOT SET',
      stripeKeyType,
      cockpit3dRetailerId: process.env.NEXT_PUBLIC_COCKPIT3D_RETAILER_ID || 'NOT SET',
      cockpit3dApiUrl: process.env.NEXT_PUBLIC_COCKPIT3D_API_URL || 'NOT SET',
      nodeEnv: process.env.NODE_ENV || 'unknown',
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown'
    }
  }, [])

  const gatherStorageState = useCallback(async (): Promise<StorageState> => {
    // localStorage
    let lsUsed = 0
    const lsKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        lsKeys.push(key)
        lsUsed += (localStorage.getItem(key)?.length || 0) + key.length
      }
    }
    
    // sessionStorage
    let ssUsed = 0
    const ssKeys: string[] = []
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          ssKeys.push(key)
          ssUsed += (sessionStorage.getItem(key)?.length || 0) + key.length
        }
      }
    } catch (e) {}
    
    // IndexedDB
    let idbStats = { totalImages: 0, estimatedSizeMB: 0, isAvailable: false }
    try {
      const stats = await getImageStorageStats()
      idbStats = {
        totalImages: stats?.totalImages || 0,
        estimatedSizeMB: stats?.estimatedSizeMB || 0,
        isAvailable: stats?.isAvailable ?? false
      }
    } catch (e) {}
    
    return {
      localStorage: {
        used: lsUsed,
        limit: 5242880,
        percentUsed: (lsUsed / 5242880) * 100,
        keys: lsKeys
      },
      sessionStorage: {
        used: ssUsed,
        keys: ssKeys
      },
      indexedDB: {
        available: idbStats.isAvailable,
        totalImages: idbStats.totalImages,
        estimatedSizeMB: idbStats.estimatedSizeMB
      }
    }
  }, [])

  const gatherCartState = useCallback(async (): Promise<CartState> => {
    const cart = await getCartWithImages()
    
    return {
      itemCount: cart.length,
      totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        hasCustomImage: !!(item.customImage?.serverUrl || item.customImage?.dataUrl),
        serverUrl: item.customImage?.serverUrl,
        originalServerUrl: item.customImage?.originalServerUrl,
        tempOrderRef: item.customImage?.tempOrderRef,
        options: item.options || []
      }))
    }
  }, [])

  const gatherCockpit3dOrder = useCallback(async () => {
    const cart = await getCartWithImages()
    if (!cart || cart.length === 0) {
      setCockpit3dOrder(null)
      setCockpit3dValidation(null)
      return
    }
    
    const session = getCurrentOrderSession()
    const orderNumber = session?.orderId || `TEST-${Date.now()}`
    
    const mockCustomer = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'Customer',
      phone: '555-0123',
      shippingAddress: {
        street1: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
      }
    }
    
    const order = buildCockpit3DOrder(orderNumber, cart, mockCustomer)
    const validation = validateCockpit3DOrder(order)
    
    setCockpit3dOrder(order)
    setCockpit3dValidation(validation)
  }, [])

  const addLog = useCallback((type: string, message: string) => {
    setLogs(prev => [{
      time: new Date().toLocaleTimeString(),
      type,
      message
    }, ...prev].slice(0, 100))
  }, [])

  const refreshAll = useCallback(async () => {
    setLastRefresh(new Date())
    const [orderIds, env, storage, cart] = await Promise.all([
      gatherOrderIdState(),
      gatherEnvState(),
      gatherStorageState(),
      gatherCartState()
    ])
    setOrderIdState(orderIds)
    setEnvState(env)
    setStorageState(storage)
    setCartState(cart)
    await gatherCockpit3dOrder()
  }, [gatherOrderIdState, gatherEnvState, gatherStorageState, gatherCartState, gatherCockpit3dOrder])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    setMounted(true)
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === 'true'
    setShouldShow(envMode !== 'production' || hasDebugParam)
    
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    if (!autoRefresh || !isOpen) return
    const interval = setInterval(refreshAll, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, isOpen, refreshAll])

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleCreateNewSession = () => {
    clearOrderSession()
    const newSession = getOrCreateOrderSession()
    addLog('ACTION', `Created new order session: ${newSession.orderId}`)
    refreshAll()
  }

  const handleClearAllStorage = () => {
    if (confirm('Clear ALL localStorage, sessionStorage, and order session?')) {
      localStorage.clear()
      sessionStorage.clear()
      addLog('ACTION', 'Cleared all storage')
      refreshAll()
    }
  }

  const [sendTestEmail, setSendTestEmail] = useState(false)

  const handleTestSubmit = async () => {
    if (!cockpit3dOrder) return
    
    setIsSubmitting(true)
    setSubmitResult(null)
    addLog('TEST', `Submitting test order to Cockpit3D... (Email: ${sendTestEmail ? 'YES' : 'NO'})`)
    
    try {
      const phpBackendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || ''
      const response = await fetch(`${phpBackendUrl}/api/cockpit3d/submit-order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cockpit3dOrder,
          testMode: true,
          sendTestEmail: sendTestEmail  // ✅ Send test email to orders@crystalkeepsakes.com
        })
      })
      
      const result = await response.json()
      setSubmitResult(result)
      
      // Log email result if applicable
      if (result.email) {
        addLog(result.email.sent ? 'SUCCESS' : 'INFO', 
          `Email: ${result.email.sent ? '✅ Sent to ' + result.email.to : result.email.message}`)
      }
      
      addLog(result.success ? 'SUCCESS' : 'ERROR', `Test order result: ${result.success ? 'OK' : result.error}`)
    } catch (error: any) {
      setSubmitResult({ success: false, error: error.message })
      addLog('ERROR', `Test order failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!mounted || !shouldShow) return null

  // Minimized badge
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-mono"
      >
        <span className="text-green-400">●</span>
        DEBUG
        {orderIdState?.mismatchWarnings && orderIdState.mismatchWarnings.length > 0 && (
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {orderIdState.mismatchWarnings.length}
          </span>
        )}
      </button>
    )
  }

  const tabs = [
    { id: 'order-ids', label: '🆔 Order IDs', warning: orderIdState?.mismatchWarnings?.length },
    { id: 'env', label: '⚙️ Environment' },
    { id: 'storage', label: '💾 Storage' },
    { id: 'cart', label: '🛒 Cart', count: cartState?.itemCount },
    { id: 'cockpit3d', label: '📦 Cockpit3D' },
    { id: 'logs', label: '📋 Logs', count: logs.length }
  ]

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4 w-auto' : 'bottom-4 right-4 w-[600px] max-h-[80vh]'} z-[9999] bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden font-mono text-xs`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">●</span>
          <span className="font-bold">DEBUG PANEL</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-400">{envState?.mode || '...'}</span>
          {envState?.stripeKeyType && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              envState.stripeKeyType === 'LIVE' ? 'bg-red-600' : 
              envState.stripeKeyType === 'TEST' ? 'bg-green-600' : 'bg-yellow-600'
            }`}>
              {envState.stripeKeyType}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[10px]">
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={refreshAll} className="p-1 hover:bg-slate-700 rounded" title="Refresh">
            🔄
          </button>
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`p-1 rounded ${autoRefresh ? 'bg-green-600' : 'hover:bg-slate-700'}`} title="Auto-refresh">
            ⏱️
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-slate-700 rounded">
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-600 rounded">
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-slate-700 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-500 bg-slate-800' 
                    : 'border-transparent hover:bg-slate-800'
                }`}
              >
                {tab.label}
                {tab.warning && tab.warning > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {tab.warning}
                  </span>
                )}
                {tab.count !== undefined && tab.count > 0 && !tab.warning && (
                  <span className="ml-1 bg-slate-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh] p-3">
            {/* ORDER IDS TAB */}
            {activeTab === 'order-ids' && orderIdState && (
              <div className="space-y-4">
                {/* Warnings */}
                {orderIdState.mismatchWarnings.length > 0 && (
                  <div className="bg-red-900/50 border border-red-600 rounded p-2">
                    <div className="font-bold text-red-400 mb-1">⚠️ ID MISMATCHES DETECTED</div>
                    {orderIdState.mismatchWarnings.map((w, i) => (
                      <div key={i} className="text-red-300 text-[11px]">{w}</div>
                    ))}
                  </div>
                )}

                {/* Unified Session */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-blue-400 mb-2">🆔 Unified Order Session</div>
                  {orderIdState.unifiedSession ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order ID:</span>
                        <span className="text-green-400 font-bold">{orderIdState.unifiedSession.orderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span>{orderIdState.unifiedSession.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Created:</span>
                        <span>{new Date(orderIdState.unifiedSession.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Masked Image:</span>
                        <span className={orderIdState.unifiedSession.images.masked ? 'text-green-400' : 'text-slate-500'}>
                          {orderIdState.unifiedSession.images.masked ? '✓ Uploaded' : '✗ None'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Raw Image:</span>
                        <span className={orderIdState.unifiedSession.images.raw ? 'text-green-400' : 'text-slate-500'}>
                          {orderIdState.unifiedSession.images.raw ? '✓ Uploaded' : '✗ None'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-yellow-400">No session - will be created when image is saved</div>
                  )}
                </div>

                {/* localStorage Order Data */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-purple-400 mb-2">💾 localStorage Order Data</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">pending_order_number:</span>
                      <span className="text-slate-200">{orderIdState.localStorage.pending_order_number || '(not set)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ck_order_counter:</span>
                      <span className="text-slate-200">{orderIdState.localStorage.ck_order_counter || '(not set)'}</span>
                    </div>
                  </div>
                </div>

                {/* sessionStorage Order Data */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-orange-400 mb-2">📦 sessionStorage pendingOrder</div>
                  {orderIdState.sessionStorage.pendingOrder ? (
                    <pre className="text-[10px] overflow-x-auto">
                      {JSON.stringify(orderIdState.sessionStorage.pendingOrder, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-500">(not set - created during checkout)</div>
                  )}
                </div>

                {/* Cart Item Refs */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-cyan-400 mb-2">🛒 Cart Item Order Refs</div>
                  {orderIdState.cartItems.length > 0 ? (
                    <div className="space-y-1">
                      {orderIdState.cartItems.map((item, i) => (
                        <div key={i} className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{item.productId}:</span>
                          <span className={item.tempOrderRef ? 'text-green-400' : 'text-slate-500'}>
                            {item.tempOrderRef || '(no ref)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500">Cart is empty</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewSession}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    🆕 Create New Session
                  </button>
                  <button
                    onClick={handleClearAllStorage}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm"
                  >
                    🗑️ Clear All Storage
                  </button>
                </div>
              </div>
            )}

            {/* ENVIRONMENT TAB */}
            {activeTab === 'env' && envState && (
              <div className="space-y-2">
                {Object.entries(envState).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-slate-700">
                    <span className="text-slate-400">{key}:</span>
                    <span className={`${
                      key === 'stripeKeyType' 
                        ? value === 'LIVE' ? 'text-red-400 font-bold' : 'text-green-400'
                        : value === 'NOT SET' ? 'text-yellow-400' : 'text-slate-200'
                    }`}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* STORAGE TAB */}
            {activeTab === 'storage' && storageState && (
              <div className="space-y-4">
                {/* localStorage */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-purple-400 mb-2">
                    💾 localStorage ({(storageState.localStorage.used / 1024).toFixed(1)} KB / 5 MB)
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2 mb-2">
                    <div 
                      className={`h-2 rounded ${storageState.localStorage.percentUsed > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(storageState.localStorage.percentUsed, 100)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Keys: {storageState.localStorage.keys.join(', ')}
                  </div>
                </div>

                {/* sessionStorage */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-orange-400 mb-2">
                    📦 sessionStorage ({(storageState.sessionStorage.used / 1024).toFixed(1)} KB)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Keys: {storageState.sessionStorage.keys.join(', ') || '(empty)'}
                  </div>
                </div>

                {/* IndexedDB */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-cyan-400 mb-2">🗄️ IndexedDB</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available:</span>
                      <span className={storageState.indexedDB.available ? 'text-green-400' : 'text-red-400'}>
                        {storageState.indexedDB.available ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Images stored:</span>
                      <span>{storageState.indexedDB.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated size:</span>
                      <span>{storageState.indexedDB.estimatedSizeMB.toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CART TAB */}
            {activeTab === 'cart' && cartState && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-slate-800 rounded p-2">
                  <div className="font-bold text-green-400 mb-2">🛒 Cart Summary</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold">{cartState.itemCount}</div>
                      <div className="text-[10px] text-slate-400">Items</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold">{cartState.totalQuantity}</div>
                      <div className="text-[10px] text-slate-400">Quantity</div>
                    </div>
                    <div className="bg-slate-700 rounded p-2">
                      <div className="text-2xl font-bold">${cartState.totalPrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Total</div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                {cartState.items.map((item, i) => (
                  <div key={i} className="bg-slate-800 rounded p-2">
                    <div className="font-bold text-blue-400">{item.name}</div>
                    <div className="grid grid-cols-2 gap-x-4 text-[11px] mt-1">
                      <div className="text-slate-400">Product ID: <span className="text-slate-200">{item.productId}</span></div>
                      <div className="text-slate-400">SKU: <span className="text-slate-200">{item.sku}</span></div>
                      <div className="text-slate-400">Qty: <span className="text-slate-200">{item.quantity}</span></div>
                      <div className="text-slate-400">Price: <span className="text-slate-200">${item.price.toFixed(2)}</span></div>
                      <div className="text-slate-400">Custom Image: 
                        <span className={item.hasCustomImage ? 'text-green-400' : 'text-slate-500'}>
                          {item.hasCustomImage ? ' ✓' : ' ✗'}
                        </span>
                      </div>
                      <div className="text-slate-400">Order Ref: 
                        <span className={item.tempOrderRef ? 'text-green-400' : 'text-yellow-400'}>
                          {item.tempOrderRef ? ` ${item.tempOrderRef.substring(0, 20)}...` : ' (none)'}
                        </span>
                      </div>
                    </div>
                    {item.serverUrl && (
                      <div className="mt-1 text-[10px]">
                        <div className="text-slate-400">Server URL:</div>
                        <div className="text-blue-400 break-all">{item.serverUrl}</div>
                      </div>
                    )}
                    {item.options.length > 0 && (
                      <div className="mt-1 text-[10px]">
                        <div className="text-slate-400">Options: {item.options.length}</div>
                      </div>
                    )}
                  </div>
                ))}

                {cartState.items.length === 0 && (
                  <div className="text-center text-slate-500 py-4">Cart is empty</div>
                )}
              </div>
            )}

            {/* COCKPIT3D TAB */}
            {activeTab === 'cockpit3d' && (
              <div className="space-y-4">
                {/* Validation */}
                {cockpit3dValidation && (
                  <div className={`rounded p-2 ${cockpit3dValidation.isValid ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'}`}>
                    <div className="font-bold">
                      {cockpit3dValidation.isValid ? '✅ Order Valid' : '❌ Order Invalid'}
                    </div>
                    {cockpit3dValidation.errors.length > 0 && (
                      <ul className="mt-1 text-[11px]">
                        {cockpit3dValidation.errors.map((e, i) => (
                          <li key={i} className="text-red-300">• {e}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Order Preview */}
                {cockpit3dOrder ? (
                  <div className="bg-slate-800 rounded p-2">
                    <div className="font-bold text-orange-400 mb-2">📦 Cockpit3D Order Preview</div>
                    <pre className="text-[10px] overflow-x-auto max-h-[300px] overflow-y-auto bg-slate-900 p-2 rounded">
                      {JSON.stringify(cockpit3dOrder, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-4">Add items to cart to preview order</div>
                )}

                {/* Test Submit */}
                {cockpit3dOrder && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestSubmit}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 rounded text-sm"
                    >
                      {isSubmitting ? '⏳ Submitting...' : '🧪 Test Submit (No Charge)'}
                    </button>
                  </div>
                )}

                {/* Submit Result */}
                {submitResult && (
                  <div className={`rounded p-2 ${submitResult.success ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                    <div className="font-bold mb-1">
                      {submitResult.success ? '✅ Test Successful' : '❌ Test Failed'}
                    </div>
                    <pre className="text-[10px] overflow-x-auto">
                      {JSON.stringify(submitResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* LOGS TAB */}
            {activeTab === 'logs' && (
              <div className="space-y-1">
                {logs.length === 0 && (
                  <div className="text-center text-slate-500 py-4">No logs yet</div>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 text-[11px] py-1 border-b border-slate-800">
                    <span className="text-slate-500 w-20">{log.time}</span>
                    <span className={`w-16 ${
                      log.type === 'ERROR' ? 'text-red-400' :
                      log.type === 'SUCCESS' ? 'text-green-400' :
                      log.type === 'ACTION' ? 'text-blue-400' :
                      'text-slate-400'
                    }`}>[{log.type}]</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
