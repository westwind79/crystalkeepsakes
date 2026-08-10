// app/order-confirmation/page.tsx
// Order confirmation page after successful Stripe Checkout
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clearCart } from '@/lib/cartUtils'
import { getCurrentOrderSession, markOrderCompleted, clearOrderSession } from '@/lib/unifiedOrderId'
import { logger } from '@/utils/logger'

type SafeOrderInfo = {
  success?: boolean
  order?: {
    order_number?: string
    order_timestamp?: number | null
    order_date?: string | null
    status?: string
    payment_status?: string
    created_at?: string | null
  }
  stripe?: {
    session_id?: string
    payment_intent_id?: string | null
    payment_status?: string
    amount_total?: number | null
    amount_subtotal?: number | null
    amount_shipping?: number | null
    amount_tax?: number | null
    amount_discount?: number | null
    currency?: string
    mode?: string
  }
  line_items?: Array<{
    description?: string
    quantity?: number
    amount_total?: number | null
    amount_subtotal?: number | null
  }>
  fulfillment?: {
    order_data_saved?: boolean
    order_data_created_at?: string | null
    webhook_expected?: boolean
    external_order_status?: string
  }
  debug?: {
    environment?: string
    timestamp?: number
    privacy?: string
  }
  error?: string
}

type OrderDetails = {
  orderNumber: string
  sessionId: string
  status: string
  message: string
  info: SafeOrderInfo | null
}

