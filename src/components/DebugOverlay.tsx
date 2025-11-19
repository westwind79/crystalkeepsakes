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

  useEffect(() => {
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

  // Always show debug button
  const showDebug = typeof window !== 'undefined'

  if (!showDebug) return null

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
    window.dispatchEvent(new CustomEvent('debug-step', {
      detail: { id, label, status, data, error }
    }))
  }
}
