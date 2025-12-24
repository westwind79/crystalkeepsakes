// app/checkout-hosted/page.tsx
// Stripe Hosted Checkout - Redirects to Stripe's checkout page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCartWithImages } from '@/lib/cartUtils'
import { logger, isDevelopment } from '@/utils/logger'

export default function CheckoutHostedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    initiateCheckout()
  }, [])

  async function initiateCheckout() {
    try {
      setLoading(true)
      setError('')

      // Get cart items WITH images from IndexedDB
      const cart = await getCartWithImages()
      
      if (!cart || cart.length === 0) {
        setError('Your cart is empty')
        // Preserve test path prefix when redirecting
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        const isTestEnv = currentPath.startsWith('/test')
        const cartUrl = isTestEnv ? '/test/cart' : '/cart'
        setTimeout(() => router.push(cartUrl), 2000)
        return
      }

      logger.info('Initiating Stripe Checkout', { items: cart.length })

      // Generate order number ONCE for entire checkout process
      const orderNumber = `CK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
      console.log('🎫 Generated Order Number:', orderNumber)
      localStorage.setItem('pending_order_number', orderNumber)

      // STEP 1: Upload images to server BEFORE creating checkout session
      logger.info('📤 Uploading customer images to server...')
      console.log('=== CHECKOUT DEBUG ===')
      console.log('Cart items:', cart.length)
      console.log('Order number:', orderNumber)
      // ✅ Images should already be uploaded when adding to cart
      // Just use the server URLs that are already stored in customImage
      cart.forEach((item, idx) => {
        console.log(`🔍 Item ${idx} (${item.productId}):`, {
          hasCustomImage: !!item.customImage,
          serverUrl: item.customImage?.serverUrl,
          originalServerUrl: item.customImage?.originalServerUrl,
          tempOrderRef: item.customImage?.tempOrderRef
        })
      })
      
      // Prepare cart items for checkout with server URLs
      const cartForCheckout = cart.map(item => {
        return {
          productId: item.productId,
          cockpit3d_id: item.cockpit3d_id,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          
          // Size & Options for Cockpit3D
          sizeDetails: item.sizeDetails,
          options: item.options,
          customText: item.customText,
          
          // ✅ Use server URLs from cart (already uploaded when adding to cart)
          maskedImageUrl: item.customImage?.serverUrl,
          rawImageUrl: item.customImage?.originalServerUrl,
          customImageMetadata: item.customImageMetadata,
          tempOrderRef: item.customImage?.tempOrderRef,
          
          // Product image (for items without custom images)
          productImage: item.productImage
        }
      })

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      // Create checkout session using PHP backend
      // PHP backend works in all environments (development, test, production)
      // Reads NEXT_PUBLIC_PHP_BACKEND_URL from your local .env file

      const phpBackendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'http://localhost:8888/crystalkeepsakes'
      const apiUrl = `${phpBackendUrl}/api/stripe/create-checkout-session.php`
      
      // Get base path for proper redirect URLs (e.g., /test for test environment)
      // ✅ FIX: Detect test environment from URL path, not just env variable
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const isTestEnv = currentPath.startsWith('/test')
      const basePath = isTestEnv ? '/test' : (process.env.NEXT_PUBLIC_BASE_PATH || '')
      
      // ✅ FIX: Explicitly send the frontend URL for Stripe redirects
      // This ensures correct redirect back to localhost:3000 (not localhost:8888)
      const frontendUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}${basePath}`
        : `http://localhost:3000${basePath}`
      
      console.log('🌐 Checkout URL config:', { currentPath, isTestEnv, basePath, frontendUrl })
      
      const payload = {
        cartItems: cartForCheckout,
        subtotal: subtotal,
        orderNumber: orderNumber, // Use the same order number
        basePath: basePath, // Tell PHP which subdirectory we're in
        frontendUrl: frontendUrl // Explicit frontend URL for Stripe redirects
      }

      logger.info('Making API call', { 
        url: apiUrl,
        environment: process.env.NODE_ENV,
        itemCount: cartForCheckout.length,
        subtotal
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      logger.info('Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      let data
      try {
        const responseText = await response.text()
        logger.info('Raw response', responseText.substring(0, 500))
        data = JSON.parse(responseText)
      } catch (parseError: any) {
        logger.error('Failed to parse response', parseError)
        if (isDevelopment) {
          setDebugInfo({
            url: apiUrl,
            status: response.status,
            statusText: response.statusText,
            responsePreview: await response.text()
          })
        }
        throw new Error(`Server returned invalid JSON. Status: ${response.status}`)
      }

      if (!response.ok) {
        if (isDevelopment) {
          setDebugInfo({
            url: apiUrl,
            status: response.status,
            statusText: response.statusText,
            errorData: data,
            payload: payload
          })
        }
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.success) {
        if (isDevelopment) {
          setDebugInfo({
            url: apiUrl,
            responseData: data,
            payload: payload
          })
        }
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
              
              {isDevelopment && debugInfo && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs max-h-60 overflow-auto">
                  <h3 className="font-bold mb-2 text-gray-900">🔍 Debug Information:</h3>
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
              
              <button
                onClick={() => {
                  // Preserve test path prefix when returning to cart
                  const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
                  const isTestEnv = currentPath.startsWith('/test')
                  router.push(isTestEnv ? '/test/cart' : '/cart')
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
