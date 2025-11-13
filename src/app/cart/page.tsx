// app/cart/page-new.tsx
// Version: 4.0.0 - 2025-11-12 - COMPLETE CART OVERHAUL
// ✅ Itemized breakdown of ALL options with individual prices
// ✅ Custom text display as separate line item with price
// ✅ Display BOTH raw uploaded image AND final masked image side-by-side
// ✅ Better visual hierarchy and pricing transparency

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { 
  getCart,
  getCartWithImages, 
  removeFromCart, 
  clearCart, 
  getCartTotal,
  getImageStorageStats,
  saveCart
} from '@/lib/cartUtils'
import { logger } from '@/utils/logger'

// Type interface
interface CartItem {
  productId: string
  name: string
  sku: string
  basePrice?: number
  optionsPrice?: number
  price: number
  totalPrice?: number
  quantity: number
  options: any
  sizeDetails?: any
  customImage?: {
    dataUrl: string // Masked image for Cockpit3D
    thumbnail: string // Masked thumbnail
    rawImageDataUrl?: string // Original uploaded image
    rawImageThumbnail?: string // Original thumbnail
    metadata: any
  }
  customImageMetadata?: {
    filename?: string
    maskName?: string
    hasImage: boolean
  }
  customText?: {
    text?: string
    line1?: string
    line2?: string
  }
  productImage?: string
  cockpit3d_id?: string
  dateAdded: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [total, setTotal] = useState(0)

