'use client'

import { useState, useEffect, useCallback } from 'react'
import { getImageStorageStats, checkStorageHealth, getCartWithImages } from '@/lib/cartUtils'
import { buildCockpit3DOrder, validateCockpit3DOrder, type Cockpit3DOrder } from '@/lib/cockpit3d-order-builder'

interface DebugStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
  data?: any
  timestamp?: string
  error?: string
}

interface SystemInfo {
  userAgent: string
  platform: string
  language: string
  cookiesEnabled: boolean
  onLine: boolean
  viewport: { width: number; height: number }
  localStorage: { used: number; limit: number; percentUsed: number; healthy: boolean }
  indexedDB: { totalImages: number; totalSize: number; oldestImage?: string }
  sessionStorage: { used: number; available: boolean }
  memory?: { used: number; total: number; limit: number }
  timing?: any
  env: {
    mode: string
    basePath: string
    backend: string
    stripeMode: string
  }
}

export default function EnhancedDebugOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [shouldShowDebug, setShouldShowDebug] = useState(false)
  const [activeTab, setActiveTab] = useState<'steps' | 'system' | 'storage' | 'cart' | 'order'>('steps')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [orderPreview, setOrderPreview] = useState<Cockpit3DOrder | null>(null)
  const [orderValidation, setOrderValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)

  const gatherSystemInfo = async (): Promise<SystemInfo> => {
    const storageHealth = checkStorageHealth()
    const imageStats = await getImageStorageStats()
    
    let localStorageUsed = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        localStorageUsed += localStorage[key].length + key.length
      }
    }
    
    let sessionStorageUsed = 0
    try {
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          sessionStorageUsed += sessionStorage[key].length + key.length
        }
      }
    } catch (e) {
      sessionStorageUsed = 0
    }

    const perfTiming = performance.timing ? {
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      responseTime: performance.timing.responseEnd - performance.timing.requestStart
    } : null

    const memory = (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    } : undefined

    // Product data verification
    const cartData = localStorage.getItem('cart')
    const cart = cartData ? JSON.parse(cartData) : []
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: {
        used: localStorageUsed,
        limit: 5242880,
        percentUsed: storageHealth.percentUsed,
        healthy: storageHealth.isHealthy
      },
      indexedDB: {
        totalImages: imageStats?.totalImages || 0,
        totalSize: imageStats?.totalSize || 0,
        oldestImage: imageStats?.oldestImageDate
      },
      sessionStorage: {
        used: sessionStorageUsed,
        available: true
      },
      memory,
      timing: perfTiming,
      env: {
        mode: process.env.NEXT_PUBLIC_ENV_MODE || 'development',
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/',
        backend: process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'Not set',
        stripeMode: process.env.NEXT_PUBLIC_ENV_MODE === 'production' ? 'LIVE' : 'TEST'
      },
      production: {
        cartItems: cart.length,
        productSource: '/data/final-products.json',
        assetPathBase: process.env.NEXT_PUBLIC_BASE_PATH || '(root)',
        cockpit3dConfigured: !!(process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID),
        stripeConfigured: !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const isDev = envMode === 'development'
    const isTest = envMode === 'testing'
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === 'true'
    
    setShouldShowDebug(isDev || isTest || hasDebugParam)
    gatherSystemInfo().then(setSystemInfo)
    
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

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      gatherSystemInfo().then(setSystemInfo)
    }, 2000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Load order preview when Order tab is selected
  const loadOrderPreview = useCallback(async () => {
    setIsLoadingOrder(true)
    try {
      const cart = await getCartWithImages()
      
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

  useEffect(() => {
    if (isOpen) {
      gatherSystemInfo().then(setSystemInfo)
    }
  }, [isOpen])

  if (!mounted || !shouldShowDebug) return null

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatMs = (ms: number): string => {
    return `${ms.toFixed(0)}ms`
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 font-mono text-sm transition-all"
      >
        {isOpen ? '✕ Close Debug' : '🐛 Debug Panel'}
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-gray-900 text-white shadow-2xl z-40 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🔬 Advanced Debug Panel
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                  title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                >
                  {autoRefresh ? '⟳ Live' : '⏸ Paused'}
                </button>
                <button
                  onClick={() => gatherSystemInfo().then(setSystemInfo)}
                  className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setSteps([])}
                  className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('steps')}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'steps' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📝 Activity ({steps.length})
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💻 System
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'storage' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                💾 Storage
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'cart' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                🛒 Cart
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`flex-1 py-2 px-3 rounded text-sm font-semibold transition-colors ${
                  activeTab === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                📦 Order
              </button>
            </div>

            {activeTab === 'steps' && (
              <div>
                {steps.length === 0 && (
                  <p className="text-gray-400 text-sm">No activity yet...</p>
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
                        <pre className="bg-black/30 p-2 rounded mt-1 overflow-x-auto text-[10px] max-h-60">
                          {JSON.stringify(step.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'system' && systemInfo && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-blue-400 mb-2">🌍 Environment</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mode:</span>
                      <span className={`font-bold ${
                        systemInfo.env.mode === 'production' ? 'text-red-400' :
                        systemInfo.env.mode === 'testing' ? 'text-yellow-400' : 'text-green-400'
                      }`}>{systemInfo.env.mode.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backend:</span>
                      <span className="text-white text-[10px]">{systemInfo.env.backend}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-purple-400 mb-2">📱 Browser</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Platform:</span>
                      <span className="text-white">{systemInfo.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Viewport:</span>
                      <span className="text-white">{systemInfo.viewport.width}x{systemInfo.viewport.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Online:</span>
                      <span className={systemInfo.onLine ? 'text-green-400' : 'text-red-400'}>
                        {systemInfo.onLine ? '✓ Connected' : '✕ Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {systemInfo.memory && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <h3 className="text-sm font-bold text-yellow-400 mb-2">⚡ Performance</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">JS Heap:</span>
                        <span className="text-white">{formatBytes(systemInfo.memory.used)}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded overflow-hidden mt-2">
                        <div 
                          className={`h-full ${
                            (systemInfo.memory.used / systemInfo.memory.limit) > 0.8 ? 'bg-red-500' :
                            (systemInfo.memory.used / systemInfo.memory.limit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(systemInfo.memory.used / systemInfo.memory.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'storage' && systemInfo && (
              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-green-400 mb-2">💾 localStorage</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used:</span>
                      <span className="text-white">{formatBytes(systemInfo.localStorage.used)}</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded overflow-hidden">
                      <div 
                        className={`h-full ${
                          systemInfo.localStorage.percentUsed > 90 ? 'bg-red-500' :
                          systemInfo.localStorage.percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemInfo.localStorage.percentUsed}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 text-center">
                      {systemInfo.localStorage.percentUsed.toFixed(1)}% used
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-blue-400 mb-2">🗄️ IndexedDB</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Images:</span>
                      <span className="text-white font-bold">{systemInfo.indexedDB.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white">{formatBytes(systemInfo.indexedDB.totalSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-700 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-green-400 mb-2">🛒 Cart Health</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Items:</span>
                      <span className="text-white">
                        {(() => {
                          try {
                            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
                            return cart.length
                          } catch {
                            return 'Error'
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cart' && (
              <div className="space-y-4">
                {(() => {
                  try {
                    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
                    const orderNumber = localStorage.getItem('pending_order_number')
                    
                    return (
                      <>
                        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
                          <h3 className="text-sm font-bold text-purple-400 mb-2">🛒 Cart Summary</h3>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-400">Items:</span>
                              <span className="ml-2 text-white font-bold">{cart.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Total:</span>
                              <span className="ml-2 text-white font-bold">
                                ${cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {orderNumber && (
                            <div className="mt-2 pt-2 border-t border-purple-700">
                              <span className="text-gray-400 text-xs">Order #:</span>
                              <span className="ml-2 text-purple-300 font-mono text-xs">{orderNumber}</span>
                            </div>
                          )}
                        </div>

                        {cart.length > 0 && cart.map((item: any, idx: number) => (
                          <div key={idx} className="bg-gray-800 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-white mb-2">{item.name || item.productId}</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">SKU:</span>
                                <span className="text-white font-mono">{item.sku}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Price:</span>
                                <span className="text-white">${item.price} × {item.quantity}</span>
                              </div>
                              {item.cockpit3d_id && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Cockpit3D ID:</span>
                                  <span className="text-green-400">{item.cockpit3d_id}</span>
                                </div>
                              )}
                              {item.customImageId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Has Image:</span>
                                  <span className="text-green-400">✓</span>
                                </div>
                              )}
                              {item.options && item.options.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <span className="text-gray-400">Options:</span>
                                  <ul className="ml-2 mt-1 space-y-0.5">
                                    {item.options.map((opt: any, oi: number) => (
                                      <li key={oi} className="text-gray-300">• {opt.name}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {cart.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Cart is empty
                          </div>
                        )}

                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚡ Quick Actions</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                console.log('Cart Data:', cart)
                                alert('Cart logged to console')
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2 rounded"
                            >
                              Log Cart
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Clear cart?')) {
                                  localStorage.removeItem('cart')
                                  localStorage.removeItem('pending_order_number')
                                  location.reload()
                                }
                              }}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-xs py-1 px-2 rounded"
                            >
                              Clear Cart
                            </button>
                          </div>
                        </div>
                      </>
                    )
                  } catch (e) {
                    return (
                      <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-center text-red-400 text-sm">
                        Error loading cart data
                      </div>
                    )
                  }
                })()}
              </div>
            )}

            {/* ORDER TAB - Cockpit3D Order Structure Preview */}
            {activeTab === 'order' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-orange-400">📦 Cockpit3D Order Structure</h3>
                  <button
                    onClick={loadOrderPreview}
                    disabled={isLoadingOrder}
                    className="text-xs bg-orange-600 px-2 py-1 rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isLoadingOrder ? '⟳ Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {/* Validation Status */}
                {orderValidation && (
                  <div className={`p-3 rounded text-xs ${
                    orderValidation.isValid 
                      ? 'bg-green-900/30 border border-green-500' 
                      : 'bg-red-900/30 border border-red-500'
                  }`}>
                    <div className="font-bold mb-1">
                      {orderValidation.isValid ? '✅ Order Valid - Ready to Submit' : '❌ Validation Errors'}
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
                    <div className="p-3 bg-orange-900/20 border border-orange-700 rounded-lg text-xs space-y-2">
                      <div className="font-bold text-orange-400 mb-2">📋 Order Info</div>
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
                    <div className="p-3 bg-gray-800 rounded-lg text-xs space-y-1">
                      <div className="font-bold text-blue-400 mb-2">📍 Shipping Address (Test Data)</div>
                      <div className="text-gray-300">{orderPreview.address.firstname} {orderPreview.address.lastname}</div>
                      <div className="text-gray-300">{orderPreview.address.street}</div>
                      <div className="text-gray-300">{orderPreview.address.city}, {orderPreview.address.region} {orderPreview.address.postcode}</div>
                      <div className="text-gray-400">{orderPreview.address.email}</div>
                    </div>

                    {/* Line Items */}
                    <div className="p-3 bg-gray-800 rounded-lg text-xs">
                      <div className="font-bold text-purple-400 mb-2">🛒 Line Items ({orderPreview.items.length})</div>
                      {orderPreview.items.map((item, idx) => (
                        <div key={idx} className="border-t border-gray-700 pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-white">{item.sku}</div>
                              <div className="text-gray-400">Qty: {item.qty}</div>
                              <div className="text-gray-500 font-mono text-[10px]">ID: {item.client_item_id}</div>
                            </div>
                            <div className="text-green-400 font-bold">${item.price.toFixed(2)}</div>
                          </div>
                          
                          {/* Item Options */}
                          {item.options.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-gray-600">
                              <div className="text-gray-500 text-[10px] mb-1">Cockpit3D Options:</div>
                              {item.options.map((opt, optIdx) => (
                                <div key={optIdx} className="text-[10px] text-gray-400">
                                  • Option ID: <span className="text-orange-400">{opt.id}</span>
                                  {opt.qty && <span className="text-gray-500"> (qty: {opt.qty})</span>}
                                  {opt.value && <span className="text-blue-400"> = {JSON.stringify(opt.value)}</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Special Instructions */}
                          {item.special_instructions && (
                            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-[10px] text-yellow-400">
                              📝 {item.special_instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Raw JSON Export */}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-orange-400 hover:text-orange-300 font-bold p-2 bg-gray-800 rounded">
                        📄 View Raw Cockpit3D JSON
                      </summary>
                      <div className="mt-2 relative">
                        <button
                          onClick={() => navigator.clipboard.writeText(JSON.stringify(orderPreview, null, 2))}
                          className="absolute top-2 right-2 text-[10px] bg-orange-600 px-2 py-0.5 rounded hover:bg-orange-700 z-10"
                        >
                          Copy JSON
                        </button>
                        <pre className="bg-black/50 p-3 rounded overflow-x-auto text-[10px] max-h-[300px] overflow-y-auto text-gray-300">
                          {JSON.stringify(orderPreview, null, 2)}
                        </pre>
                      </div>
                    </details>

                    {/* Test Order Button */}
                    <div className="p-3 bg-yellow-900/20 border border-yellow-600 rounded-lg">
                      <div className="font-bold text-yellow-400 text-xs mb-2">⚡ Test Actions</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            console.log('📦 Cockpit3D Order Preview:', orderPreview)
                            alert('Order logged to browser console (F12)')
                          }}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-xs py-1.5 px-3 rounded font-semibold"
                        >
                          Log to Console
                        </button>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(orderPreview, null, 2)], { type: 'application/json' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `cockpit3d-order-${orderPreview.order_id}.json`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-1.5 px-3 rounded font-semibold"
                        >
                          Download JSON
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🛒</div>
                    <p className="text-gray-400 text-sm">Add items to your cart to preview the Cockpit3D order structure</p>
                    <p className="text-gray-500 text-xs mt-2">This shows exactly what will be sent to Cockpit3D API</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => {
                  const exportData = {
                    timestamp: new Date().toISOString(),
                    systemInfo,
                    steps,
                    cart: JSON.parse(localStorage.getItem('cart') || '[]')
                  }
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `debug-export-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded font-semibold transition-all"
              >
                📥 Export Debug Data
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function debugStep(id: string, label: string, status: 'pending' | 'active' | 'complete' | 'error', data?: any, error?: string) {
  if (typeof window !== 'undefined') {
    const envMode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
    const isDev = envMode === 'development'
    const isTest = envMode === 'testing'
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === 'true'
    
    if (isDev || isTest || hasDebugParam) {
      window.dispatchEvent(new CustomEvent('debug-step', {
        detail: { id, label, status, data, error }
      }))
    }
  }
}
