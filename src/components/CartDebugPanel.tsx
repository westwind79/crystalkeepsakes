'use client'

import { useState, useEffect } from 'react'
import { getCart, getCartWithImages } from '@/lib/cartUtils'

export default function CartDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      refreshData()
    }
  }, [isOpen])

  const refreshData = async () => {
    const cartData = getCart()
    const cartWithImages = await getCartWithImages()
    
    // Get localStorage info
    const localStorageData: Record<string, any> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          const value = localStorage.getItem(key)
          localStorageData[key] = value ? JSON.parse(value) : value
        } catch {
          localStorageData[key] = localStorage.getItem(key)
        }
      }
    }

    // Get cookies
    const cookies = document.cookie.split(';').reduce((acc: Record<string, string>, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key) acc[key] = decodeURIComponent(value || '')
      return acc
    }, {})

    // Get IndexedDB info
    let indexedDBInfo: any = {}
    try {
      const dbs = await indexedDB.databases()
      indexedDBInfo = {
        databases: dbs.map(db => ({ name: db.name, version: db.version })),
        count: dbs.length
      }
    } catch (e) {
      indexedDBInfo = { error: 'Could not access IndexedDB' }
    }

    // Calculate storage sizes
    const localStorageSize = new Blob([JSON.stringify(localStorage)]).size
    
    setData({
      cart: {
        itemCount: cartData.length,
        items: cartData,
        withImages: cartWithImages,
        totalValue: cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      },
      storage: {
        localStorage: {
          size: `${(localStorageSize / 1024).toFixed(2)} KB`,
          itemCount: localStorage.length,
          data: localStorageData
        },
        cookies: {
          count: Object.keys(cookies).length,
          data: cookies
        },
        indexedDB: indexedDBInfo
      },
      session: {
        pendingOrder: sessionStorage.getItem('pendingOrder') ? JSON.parse(sessionStorage.getItem('pendingOrder')!) : null,
        pendingOrderNumber: localStorage.getItem('pending_order_number')
      },
      environment: {
        mode: process.env.NEXT_PUBLIC_ENV_MODE,
        backend: process.env.NEXT_PUBLIC_PHP_BACKEND_URL,
        nodeEnv: process.env.NODE_ENV
      },
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    })
  }

  if (!mounted) return null

  // Only show in development
  if (process.env.NEXT_PUBLIC_ENV_MODE !== 'development' && !window.location.search.includes('debug=true')) {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 font-mono text-sm flex items-center gap-2"
      >
        🛒 Cart Debug
        {data?.cart?.itemCount > 0 && (
          <span className="bg-white text-purple-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {data.cart.itemCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-gray-900 text-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-purple-600 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">🛒 Cart Debug Panel</h2>
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-4 space-y-4">
              {data ? (
                <>
                  {/* Cart Summary */}
                  <section className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-purple-400">🛒 Cart Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Items</p>
                        <p className="text-2xl font-bold">{data.cart.itemCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Value</p>
                        <p className="text-2xl font-bold">${data.cart.totalValue.toFixed(2)}</p>
                      </div>
                    </div>
                  </section>

                  {/* Cart Items Detail */}
                  {data.cart.items.length > 0 && (
                    <section className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-purple-400">📦 Cart Items</h3>
                      <div className="space-y-3">
                        {data.cart.items.map((item: any, idx: number) => (
                          <details key={idx} className="bg-gray-700 rounded p-3">
                            <summary className="cursor-pointer font-semibold hover:text-purple-400">
                              {item.name || item.productId} - ${item.price} x {item.quantity}
                            </summary>
                            <pre className="text-xs mt-2 bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Storage Info */}
                  <section className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-green-400">💾 Storage Info</h3>
                    
                    {/* localStorage */}
                    <details className="mb-3">
                      <summary className="cursor-pointer font-semibold hover:text-green-400 mb-2">
                        📁 localStorage ({data.storage.localStorage.size}, {data.storage.localStorage.itemCount} items)
                      </summary>
                      <div className="space-y-2 mt-2">
                        {Object.entries(data.storage.localStorage.data).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-gray-700 rounded p-2">
                            <p className="text-xs text-green-400 font-mono">{key}</p>
                            <pre className="text-xs mt-1 bg-gray-900 p-2 rounded overflow-x-auto max-h-40">
                              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Cookies */}
                    <details className="mb-3">
                      <summary className="cursor-pointer font-semibold hover:text-green-400 mb-2">
                        🍪 Cookies ({data.storage.cookies.count})
                      </summary>
                      <div className="space-y-1 mt-2">
                        {Object.entries(data.storage.cookies.data).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-gray-700 rounded p-2 text-xs font-mono">
                            <span className="text-green-400">{key}</span> = {String(value)}
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* IndexedDB */}
                    <details>
                      <summary className="cursor-pointer font-semibold hover:text-green-400 mb-2">
                        🗄️ IndexedDB ({data.storage.indexedDB.count || 0} databases)
                      </summary>
                      <pre className="text-xs mt-2 bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(data.storage.indexedDB, null, 2)}
                      </pre>
                    </details>
                  </section>

                  {/* Session Info */}
                  {(data.session.pendingOrder || data.session.pendingOrderNumber) && (
                    <section className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-3 text-yellow-400">🔄 Session Info</h3>
                      
                      {data.session.pendingOrderNumber && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-400">Pending Order Number</p>
                          <p className="font-mono text-lg">{data.session.pendingOrderNumber}</p>
                        </div>
                      )}
                      
                      {data.session.pendingOrder && (
                        <details>
                          <summary className="cursor-pointer font-semibold hover:text-yellow-400">
                            Pending Order Data
                          </summary>
                          <pre className="text-xs mt-2 bg-gray-900 p-2 rounded overflow-x-auto">
                            {JSON.stringify(data.session.pendingOrder, null, 2)}
                          </pre>
                        </details>
                      )}
                    </section>
                  )}

                  {/* Environment */}
                  <section className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-blue-400">🌐 Environment</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Mode</p>
                        <p className="font-mono">{data.environment.mode}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Node Env</p>
                        <p className="font-mono">{data.environment.nodeEnv}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400">Backend URL</p>
                        <p className="font-mono text-xs">{data.environment.backend}</p>
                      </div>
                    </div>
                  </section>

                  {/* Browser Info */}
                  <section className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-cyan-400">🌍 Browser Info</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-400">Platform</p>
                        <p className="font-mono">{data.browser.platform}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Language</p>
                        <p className="font-mono">{data.browser.language}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Cookies Enabled</p>
                        <p className="font-mono">{data.browser.cookiesEnabled ? '✅ Yes' : '❌ No'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Online</p>
                        <p className="font-mono">{data.browser.onLine ? '✅ Yes' : '❌ No'}</p>
                      </div>
                    </div>
                  </section>

                  {/* Quick Actions */}
                  <section className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-3 text-red-400">⚡ Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          localStorage.clear()
                          sessionStorage.clear()
                          refreshData()
                          alert('Storage cleared!')
                        }}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        🗑️ Clear All Storage
                      </button>
                      <button
                        onClick={() => {
                          console.log('Cart Debug Data:', data)
                          alert('Debug data logged to console!')
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                      >
                        📋 Log to Console
                      </button>
                      <button
                        onClick={() => {
                          const dataStr = JSON.stringify(data, null, 2)
                          navigator.clipboard.writeText(dataStr)
                          alert('Debug data copied to clipboard!')
                        }}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                      >
                        📋 Copy to Clipboard
                      </button>
                    </div>
                  </section>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">Click Refresh to load data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
