// app/checkout-hosted/page.tsx
// Stripe Hosted Checkout - Redirects to Stripe's checkout page
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCartWithImages } from '@/lib/cartUtils'
import { logger, isDevelopment } from '@/utils/logger'
import { uploadCustomerImages } from '@/lib/customerImageUpload'

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
        setTimeout(() => router.push('/cart'), 2000)
        return
      }

      logger.info('Initiating Stripe Checkout', { items: cart.length })

      // STEP 1: Upload images to server BEFORE creating checkout session
      logger.info('📤 Uploading customer images to server...')
      console.log('=== CHECKOUT DEBUG ===')
      console.log('Cart items:', cart.length)
      cart.forEach((item, idx) => {
        console.log(`Item ${idx}:`, {
          productId: item.productId,
          hasCustomImage: !!item.customImage,
          dataUrlLength: item.customImage?.dataUrl?.length,
          dataUrlStart: item.customImage?.dataUrl?.substring(0, 50),
          rawImageLength: item.customImage?.rawImageDataUrl?.length
        })
      })
      
      const cartWithServerUrls = await Promise.all(
        cart.map(async (item, idx) => {
          // Check if this item has images in IndexedDB
          if (item.customImage?.dataUrl) {
            console.log(`📤 Uploading images for item ${idx}: ${item.productId}`)
            console.log('  - Masked image length:', item.customImage.dataUrl.length)
            console.log('  - Masked image starts with:', item.customImage.dataUrl.substring(0, 50))
            
            logger.info(`Uploading images for item: ${item.productId}`)
            
            try {
              const uploadResult = await uploadCustomerImages(
                item.customImage.dataUrl, // Masked image from IndexedDB
                item.customImage.rawImageDataUrl, // Raw image from IndexedDB
                item.productId
              )
              
              console.log('  - Upload result:', uploadResult)
              
              if (uploadResult.errors.length > 0) {
                console.error('  - Upload errors:', uploadResult.errors)
                logger.error('Image upload errors:', uploadResult.errors)
              }
              
              // Replace base64 with server URLs
              return {
                ...item,
                maskedImageUrl: uploadResult.maskedUrl,
                rawImageUrl: uploadResult.rawUrl,
                imageUploadErrors: uploadResult.errors
              }
            } catch (error) {
              console.error('  - Upload exception:', error)
              return item
            }
          }
          
          console.log(`⏭️  Item ${idx} has no custom image, skipping upload`)
          return item
        })
      )

      logger.info('✅ Images uploaded, preparing checkout...')
      console.log('=== AFTER UPLOAD ===')
      cartWithServerUrls.forEach((item, idx) => {
        console.log(`Item ${idx}:`, {
          productId: item.productId,
          maskedImageUrl: item.maskedImageUrl,
          rawImageUrl: item.rawImageUrl,
          errors: item.imageUploadErrors
        })
      })

      // Prepare cart items for checkout (now with server URLs)
      const cartForCheckout = cartWithServerUrls.map(item => {
        const { customImage, ...itemWithoutImage } = item as any
        return {
          ...itemWithoutImage,
          customImageId: item.customImageId,
          customImageMetadata: item.customImageMetadata,
          // Include image URLs for webhook/Cockpit3D
          maskedImageUrl: item.maskedImageUrl,
          rawImageUrl: item.rawImageUrl
        }
      })

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      // Create checkout session using PHP backend
      // PHP backend works in all environments (development, test, production)
      // Reads NEXT_PUBLIC_PHP_BACKEND_URL from your local .env file

      const phpBackendUrl = process.env.NEXT_PUBLIC_PHP_BACKEND_URL || 'http://localhost:8888/crystalkeepsakes'
      const apiUrl = `${phpBackendUrl}/api/stripe/create-checkout-session.php`
      
      const payload = {
        cartItems: cartForCheckout,
        subtotal: subtotal,
        orderNumber: `CK-${Date.now()}`
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
                onClick={() => router.push('/cart')}
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
