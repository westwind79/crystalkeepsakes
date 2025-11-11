/**
 * Stripe payment processing with Shipping Support
 * @version 2.1.0
 * @date 2025-11-08
 * @description Added shipping calculation and better total handling
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'
import { logger } from '@/utils/logger'
import { CartItem } from '@/lib/cartUtils'

// Get the correct publishable key based on environment
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_ENV_MODE === 'production'
  ? process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY!
  : process.env.NEXT_PUBLIC_STRIPE_DEVELOPMENT_PUBLISHABLE_KEY!

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.error('❌ Stripe publishable key not found!')
      console.error('Mode:', process.env.NEXT_PUBLIC_ENV_MODE)
      throw new Error('Stripe publishable key not configured')
    }
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
    console.log('✅ Stripe initialized:', process.env.NEXT_PUBLIC_ENV_MODE)
  }
  return stripePromise
}

/**
 * Shipping calculation based on cart total
 * You can customize these rates
 */
export function calculateShipping(subtotal: number, shippingMethod?: string): number {
  // Free shipping over $100
  if (subtotal >= 100) {
    return 0
  }
  
  // Shipping methods
  switch (shippingMethod) {
    case 'express':
      return 15.00
    case 'priority':
      return 10.00
    case 'standard':
    default:
      return 5.00
  }
}

/**
 * Tax calculation (customize for your state/country)
 */
export function calculateTax(subtotal: number, shippingCost: number): number {
  // Example: 8.5% sales tax
  const TAX_RATE = 0.085
  return (subtotal + shippingCost) * TAX_RATE
}

/**
 * Calculate complete order totals
 */
export function calculateOrderTotals(
  cartItems: CartItem[], 
  shippingMethod: string = 'standard'
) {
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  )
  
  const shippingCost = calculateShipping(subtotal, shippingMethod)
  const taxAmount = calculateTax(subtotal, shippingCost)
  const total = subtotal + shippingCost + taxAmount
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    shippingCost: Number(shippingCost.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

/**
 * Get PHP endpoint URL
 */
function getPhpEndpoint(): string {
  const mode = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
  
  if (mode === 'development') {
    const port = process.env.NEXT_PUBLIC_MAMP_PORT || '8888'
    return `http://localhost:${port}/crystalkeepsakes/api/stripe/create-payment-intent.php`
  }
  
  return '/api/stripe/create-payment-intent.php'
}

/**
 * Create payment intent with shipping
 */
export async function createPaymentIntent(
  cartItems: CartItem[],
  shippingMethod: string = 'standard',
  fullCartItems?: CartItem[],
  orderNumber?: string,
  cockpitOrder?: any
) {
  logger.payment('creating intent', { 
    orderNumber,
    itemCount: cartItems.length,
    shippingMethod 
  })

  try {
    const endpoint = getPhpEndpoint()
    
    // Calculate all totals (frontend does this for display)
    const totals = calculateOrderTotals(cartItems, shippingMethod)
    
    logger.payment('Order totals', totals)

    // Send to PHP - PHP will VERIFY these amounts
    const requestBody = {
      cartItems: cartItems.map(item => ({
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        options: item.options
      })),
      cockpitOrder, 
      fullCartItems: fullCartItems || cartItems,
      orderNumber: orderNumber || `ORD-${Date.now()}`,
      shippingMethod: shippingMethod,
      // Send calculated totals (PHP will verify)
      subtotal: totals.subtotal,
      shippingCost: totals.shippingCost,
      taxAmount: totals.taxAmount,
      total: totals.total
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Payment intent failed', { 
        status: response.status, 
        error: errorText 
      })
      throw new Error(`Payment intent creation failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Payment intent creation failed')
    }
    
    logger.payment('intent created', { 
      orderNumber: data.order_number,
      amount: data.amount
    })
    
    return {
      clientSecret: data.clientSecret,
      orderNumber: data.order_number,
      amount: data.amount
    }
  } catch (error) {
    logger.error('Payment intent failed', error)
    throw error
  }
}

export async function confirmPayment(
  clientSecret: string,
  paymentMethod: any
) {
  logger.payment('confirming', { clientSecret })

  const stripe = await getStripe()
  if (!stripe) {
    throw new Error('Stripe not initialized')
  }

  try {
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: paymentMethod }
    )

    if (error) {
      logger.error('Payment confirmation failed', error)
      throw error
    }

    logger.payment('confirmed', { id: paymentIntent?.id })
    return paymentIntent
  } catch (error) {
    logger.error('Payment error', error)
    throw error
  }
}