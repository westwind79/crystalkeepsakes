// app/checkout/page.tsx
// V3.0 - Stripe Hosted Checkout (stripe.com)
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, type CartItem } from '@/lib/cartUtils'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingCheckout, setProcessingCheckout] = useState(false)
  const [error, setError] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  useEffect(() => {
    const loadCart = async () => {
      const items = await getCart()
      setCart(items)
      setLoading(false)
    }
    loadCart()
  }, [])

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.price || item.totalPrice || 0
      return sum + (itemPrice * item.quantity)
    }, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    setProcessingCheckout(true)
    setError('')

    try {
      const orderNumber = `CK-${Date.now()}`
      const subtotal = calculateSubtotal()

      // Call PHP to create Stripe Checkout Session
      const response = await fetch('http://localhost:8888/crystalkeepsakes/api/stripe/create-checkout-session.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartItems: cart,
          orderNumber,
          subtotal,
          customerEmail: customerEmail || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      console.log('✅ Redirecting to Stripe Checkout:', data.url)
      window.location.href = data.url

    } catch (err: any) {
      console.error('❌ Checkout error:', err)
      setError(err.message || 'Failed to start checkout')
      setProcessingCheckout(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-text-primary">Loading cart...</div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Your cart is empty</h2>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()

  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Checkout</h1>

        {/* Cart Summary */}
        <div className="bg-dark-surface border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start pb-4 border-b border-gray-700 last:border-0">
                <div className="flex-1">
                  <h3 className="text-text-primary font-medium">{item.name}</h3>
                  <p className="text-text-secondary text-sm">Quantity: {item.quantity}</p>
                  {item.sizeDetails && (
                    <p className="text-text-tertiary text-xs">{item.sizeDetails.name}</p>
                  )}
                </div>
                <div className="text-text-primary font-semibold ml-4">
                  ${((item.price || item.totalPrice || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-secondary text-sm">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-text-secondary text-sm">
              <span>Tax</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-text-primary font-bold text-lg border-t border-gray-700 pt-2 mt-2">
              <span>Total (estimated)</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Optional Email */}
        <div className="bg-dark-surface border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Contact Information</h2>
          <div className="mb-4">
            <label className="block text-text-secondary text-sm mb-2">
              Email (optional - for order updates)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-text-primary focus:border-brand-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Checkout Info */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-blue-400 font-semibold mb-2">🔒 Secure Checkout</h3>
          <p className="text-text-secondary text-sm mb-3">
            You will be redirected to Stripe's secure checkout page where you can:
          </p>
          <ul className="text-text-secondary text-sm space-y-1 list-disc list-inside">
            <li>Enter your shipping address</li>
            <li>Choose shipping speed (3-5 days, 5-7 days, etc.)</li>
            <li>Apply coupon codes (like TAPS)</li>
            <li>Enter payment information securely</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={processingCheckout || cart.length === 0}
          className="w-full py-4 px-6 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-lg rounded-lg transition-colors shadow-lg hover:shadow-brand-500/50"
        >
          {processingCheckout ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            `Proceed to Secure Checkout → $${subtotal.toFixed(2)}`
          )}
        </button>

        {/* Back to Cart */}
        <div className="text-center mt-6">
          <Link
            href="/cart"
            className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
          >
            ← Back to Cart
          </Link>
        </div>
      </div>
    </div>
  )
}
