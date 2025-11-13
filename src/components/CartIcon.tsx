// components/CartIcon.tsx
// Version: 1.1.0 | Date: 2025-11-08
// FIXED: Enhanced debugging and forced re-render on cart changes
// Previous: Cart count showing 0 when items exist

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Mark as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Initial count update
    updateCartCount()

    // Event handlers
    const handleCartUpdate = () => {
      console.log('🔔 CartIcon: cartUpdated event received')
      updateCartCount()
    }
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cart' || e.key === null) {
        console.log('🔔 CartIcon: storage event received', { key: e.key })
        updateCartCount()
      }
    }
    
    // Add event listeners
    window.addEventListener('cartUpdated', handleCartUpdate)
    window.addEventListener('storage', handleStorage)

    // Cleanup
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  function updateCartCount() {
    try {
      const cartRaw = localStorage.getItem('cart')
      console.log('📦 CartIcon: Reading cart from localStorage', { 
        exists: !!cartRaw,
        length: cartRaw?.length || 0
      })

      if (!cartRaw) {
        console.log('⚠️ CartIcon: No cart data found in localStorage')
        setItemCount(0)
        return
      }

      const cart = JSON.parse(cartRaw)
      console.log('📦 CartIcon: Cart parsed', { 
        items: cart.length,
        cartData: cart 
      })

      const count = cart.reduce((sum: number, item: any) => {
        const qty = item.quantity || 1
        console.log(`  - Item: ${item.name}, Qty: ${qty}`)
        return sum + qty
      }, 0)

      console.log(`✅ CartIcon: Updated count = ${count}`)
      setItemCount(count)
    } catch (error) {
      console.error('❌ CartIcon: Error reading cart', error)
      setItemCount(0)
    }
  }

  // Don't render on server-side
  if (!mounted) {
    return (
      <Link 
        href="/cart" 
        className="relative d-inline-flex align-items-center"
        style={{
          color: '#ffffff',
          textDecoration: 'none',
          padding: '8px 12px',
          transition: 'all 0.2s ease'
        }}
      >
        <ShoppingCart size={24} className="text-white" />
      </Link>
    )
  }

  console.log('🎨 CartIcon RENDER: itemCount =', itemCount)

  return (
    <Link 
      href="/cart" 
      className="relative d-inline-flex align-items-center"
      style={{
        color: '#ffffff',
        textDecoration: 'none',
        padding: '8px 12px',
        transition: 'all 0.2s ease'
      }}
    >
      <ShoppingCart size={24} className="text-white" />
      
      {itemCount > 0 && (
        <span 
          className="cart-badge"
          style={{
            position: 'absolute',
            top: '23px',
            right: '-21px',
            background: '#8ac644',
            color: '#000000',
            borderRadius: '12px',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            border: '2px solid #1a1a19',
            zIndex: 10
          }}
        >
          {itemCount > 10 ? '10+' : itemCount}
        </span>
      )}
    </Link>
  )
}