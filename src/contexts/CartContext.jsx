// contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartUtils, storageUtils } from '../utils/cartUtils'; 

const CartContext = createContext();
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const cleanupTimeoutRef = useRef(null);
  const lastCleanupRef = useRef(Date.now());

  // Load initial cart and set up listener for storage changes
  useEffect(() => {
    const updateCart = () => {
      try {
        const items = CartUtils.getCart();
        setCartItems(items);
        setCartCount(items.length);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    };

    // Initial cart load
    updateCart();

    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCart);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCart);
    };
  }, []);

  // Separate effect for cleanup scheduling
  useEffect(() => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    // Only schedule cleanup if we have items
    if (cartItems.length > 0) {
      const now = Date.now();
      const timeSinceLastCleanup = now - lastCleanupRef.current;

      // If it's been less than our interval, wait for the remaining time
      const timeToNextCleanup = Math.max(
        CLEANUP_INTERVAL - timeSinceLastCleanup,
        CLEANUP_INTERVAL
      );

      cleanupTimeoutRef.current = setTimeout(() => {
        try {
          storageUtils.cleanupExpiredCartItems();
          storageUtils.cleanupUnusedImages();
          lastCleanupRef.current = Date.now();
          // Update cart after cleanup
          window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }, timeToNextCleanup);
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [cartItems.length]);

  const addToCart = async (item) => {
    try {
      await CartUtils.addToCart(item);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = (cartId) => {
    try {
      CartUtils.removeItem(cartId);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = () => {
    try {
      CartUtils.clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider 
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}