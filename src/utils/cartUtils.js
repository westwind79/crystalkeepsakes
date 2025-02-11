// File: src/utils/cartUtils.js
// Purpose: Manages all cart operations using localStorage
// Location: This file should be in your src/utils folder
// Usage: Import this in components that need cart functionality (ProductDetail.jsx, Cart.jsx)

/**
 * Constants for cart management
 */
const CART_STORAGE_KEY = 'crystal_cart';  // Key used in localStorage
const MAX_CART_ITEMS = 10;                // Maximum items allowed in cart
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB localStorage limit

/**
 * Custom error class for cart-specific errors
 */
export class CartError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CartError';
    this.code = code;
  }
}

/**
 * Main cart utility object with all cart operations
 */
export const CartUtils = {
  /**
   * Validates the structure of a cart item
   * @param {Object} item - Cart item to validate
   * @throws {CartError} If item structure is invalid
   */
  validateCartItem(item) {
    const requiredFields = ['productId', 'name', 'price', 'options'];
    
    // Check if all required fields exist
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new CartError(
          `Missing required field: ${field}`,
          'INVALID_ITEM_STRUCTURE'
        );
      }
    }

    // Validate price
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new CartError(
        'Price must be a positive number',
        'INVALID_PRICE'
      );
    }

    // Validate options structure
    if (!item.options.size || !item.options.background || !item.options.lightBase) {
      throw new CartError(
        'Missing required options',
        'INVALID_OPTIONS'
      );
    }

    // Validate image presence
    if (!item.options.imageUrl) {
      throw new CartError(
        'Image is required',
        'MISSING_IMAGE'
      );
    }
  },

  /**
   * Gets the current cart from localStorage
   * @returns {Array} Array of cart items
   * @throws {CartError} If there's an error reading from localStorage
   */
  getCart() {
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      throw new CartError(
        'Failed to load cart data',
        'STORAGE_READ_ERROR'
      );
    }
  },

  /**
   * Adds an item to the cart
   * @param {Object} item - Item to add to cart
   * @throws {CartError} If validation fails or storage limit reached
   */
  addToCart(item) {
    try {
      // Validate item structure
      this.validateCartItem(item);

      // Get current cart
      const cart = this.getCart();

      // Check cart size limit
      if (cart.length >= MAX_CART_ITEMS) {
        throw new CartError(
          `Cart cannot exceed ${MAX_CART_ITEMS} items`,
          'CART_LIMIT_REACHED'
        );
      }

      // Add unique ID and timestamp
      const cartItem = {
        ...item,
        cartId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date().toISOString()
      };

      // Add to cart
      cart.push(cartItem);

      // Check storage size before saving
      const cartString = JSON.stringify(cart);
      if (cartString.length > MAX_STORAGE_SIZE) {
        throw new CartError(
          'Cart storage limit exceeded',
          'STORAGE_LIMIT_EXCEEDED'
        );
      }

      // Save to localStorage
      localStorage.setItem(CART_STORAGE_KEY, cartString);
      
      return cartItem.cartId; // Return ID of added item
    } catch (error) {
      // Rethrow CartErrors as-is
      if (error instanceof CartError) {
        throw error;
      }
      // Wrap other errors
      throw new CartError(
        'Failed to add item to cart',
        'ADD_TO_CART_ERROR'
      );
    }
  },

  /**
   * Removes an item from the cart
   * @param {string} cartId - ID of item to remove
   * @throws {CartError} If item not found or storage error
   */
  removeItem(cartId) {
    try {
      const cart = this.getCart();
      const itemIndex = cart.findIndex(item => item.cartId === cartId);
      
      if (itemIndex === -1) {
        throw new CartError(
          'Item not found in cart',
          'ITEM_NOT_FOUND'
        );
      }

      cart.splice(itemIndex, 1);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      if (error instanceof CartError) {
        throw error;
      }
      throw new CartError(
        'Failed to remove item from cart',
        'REMOVE_ITEM_ERROR'
      );
    }
  },

  /**
   * Clears all items from the cart
   * @throws {CartError} If there's an error clearing the cart
   */
  clearCart() {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      throw new CartError(
        'Failed to clear cart',
        'CLEAR_CART_ERROR'
      );
    }
  },

  /**
   * Calculates the total price of items in the cart
   * @returns {number} Total price
   * @throws {CartError} If there's an error calculating total
   */
  getTotal() {
    try {
      const cart = this.getCart();
      return cart.reduce((total, item) => {
        if (typeof item.price !== 'number') {
          throw new CartError(
            'Invalid price in cart item',
            'INVALID_PRICE_FORMAT'
          );
        }
        return total + item.price;
      }, 0);
    } catch (error) {
      if (error instanceof CartError) {
        throw error;
      }
      throw new CartError(
        'Failed to calculate cart total',
        'TOTAL_CALCULATION_ERROR'
      );
    }
  }
};