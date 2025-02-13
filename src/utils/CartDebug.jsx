import React, { useState, useEffect } from 'react';
import { CartUtils, storageUtils } from './cartUtils';

const CartDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    cartItems: [],
    totalSize: 0,
    maxSize: 10 * 1024 * 1024, // 10MB
    itemCount: 0,
    maxItems: 10,
    storageUsage: 0,
    sessionStorageItems: [] // Added to track session storage
  });

  const updateDebugInfo = () => {
    try {
      // Get cart data
      const cartData = localStorage.getItem('crystal_cart');
      const cart = cartData ? JSON.parse(cartData) : [];
      const cartSize = cartData ? new Blob([cartData]).size : 0;
      
      // Get session storage info
      const sessionItems = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        const size = new Blob([value]).size;
        sessionItems.push({
          key,
          size: (size / 1024).toFixed(2) + 'KB',
          timestamp: key.split('_')[2] || 'N/A'
        });
      }

      // Calculate total session storage usage
      const totalSessionSize = storageUtils.getStorageUsage();
      
      setDebugInfo({
        cartItems: cart,
        totalSize: cartSize + totalSessionSize,
        maxSize: 10 * 1024 * 1024,
        itemCount: cart.length,
        maxItems: 10,
        storageUsage: (((cartSize + totalSessionSize) / (10 * 1024 * 1024)) * 100).toFixed(2),
        sessionStorageItems: sessionItems
      });
    } catch (error) {
      console.error('Debug info error:', error);
    }
  };

  useEffect(() => {
    updateDebugInfo();
    
    // Listen for storage changes
    window.addEventListener('storage', updateDebugInfo);
    
    // Create a custom event for cart updates
    const handleCartUpdate = () => updateDebugInfo();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Set up periodic updates
    const updateInterval = setInterval(updateDebugInfo, 5000);
    
    return () => {
      window.removeEventListener('storage', updateDebugInfo);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(updateInterval);
    };
  }, []);

  const handleClearCart = () => {
    CartUtils.clearCart();
    updateDebugInfo(); // Immediate update
    window.dispatchEvent(new Event('cartUpdated')); // Notify other components
  };

  const handleForceLocalStorageClear = () => {
    localStorage.clear();
    sessionStorage.clear();
    updateDebugInfo(); // Immediate update
    window.dispatchEvent(new Event('cartUpdated')); // Notify other components
  };

  return (
    <div className="p-4 bg-surface-800 rounded">
      <h3 className="text-xl mb-4">Cart Storage Debug</h3>
      
      <div className="grid gap-4">
        <div>
          <strong>Items in Cart:</strong> {debugInfo.itemCount} / {debugInfo.maxItems}
        </div>
        
        <div>
          <strong>Storage Usage:</strong>
          <div className="w-full bg-surface-700 rounded h-4 mt-1">
            <div 
              className="bg-brand-500 h-full rounded" 
              style={{ width: `${debugInfo.storageUsage}%` }}
            />
          </div>
          <div className="text-sm mt-1">
            {(debugInfo.totalSize / 1024).toFixed(2)}KB / {(debugInfo.maxSize / 1024 / 1024).toFixed(2)}MB
            ({debugInfo.storageUsage}%)
          </div>
        </div>

        {/* Added Session Storage Details */}
        <div>
          <strong>Session Storage Items:</strong>
          <div className="mt-2 text-sm">
            {debugInfo.sessionStorageItems.map((item, index) => (
              <div key={index} className="mb-1">
                {item.key}: {item.size} (Added: {new Date(parseInt(item.timestamp)).toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">     
            <button 
              onClick={handleClearCart}
              className="bg-error-light text-surface-900 px-4 py-2 rounded mr-2"
            >
              Clear Cart
            </button>
            
            <button 
              onClick={handleForceLocalStorageClear}
              className="bg-error-dark text-surface-50 px-4 py-2 rounded mr-2"
            >
              Force Clear All Storage
            </button>

            <button 
              onClick={() => {
                const { cleanedCount, spaceFreed } = storageUtils.cleanupUnusedImages();
                updateDebugInfo();
                window.dispatchEvent(new Event('cartUpdated'));
                alert(`Cleaned ${cleanedCount} unused images (${(spaceFreed / 1024).toFixed(2)}KB freed)`);
              }}
              className="bg-warning text-surface-900 px-4 py-2 rounded"
            >
              Clean Unused Images
            </button>

            <button 
              onClick={() => {
                const { clearedCount, spaceFreed } = storageUtils.clearOldImages(30); // 30 minutes timeout
                updateDebugInfo();
                window.dispatchEvent(new Event('cartUpdated'));
                alert(`Cleared ${clearedCount} old images (${(spaceFreed / 1024).toFixed(2)}KB freed)`);
              }}
              className="bg-warning text-surface-900 px-4 py-2 rounded"
            >
              Clear Old Images (&gt;30min)
            </button>
        </div>

        <div>
          <strong>Cart Contents:</strong>
          <pre className="mt-2 p-2 bg-surface-900 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.cartItems, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CartDebug;