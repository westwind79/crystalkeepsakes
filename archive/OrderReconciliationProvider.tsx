/**
 * OrderReconciliationProvider
 * @version 1.0.0
 * @date 2025-01-08
 * @description Client component to auto-fix order ID mismatches
 */

'use client'

import { useOrderReconciliationSilent } from '@/hooks/useOrderReconciliation'

/**
 * Provider that auto-reconciles order IDs on mount
 * Add to root layout to run on every page
 */
export default function OrderReconciliationProvider() {
  useOrderReconciliationSilent()
  return null
}