  const loadCart = async () => {
    try {
      setLoading(true)
      const cartWithImages = await getCartWithImages()
      setCart(cartWithImages)
      
      // Calculate total
      const sum = cartWithImages.reduce((acc, item) => {
        const itemPrice = item.price || item.totalPrice || 0
        return acc + (itemPrice * item.quantity)
      }, 0)
      setTotal(sum)
      
      // Storage stats
      const stats = await getImageStorageStats()
      setStorageStats(stats)
      
      logger.info('Cart loaded with images', {
        items: cartWithImages.length,
        withImages: cartWithImages.filter(item => item.customImage).length
      })
    } catch (error) {
      logger.error('Failed to load cart', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()

    const handleCartUpdate = () => {
      loadCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  const handleRemoveItem = async (index: number) => {
    setRemoving(index)
    try {
      await removeFromCart(index)
      await loadCart()
      logger.success('Item removed from cart')
    } catch (error) {
      logger.error('Failed to remove item', error)
    } finally {
      setRemoving(null)
    }
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      try {
        await clearCart()
        setCart([])
        logger.success('Cart cleared')
      } catch (error) {
        logger.error('Failed to clear cart', error)
      }
    }
  }

  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      const currentCart = getCart()
      currentCart[index].quantity = newQuantity
      saveCart(currentCart)
      await loadCart()
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      logger.error('Failed to update quantity', error)
    }
  }

  /**
   * Parse options to extract detailed breakdown with prices
   */
  const getDetailedOptions = (item: any): Array<{name: string, value: string, price: number}> => {
    const details: Array<{name: string, value: string, price: number}> = []
    
    // Parse options array
    if (Array.isArray(item.options)) {
      item.options.forEach((opt: any) => {
        // Skip custom text (we'll show it separately)
        if (opt.category === 'customText') return
        
        if (opt.value && opt.value !== 'None') {
          details.push({
            name: opt.category || opt.name || 'Option',
            value: opt.value,
            price: opt.priceModifier || 0
          })
        }
      }
      
      // Handle background
      if (item.options.background) {
        const bg = item.options.background
        if (typeof bg === 'object' && bg.name && bg.name !== 'None') {
          optionsArray.push({
            label: 'Background',
            value: bg.name,
            price: bg.price || 0
          })
        } else if (typeof bg === 'string' && bg !== 'None' && bg !== 'none') {
          optionsArray.push({
            label: 'Background',
            value: bg,
            price: 0
          })
        }
      }
      
      // Handle custom text
      if (item.options.customText) {
        const txt = item.options.customText
        const textValue = typeof txt === 'string' ? txt : txt.text || `${txt.line1 || ''} ${txt.line2 || ''}`.trim()
        if (textValue) {
          optionsArray.push({
            label: 'Custom Text',
            value: textValue,
            price: 0
          })
        }
      }
    }
    
    // Add size if available
    if (item.sizeDetails?.sizeName) {
      details.unshift({
        name: 'Size',
        value: item.sizeDetails.sizeName,
        price: item.sizeDetails.basePrice || item.basePrice || 0
      })
    }
    
    return details
  }

  /**
   * Get custom text option details - returns two separate lines
   */
  const getCustomTextDetails = (item: any): {line1: string, line2: string, price: number} | null => {
    // Check in options array first
    if (Array.isArray(item.options)) {
      const textOption = item.options.find((opt: any) => opt.category === 'customText')
      if (textOption && (textOption.line1 || textOption.line2)) {
        return {
          line1: textOption.line1 || '',
          line2: textOption.line2 || '',
          price: textOption.priceModifier || 0
        }
      }
    }
    
    // Fallback to customText field - extract price from options if available
    if (item.customText) {
      const line1 = item.customText.line1 || ''
      const line2 = item.customText.line2 || ''
      
      if (line1 || line2) {
        // Try to find the custom text price from optionsPrice or look for text option
        let textPrice = 0
        if (Array.isArray(item.options)) {
          const textOpt = item.options.find((opt: any) => 
            opt.category === 'textOption' || opt.name?.toLowerCase().includes('text')
          )
          if (textOpt && textOpt.priceModifier) {
            textPrice = textOpt.priceModifier
          }
        }
        return {
          line1,
          line2,
          price: textPrice
        }
      }
    }
    
    return null
  }

  const buildCockpitOrder = () => {
    const orderNumber = `CK-${Date.now()}`
    const { buildCockpit3DOrder } = require('@/lib/cockpit3d-order-builder')
    const cockpitOrder = buildCockpit3DOrder(
      orderNumber,
      cart,
      undefined,
      undefined
    )
    return cockpitOrder
  }

  async function proceedToCheckout() {
    setCheckoutLoading(true)
    
    try {
      // Redirect to Stripe Hosted Checkout
      window.location.href = '/checkout-hosted'
      
    } catch (error) {
      console.error('❌ Checkout error:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center text-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 text-slate-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-6">Add some beautiful crystal keepsakes to get started!</p>
            <Link 
              href="/products" 
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-green-900 via-gray-300 to-green-100 text-slate-900">
      <div className="max-w-7xl max-lg:max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Your Shopping Cart</h2>
          <button
            onClick={handleClearCart}
            className="cursor-pointer text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Storage Stats (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && storageStats && (
          <div className="bg-slate-700 rounded-lg p-4 mb-6 text-sm text-gray-300">
            <h3 className="font-bold mb-2">Storage Stats:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>localStorage: {storageStats.storageHealth.percentUsed.toFixed(1)}% used</div>
              <div>IndexedDB Images: {storageStats.totalImages}</div>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const detailedOptions = getDetailedOptions(item)
              const customTextDetails = getCustomTextDetails(item)
              
              return (
                <div key={index} className="bg-white shadow-md border border-gray-300 rounded-lg p-6">
                  <div className="flex items-start gap-6">
                    
                    {/* Images Section - Show BOTH if available */}
                    <div className="flex-shrink-0">
                      {item.customImage ? (
                        <div className="space-y-3">
                          {/* Original Uploaded Image */}
                          {item.customImage.rawImageThumbnail && (
                            <div className="text-center">
                              <img 
                                src={item.customImage.rawImageThumbnail}
                                alt="Your Original"
                                className="w-32 h-32 object-cover rounded-lg border-2 border-blue-300"
                              />
                              <p className="text-xs text-blue-600 font-medium mt-1">Your Original</p>
                            </div>
                          )}
                          
                          {/* Final Masked Image */}
                          <div className="text-center">
                            <img 
                              src={item.customImage.thumbnail}
                              alt="Final Engraved Version"
                              className="w-32 h-32 object-contain rounded-lg border-2 border-green-500"
                            />
                            <p className="text-xs text-green-600 font-medium mt-1">Final Engraved</p>
                          </div>
                        </div>
                      ) : (
                        // Product image fallback
                        <img 
                          src={item.productImage || 'https://placehold.co/800x800?text=No+Image'}
                          alt={item.name}
                          className="w-32 h-32 object-contain rounded-lg"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                          {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(index)}
                          disabled={removing === index}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove item"
                        >
                          {removing === index ? (
                            <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </button>
                      </div>

                      {/* DETAILED OPTIONS BREAKDOWN */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Configuration Details:</h4>
                        <div className="space-y-2">
                          {detailedOptions.map((opt, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-700">
                                <strong>{opt.name}:</strong> {opt.value}
                              </span>
                              <span className="text-gray-900 font-medium">
                                ${opt.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          
                          {/* Custom Text Line Item */}
                          {customTextDetails && (
                            <div className="flex justify-between items-start text-sm pt-2 border-t border-gray-300">
                              <div className="flex-1">
                                <strong className="text-gray-700">Custom Text:</strong>
                                <div className="mt-1 space-y-1">
                                  {customTextDetails.line1 && (
                                    <p className="text-gray-600 italic">Line 1: "{customTextDetails.line1}"</p>
                                  )}
                                  {customTextDetails.line2 && (
                                    <p className="text-gray-600 italic">Line 2: "{customTextDetails.line2}"</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-900 font-medium ml-3">
                                +${customTextDetails.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Total Item Price */}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-400">
                          <span className="text-sm font-bold text-gray-800">Item Total:</span>
                          <span className="text-lg font-bold text-blue-600">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Image Metadata */}
                      {item.customImageMetadata?.hasImage && (
                        <div className="text-sm text-emerald-600 bg-emerald-50 rounded px-3 py-2 mb-3">
                          ✓ Custom Image: {item.customImageMetadata.filename}
                        </div>
                      )}

                      {/* Quantity Controls and Line Total */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-700">Qty:</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Line Total</p>
                          <p className="text-2xl font-bold text-slate-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Debug Info */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-3 p-2 rounded border border-blue-200 bg-blue-50">
                          <small className="text-blue-700">
                            <strong>Debug:</strong> SKU: {item.sku} | 
                            Base: ${item.basePrice?.toFixed(2)} | 
                            Options: ${item.optionsPrice?.toFixed(2)} | 
                            Has Raw Image: {item.customImage?.rawImageDataUrl ? 'Yes' : 'No'}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-md border border-gray-300 rounded-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500 italic">At checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-500 italic">At checkout</span>
                </div>
                
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={proceedToCheckout}
                disabled={checkoutLoading}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
              
              <p className="text-center text-gray-500 text-xs mt-4">
                🔒 Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-8">
          <Link 
            href="/products" 
            className="text-blue-600 hover:underline font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* Full Debug Section */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-4 border-t border-gray-300">
            <h6 className="text-amber-600 font-semibold mb-3">🔧 Developer Mode - Cart Debug</h6>
            <div className="bg-slate-900 p-4 rounded overflow-auto max-h-96">
              <pre className="text-slate-100 text-xs">
                {JSON.stringify(cart, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
