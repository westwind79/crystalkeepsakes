// app/order-confirmation/page.tsx
// Order confirmation page after successful Stripe Checkout
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { clearCart } from '@/lib/cartUtils'
import { logger } from '@/utils/logger'

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId)
    } else {
      setError('No session ID found')
      setLoading(false)
    }
  }, [sessionId])

  async function verifyPayment(sessionId: string) {
    try {
      setLoading(true)
      
      logger.info('Verifying payment and processing order', { sessionId })
      console.log('🔍 [ORDER CONFIRMATION] Starting verification for session:', sessionId)

      // Get pending order data from sessionStorage
      let pendingOrder: any = null
      try {
        const storedOrder = sessionStorage.getItem('pendingOrder')
        if (storedOrder) {
          pendingOrder = JSON.parse(storedOrder)
          console.log('📥 [ORDER CONFIRMATION] Retrieved Pending Order:', {
            orderNumber: pendingOrder.orderNumber,
            itemCount: pendingOrder.cartItems?.length,
            customer: pendingOrder.customer,
            hasShippingInfo: !!pendingOrder.shippingInfo
          })
          logger.info('Retrieved pending order', { orderNumber: pendingOrder.orderNumber })
        }
      } catch (e) {
        console.warn('⚠️ [ORDER CONFIRMATION] No pending order found in sessionStorage')
        logger.warn('No pending order found in sessionStorage')
      }

      // Generate order number
      const orderNumber = pendingOrder?.orderNumber || `CK-${Date.now()}`
      console.log('🔢 [ORDER CONFIRMATION] Order Number:', orderNumber)
      
      // Process the order (Cockpit3D + Email)
      if (pendingOrder && pendingOrder.cartItems && pendingOrder.cartItems.length > 0) {
        try {
          const orderPayload = {
            orderNumber,
            cartItems: pendingOrder.cartItems,
            customer: pendingOrder.customer,
            shippingInfo: pendingOrder.shippingInfo,
            paymentIntentId: sessionId,
            stripeSessionId: sessionId,
            receipt_email: pendingOrder.receipt_email
          }
          
          console.log('📤 [ORDER CONFIRMATION] Sending to /api/process-order')
          console.log('📤 [ORDER CONFIRMATION] Payload:', JSON.stringify(orderPayload, null, 2))
          logger.info('Processing order with Cockpit3D and email notification')
          
          const processResponse = await fetch('/api/process-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
          })

          const processResult = await processResponse.json()
          console.log('📨 [ORDER CONFIRMATION] API Response:', JSON.stringify(processResult, null, 2))
          logger.info('Order processing result', processResult)

          if (!processResult.success) {
            logger.warn('Order processing had issues', processResult)
          } else {
            logger.success('Order processed successfully', {
              orderNumber,
              cockpit3d: processResult.cockpit3d?.submitted,
              email: processResult.email?.sent
            })
          }

        } catch (processError: any) {
          logger.error('Order processing failed', processError)
          // Continue anyway - order was paid
        }
      }

      // Set order details for display
      setOrderDetails({
        orderNumber,
        sessionId: sessionId,
        status: 'complete',
        message: 'Your order has been confirmed!'
      })
      
      // Clear the cart and sessionStorage after successful order
      await clearCart()
      sessionStorage.removeItem('pendingOrder')
      logger.success('Order confirmed, cart cleared')
      
      setLoading(false)
      
    } catch (err: any) {
      logger.error('Payment verification error', err)
      setError(err.message || 'Failed to verify payment')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Confirming Your Order
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Verification Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-3xl mx-auto p-6 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your purchase
            </p>
          </div>

          {/* Order Details */}
          {orderDetails && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Order Number</p>
                  <p className="font-semibold text-gray-900">{orderDetails.orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Session ID</p>
                  <p className="font-mono text-xs text-gray-600">{orderDetails.sessionId}</p>
                </div>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>You'll receive an order confirmation email shortly</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Your custom crystal will be carefully crafted</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>We'll send shipping updates to your email</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
            >
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
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  )
}
