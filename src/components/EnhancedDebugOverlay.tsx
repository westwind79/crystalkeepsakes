'use client'

import { useState, useEffect } from 'react'
import { getImageStorageStats, checkStorageHealth } from '@/lib/cartUtils'

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
  const [activeTab, setActiveTab] = useState<'steps' | 'system' | 'storage' | 'cart'>('steps')
  const [autoRefresh, setAutoRefresh] = useState(false)

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
