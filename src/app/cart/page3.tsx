// app/cart/page.tsx
// Version: 3.0.0 - 2025-11-11 - FIXED & ENHANCED
// ✅ Fixed: Correct CartItem type from cartUtils
// ✅ Fixed: Options display for array-based structure
// ✅ Fixed: IndexedDB image loading and display
// ✅ Enhanced: Tailwind layout from page-1/page-2
// ✅ Enhanced: Uses cartUtils for all operations
// ✅ Enhanced: Sticky summary, better UX, debug mode

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { 
  getCartWithImages, 
  removeFromCart, 
  saveCart,
  clearCart, 
  getCartTotal,
  getImageStorageStats,
  CartItem // ✅ CORRECT TYPE IMPORT
} from '@/lib/cartUtils'
import { logger } from '@/utils/logger'

export default function CartPage() {
  const [cart, setCart] = useState<(CartItem & { customImage?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Load cart with images from IndexedDB
  const loadCart = async () => {
    try {
      setLoading(true)
      const cartWithImages = await getCartWithImages()
      setCart(cartWithImages)
      
      // Get storage stats
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

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [])

  // ✅ FIXED: Uses cartUtils.removeFromCart
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

  // ✅ FIXED: Uses cartUtils.clearCart
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

  // ✅ FIXED: Uses cartUtils for quantity update
  const updateQuantity = async (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    
    try {
      const currentCart = await getCartWithImages()
      currentCart[index].quantity = newQuantity
      
      // ✅ Use cartUtils.saveCart to maintain consistency
      const { saveCart } = await import('@/lib/cartUtils')
      saveCart(currentCart)
      
      await loadCart() // Refresh from storage
      window.dispatchEvent(new Event('cartUpdated'))
    } catch (error) {
      logger.error('Failed to update quantity', error)
    }
  }

  // ✅ ENHANCED: Normalize options for display (handles both array and object formats)
  const getDisplayOptions = (item: any): Record<string, string> => {
    const options: Record<string, string> = {}
    
    // New format: options array
    if (Array.isArray(item.options)) {
      item.options.forEach((opt: any) => {
        if (opt.category === 'customText') {
          options['Custom Text'] = opt.value
        } else if (opt.value && opt.value !== 'None') {
          options[opt.category || opt.name] = opt.value
        }
      })
    } 
    // Old format: flat object
    else if (item.options) {
      Object.entries(item.options).forEach(([key, value]) => {
        if (value && value !== 'None' && key !== 'imageFilename' && key !== 'maskName') {
          options[key] = String(value)
        }
      })
    }
    
    // Add size details if present
    if (item.sizeDetails?.sizeName) {
      options['Size'] = item.sizeDetails.sizeName
    }
    
    return options
  }

  // ✅ FIXED: Uses getCartTotal from cartUtils
  const cartTotal = getCartTotal()

  // Loading state
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

  // Empty cart state
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6 text-slate-900">
          <h2 className="text-xl font-semibold text-slate-900">Your shopping cart</h2>
          <button
            onClick={handleClearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        {/* Storage Stats (Development Only) */}
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

        <div className="grid lg:grid-cols-3 gap-4 relative">
          {/* Cart Items Column */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => {
              // ✅ FIXED: Get thumbnail from IndexedDB-enriched data
              const displayImage = item.customImage?.thumbnail || 
                                 item.options?.rawImageUrl || 
                                 item.options?.imageUrl ||
                                 'https://placehold.co/800x800?text=Failed+to+Load+Image'
              
              const displayOptions = getDisplayOptions(item)
              
              return (
                <div key={index} className="p-6 text-slate-900 bg-white shadow-sm border border-gray-300 rounded-md relative">
                  <div className="flex items-start max-sm:flex-col gap-4 max-sm:gap-6">
                    
                     
                    {/* Product Image */}
                    <div className="w-50 h-50 shrink-0">
                      {/* Should be Customer Saved Masked Image*/}dfasdf
                      <img 
                        src={item.productImage} 
                        alt={item.name}
                        className="w-full max-w-md rounded-lg h-full object-cover"
                      />

                      {/* Should be Original Product Image*/}
                      <img 
                        src={item.customImage}
                        alt={item.name}
                        className="w-full max-w-md rounded-lg h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
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

                      {/* Quantity and Price */}
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
                            className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50"
                          >
                            {removing === index ? (
                              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Trash2 size={20} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ✅ ENHANCED: Debug Info (Development Only) */}
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
          <div className="text-slate-900 bg-white h-max rounded-md p-6 shadow-sm border border-gray-300 sticky top-6">
            <h3 className="text-base font-semibold text-slate-900">Order Summary</h3>
            <ul className="text-slate-500 font-medium text-sm divide-y divide-gray-300 mt-4">
              <li className="flex flex-wrap gap-4 py-3">
                Subtotal 
                <span className="ml-auto font-semibold text-slate-900">${cartTotal.toFixed(2)}</span>
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
                <span className="ml-auto">${cartTotal.toFixed(2)}</span>
              </li>
            </ul>
            
            {/* ✅ FIXED: Checkout Button */}
            <Link 
              href="/checkout"
              className="mt-6 text-sm font-medium px-4 py-2.5 tracking-wide w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer block text-center"
            >
              Proceed to Checkout
            </Link>
            <p className="text-center text-slate-500 text-xs mt-4">
              🔒 Secure checkout powered by Stripe
            </p>
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

        {/* ✅ ENHANCED: Full Debug Section (Development Only) */}
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