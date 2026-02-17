// app/cart/page.tsx
// Version: 5.0.1 - ONLY Fixed Sale Pricing Display
// ✅ Sale pricing matches admin panel format
// ✅ Everything else UNCHANGED from version 5.0.0

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
<<<<<<< HEAD
    dataUrl: string
    thumbnail: string
    rawImageDataUrl?: string
    rawImageThumbnail?: string
    metadata: any
=======
    dataUrl?: string // Masked image base64 (for local display)
    thumbnail?: string // Masked thumbnail
    rawImageDataUrl?: string // Original uploaded image
    rawImageThumbnail?: string // Original thumbnail
    metadata?: any
    // ✅ Server URLs for Cockpit3D order payload
    serverUrl?: string // URL on the server for the masked image
    originalServerUrl?: string // URL on the server for the original image
    originalDataUrl?: string // Base64 for original image (fallback)
    tempOrderRef?: string // Order reference for image folder
>>>>>>> localchanges
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

  const loadCart = async () => {
    try {
      setLoading(true)
      const cartWithImages = await getCartWithImages()
      setCart(cartWithImages)
      
      const sum = cartWithImages.reduce((acc, item) => {
        const itemPrice = item.price || item.totalPrice || 0
        return acc + (itemPrice * item.quantity)
      }, 0)
      setTotal(sum)
      
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
    const handleCartUpdate = () => { loadCart() }
    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => { window.removeEventListener('cartUpdated', handleCartUpdate) }
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
    
    // 1. SIZE - Check sizeDetails first (used by ProductDetailClient)
    if (item.sizeDetails && item.sizeDetails.sizeName) {
      options.push({
        name: 'Size',
        value: item.sizeDetails.sizeName,
        price: item.sizeDetails.basePrice || 0
      })
    }
    
    // 2. Process options array for all Cockpit3D required fields
    if (item.options && Array.isArray(item.options)) {
      item.options.forEach((opt: any) => {
        // Light Base
        if (opt.category === 'lightBase' && opt.name) {
          options.push({
            name: 'Light Base',
            value: opt.name || opt.value,
            price: opt.priceModifier || opt.price || 0
          })
        }
        // Background
        else if (opt.category === 'background' && opt.name) {
          options.push({
            name: 'Background',
            value: opt.name || opt.value,
            price: opt.priceModifier || opt.price || 0
          })
        }
        // Faces (for multi-face products) - HIDDEN until pricing set
        else if (opt.category === 'faces' && opt.name) {
          options.push({
            name: 'Faces',
            value: opt.name || opt.value,
            price: opt.priceModifier || opt.price || 0
          })
        }
        // Custom Text (when in options array)
        else if (opt.category === 'customText' && (opt.line1 || opt.line2)) {
          // Skip - handled by getCustomTextDetails below
        }
        // Size in options (fallback if no sizeDetails)
        else if (opt.category === 'size' && opt.name && !item.sizeDetails) {
          options.push({
            name: 'Size',
            value: opt.name || opt.value,
            price: opt.price || opt.basePrice || 0
          })
        }
      })
    }
    
    return options
  }

<<<<<<< HEAD
  const ContinueShoppingBtn = () => (
    <div className="text-center mt-10">
      <Link 
        href="/products" 
        className="cursor-pointer inline-flex items-center gap-2 text-[#8DC63F] hover:text-[#7AB82F] font-semibold text-lg transition-colors"
      >
        <span>←</span>
        <span>Continue Shopping</span>
      </Link>
    </div>
  )

=======
>>>>>>> localchanges
  const getCustomTextDetails = (item: CartItem) => {
    // First check if custom text is in the options array
    if (item.options && Array.isArray(item.options)) {
      const textOpt = item.options.find((opt: any) => opt.category === 'customText')
      if (textOpt && (textOpt.line1 || textOpt.line2)) {
        return {
          line1: textOpt.line1 || '',
          line2: textOpt.line2 || '',
          price: textOpt.priceModifier || 0
        }
      }
    }
    
    // Fallback to direct customText property
    if (item.customText) {
      const line1 = item.customText.line1 || ''
      const line2 = item.customText.line2 || ''
      
      if (line1 || line2) {
        let textPrice = 0
        if (Array.isArray(item.options)) {
          const textOpt = item.options.find((opt: any) => 
            opt.category === 'customText' || opt.name?.toLowerCase().includes('text')
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

  /**
   * Continue Shopping Button Component
   */
  const ContinueShoppingBtn = () => (
    <div className="text-center mt-10">
      <Link 
        href="/products" 
        className="cursor-pointer inline-flex items-center gap-2 text-[#8DC63F] hover:text-[#7AB82F] font-semibold text-lg transition-colors"
      >
        <span>←</span>
        <span>Continue Shopping</span>
      </Link>
    </div>
  )

  async function proceedToCheckout() {
    setCheckoutLoading(true)
    
    try {
<<<<<<< HEAD
      window.location.href = '/checkout'
=======
      // Detect test environment from multiple sources
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const currentHref = typeof window !== 'undefined' ? window.location.href : ''
      
      // Check for /test in path OR in full URL (handles various URL structures)
      const isTestEnv = currentPath.startsWith('/test/') || 
                        currentPath === '/test' || 
                        currentPath.startsWith('/test?') ||
                        currentHref.includes('/test/') ||
                        currentHref.includes('crystalkeepsakes.com/test')
      
      // Build the checkout URL - use full URL to avoid any relative path issues
      let checkoutUrl: string
      if (isTestEnv) {
        // For test environment, use absolute path
        if (typeof window !== 'undefined') {
          const origin = window.location.origin
          checkoutUrl = `${origin}/test/checkout`
        } else {
          checkoutUrl = '/test/checkout'
        }
      } else {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        checkoutUrl = basePath ? `${basePath}/checkout` : '/checkout'
      }
      
      console.log('🛒 Proceeding to checkout:', { 
        currentPath, 
        currentHref,
        isTestEnv, 
        checkoutUrl
      })
      
      window.location.href = checkoutUrl
      
>>>>>>> localchanges
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <button
            onClick={handleClearCart}
            className="cursor-pointer text-sm text-red-600 hover:text-white bg-white hover:bg-red-600 px-4 py-2 rounded-lg border-2 border-red-600 font-medium transition-all"
          >
            Clear Cart
          </button>
        </div>

<<<<<<< HEAD
=======

        {/* 2-column layout */}
>>>>>>> localchanges
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => {
              const detailedOptions = getDetailedOptions(item)
              const customTextDetails = getCustomTextDetails(item)
              
              return (
                <div key={index} className="bg-white shadow-lg rounded-xl p-6 border border-green-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-start gap-6">
                    
                    <div className="flex-shrink-0 space-y-3">
                      <div className="text-center">
<<<<<<< HEAD
                        <img 
                          src={item.productImage || 'https://placehold.co/800x800?text=No+Image'}
                          alt={item.name}
                          className="w-65 h-65 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.open(item.productImage, '_blank')}
                          title="Click to view full size"
                        />
                        <span className="text-xs text-gray-600 font-medium mt-1">Product Image</span>
                      </div>
                      
                      {item.customImage?.thumbnail && (
                        <div className="text-center">
                          <img 
                            src={item.customImage.thumbnail}
                            alt="Final Engraved Version"
                            className="w-65 h-65 object-cover rounded-lg border-2 border-green-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => window.open(item.customImage?.dataUrl, '_blank')}
                            title="Click to view full size"
                          />
                          <span className="text-xs text-green-600 font-medium mt-1">Final Engraved</span>
=======
                        <a href={item.productImage || '#'} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={item.productImage || 'https://placehold.co/800x800?text=No+Image'}
                            alt={item.name}
                            className="w-65 h-65 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            title="Click to view full size"
                          />
                        </a>
                        <span className="text-xs text-gray-600 font-medium mt-1 block">Product Image</span>
                      </div>
                      
                      {/* Final Masked Image (if available) - LARGER & BETTER QUALITY */}
                      {(item.customImage?.serverUrl || item.customImage?.thumbnail || item.customImage?.dataUrl) && (
                        <div className="text-center">
                          {/* Use server URL for link, thumbnail/dataUrl for display */}
                          <a 
                            href={item.customImage.serverUrl || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title={item.customImage.serverUrl ? "Click to view full size on server" : "Server URL not available"}
                          >
                            <img 
                              src={item.customImage.thumbnail || item.customImage.dataUrl || item.customImage.serverUrl}
                              alt="Final Engraved Version"
                              className="w-65 h-65 object-cover rounded-lg border-2 border-green-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            />
                          </a>
                          <span className="text-xs text-green-600 font-medium mt-1 block">Final Engraved</span>
                          {/* Show server URL status */}
                          {item.customImage.serverUrl ? (
                            <a 
                              href={item.customImage.serverUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:text-blue-700 underline block mt-1"
                            >
                              View on Server ↗
                            </a>
                          ) : (
                            <span className="text-xs text-orange-500 block mt-1">⚠️ No server URL</span>
                          )}
>>>>>>> localchanges
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                          {item.sku && <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>}
                          {item.cockpit3d_id && (
                            <p className="text-xs text-green-600 font-medium mt-1">Cockpit3D ID: {item.cockpit3d_id}</p>
                          )}
                        </div>
                        
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
                        
                        {/* ONLY CHANGE: Sale pricing format matches admin panel */}
                        {item.onSale && (item.discountAmount ?? 0) > 0 && (
                          <div className="mt-3 p-3 bg-white border-2 border-red-200 rounded-lg">
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Original:</span>
                                <span className="line-through text-gray-500">${item.originalPrice?.toFixed(2)}</span>
                              </div>
                              
                              {item.salePercent && (
                                <>
                                  <div className="flex justify-between text-green-700 font-bold">
                                    <span>Sale ({item.salePercent}% off):</span>
                                    <span>${item.price.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600 text-xs">
                                    <span>Savings:</span>
                                    <span>${item.discountAmount.toFixed(2)}</span>
                                  </div>
                                </>
                              )}
                              
                              {item.salePrice && !item.salePercent && (
                                <>
                                  <div className="flex justify-between text-green-700 font-bold">
                                    <span>Sale Price:</span>
                                    <span>${item.price.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600 text-xs">
                                    <span>Savings:</span>
                                    <span>${item.discountAmount.toFixed(2)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
<<<<<<< HEAD

                        <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-green-300">
                          <span className="text-base font-bold text-gray-900">Item Total:</span>
                          <span className="text-xl font-bold text-[#8DC63F]">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
=======
>>>>>>> localchanges
                      </div>

                      {item.customImageMetadata?.hasImage && (
                        <div className="text-sm bg-emerald-50 rounded px-3 py-2 mb-3">
                          <span className="text-emerald-700 font-medium">Custom Image: </span>
                          {/* Prefer server URL over base64 */}
                          {(item.customImage?.serverUrl || item.customImage?.dataUrl) ? (
                            <a 
                              href={item.customImage.serverUrl || item.customImage.dataUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
                            >
                              {item.customImageMetadata.filename || 'View Masked Image'}
                            </a>
                          ) : (
                            <span className="text-emerald-600">{item.customImageMetadata.filename}</span>
                          )}
                          {/* Also show original if available */}
                          {(item.customImage?.originalServerUrl || item.customImage?.originalDataUrl) && (
                            <>
                              <span className="mx-2 text-gray-400">|</span>
                              <a 
                                href={item.customImage.originalServerUrl || item.customImage.originalDataUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
                              >
                                View Original
                              </a>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-4 pt-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                          <div className="flex items-center gap-2 border-3 border-[#8DC63F] rounded-lg overflow-hidden shadow-md">
                            <button 
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="cursor-pointer w-12 h-12 flex items-center justify-center bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-bold text-xl transition-colors"
                            >
                              −
                            </button>
                            <span className="text-2xl font-black text-gray-900 min-w-[4rem] text-center px-4 bg-white">
                              {item.quantity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="cursor-pointer w-12 h-12 flex items-center justify-center bg-[#8DC63F] hover:bg-[#7AB82F] text-white font-bold text-xl transition-colors"
                            >
                              +
                            </button>
                          </div>
                          {item.quantity > 1 && (
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                              × {item.quantity} items
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Line Total</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">
                              ${item.price.toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

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
                Secure checkout powered by <Link className="text-[var(--brand-500)]" href="https://stripe.com/">Stripe</Link>
              </p>
            </div>
          </div>
        </div>

        <ContinueShoppingBtn />

      </div>
    </div>
  )
}