// cartUtils.js
import imageCompression from 'browser-image-compression';

const CART_STORAGE_KEY = 'crystal_cart';
const MAX_CART_ITEMS = 10;
const MAX_STORAGE_SIZE = 10 * 1024 * 1024;
const CART_ITEM_EXPIRY = 5 * 60 * 1000; // 30 minutes in milliseconds

// Storage management utilities
const storageUtils = {
   
  // Get approximate storage usage
  getStorageUsage() {
    let total = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      total += (key.length + value.length) * 2; // Approximate bytes
    }
    return total;
  },

  // Get available storage space (approximate)
  getAvailableSpace() {
    try {
      // Test string to measure available space
      const testString = 'x'.repeat(1024 * 1024); // 1MB test string
      let space = 0;
      try {
        for (let i = 0; i < 10; i++) { // Test up to 10MB
          sessionStorage.setItem('__test__' + i, testString);
          space += testString.length;
        }
      } catch (e) {
        // We've hit the limit
      }
      // Clean up test items
      for (let i = 0; i < 10; i++) {
        sessionStorage.removeItem('__test__' + i);
      }
      return space;
    } catch (e) {
      console.warn('Failed to measure storage space:', e);
      return 0;
    }
  },

  // Aggressively clear space if needed
  async clearSpaceIfNeeded(neededBytes) {
    // First try clearing old images
    this.clearOldImages();
    
    // If still not enough space, remove oldest items one by one
    if (this.getAvailableSpace() < neededBytes) {
      const items = [];
      // Collect all image items with their timestamps
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('img_')) {
          const timestamp = parseInt(key.split('_')[2]);
          items.push({ key, timestamp });
        }
      }
      
      // Sort by timestamp and remove oldest first
      items.sort((a, b) => a.timestamp - b.timestamp);
      for (const item of items) {
        sessionStorage.removeItem(item.key);
        if (this.getAvailableSpace() >= neededBytes) {
          break;
        }
      }
    }
  },
   // Get all image keys from sessionStorage
  getAllImageKeys() {
    const imageKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('img_')) {
        imageKeys.push(key);
      }
    }
    return imageKeys;
  },
  // Extract storage key from image reference
  extractStorageKey(imageRef) {
    if (!imageRef?.startsWith('img_ref_')) return null;
    try {
      const parts = imageRef.split('_');
      const encodedKey = parts[parts.length - 1];
      return atob(encodedKey);
    } catch (error) {
      console.warn('Failed to extract storage key:', error);
      return null;
    }
  },
  getCartImageRefs() {
    try {
      const cartData = localStorage.getItem('crystal_cart');
      if (!cartData) return new Set();

      const cart = JSON.parse(cartData);
      const imageRefs = new Set();

      cart.forEach(item => {
        if (item.options) {
          // Add all possible image references from the item
          const { rawImageUrl, imageUrl, maskedImageUrl } = item.options;
          [rawImageUrl, imageUrl, maskedImageUrl].forEach(ref => {
            if (ref?.startsWith('img_ref_')) {
              const storageKey = this.extractStorageKey(ref);
              if (storageKey) imageRefs.add(storageKey);
            }
          });
        }
      });

      return imageRefs;
    } catch (error) {
      console.error('Error getting cart image refs:', error);
      return new Set();
    }
  },
  cleanupUnusedImages() {
    try {
      const activeRefs = this.getCartImageRefs();
      const storedImages = this.getAllImageKeys();
      let cleanedCount = 0;
      let spaceFreed = 0;

      storedImages.forEach(key => {
        // If the image isn't referenced in the cart
        if (!activeRefs.has(key)) {
          // Get size before removal for logging
          const value = sessionStorage.getItem(key);
          const size = value ? new Blob([value]).size : 0;
          
          // Remove the image
          sessionStorage.removeItem(key);
          
          cleanedCount++;
          spaceFreed += size;
        }
      });

      console.log(`Cleaned up ${cleanedCount} unused images, freed ${(spaceFreed / 1024).toFixed(2)}KB`);
      return { cleanedCount, spaceFreed };
    } catch (error) {
      console.error('Error cleaning up unused images:', error);
      return { cleanedCount: 0, spaceFreed: 0 };
    }
  },
  clearOldImages() {
    try {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('img_')) {
          const timestamp = parseInt(key.split('_')[2]);
          if (timestamp && timestamp < oneHourAgo) {
            sessionStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear old images:', error);
    }
  },
      // Private method to get raw cart data without cleanup
  _getRawCart() {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  },
  // In storageUtils object within cartUtils.js
  cleanupExpiredCartItems() {
    try {
      const cart = this._getRawCart();
      
      // If cart is invalid, reset everything
      if (!Array.isArray(cart)) {
        localStorage.setItem(CART_STORAGE_KEY, '[]');
        this.cleanupUnusedImages(); // Clean up any orphaned images
        window.dispatchEvent(new Event('cartUpdated'));
        return { removedCount: 0, spaceFreed: 0, validCart: [] };
      }

      const now = Date.now();
      let removedCount = 0;
      let spaceFreed = 0;
      
      // Check if entire cart has expired (no activity for expiry period)
      const lastActivity = Math.max(...cart.map(item => 
        new Date(item.dateAdded || 0).getTime()
      ));
      
      if (now - lastActivity > CART_ITEM_EXPIRY) {
        // Cart has completely expired - clear everything
        localStorage.setItem(CART_STORAGE_KEY, '[]');
        this.cleanupUnusedImages();
        window.dispatchEvent(new Event('cartUpdated'));
        return { 
          removedCount: cart.length, 
          spaceFreed: this.getStorageUsage(), 
          validCart: [] 
        };
      }

      // Filter out expired items
      const validCart = cart.filter(item => {
        if (!item || !item.dateAdded) {
          removedCount++;
          return false;
        }

        const itemDate = new Date(item.dateAdded).getTime();
        const isExpired = (now - itemDate) > CART_ITEM_EXPIRY;
        
        if (isExpired) {
          // Clean up associated images
          if (item.options) {
            ['rawImageUrl', 'imageUrl', 'maskedImageUrl'].forEach(key => {
              if (item.options[key]) {
                const storageKey = this.extractStorageKey(item.options[key]);
                if (storageKey) {
                  const value = sessionStorage.getItem(storageKey);
                  spaceFreed += value ? new Blob([value]).size : 0;
                  sessionStorage.removeItem(storageKey);
                }
              }
            });
          }
          removedCount++;
          return false;
        }
        return true;
      });

      // Update storage and trigger UI updates if anything changed
      if (removedCount > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCart));
        this.cleanupUnusedImages();
        window.dispatchEvent(new Event('cartUpdated'));
      }

      return { removedCount, spaceFreed, validCart };
    } catch (error) {
      console.error('Error cleaning up expired cart items:', error);
      return { removedCount: 0, spaceFreed: 0, validCart: [] };
    }
  },

};

