// app/cart/page.tsx
// Version: 3.0.0 - 2025-11-11 - MERGED & FIXED
// ✅ Merged: All functions from original files preserved
// ✅ Fixed: updateQuantity uses cartUtils.saveCart
// ✅ Fixed: Options display handles both formats
// ✅ Enhanced: Layout from page-1/page-2

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

// ✅ PRESERVE: Type interface from original files
interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: any
  sizeDetails?: any
  customImage?: {
    dataUrl: string
    thumbnail: string
    metadata: any
  }
  customImageMetadata?: {
    filename?: string
    maskName?: string
    hasImage: boolean
  }
  cockpit3d_id?: string
  dateAdded: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [total, setTotal] = useState(0) // ✅ PRESERVE: total state

  // ✅ PRESERVE: loadCart from page.tsx
  const loadCart = async () => {
    try {
      setLoading(true)
      const cartWithImages = await getCartWithImages()
      setCart(cartWithImages)
      
      // ✅ PRESERVE: Calculate total like page-2
      const sum = cartWithImages.reduce((acc, item) => {
        const itemPrice = item.price || (item as any).totalPrice || 0
        return acc + (itemPrice * item.quantity)
      }, 0)
      setTotal(sum)
      
      // ✅ PRESERVE: Storage stats from page.tsx
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

    // ✅ PRESERVE: Event listener from page.tsx
    const handleCartUpdate = () => {
      loadCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  // ✅ PRESERVE: handleRemoveItem from page.tsx
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

  // ✅ PRESERVE: handleClearCart from page.tsx
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

  // ✅ FIXED: updateQuantity - Get cart WITHOUT images to avoid localStorage quota
  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      // Get cart WITHOUT images (just from localStorage)
      const currentCart = getCart()
      currentCart[index].quantity = newQuantity
      
      // Save back to localStorage
      saveCart(currentCart)
      
      // Reload cart with images for display
      await loadCart()
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      logger.error('Failed to update quantity', error)
    }
  }

  // ✅ ENHANCED: Normalize options for display with prices
  const getDisplayOptions = (item: any): Array<{label: string, value: string, price: number}> => {
    const optionsArray: Array<{label: string, value: string, price: number}> = []
    
    // Add size first (most important)
    if (item.sizeDetails?.sizeName || item.size?.sizeName) {
      const sizeDetails = item.sizeDetails || item.size
      optionsArray.push({
        label: 'Size',
        value: sizeDetails.sizeName || sizeDetails.name,
        price: sizeDetails.basePrice || sizeDetails.price || 0
      })
    }
    
    // New format: options array (from ProductDetailClient)
    if (Array.isArray(item.options)) {
      item.options.forEach((opt: any) => {
        if (opt.category === 'customText') {
          optionsArray.push({
            label: opt.name || 'Custom Text',
            value: opt.value,
            price: opt.priceModifier || 0
          })
        } else if (opt.value && opt.value !== 'None' && opt.value !== 'none') {
          optionsArray.push({
            label: opt.name || opt.category || 'Option',
            value: opt.value,
            price: opt.priceModifier || 0
          })
        }
      })
    } 
    // Old format: flat object
    else if (item.options && typeof item.options === 'object') {
      // Handle light base
      if (item.options.lightBase) {
        const lb = item.options.lightBase
        if (typeof lb === 'object' && lb.name && lb.name !== 'None') {
          optionsArray.push({
            label: 'Light Base',
            value: lb.name,
            price: lb.price || 0
          })
        } else if (typeof lb === 'string' && lb !== 'None' && lb !== 'none') {
          optionsArray.push({
            label: 'Light Base',
            value: lb,
            price: 0
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
    
    // Handle standalone customText field
    if (item.customText && !optionsArray.some(opt => opt.label === 'Custom Text')) {
      const textValue = typeof item.customText === 'string' 
        ? item.customText 
        : item.customText.text || `${item.customText.line1 || ''} ${item.customText.line2 || ''}`.trim()
      
      if (textValue) {
        optionsArray.push({
          label: 'Custom Text',
          value: textValue,
          price: 0
        })
      }
    }
    
    return optionsArray
  }

  // ✅ FIXED: Import Cockpit3D order builder
  const buildCockpitOrder = () => {
    const orderNumber = `CK-${Date.now()}`
    
    // Import and use the proper Cockpit3D order builder
    const { buildCockpit3DOrder } = require('@/lib/cockpit3d-order-builder')
    
    // Build order with proper Cockpit3D structure
    const cockpitOrder = buildCockpit3DOrder(
      orderNumber,
      cart,
      undefined, // Customer info will be added at checkout
      undefined  // Retailer ID from env
    )
    
    return cockpitOrder
  }

  // ✅ PRESERVE: proceedToCheckout from page-2
  async function proceedToCheckout() {
    setCheckoutLoading(true)
    
    try {
      const orderData = buildCockpitOrder()
      
      // Strip customImage objects (keep only IDs) to avoid quota issues
      const cartForStorage = cart.map(item => {
        const { customImage, ...itemWithoutImage } = item
        return {
          ...itemWithoutImage,
          // Keep only the ID and metadata, not the full image data
          customImageId: item.customImageId,
          customImageMetadata: item.customImageMetadata
        }
      })
      
      console.log('💾 Storing order in sessionStorage (images stripped)')
      console.log('📊 Cart size:', JSON.stringify(cartForStorage).length, 'bytes')
      
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        cartItems: cartForStorage,
        subtotal: total,
        total: total,
        orderNumber: orderData.order_id,
        cockpitOrderData: orderData
      }))
      
      window.location.href = '/checkout'
      
    } catch (error) {
      console.error('❌ Checkout error:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  // ✅ PRESERVE: Loading state from page-2
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // ✅ PRESERVE: Empty state from page-2
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50">
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
    <div className="min-h-screen bg-gradient-to-tr from-green-900 via-gray-300 to-green-100">
      <div className="max-w-7xl max-lg:max-w-4xl mx-auto p-6">
        {/* ✅ ENHANCED: Header from page-2 */}
        <div className="flex items-center justify-between mb-6 text-slate-900">
          <h2 className="text-xl font-semibold text-slate-900">Your shopping cart</h2>
          <button
            onClick={handleClearCart}
            className="cursor-pointer text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* ✅ PRESERVE: Storage Stats from page.tsx */}
        {process.env.NODE_ENV === 'development' && storageStats && (
          <div className="bg-slate-700 rounded-lg p-4 mb-6 text-sm text-gray-300">
            <h3 className="font-bold mb-2">Storage Stats:</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>localStorage: {storageStats.storageHealth.percentUsed.toFixed(1)}% used</div>
              <div>IndexedDB Images: {storageStats.totalImages}</div>
              <div>localStorage Size: {(storageStats.storageHealth.usedSpace / 1024).toFixed(1)} KB</div>
              <div>Image Storage: {storageStats.estimatedSizeMB.toFixed(2)} MB</div>
            </div>
          </div>
        )}

        {/* ✅ ENHANCED: 2-column layout from page-2 */}
        <div className="grid lg:grid-cols-3 gap-4 relative">
          {/* Cart Items Column */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => {
              const displayImage = item.customImage?.thumbnail ||  // User's uploaded photo
                                 item.productImage ||             // Product's own photo
                                 'https://placehold.co/800x800?text=No+Image'  // Fallback
              
              const displayOptions = getDisplayOptions(item)
              
              return (
                <div key={index} className="p-6 text-slate-900 bg-white shadow-sm border border-gray-300 rounded-md relative">
                  <div className="flex items-start max-sm:flex-col gap-4 max-sm:gap-6">
                    
                    {/* ✅ ENHANCED: Product Image */}
                    <div className="w-32 h-32 shrink-0">
                      <img 
                        src={displayImage}
                        alt={item.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>

                    {/* ✅ ENHANCED: Product Details */}
                    <div className="sm:border-l sm:pl-4 sm:border-gray-300 w-full">
                      <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                      
                      {/* ✅ FIXED: Options Display */}
                      {Object.keys(displayOptions).length > 0 && (
                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                          {Object.entries(displayOptions).map(([key, val]) => (
                            <p key={key}><strong>{key}:</strong> {val}</p>
                          ))}
                        </div>
                      )}

                      {/* ✅ ENHANCED: Specifications */}
                      <ul className="mt-4 text-sm text-slate-500 font-medium space-y-1">
                        {item.sku && <li>SKU: {item.sku}</li>}
                        {item.sizeDetails?.sizeName && <li>Size: {item.sizeDetails.sizeName}</li>}
                        {item.customImageMetadata?.hasImage && (
                          <li className="text-emerald-600">✓ Custom Image: {item.customImageMetadata.filename}</li>
                        )}
                      </ul>

                      <hr className="border-gray-300 my-4" />

                      {/* ✅ ENHANCED: Quantity and Price */}
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <h4 className="text-sm font-semibold text-slate-900">Qty:</h4>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="flex items-center justify-center w-[18px] h-[18px] bg-blue-600 hover:bg-blue-700 outline-none rounded-sm cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2 fill-white" viewBox="0 0 124 124">
                              <path d="M112 50H12C5.4 50 0 55.4 0 62s5.4 12 12 12h100c6.6 0 12-5.4 12-12s-5.4-12-12-12z"></path>
                            </svg>
                          </button>
                          <span className="font-semibold text-base leading-[16px]">{item.quantity}</span>
                          <button 
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="flex items-center justify-center w-[18px] h-[18px] bg-blue-600 hover:bg-blue-700 outline-none rounded-sm cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-2 fill-white" viewBox="0 0 42 42">
                              <path d="M37.059 16H26V4.941C26 2.224 23.718 0 21 0s-5 2.224-5 4.941V16H4.941C2.224 16 0 18.282 0 21s2.224 5 4.941 5H16v11.059C16 39.776 18.282 42 21 42s5-2.224 5-4.941V26h11.059C39.776 26 42 23.718 42 21s-2.224-5-4.941-5z"></path>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <h4 className="text-base font-semibold text-slate-900">
                            ${((item.price) * item.quantity).toFixed(2)}
                          </h4>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(index)}
                            disabled={removing === index}
                            className="cursor-pointer p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50"
                          >
                            {removing === index ? (
                              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Trash2 size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ✅ ENHANCED: Debug Info */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="w-full mt-3 p-2 rounded border border-blue-200 bg-blue-50">
                          <small className="text-blue-700">
                            <strong>Debug:</strong><br/>
                            SKU: {item.sku || 'N/A'} | 
                            Cockpit3D ID: {item.cockpit3d_id || 'N/A'}<br/>
                            Image: {item.customImageMetadata?.hasImage ? 'Yes' : 'No'} | 
                            {item.customImage && ` ${(item.customImage.metadata?.fileSize / 1024).toFixed(1)}KB`}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ✅ ENHANCED: Sticky Order Summary */}
          <div className="text-slate-900 bg-white h-max rounded-md p-6 shadow-sm border border-gray-300 sticky top-[var(--header-height)]">
            <h3 className="text-base font-semibold text-slate-900">Order Summary</h3>
            <ul className="text-slate-500 font-medium text-sm divide-y divide-gray-300 mt-4">
              <li className="flex flex-wrap gap-4 py-3">
                Subtotal 
                <span className="ml-auto font-semibold text-slate-900">${total.toFixed(2)}</span>
              </li>
              <li className="flex flex-wrap gap-4 py-3">
                Shipping 
                <span className="ml-auto font-semibold text-slate-900">Calculated at checkout</span>
              </li>
              <li className="flex flex-wrap gap-4 py-3">
                Tax 
                <span className="ml-auto font-semibold text-slate-900">Calculated at checkout</span>
              </li>
              <li className="flex flex-wrap gap-4 py-3 font-semibold text-slate-900 text-lg">
                Total 
                <span className="ml-auto">${total.toFixed(2)}</span>
              </li>
            </ul>
            
            {/* ✅ FIXED: Checkout Button that uses proceedToCheckout */}
            <button 
              type="button" 
              onClick={proceedToCheckout}
              disabled={checkoutLoading}
              className="mt-6 text-sm font-medium px-4 py-2.5 tracking-wide w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Proceed to Checkout'
              )}
            </button>
            <p className="text-center text-slate-500 text-xs mt-4">
              🔒 Secure checkout powered by Stripe
            </p>
          </div>
        </div>

        {/* ✅ PRESERVE: Continue Shopping Link */}
        <div className="text-center mt-8">
          <Link 
            href="/products" 
            className="text-blue-600 hover:underline font-medium"
          >
            ← Continue Shopping
          </Link>
        </div>

        {/* ✅ ENHANCED: Full Debug Section */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-4 border-t border-gray-300">
            <h6 className="text-amber-600 font-semibold mb-3">🔧 Developer Mode - Cart Debug</h6>
            
            <div className="bg-slate-900 p-4 rounded mb-3">
              <h6 className="text-slate-400 text-sm mb-2">📦 Raw Cart Data (with IndexedDB images)</h6>
              <pre className="text-slate-100 text-xs overflow-auto" style={{ maxHeight: '300px' }}>
                {JSON.stringify(cart, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}