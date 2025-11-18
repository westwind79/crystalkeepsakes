// app/cart/page.tsx
// Version: 5.0.0 - Enhanced with Green Theming & Better UX
// ✅ Green brand theming throughout
// ✅ Larger, clearer image thumbnails (200x200)
// ✅ Better organized debugging information
// ✅ Product options properly displayed and passed to Cockpit3D
// ✅ cursor-pointer on all interactive elements

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, ShoppingBag, AlertCircle } from 'lucide-react'
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
  // Sale information
  onSale?: boolean
  salePrice?: number
  salePercent?: number
  originalPrice?: number
  discountAmount?: number
  dateAdded: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [showDebug, setShowDebug] = useState(false)

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
    try {
      setRemoving(index)
      await removeFromCart(index)
      await loadCart()
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      logger.error('Failed to remove item', error)
    } finally {
      setRemoving(null)
    }
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your entire cart?')) {
      await clearCart()
      await loadCart()
      window.dispatchEvent(new Event('cartUpdated'))
    }
  }

  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    const updatedCart = [...cart]
    updatedCart[index].quantity = newQuantity
    setCart(updatedCart)
    await saveCart(updatedCart)
    
    const newTotal = updatedCart.reduce((acc, item) => {
      return acc + (item.price * item.quantity)
    }, 0)
    setTotal(newTotal)
    
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const getDetailedOptions = (item: CartItem) => {
    const options: Array<{ name: string; value: string; price: number }> = []
    
    if (!item.options || !Array.isArray(item.options)) {
      return options
    }
    
    item.options.forEach((opt: any) => {
      if (opt.category === 'size' && opt.name) {
        options.push({
          name: 'Size',
          value: opt.name,
          price: opt.price || 0
        })
      } else if (opt.category === 'lightBase' && opt.name) {
        options.push({
          name: 'Light Base',
          value: opt.name,
          price: opt.priceModifier || 0
        })
      } else if (opt.category === 'background' && opt.name) {
        options.push({
          name: 'Background',
          value: opt.name,
          price: opt.priceModifier || 0
        })
      }
    })
    
    return options
  }

  /**
   * Hero Component - Single source of truth
   */
  const ContinueShoppingBtn = () => (
    <div className="text-center mt-10">
      {/* Continue Shopping */}
      <Link 
        href="/products" 
        className="cursor-pointer inline-flex items-center gap-2 text-[#8DC63F] hover:text-[#7AB82F] font-semibold text-lg transition-colors"
      >
        <span>←</span>
        <span>Continue Shopping</span>
      </Link>
    </div>
  )

  const getCustomTextDetails = (item: CartItem) => {
    if (item.customText) {
      const line1 = item.customText.line1 || ''
      const line2 = item.customText.line2 || ''
      
      if (line1 || line2) {
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

  async function proceedToCheckout() {
    setCheckoutLoading(true)
    
    try {
      // Redirect to Stripe Hosted Checkout
      // OLD window.location.href = '/checkout-hosted'
      window.location.href = '/checkout'
      
    } catch (error) {
      console.error('❌ Checkout error:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8DC63F] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading your cart...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-16">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8 text-lg">Add some beautiful crystal keepsakes to get started!</p>
            <Link 
              href="/products" 
              className="cursor-pointer inline-block px-8 py-4 bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100">
      <div className="max-w-7xl max-lg:max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <button
            onClick={handleClearCart}
            className="cursor-pointer text-sm text-red-600 hover:text-white hover:bg-red-600 px-4 py-2 rounded-lg border-2 border-red-600 font-medium transition-all"
          >
            Clear Cart
          </button>
        </div>


        {/* Storage Stats Banner (Dev Mode) */}
        {process.env.NODE_ENV === 'development' && storageStats && (
          <div className="bg-green-900 text-white rounded-lg p-4 mb-6 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-2">💾 Storage Health</h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-green-300">localStorage:</span>
                    <span className="ml-2 font-semibold">{storageStats.storageHealth.percentUsed.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-green-300">IndexedDB Images:</span>
                    <span className="ml-2 font-semibold">{storageStats.totalImages}</span>
                  </div>
                  <div>
                    <span className="text-green-300">Cart Items:</span>
                    <span className="ml-2 font-semibold">{cart.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2-column layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const detailedOptions = getDetailedOptions(item)
              const customTextDetails = getCustomTextDetails(item)
              
              return (
                <div key={index} className="bg-white shadow-lg rounded-xl p-6 border border-green-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-6">
                    
                    {/* Images Section - LARGER THUMBNAILS */}
                    <div className="flex-shrink-0">
                      {item.customImage ? (
                        <div className="space-y-4">
                          {/* Original Uploaded Image */}
                          {item.customImage.rawImageThumbnail && (
                            <div className="text-center">
                              <img 
                                src={item.customImage.rawImageThumbnail}
                                alt="Your Original"
                                className="w-48 h-48 object-cover rounded-lg border-4 border-blue-400 shadow-md"
                              />
                              <p className="text-xs text-blue-600 font-semibold mt-2 bg-blue-50 py-1 px-2 rounded">📷 Your Original</p>
                            </div>
                          )}
                          
                          {/* Final Masked Image */}
                          <div className="text-center">
                            <img 
                              src={item.customImage.thumbnail}
                              alt="Final Engraved Version"
                              className="w-48 h-48 object-contain rounded-lg border-4 border-[#8DC63F] shadow-md bg-gray-50"
                            />
                            <p className="text-xs text-[#8DC63F] font-semibold mt-2 bg-green-50 py-1 px-2 rounded">✨ Final Engraving</p>
                          </div>
                        </div>
                      ) : (
                        // Product image fallback
                        <img 
                          src={item.productImage || 'https://placehold.co/800x800?text=No+Image'}
                          alt={item.name}
                          className="w-48 h-48 object-contain rounded-lg border-2 border-gray-200"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                          {item.sku && <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>}
                          {item.cockpit3d_id && (
                            <p className="text-xs text-green-600 font-medium mt-1">Cockpit3D ID: {item.cockpit3d_id}</p>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(index)}
                          disabled={removing === index}
                          className="cursor-pointer p-3 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-full transition-all"
                          title="Remove item"
                        >
                          {removing === index ? (
                            <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Trash2 size={22} />
                          )}
                        </button>
                      </div>

                      {/* DETAILED OPTIONS BREAKDOWN */}
                      <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-5 mb-4 border border-green-100">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#8DC63F] rounded-full"></span>
                          Configuration Details
                        </h4>
                        <div className="space-y-2.5">
                          {detailedOptions.map((opt, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded">
                              <span className="text-gray-700">
                                <strong className="text-gray-900">{opt.name}:</strong> {opt.value}
                              </span>
                              <span className="text-gray-900 font-semibold">
                                ${opt.price.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          
                          {/* Custom Text Line Item */}
                          {customTextDetails && (
                            <div className="flex justify-between items-start text-sm pt-3 border-t-2 border-green-200 bg-white px-3 py-2 rounded">
                              <div className="flex-1">
                                <strong className="text-gray-900">Custom Text:</strong>
                                <div className="mt-1.5 space-y-1">
                                  {customTextDetails.line1 && (
                                    <p className="text-gray-600 italic pl-2 border-l-2 border-green-300">Line 1: "{customTextDetails.line1}"</p>
                                  )}
                                  {customTextDetails.line2 && (
                                    <p className="text-gray-600 italic pl-2 border-l-2 border-green-300">Line 2: "{customTextDetails.line2}"</p>
                                  )}
                                </div>
                              </div>
                              <span className="text-gray-900 font-semibold ml-3">
                                +${customTextDetails.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Total Item Price */}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-green-300">
                          <span className="text-base font-bold text-gray-900">Item Total:</span>
                          <span className="text-xl font-bold text-[#8DC63F]">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Image Metadata Badge */}
                      {item.customImageMetadata?.hasImage && (
                        <div className="inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-full px-4 py-2 mb-3 border border-emerald-200">
                          <span className="text-lg">✓</span>
                          <span className="font-medium">Custom Image: {item.customImageMetadata.filename}</span>
                        </div>
                      )}

                      {/* Quantity Controls and Line Total */}
                      <div className="flex items-center justify-between flex-wrap gap-4 pt-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                          <div className="flex items-center gap-2 border-2 border-[#8DC63F] rounded-lg overflow-hidden">
                            <button 
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="cursor-pointer w-10 h-10 flex items-center justify-center bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="text-lg font-bold text-gray-900 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="cursor-pointer w-10 h-10 flex items-center justify-center bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Line Total</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Compact Debug Info */}
                      {process.env.NODE_ENV === 'development' && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 font-medium">🔧 Debug Info</summary>
                          <div className="mt-2 p-3 rounded-lg border border-green-200 bg-green-50">
                            <div className="text-xs space-y-1 text-gray-700">
                              <div><strong>SKU:</strong> {item.sku}</div>
                              <div><strong>Cockpit3D ID:</strong> {item.cockpit3d_id || 'N/A'}</div>
                              <div><strong>Base Price:</strong> ${item.basePrice?.toFixed(2)}</div>
                              <div><strong>Options Price:</strong> ${item.optionsPrice?.toFixed(2)}</div>
                              <div><strong>Has Raw Image:</strong> {item.customImage?.rawImageDataUrl ? '✅ Yes' : '❌ No'}</div>
                              <div><strong>Has Masked Image:</strong> {item.customImage?.dataUrl ? '✅ Yes' : '❌ No'}</div>
                              <div><strong>Options Array:</strong> {item.options ? `${item.options.length} options` : 'None'}</div>
                            </div>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-xl p-6 border-2 border-green-200 sticky top-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">Order Summary</h3>
              
              <div className="space-y-4 text-base mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900 text-lg">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-500 italic text-sm">Calculated at checkout</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-500 italic text-sm">Calculated at checkout</span>
                </div>
                
                <div className="border-t-2 border-green-300 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-3xl font-bold text-[#8DC63F]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={proceedToCheckout}
                disabled={checkoutLoading}
                className="cursor-pointer mt-4 w-full bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
              
              <p className="text-center text-gray-500 text-xs mt-4 flex items-center justify-center gap-2">
                <span className="text-lg">🔒</span>
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>

        {/* Continue Shopping */}
        <ContinueShoppingBtn />

        {/* Organized Debug Section (Collapsible) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 pt-8 border-t-2 border-gray-300">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="cursor-pointer flex items-center gap-3 text-lg font-bold text-amber-600 hover:text-amber-700 mb-4 transition-colors"
            >
              <span className="text-2xl">{showDebug ? '▼' : '▶'}</span>
              <span>🔧 Developer Debug Panel</span>
            </button>
            
            {showDebug && (
              <div className="space-y-4">
                {/* Cart Summary */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg border-2 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-3">📊 Cart Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-amber-700 font-semibold">Total Items:</span>
                      <span className="ml-2 text-amber-900 font-bold">{cart.length}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 font-semibold">With Images:</span>
                      <span className="ml-2 text-amber-900 font-bold">{cart.filter(i => i.customImage).length}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 font-semibold">Cart Total:</span>
                      <span className="ml-2 text-amber-900 font-bold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Full JSON */}
                <div className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 border-2 border-slate-700">
                  <h4 className="text-amber-400 font-bold mb-2">📋 Full Cart JSON</h4>
                  <pre className="text-green-300 text-xs font-mono">
                    {JSON.stringify(cart, null, 2)}
                  </pre>
                </div>

                {/* Cockpit3D Validation */}
                <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3">🚀 Cockpit3D Readiness Check</h4>
                  <div className="space-y-2 text-sm">
                    {cart.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={item.cockpit3d_id ? 'text-green-600' : 'text-red-600'}>●</span>
                        <span className="text-gray-700">
                          <strong>{item.name}:</strong> 
                          {item.cockpit3d_id ? (
                            <span className="text-green-700 ml-2">✓ Has Cockpit3D ID ({item.cockpit3d_id})</span>
                          ) : (
                            <span className="text-red-700 ml-2">✗ Missing Cockpit3D ID</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
