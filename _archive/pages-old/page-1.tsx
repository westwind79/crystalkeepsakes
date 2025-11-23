// app/cart/page.tsx
// Version: 2.0.0 - 2025-11-10
// Updated to use IndexedDB image loading

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { 
  getCartWithImages, 
  removeFromCart, 
  clearCart, 
  getCartTotal,
  getImageStorageStats
} from '@/lib/cartUtils'
import { logger } from '@/utils/logger'

interface CartItemWithImage {
  productId: string
  name: string
  sku: string
  price: number
  quantity: number
  options: any
  sizeDetails?: any
  customImageId?: string
  customImageMetadata?: {
    filename?: string
    maskName?: string
    hasImage: boolean
  }
  customImage?: {
    dataUrl: string
    thumbnail: string
    metadata: any
  }
  cockpit3d_id?: string
  dateAdded: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItemWithImage[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)
  const [storageStats, setStorageStats] = useState<any>(null)

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

  const cartTotal = getCartTotal()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#8ac644] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-800">
        <section className="hero px-8 py-16 text-center">
          <div className="hero-content max-w-xl mx-auto">
            <h1 className="primary-header mb-4">Your Cart is Empty</h1>
            <p className="lead mb-8">Add some products to get started!</p>
            <Link 
              href="/products" 
              className="btn-primary inline-block"
            >
              Browse Products
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-800">
      {/* Hero Section */}
      <section className="hero px-8 py-16 text-center">
        <div className="hero-content max-w-xl mx-auto">
          <h1 className="primary-header mb-4">Shopping Cart</h1>
          <p className="lead">{cart.length} item{cart.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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

          {/* Cart Items */}
          <div className="bg-slate-700 rounded-lg shadow-xl">
            {cart.map((item, index) => (
              <div key={index} className="border-b border-slate-600 p-6 last:border-b-0">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image or Custom Image */}
                  <div className="w-full md:w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center">
                    {item.customImage?.thumbnail ? (
                      <img 
                        src={item.customImage.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-500">No Image</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-gray-400 mb-2">SKU: {item.sku}</p>
                    
                    {/* Options */}
                    {item.options && Object.keys(item.options).length > 0 && (
                      <div className="text-sm text-gray-300 mb-2">
                        {Object.entries(item.options).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom Image Metadata */}
                    {item.customImageMetadata?.hasImage && (
                      <div className="text-sm text-green-400">
                        ✓ Custom Image: {item.customImageMetadata.filename || 'Uploaded'}
                        {item.customImageMetadata.maskName && (
                          <span> ({item.customImageMetadata.maskName})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#8ac644]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-gray-400">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(index)}
                      disabled={removing === index}
                      className="mt-4 p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50"
                    >
                      {removing === index ? (
                        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Cart Summary */}
            <div className="bg-slate-800 p-6 rounded-b-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-3xl font-bold text-[#8ac644]">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleClearCart}
                  className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Clear Cart
                </button>
                <Link
                  href="/checkout"
                  className="flex-1 py-3 px-6 bg-[#8ac644] hover:bg-[#7ab534] text-black rounded-lg font-bold text-center transition-colors"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>

          {/* Continue Shopping Link */}
          <div className="text-center mt-8">
            <Link 
              href="/products" 
              className="text-[#8ac644] hover:underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}