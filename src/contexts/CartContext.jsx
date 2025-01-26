// contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { CartUtils } from '../utils/cartUtils'; 

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load initial cart
  useEffect(() => {
    const items = CartUtils.getCart();
    setCartItems(items);
    setCartCount(items.length);
  }, []);

  const updateCart = () => {
    const items = CartUtils.getCart();
    setCartItems(items);
    setCartCount(items.length);
  };

  const addToCart = async (item) => {
    await CartUtils.addToCart(item);
    updateCart();
  };

  const removeFromCart = (cartId) => {
    CartUtils.removeItem(cartId);
    updateCart();
  };

  const clearCart = () => {
    CartUtils.clearCart();
    updateCart();
  };

  return (
    <CartContext.Provider 
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        clearCart,
        updateCart
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