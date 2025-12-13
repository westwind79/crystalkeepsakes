'use client'

import { useState, useEffect, useCallback } from 'react'
import { buildCockpit3DOrder, validateCockpit3DOrder, type Cockpit3DOrder } from '@/lib/cockpit3d-order-builder'
import { getCartWithImages } from '@/lib/cartUtils'

interface DebugStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
  data?: any
  timestamp?: string
  error?: string
}

type TabType = 'activity' | 'order' | 'env'

export default function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [mounted, setMounted] = useState(false)
  const [shouldShowDebug, setShouldShowDebug] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('activity')
  const [orderPreview, setOrderPreview] = useState<Cockpit3DOrder | null>(null)
  const [orderValidation, setOrderValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if debug should be enabled
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const isDev = envMode === 'development'
    const isTest = envMode === 'testing'
    
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === 'true'
    
    // Show debug if: (dev OR test) OR has ?debug=true parameter
    setShouldShowDebug(isDev || isTest || hasDebugParam)
    
    // Listen for debug events
    const handleDebugEvent = (e: CustomEvent) => {
      setSteps(prev => {
        const newSteps = [...prev]
        const existingIndex = newSteps.findIndex(s => s.id === e.detail.id)
        
        if (existingIndex >= 0) {
          newSteps[existingIndex] = {
            ...newSteps[existingIndex],
            ...e.detail,
            timestamp: new Date().toISOString()
          }
        } else {
          newSteps.push({
            ...e.detail,
            timestamp: new Date().toISOString()
          })
        }
        
        return newSteps
      })
    }

    window.addEventListener('debug-step' as any, handleDebugEvent)
    return () => window.removeEventListener('debug-step' as any, handleDebugEvent)
  }, [])

  // Load order preview when Order tab is selected
  const loadOrderPreview = useCallback(async () => {
    setIsLoadingOrder(true)
    try {
      const cart = await getCartWithImages()
      setCartItems(cart || [])
      
      if (cart && cart.length > 0) {
        // Generate test order number
        const testOrderNumber = `TEST-${Date.now()}`
        
        // Mock customer info for preview
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
        
        // Build preview order
        const order = buildCockpit3DOrder(testOrderNumber, cart, mockCustomer)
        setOrderPreview(order)
        
        // Validate
        const validation = validateCockpit3DOrder(order)
        setOrderValidation(validation)
      } else {
        setOrderPreview(null)
        setOrderValidation(null)
      }
    } catch (err) {
      console.error('Failed to load order preview:', err)
    } finally {
      setIsLoadingOrder(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen && activeTab === 'order') {
      loadOrderPreview()
    }
  }, [isOpen, activeTab, loadOrderPreview])

  // Don't render at all if debug is not enabled
  if (!mounted || !shouldShowDebug) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 font-mono text-sm"
      >
        {isOpen ? '✕ Close' : '🐛 Debug'}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[450px] bg-gray-900 text-white shadow-2xl z-40 overflow-hidden flex flex-col">
          {/* Header with Tabs */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold">🐛 Debug Panel</h2>
              <button
                onClick={() => setSteps([])}
                className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
              >
                Clear
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-800 p-1 rounded">
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  activeTab === 'activity' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                📋 Activity
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  activeTab === 'order' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                📦 Order Preview
              </button>
              <button
                onClick={() => setActiveTab('env')}
                className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
                  activeTab === 'env' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                🔧 Environment
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                {steps.length === 0 && (
                  <p className="text-gray-400 text-sm">No activity yet. Add items to cart and proceed to checkout to see debug events.</p>
                )}

                {steps.map((step, i) => (
                  <div key={i} className="mb-4 border-l-4 pl-3 border-gray-700">
                    <div className="flex items-center gap-2 mb-1">
                      {step.status === 'complete' && <span className="text-green-400">✓</span>}
                      {step.status === 'active' && <span className="text-yellow-400">⟳</span>}
                      {step.status === 'error' && <span className="text-red-400">✕</span>}
                      {step.status === 'pending' && <span className="text-gray-500">○</span>}
                      
                      <span className="font-semibold text-sm">{step.label}</span>
                    </div>
                    
                    {step.timestamp && (
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </p>
                    )}

                    {step.error && (
                      <p className="text-xs text-red-400 bg-red-900/20 p-2 rounded mb-2">
                        {step.error}
                      </p>
                    )}

                    {step.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Data
                        </summary>
                        <pre className="bg-black/30 p-2 rounded mt-1 overflow-x-auto text-[10px]">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Order Preview Tab */}
            {activeTab === 'order' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-blue-400">Cockpit3D Order Structure</h3>
                  <button
                    onClick={loadOrderPreview}
                    disabled={isLoadingOrder}
                    className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingOrder ? '⟳ Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {/* Cart Items Count */}
                <div className="mb-4 p-3 bg-gray-800 rounded text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Cart Items:</span>
                    <span className={cartItems.length > 0 ? 'text-green-400' : 'text-yellow-400'}>
                      {cartItems.length} item(s)
                    </span>
                  </div>
                </div>

                {/* Validation Status */}
                {orderValidation && (
                  <div className={`mb-4 p-3 rounded text-xs ${
                    orderValidation.isValid 
                      ? 'bg-green-900/30 border border-green-500' 
                      : 'bg-red-900/30 border border-red-500'
                  }`}>
                    <div className="font-bold mb-1">
                      {orderValidation.isValid ? '✅ Order Valid' : '❌ Validation Errors'}
                    </div>
                    {orderValidation.errors.length > 0 && (
                      <ul className="list-disc list-inside text-red-400">
                        {orderValidation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Order Preview */}
                {orderPreview ? (
                  <div className="space-y-4">
                    {/* Order Header */}
                    <div className="p-3 bg-gray-800 rounded text-xs space-y-2">
                      <div className="font-bold text-blue-400 mb-2">📋 Order Info</div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="text-white font-mono">{orderPreview.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Retailer ID:</span>
                        <span className="text-white font-mono">{orderPreview.retailer_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-green-400 font-bold">${orderPreview.total?.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="p-3 bg-gray-800 rounded text-xs space-y-1">
                      <div className="font-bold text-blue-400 mb-2">📍 Shipping Address</div>
                      <div>{orderPreview.address.firstname} {orderPreview.address.lastname}</div>
                      <div>{orderPreview.address.street}</div>
                      <div>{orderPreview.address.city}, {orderPreview.address.region} {orderPreview.address.postcode}</div>
                      <div>{orderPreview.address.country}</div>
                      <div className="text-gray-400 mt-2">{orderPreview.address.email}</div>
                      <div className="text-gray-400">{orderPreview.address.telephone}</div>
                    </div>

                    {/* Line Items */}
                    <div className="p-3 bg-gray-800 rounded text-xs">
                      <div className="font-bold text-blue-400 mb-2">🛒 Line Items ({orderPreview.items.length})</div>
                      {orderPreview.items.map((item, idx) => (
                        <div key={idx} className="border-t border-gray-700 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-white">{item.sku}</div>
                              <div className="text-gray-400">Qty: {item.qty}</div>
                              <div className="text-gray-400 font-mono text-[10px]">ID: {item.client_item_id}</div>
                            </div>
                            <div className="text-green-400">${item.price.toFixed(2)}</div>
                          </div>
                          
                          {/* Item Options */}
                          {item.options.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-gray-600">
                              <div className="text-gray-500 text-[10px] mb-1">Options:</div>
                              {item.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-[10px] text-gray-400">
                                  • ID: {opt.id} {opt.qty && `(qty: ${opt.qty})`} {opt.value && `= ${JSON.stringify(opt.value)}`}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Special Instructions */}
                          {item.special_instructions && (
                            <div className="mt-2 p-2 bg-yellow-900/20 rounded text-[10px] text-yellow-400">
                              📝 {item.special_instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Raw JSON */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300 font-bold p-2 bg-gray-800 rounded">
                        📄 View Raw JSON
                      </summary>
                      <div className="mt-2 relative">
                        <button
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(orderPreview, null, 2))}
                          className="absolute top-2 right-2 text-[10px] bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-700"
                        >
                          Copy
                        </button>
                        <pre className="bg-black/50 p-3 rounded overflow-x-auto text-[10px] max-h-[300px] overflow-y-auto">
                          {JSON.stringify(orderPreview, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">🛒</div>
                    <p>Add items to your cart to preview the Cockpit3D order structure</p>
                  </div>
                )}
              </div>
            )}

            {/* Environment Tab */}
            {activeTab === 'env' && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-800 rounded text-xs space-y-1">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-bold text-blue-400">🔧 Environment Info</div>
                    <button
                      onClick={() => {
                        const envInfo = {
                          mode: process.env.NEXT_PUBLIC_ENV_MODE || 'development',
                          basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/',
                          backend: process.env.NEXT_PUBLIC_PHP_BACKEND_URL,
                          stripeKey: process.env.NEXT_PUBLIC_ENV_MODE === 'production'
                            ? process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY?.substring(0, 20)
                            : process.env.NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY?.substring(0, 20),
                          stripeMode: process.env.NEXT_PUBLIC_ENV_MODE === 'production' ? 'LIVE' : 'TEST'
                        }
                        navigator.clipboard.writeText(JSON.stringify(envInfo, null, 2))
                      }}
                      className="text-[10px] bg-blue-600 px-2 py-0.5 rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className={
                      process.env.NEXT_PUBLIC_ENV_MODE === 'production' 
                        ? 'text-red-400 font-bold'
                        : process.env.NEXT_PUBLIC_ENV_MODE === 'testing'
                        ? 'text-yellow-400 font-bold'
                        : 'text-blue-400 font-bold'
                    }>
                      {process.env.NEXT_PUBLIC_ENV_MODE || 'development'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Path:</span>
                    <span className="text-white">{process.env.NEXT_PUBLIC_BASE_PATH || '/'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Backend:</span>
                    <span className="text-white truncate max-w-[200px]" title={process.env.NEXT_PUBLIC_PHP_BACKEND_URL}>
                      {process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe Key:</span>
                    <span className="text-white font-mono text-[10px]">
                      {process.env.NEXT_PUBLIC_ENV_MODE === 'production'
                        ? (process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY || 'NOT SET').substring(0, 20) + '...'
                        : (process.env.NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY || 'NOT SET').substring(0, 20) + '...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stripe Mode:</span>
                    <span className={
                      process.env.NEXT_PUBLIC_ENV_MODE === 'production'
                        ? 'text-red-400 font-bold'
                        : 'text-green-400 font-bold'
                    }>
                      {process.env.NEXT_PUBLIC_ENV_MODE === 'production' ? '🔴 LIVE' : '✓ TEST'}
                    </span>
                  </div>
                  
                  {/* Warning if production mode detected */}
                  {process.env.NEXT_PUBLIC_ENV_MODE === 'production' && (
                    <div className="mt-2 p-2 bg-red-900/30 border border-red-500 rounded">
                      <div className="text-red-400 font-bold text-[10px]">⚠️ PRODUCTION MODE</div>
                      <div className="text-red-300 text-[10px]">Using LIVE Stripe keys!</div>
                    </div>
                  )}
                </div>

                {/* Cockpit3D Config */}
                <div className="p-3 bg-gray-800 rounded text-xs space-y-1">
                  <div className="font-bold text-blue-400 mb-2">🏭 Cockpit3D Config</div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shop ID:</span>
                    <span className="text-white font-mono">
                      {process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID || '256568874'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Status:</span>
                    <span className="text-yellow-400">Not Connected</span>
                  </div>
                </div>

                {/* Debug Tips */}
                <div className="p-3 bg-blue-900/20 border border-blue-500 rounded text-xs">
                  <div className="font-bold text-blue-400 mb-2">💡 Debug Tips</div>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Add <code className="bg-black/30 px-1 rounded">?debug=true</code> to URL to show this panel in production</li>
                    <li>• Check "Order Preview" tab to see Cockpit3D order structure</li>
                    <li>• Activity tab shows real-time checkout events</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Helper to emit debug events
export function debugStep(id: string, label: string, status: DebugStep['status'], data?: any, error?: string) {
  if (typeof window !== 'undefined') {
    // Check if debug is enabled
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const isDev = envMode === 'development'
    const isTest = envMode === 'testing'
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === 'true'
    
    // Only emit events if debug is enabled
    if (isDev || isTest || hasDebugParam) {
      window.dispatchEvent(new CustomEvent('debug-step', {
        detail: { id, label, status, data, error }
      }))
    }
  }
}
