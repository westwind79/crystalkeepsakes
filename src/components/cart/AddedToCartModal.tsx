// components/cart/AddedToCartModal.tsx
// Modal that appears when item is added to cart
'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, ShoppingCart, ArrowRight } from 'lucide-react'

interface AddedToCartModalProps {
  show: boolean
  onClose: () => void
  itemDetails?: {
    name: string
    image: string
    price: number
    quantity: number
    options?: string[]
  }
}

export default function AddedToCartModal({ show, onClose, itemDetails }: AddedToCartModalProps) {
  const router = useRouter()

  if (!show) return null

  const handleViewCart = () => {
    onClose()
    router.push('/cart')
  }

  const handleContinueShopping = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-slate-800 text-white border-2 border-[var(--brand-350)] border-brand-500/30 rounded-2xl shadow-2xl shadow-brand-500/20 max-w-lg w-full animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--brand-800)]/90 rounded-full flex items-center justify-center">
                <ShoppingCart className="text-[var(--brand-350)]" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--brand-500)]">Added to Cart!</h3>
                <p className="text-sm text-text-secondary">Item successfully added</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          {/* Item Details */}
          {itemDetails && (
            <div className="p-6 border-b border-gray-700">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative w-48 h-48 bg-dark-bg rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={itemDetails.image}
                    alt={itemDetails.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-text-primary mb-2 truncate">
                    {itemDetails.name}
                  </h4>
                  
                  {/* Options */}
                  {itemDetails.options && itemDetails.options.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {itemDetails.options.map((option, index) => (
                        <p key={index} className="text-sm text-text-secondary truncate">
                          {option}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Price & Quantity */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-brand-400 font-bold text-xl">
                      ${itemDetails.price.toFixed(2)}
                    </span>
                    <span className="text-text-tertiary">
                      Qty: {itemDetails.quantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* View Cart Button */}
            <button
              onClick={handleViewCart}
              className="cursor-pointer w-full px-6 py-4 bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-[var(--brand-500)]/50 group"
            >
              <span>View Cart & Checkout</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Continue Shopping Button */}
            <button
              onClick={handleContinueShopping}
              className="cursor-pointer w-full px-6 py-4 bg-transparent border-2 border-gray-600 hover:border-[var(--brand-400)] text-text-primary hover:text-[var(--brand-400)] rounded-lg font-semibold transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
