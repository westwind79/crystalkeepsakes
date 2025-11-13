// app/checkout/page.tsx
// Version: 3.1.0 | Date: 2025-11-10
// Fixed: Import from correct @/lib/stripe path

'use client'

import { useState, useEffect } from 'react'
import { PaymentElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe, createPaymentIntent, calculateOrderTotals } from '@/lib/stripe'
import { getCart, clearCart, type CartItem } from '@/lib/cartUtils'

// Payment form component
function CheckoutForm({ clientSecret, orderTotals }: { 
  clientSecret: string
  orderTotals: { subtotal: number, shippingCost: number, taxAmount: number, total: number }
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setMessage('Processing payment...')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required'
      })

      if (error) throw error
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment failed')

      setMessage('✅ Payment successful!')
      
      setTimeout(() => {
        clearCart()
        window.location.href = '/order-confirmation?order=' + paymentIntent.id
      }, 2000)

    } catch (err: any) {
      console.error('Payment error:', err)
      setMessage(`❌ Error: ${err.message}`)
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 text-gray-900">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Order Summary</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-900">
              <span>Subtotal:</span>
              <span>${orderTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>
                {orderTotals.shippingCost === 0 ? (
                  <span className="text-green-600">FREE</span>
                ) : (
                  `$${orderTotals.shippingCost.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${orderTotals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>${orderTotals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Payment Details</h3>
          
          <PaymentElement />

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full mt-6 bg-[#8ac644] text-black py-3 rounded font-bold hover:bg-[#7ab534] disabled:bg-gray-400"
          >
            {processing ? 'Processing...' : `Pay $${orderTotals.total.toFixed(2)}`}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-4 text-center">
            Test: 4242 4242 4242 4242 | Any future date | Any CVC
          </p>
        </div>
      </div>
    </form>
  )
}

// Main checkout page
export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    shippingCost: 0,
    taxAmount: 0,
    total: 0
  })
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    email: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US'
  })
  const [addressComplete, setAddressComplete] = useState(false)

  // Calculate totals when cart or shipping changes
  useEffect(() => {
    const cartItems = getCart()
    setCart(cartItems)
    
    if (cartItems.length > 0) {
      const totals = calculateOrderTotals(cartItems, shippingMethod)
      console.log('📊 Order totals calculated:', totals)
      setOrderTotals(totals)
    }
  }, [shippingMethod])

  // Build Cockpit3D order structure from cart
  function buildCockpit3DOrder() {
    console.log('🏗️ Building Cockpit3D order structure')
    
    const items = cart.map(item => {
      const orderItem: any = {
        product_id: item.cockpit3d_id || item.productId,
        quantity: item.quantity,
        options: []
      }

      // Add size option if present
      if (item.options?.size) {
        orderItem.options.push({
          option_id: '151',
          value_id: item.options.size.cockpit3d_id || item.options.size.id,
          name: 'Size',
          value: item.options.size.name
        })
      }

      // Add lightbase option if present and not "none"
      if (item.options?.lightbase && item.options.lightbase.id !== 'none') {
        orderItem.options.push({
          option_id: '152',
          value_id: item.options.lightbase.cockpit3d_id || item.options.lightbase.id,
          name: 'Light Base',
          value: item.options.lightbase.name
        })
      }

      // Add background option if present and not "rm"
      if (item.options?.background && item.options.background.id !== 'rm') {
        orderItem.options.push({
          option_id: item.options.background.cockpit3d_option_id || '154',
          name: item.options.background.name,
          value: 'true'
        })
      }

      // Add text option if present and not "none"
      if (item.options?.text && item.options.text.id !== 'none') {
        orderItem.options.push({
          option_id: item.options.text.cockpit3d_option_id || '199',
          name: 'Customer text',
          value: item.options.text.value || ''
        })
      }

      // Add custom image reference
      if (item.customImageId) {
        orderItem.custom_image = {
          image_id: item.customImageId,
          filename: item.customImageMetadata?.filename || 'custom.jpg'
        }
      }

      return orderItem
    })

    console.log('📦 Cockpit3D order items:', items)

    return {
      items: items,
      shipping_address: shippingAddress,
      customer_email: shippingAddress.email,
      customer_name: shippingAddress.name
    }
  }

  // Initialize payment
  useEffect(() => {
    async function initializePayment() {
      try {
        if (!cart.length) {
          setError('Cart is empty')
          setLoading(false)
          return
        }

        // Check if address is complete
        if (!addressComplete) {
          console.log('⏳ Waiting for shipping address...')
          return
        }

        console.log('🛒 Creating payment intent with PHP backend')
        console.log('Totals:', orderTotals)
        console.log('Shipping address:', shippingAddress)

        const cockpitOrder = buildCockpit3DOrder()

        // This calls PHP: create-payment-intent.php
        const result = await createPaymentIntent(
          cart, 
          shippingMethod,
          cart,
          `ORD-${Date.now()}`,
          cockpitOrder
        )
        
        console.log('✅ Payment intent created:', result.orderNumber)
        setClientSecret(result.clientSecret)
        setLoading(false)

      } catch (err: any) {
        console.error('❌ Payment setup failed:', err)
        setError(err.message || 'Failed to initialize payment')
        setLoading(false)
      }
    }

    if (cart.length > 0 && orderTotals.total > 0 && addressComplete) {
      initializePayment()
    }
  }, [cart, orderTotals, addressComplete])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto p-6 bg-red-50 rounded">
          <p className="text-red-800">❌ {error}</p>
          <a href="/cart" className="text-blue-600 underline mt-4 block">
            Return to cart
          </a>
        </div>
      </div>
    )
  }

  if (loading || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-slate-900">
        <div className="max-w-3xl mx-auto">
          
          {/* Shipping Address Form */}
          <div className="bg-white p-6 rounded shadow mb-6 ">
            <h2 className="text-xl font-bold mb-4 text-slate-900">Shipping Address</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={shippingAddress.email}
                  onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={shippingAddress.line1}
                  onChange={(e) => setShippingAddress({...shippingAddress, line1: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={shippingAddress.line2}
                  onChange={(e) => setShippingAddress({...shippingAddress, line2: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input
                  type="text"
                  value={shippingAddress.state}
                  onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Zip Code *</label>
                <input
                  type="text"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>
            
            <button
              onClick={() => {
                // Validate required fields
                if (shippingAddress.name && shippingAddress.email && shippingAddress.phone &&
                    shippingAddress.line1 && shippingAddress.city && shippingAddress.state && 
                    shippingAddress.postal_code) {
                  setAddressComplete(true)
                  console.log('✅ Shipping address complete')
                } else {
                  alert('Please fill in all required fields')
                }
              }}
              className="mt-4 w-full bg-[#8ac644] text-black py-3 rounded font-bold hover:bg-[#7ab534]"
            >
              Continue to Payment
            </button>
          </div>

          {/* Shipping Selection */}
          {addressComplete && (
            <div className="bg-white p-6 rounded shadow mb-6">
              <h2 className="text-xl font-bold mb-4 text-slate-900">Shipping Method</h2>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Standard Shipping</div>
                  <div className="text-sm text-gray-600">5-7 business days</div>
                </div>
                <div className="font-bold">
                  {orderTotals.subtotal >= 100 ? 'FREE' : '$5.00'}
                </div>
              </label>

              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shipping"
                  value="priority"
                  checked={shippingMethod === 'priority'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Priority Shipping</div>
                  <div className="text-sm text-gray-600">2-3 business days</div>
                </div>
                <div className="font-bold">$10.00</div>
              </label>

              <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium">Express Shipping</div>
                  <div className="text-sm text-gray-600">1-2 business days</div>
                </div>
                <div className="font-bold">$15.00</div>
              </label>
            </div>

            {orderTotals.subtotal >= 100 && (
              <div className="mt-4 p-3 bg-green-50 text-green-800 rounded text-sm">
                🎉 You qualify for free standard shipping!
              </div>
            )}
            </div>
          )}

          {/* Loading Payment */}
          {addressComplete && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-4">Setting up payment...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Hero Section */}      
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">Checkout</h1>
          <p className="lead">Complete your order</p>
        </div>
      </section>

      <Elements stripe={getStripe()} options={{ clientSecret }}>
        <CheckoutForm clientSecret={clientSecret} orderTotals={orderTotals} />
      </Elements>
    </div>
  )
}