function formatMoney(cents?: number | null, currency = 'usd') {
  if (typeof cents !== 'number') return 'Pending'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

function formatDate(value?: string | number | null) {
  if (!value) return 'Pending'

  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Pending'

  return date.toLocaleString()
}

function formatOrderTimestamp(orderNumber?: string) {
  const match = orderNumber?.match(/CK_\d+_(\d+)/)
  if (!match) return null

  return formatDate(Number(match[1]) / 1000)
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800">
      {children}
    </span>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className={mono ? 'mt-1 break-all font-mono text-sm text-gray-900' : 'mt-1 text-base font-semibold text-gray-900'}>
        {value}
      </dd>
    </div>
  )
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      setError('No Stripe session ID was found for this confirmation page.')
      setLoading(false)
    }
  }, [sessionId])

  async function verifyPayment(stripeSessionId: string) {
    try {
      setLoading(true)
      logger.info('Verifying payment session', { sessionId: stripeSessionId })

      let orderNumber = getCurrentOrderSession()?.orderId

      if (!orderNumber) {
        orderNumber = localStorage.getItem('pending_order_number') || undefined
      }

      let safeOrderInfo: SafeOrderInfo | null = null

      try {
        const phpBackendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'http://crystalkeepsakes:8888'
        const debugResponse = await fetch(`${phpBackendUrl}/api/stripe/verify-session-debug.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: stripeSessionId }),
        })

        safeOrderInfo = await debugResponse.json()

        if (!debugResponse.ok || safeOrderInfo?.success === false) {
          throw new Error(safeOrderInfo?.error || 'Stripe session verification failed')
        }

        orderNumber = safeOrderInfo?.order?.order_number || orderNumber
      } catch (verificationError) {
        logger.warn('Could not fetch safe Stripe order details', verificationError)
      }

      if (!orderNumber) {
        orderNumber = `CK_FALLBACK_${Date.now()}`
        logger.warn('No unified order ID found for confirmation page', { orderNumber })
      }

      setOrderDetails({
        orderNumber,
        sessionId: stripeSessionId,
        status: 'complete',
        message: 'Your order has been confirmed.',
        info: safeOrderInfo,
      })

      await clearCart()
      sessionStorage.removeItem('pendingOrder')
      localStorage.removeItem('pending_order_number')

      markOrderCompleted(orderNumber)
      clearOrderSession()

      logger.success('Order confirmed, cart and local session cleared')
      setLoading(false)
    } catch (err: any) {
      logger.error('Payment verification error', err)
      setError(err.message || 'Failed to verify payment')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50">
        <div className="mx-auto w-full max-w-md p-6">
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600"></div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Confirming Your Order</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50">
        <div className="mx-auto w-full max-w-md p-6">
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-red-500">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">Verification Error</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link href="/products" className="inline-block rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const info = orderDetails?.info
  const stripe = info?.stripe
  const fulfillment = info?.fulfillment
  const currency = stripe?.currency || 'usd'
  const createdAt = info?.order?.created_at || info?.order?.order_date || formatOrderTimestamp(orderDetails?.orderNumber)

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-purple-50">
      <div className="mx-auto max-w-4xl p-6 py-12">
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Order Confirmed</h1>
            <p className="text-lg text-gray-600">Your payment was received and your order is queued for fulfillment review.</p>
          </div>

          {orderDetails && (
            <section className="mb-8">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
              </div>

              <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoRow label="Order Number" value={orderDetails.orderNumber} />
                <InfoRow label="Order Total" value={formatMoney(stripe?.amount_total, currency)} />
                <InfoRow label="Received" value={formatDate(createdAt)} />
                <InfoRow
                  label="Fulfillment"
                  value={fulfillment?.order_data_saved ? 'Order data saved for review' : 'Waiting for review'}
                />
              </dl>
            </section>
          )}

          {info?.line_items && info.line_items.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Items</h2>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {info.line_items.map((item, index) => (
                  <div key={`${item.description}-${index}`} className="flex flex-col gap-2 border-b border-gray-200 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.description || 'Crystal Keepsake item'}</p>
                      <p className="text-sm text-gray-600">Qty {item.quantity || 1}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatMoney(item.amount_total, currency)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-gray-900">Technical References</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-700">Stripe Session ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-gray-700">{orderDetails?.sessionId}</dd>
                <p className="mt-1 text-gray-600">This is Stripe's Checkout session reference. It is useful for payment lookup, but it is not the customer-facing order number.</p>
              </div>
              {stripe?.payment_intent_id && (
                <div>
                  <dt className="font-medium text-gray-700">Payment Intent</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-gray-700">{stripe.payment_intent_id}</dd>
                </div>
              )}
              {stripe?.amount_subtotal !== undefined && (
                <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
                  <p><span className="font-medium text-gray-700">Subtotal:</span> {formatMoney(stripe.amount_subtotal, currency)}</p>
                  <p><span className="font-medium text-gray-700">Shipping:</span> {formatMoney(stripe.amount_shipping, currency)}</p>
                  <p><span className="font-medium text-gray-700">Tax:</span> {formatMoney(stripe.amount_tax, currency)}</p>
                </div>
              )}
            </dl>
          </section>

          <section className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-gray-900">Privacy</h2>
            <p className="text-sm text-gray-700">
              This page intentionally does not display or keep name, email, phone, or shipping address. Stripe handles payment/customer details, and fulfillment receives required order data server-side.
            </p>
          </section>

          <section className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h2 className="mb-3 font-bold text-gray-900">What happens next?</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>Your confirmation email will be sent shortly.</li>
              <li>Your engraving image and order details are queued for production review.</li>
              <li>Shipping updates will be sent by email when available.</li>
              <li>For help, contact orders@crystalkeepsakes.com and include your order number.</li>
            </ul>
          </section>

          {info && process.env.NODE_ENV === 'development' && (
            <details className="mb-8 rounded-lg border border-gray-300 bg-gray-50 p-4">
              <summary className="cursor-pointer font-bold text-gray-900 hover:text-blue-600">Safe Debug Info</summary>
              <pre className="mt-4 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-green-400">
                {JSON.stringify(info, null, 2)}
              </pre>
            </details>
          )}

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/products" className="rounded-lg bg-[var(--brand-500)] px-8 py-3 text-center font-medium text-white transition-colors hover:bg-[var(--brand-400)]">
              Continue Shopping
            </Link>
            <Link href="/" className="rounded-lg bg-gray-200 px-8 py-3 text-center font-medium text-gray-900 transition-colors hover:bg-gray-300">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50">
        <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
