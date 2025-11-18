// app/cart/page.tsx
// Version: 2.5.0 - 2025-11-09 - TAILWIND DESIGN UPDATE
// ✅ Redesigned with Tailwind markup from reference design
// ✅ Maintained all existing cart functionality
// ✅ Improved layout with side-by-side cards and sticky summary
// ✅ Better product image display and option details
// Previous: Emerald theme styling

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: {
    size?: string
    background?: string
    lightBase?: string
    giftStand?: string
    customText?: string | { line1?: string; line2?: string }
    rawImageUrl?: string
    imageUrl?: string
    maskedImageUrl?: string
  }
  sizeDetails?: {
    name: string
    price: number
  }
  customImage?: {
    dataUrl: string
    filename: string
    mimeType: string
    fileSize: number
    width: number
    height: number
  }
  cockpit3d_id?: string
  dateAdded: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    loadCart()
  }, [])

  function loadCart() {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]')
    
    console.log('🛒 Cart loaded:', {
      itemCount: cartData.length,
      items: cartData.map((item: any, i: number) => ({
        index: i,
        name: item.name,
        hasCustomImage: !!item.customImage,
        hasDataUrl: !!item.customImage?.dataUrl,
        dataUrlLength: item.customImage?.dataUrl?.length || 0,
        hasOptionsImages: !!(item.options?.rawImageUrl || item.options?.imageUrl)
      }))
    })
    
    setCart(cartData)
    
    const sum = cartData.reduce((acc: number, item: CartItem) => {
      const itemPrice = item.price || (item as any).totalPrice || 0
      return acc + (itemPrice * item.quantity)
    }, 0)
    setTotal(sum)
    setLoading(false)
  }

  function removeItem(index: number) {
    const newCart = cart.filter((_, i) => i !== index)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    
    const sum = newCart.reduce((acc, item) => {
      const itemPrice = item.price || (item as any).totalPrice || 0
      return acc + (itemPrice * item.quantity)
    }, 0)
    setTotal(sum)
    
    window.dispatchEvent(new Event('cartUpdated'))
  }

  function updateQuantity(index: number, newQuantity: number) {
    if (newQuantity < 1) return
    
    const newCart = [...cart]
    newCart[index].quantity = newQuantity
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    
    const sum = newCart.reduce((acc, item) => {
      const itemPrice = item.price || (item as any).totalPrice || 0
      return acc + (itemPrice * item.quantity)
    }, 0)
    setTotal(sum)
    
    window.dispatchEvent(new Event('cartUpdated'))
  }

  function clearCart() {
    if (!window.confirm('Are you sure you want to clear your cart?')) return
    
    setCart([])
    setTotal(0)
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cartUpdated'))
  }

  // Build Cockpit3D order structure
  function buildCockpitOrder(): any {
    const orderNumber = `CK-${Date.now()}`
    
    return {
      order_id: orderNumber,
      customer_name: '',
      email: '',
      phone: '',
      staff_user: 'Web Order',
      shipping_method: 'air',
      destination: 'customer_home',
      shipping_address: {},
      billing_address: {},
      items: cart.map(item => ({
        sku: item.sku || item.productId,
        qty: item.quantity,
        price: item.price || (item as any).totalPrice || 0,
        name: item.name,
        custom_options: buildCustomOptions(item),
        custom_image_url: item.customImage?.dataUrl || item.options.rawImageUrl || item.options.imageUrl || undefined
      })),
      total: total
    }
  }

  function buildCustomOptions(item: CartItem) {
    const options: Array<{ option_id: string; option_value: string }> = []
    
    const getOptionValue = (option: any): string => {
      if (!option) return ''
      if (typeof option === 'string') return option
      if (typeof option === 'object') return option.name || option.id || String(option)
      return String(option)
    }
    
    if (item.options.size) {
      options.push({
        option_id: 'size',
        option_value: item.sizeDetails?.name || getOptionValue(item.options.size)
      })
    }
    
    if (item.options.background) {
      options.push({
        option_id: 'background',
        option_value: getOptionValue(item.options.background)
      })
    }
    
    if (item.options.lightBase) {
      options.push({
        option_id: 'lightBase',
        option_value: getOptionValue(item.options.lightBase)
      })
    }
    
    if (item.options.giftStand) {
      options.push({
        option_id: 'giftStand',
        option_value: getOptionValue(item.options.giftStand)
      })
    }
    
    if (item.options.customText) {
      const textValue = typeof item.options.customText === 'string' 
        ? item.options.customText
        : [
            item.options.customText.line1 && `Line 1: ${item.options.customText.line1}`,
            item.options.customText.line2 && `Line 2: ${item.options.customText.line2}`
          ].filter(Boolean).join(' | ')
      
      options.push({
        option_id: 'customText',
        option_value: textValue
      })
    }
    
    return options
  }

  async function proceedToCheckout() {
    setCheckoutLoading(true)
    
    try {
      // Build order structure
      const orderData = buildCockpitOrder()
      
      // Store in session for checkout page
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        cartItems: cart,
        subtotal: total,
        total: total,
        orderNumber: orderData.order_id,
        cockpitOrderData: orderData
      }))
      
      // Navigate to checkout
      window.location.href = '/checkout'
      
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your cart is empty</h2>
            <p className="text-slate-600 mb-6">Add some beautiful crystal keepsakes to get started!</p>
            <Link 
              href="/" 
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
        <div className="flex items-center justify-between mb-6 text-slate-900">
          <h2 className="text-xl font-semibold text-slate-900">Your shopping cart</h2>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 relative">
          {/* Cart Items Column */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => {
              const displayImage = item.customImage?.dataUrl || 
                                 item.options.maskedImageUrl || 
                                 item.options.rawImageUrl || 
                                 item.options.imageUrl ||
                                 '/images/placeholder-product.jpg'
              
              return (
                <div key={index} className="p-6 text-slate-900 bg-white shadow-sm border border-gray-300 rounded-md relative">
                  <div className="flex items-start max-sm:flex-col gap-4 max-sm:gap-6">
                    
                    {/* Product Image */}
                    <div className="w-50 h-50 shrink-0">
                      {/* Should be Customer Saved Masked Image*/}
                      <img 
                        src={item.productImage} 
                        alt={item.name}
                        className="w-full max-w-md rounded-lg h-full object-cover"
                      />

                      {/* Should be Original Product Image*/}
                      <img 
                        src={item.customImage.dataUrl}
                        alt={item.name}
                        className="w-full max-w-md rounded-lg h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="sm:border-l sm:pl-4 sm:border-gray-300 w-full">
                      <p>{localStorage.getItem('cart')} </p>
                      <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
                       {item.options && Object.keys(item.options).length > 0 && (
                        <div className="text-sm text-gray-600 mt-2">
                          {Object.entries(item.options).map(([key, val]) => (
                            <p key={key}><strong>{key}:</strong> {val}</p>
                          ))}
                        </div>
                      )}
                      
                      {/* Product Specifications */}
                      <ul className="mt-4 text-sm text-slate-500 font-medium space-y-2">
                        {item.sku && (
                          <li>ID: #{item.productId}</li>
                        )}

                        {item.sku && (
                          <li>Item Price: ${item.price}</li>
                        )}
                        {item.sku && (
                          <li>SKU: {item.sku}</li>
                        )}
                        {item.sizeDetails && (
                          <li>Size: {item.sizeDetails.sizeName} - #{item.sizeDetails.sizeId}</li>
                        )}
                        {item.options.background && (
                          <li>
                            Background: {
                              typeof item.options.background === 'object' 
                                ? (item.options.background as any).name || (item.options.background as any).id
                                : item.options.background
                            }
                          </li>
                        )}
                        {item.options.lightBase && (
                          <li>
                            Light Base: {
                              typeof item.options.lightBase === 'object'
                                ? (item.options.lightBase as any).name || (item.options.lightBase as any).id
                                : item.options.lightBase
                            }
                          </li>
                        )}
                        {item.options.giftStand && (
                          <li>
                            Stand: {
                              typeof item.options.giftStand === 'object'
                                ? (item.options.giftStand as any).name || (item.options.giftStand as any).id
                                : item.options.giftStand
                            }
                          </li>
                        )}
                        {(item.customImage?.dataUrl || item.options.rawImageUrl) && (
                          <li className="text-emerald-600">✓ Custom Image Added</li>
                        )}
                        {item.options?.customText && (
                          <li className="text-slate-700">
                            <span className="font-semibold">Custom Text: </span>
                            {typeof item.options.customText === 'string' ? (
                              item.options.customText
                            ) : (
                              <>
                                {item.options.customText.line1 && <span>{item.options.customText.line1}</span>}
                                {item.options.customText.line2 && <span> | {item.options.customText.line2}</span>}
                              </>
                            )}
                          </li>
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
                        <div className="flex items-center">
                          <h4 className="text-base font-semibold text-slate-900">
                            ${((item.price || (item as any).totalPrice || 0) * item.quantity).toFixed(2)}
                          </h4>

                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-3 cursor-pointer shrink-0 fill-gray-400 hover:fill-red-500 absolute top-3.5 right-3.5" 
                            viewBox="0 0 320.591 320.591"
                            onClick={() => removeItem(index)}
                          >
                            <path d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"></path>
                            <path d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Debug Info (development only) */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="w-full mt-3 p-2 rounded border border-blue-200 bg-blue-50">
                          <small className="text-blue-700">
                            <strong>Debug:</strong><br/>
                            SKU: {item.sku || 'N/A'}<br/>
                            Cockpit3D ID: {item.cockpit3d_id || 'N/A'}<br/>
                            Has CustomImage: {item.customImage?.dataUrl ? 'Yes (new)' : item.options.rawImageUrl ? 'Yes (old)' : 'No'}<br/>
                            {item.customImage && `Image Size: ${(item.customImage.fileSize / 1024).toFixed(1)}KB`}
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Order Summary Column */}
          <div className="text-slate-900 bg-white h-max rounded-md p-6 shadow-sm border border-gray-300 sticky top-0">
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
              <li className="flex flex-wrap gap-4 py-3 font-semibold text-slate-900">
                Total 
                <span className="ml-auto">${total.toFixed(2)}</span>
              </li>
            </ul>
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

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-4 border-t border-gray-300">
            <h6 className="text-amber-600 font-semibold mb-3">🔧 Developer Mode - Cart Debug</h6>
            
            <div className="bg-slate-900 p-4 rounded mb-3">
              <h6 className="text-slate-400 text-sm mb-2">📦 Order Structure (Cockpit3D Format)</h6>
              <pre className="text-slate-100 text-xs overflow-auto" style={{ maxHeight: '300px' }}>
                {JSON.stringify(buildCockpitOrder(), null, 2)}
              </pre>
            </div>

            <div className="bg-slate-900 p-4 rounded">
              <h6 className="text-slate-400 text-sm mb-2">🛒 Raw Cart Data</h6>
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