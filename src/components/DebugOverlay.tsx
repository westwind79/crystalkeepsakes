'use client'

import { useState, useEffect } from 'react'

interface DebugStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'complete' | 'error'
  data?: any
  timestamp?: string
  error?: string
}

export default function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [steps, setSteps] = useState<DebugStep[]>([])
  const [mounted, setMounted] = useState(false)
  const [shouldShowDebug, setShouldShowDebug] = useState(false)

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
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 text-white shadow-2xl z-40 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Debug</h2>
              <button
                onClick={() => setSteps([])}
                className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
              >
                Clear
              </button>
            </div>

            {/* Environment Info */}
            <div className="mb-4 p-3 bg-gray-800 rounded text-xs space-y-1">
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
                    <pre className="bg-black/30 p-2 rounded mt-1 overflow-x-auto text-[10px]">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
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
