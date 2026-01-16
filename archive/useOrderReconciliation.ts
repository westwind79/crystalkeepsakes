/**
 * useOrderReconciliation Hook
 * @version 1.0.0
 * @date 2025-01-08
 * @description Auto-fixes order ID mismatches on mount
 */

'use client'

import { useEffect, useState } from 'react'
import { reconcileOrderIds, checkOrderIdHealth } from '@/lib/orderReconciliation'

interface ReconciliationState {
  checked: boolean
  hadIssues: boolean
  fixedOrderId: string | null
  details: string
}

/**
 * Hook to automatically reconcile order IDs on component mount
 * 
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const reconciliation = useOrderReconciliation()
 *   
 *   if (reconciliation.hadIssues) {
 *     console.log('Fixed order ID:', reconciliation.fixedOrderId)
 *   }
 *   
 *   return <div>...</div>
 * }
 * ```
 */
export function useOrderReconciliation(): ReconciliationState {
  const [state, setState] = useState<ReconciliationState>({
    checked: false,
    hadIssues: false,
    fixedOrderId: null,
    details: 'Not checked yet'
  })

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return

    // Check health first
    const health = checkOrderIdHealth()
    
    if (!health.healthy) {
      console.warn('⚠️ [ORDER HEALTH] Issues detected:', health.issues)
      
      // Auto-fix
      const result = reconcileOrderIds()
      
      setState({
        checked: true,
        hadIssues: true,
        fixedOrderId: result.fixedOrderId,
        details: result.details
      })
      
      console.log('✅ [ORDER HEALTH] Auto-fixed:', result)
    } else {
      setState({
        checked: true,
        hadIssues: false,
        fixedOrderId: null,
        details: 'No issues found'
      })
      
      console.log('✅ [ORDER HEALTH] All good!')
    }
  }, []) // Run once on mount

  return state
}

/**
 * Silent version - just fixes without returning state
 * Use in layouts or providers
 */
export function useOrderReconciliationSilent(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const health = checkOrderIdHealth()
    if (!health.healthy) {
      reconcileOrderIds()
    }
  }, [])
}