// Updated compression settings
const compressionSettings = {
  raw: {
    maxSizeMB: 1.5,           // Reduced from 2MB
    maxWidthOrHeight: 2000,   // Reduced from 2400
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85      // Reduced from 0.9
  },
  preview: {
    maxSizeMB: 0.3,          // Reduced from 0.5
    maxWidthOrHeight: 800,    // Reduced from 1200
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75      // Reduced from 0.8
  },
  masked: {
    maxSizeMB: 0.75,         // Reduced from 1
    maxWidthOrHeight: 1600,   // Reduced from 1920
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8       // Reduced from 0.85
  }
};

// Updated storeImage function
const storeImage = async (imageData, type) => {
  try {
    if (!imageData) return null;
    
    if (!imageData.startsWith('data:')) {
      return imageData;
    }

    const timestamp = Date.now();
    const storageKey = `img_${type}_${timestamp}`;
    
    // Estimate needed space
    const estimatedSize = imageData.length;
    
    // Try to clear space if needed using the correct reference
    await storageUtils.clearSpaceIfNeeded(estimatedSize);
    
    // Compress image
    let compressedImage = imageData;
    try {
      const fetchResponse = await fetch(imageData);
      const blob = await fetchResponse.blob();
      
      let options = compressionSettings[type] || compressionSettings.preview;
      
      // If original is very large, adjust compression
      if (blob.size > 5 * 1024 * 1024) {
        options = {
          ...options,
          maxSizeMB: options.maxSizeMB * 0.75,
          initialQuality: options.initialQuality * 0.9
        };
      }
      
      const compressedFile = await imageCompression(blob, options);
      
      const reader = new FileReader();
      compressedImage = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressedFile);
      });
      
      console.log(`Compressed ${type} image from ${(blob.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
    } catch (compressionError) {
      console.warn(`Compression failed for ${type} image:`, compressionError);
      throw new CartError('Image compression failed. Please try a smaller image.', 'COMPRESSION_ERROR');
    }
    
    try {
      sessionStorage.setItem(storageKey, compressedImage);
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError') {
        throw new CartError(
          'Unable to store image. Please clear your cart or try a smaller image.',
          'STORAGE_QUOTA_EXCEEDED'
        );
      }
      throw storageError;
    }
    
    return `img_ref_${type}_${btoa(storageKey)}`;
  } catch (error) {
    console.error(`Error storing ${type} image:`, error);
    throw new CartError(
      `Failed to store ${type} image: ${error.message}`, 
      error.code || 'IMAGE_STORAGE_ERROR'
    );
  }
};


// Retrieves an image from storage
const retrieveImage = (reference, type) => {
  try {
    // Early return if no reference
    if (!reference) return null;
    
    // Debugging line causing the message - let's remove it
    // console.log(`Image ${type} is not a reference, returning as is`);
    
    // If it's not a reference format, it's probably a data URL, return as is
    if (!reference.startsWith('img_ref_')) {
      return reference;
    }

    // Extract the storage key
    const prefix = `img_ref_${type}_`;
    const encodedKey = reference.slice(prefix.length);
    const storageKey = atob(encodedKey);
    
    // Retrieve the image data
    const imageData = sessionStorage.getItem(storageKey);
    if (!imageData) {
      // Silent fail - just return null if image not found
      return null;
    }

    return imageData;
  } catch (error) {
    // Silent fail - log error but don't break functionality
    console.error(`Error retrieving ${type} image:`, error);
    return null;
  }
};

export class CartError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CartError';
    this.code = code;
  }
}

export const CartUtils = {
  validateCartItem(item) {
    const requiredFields = ['productId', 'name', 'price', 'options'];
    for (const field of requiredFields) {
      if (!(field in item)) {
        throw new CartError(`Missing required field: ${field}`, 'INVALID_ITEM_STRUCTURE');
      }
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      throw new CartError('Price must be a positive number', 'INVALID_PRICE');
    }
    if (!item.options.size || !item.options.background || !item.options.lightBase) {
      throw new CartError('Missing required options', 'INVALID_OPTIONS');
    }
    if (!item.options.imageUrl) {
      throw new CartError('Image is required', 'MISSING_IMAGE');
    }
  },

  // Update addToCart to ensure dateAdded is set
  async addToCart(item) {
    try {
      this.validateCartItem(item);
      const cart = this.getCart();

      if (cart.length >= MAX_CART_ITEMS) {
        throw new CartError(`Cart cannot exceed ${MAX_CART_ITEMS} items`, 'CART_LIMIT_REACHED');
      }

      // Store images and create references
      const imageRefs = {};
      
      // Only store image if it's not already a reference
      if (item.options.imageUrl && !item.options.imageUrl.startsWith('img_ref_')) {
        imageRefs.imageUrl = await storeImage(item.options.imageUrl, 'preview');
      } else {
        imageRefs.imageUrl = item.options.imageUrl;
      }
      
      if (item.options.maskedImageUrl && !item.options.maskedImageUrl.startsWith('img_ref_')) {
        imageRefs.maskedImageUrl = await storeImage(item.options.maskedImageUrl, 'masked');
      } else {
        imageRefs.maskedImageUrl = item.options.maskedImageUrl;
      }

      // Create cart item with either new references or existing ones
      const cartItem = {
        ...item,
        options: {
          ...item.options,
          ...imageRefs
        },
        cartId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date().toISOString()
      };

      cart.push(cartItem);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      
      return cartItem.cartId;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      if (error instanceof CartError) throw error;
      throw new CartError('Failed to add item to cart', 'ADD_TO_CART_ERROR');
    }
  },

  // In CartUtils object
  getCart() {
    try {
      const cartData = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartData) return [];

      const cart = JSON.parse(cartData);
      if (!Array.isArray(cart)) return [];

      const now = Date.now();
      const validCart = cart.filter(item => {
        if (!item || !item.dateAdded) return false;
        const itemDate = new Date(item.dateAdded).getTime();
        return (now - itemDate) <= CART_ITEM_EXPIRY;
      });

      // Only update storage if items were removed
      if (validCart.length < cart.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCart));
      }

      return validCart;
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  },

  getFullCartItem(cartId) {
    try {
      if (!cartId) {
        console.warn('No cartId provided to getFullCartItem');
        return null;
      }

      const cart = this.getCart();
      if (!Array.isArray(cart)) {
        console.warn('Invalid cart data in getFullCartItem');
        return null;
      }

      const item = cart.find(item => item && item.cartId === cartId);
      if (!item) {
        console.warn(`Cart item not found: ${cartId}`);
        return null;
      }

      // Add defensive checks for item.options
      const options = item.options || {};
      
      return {
        ...item,
        options: {
          ...options,
          rawImageUrl: options.rawImageUrl ? retrieveImage(options.rawImageUrl, 'raw') : null,
          imageUrl: options.imageUrl ? retrieveImage(options.imageUrl, 'preview') : null,
          maskedImageUrl: options.maskedImageUrl ? retrieveImage(options.maskedImageUrl, 'masked') : null
        }
      };
    } catch (error) {
      console.error('Error getting full cart item:', error);
      return null;
    }
  },

  removeItem(cartId) {
    try {
      const cart = this.getCart();
      const itemIndex = cart.findIndex(item => item.cartId === cartId);
      if (itemIndex === -1) {
        throw new CartError('Item not found in cart', 'ITEM_NOT_FOUND');
      }
      cart.splice(itemIndex, 1);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      if (error instanceof CartError) throw error;
      throw new CartError('Failed to remove item from cart', 'REMOVE_ITEM_ERROR');
    }
  },

  clearCart() {
    try {
      // Clear both localStorage and sessionStorage
      localStorage.removeItem(CART_STORAGE_KEY);
      
      // Clear all image data from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('img_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      throw new CartError('Failed to clear cart', 'CLEAR_CART_ERROR');
    }
  },

  getTotal() {
    try {
      const cart = this.getCart();
      return cart.reduce((total, item) => {
        if (typeof item.price !== 'number') {
          throw new CartError('Invalid price in cart item', 'INVALID_PRICE_FORMAT');
        }
        return total + item.price;
      }, 0);
    } catch (error) {
      if (error instanceof CartError) throw error;
      throw new CartError('Failed to calculate cart total', 'TOTAL_CALCULATION_ERROR');
    }
  }
};

// Export helper functions for direct use in components
export const getFullImage = retrieveImage;
export { storeImage, storageUtils };
