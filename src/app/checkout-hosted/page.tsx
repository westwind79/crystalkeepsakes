// app/checkout-hosted/page.tsx
// Stripe Hosted Checkout - Redirects to Stripe's checkout page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart } from '@/lib/cartUtils'
import { logger } from '@/utils/logger'

export default function CheckoutHostedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    initiateCheckout()
  }, [])

  async function initiateCheckout() {
    try {
      setLoading(true)
      setError('')

      // Get cart items
      const cart = getCart()
      
      if (!cart || cart.length === 0) {
        setError('Your cart is empty')
        setTimeout(() => router.push('/cart'), 2000)
        return
      }

      logger.info('Initiating Stripe Checkout', { items: cart.length })

      // Prepare cart items for checkout (strip out image data)
      const cartForCheckout = cart.map(item => {
        const { customImage, ...itemWithoutImage } = item as any
        return {
          ...itemWithoutImage,
          customImageId: item.customImageId,
          customImageMetadata: item.customImageMetadata
        }
      })

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      // Create checkout session - Call MAMP PHP backend
      const phpBackendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'http://localhost:8888/crystalkeepsakes'
      const response = await fetch(`${phpBackendUrl}/api/stripe/create-checkout-session.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartForCheckout,
          subtotal: subtotal,
          orderNumber: `CK-${Date.now()}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Checkout session creation failed')
      }

      logger.success('Checkout session created', { sessionId: data.sessionId })

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }

    } catch (err: any) {
      logger.error('Checkout error', err)
      setError(err.message || 'Failed to initiate checkout')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {loading && !error && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Redirecting to Checkout
              </h2>
              <p className="text-gray-600">
                Please wait while we prepare your secure checkout session...
              </p>
            </>
          )}

          {error && (
            <>
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Checkout Error
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/cart')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Cart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
