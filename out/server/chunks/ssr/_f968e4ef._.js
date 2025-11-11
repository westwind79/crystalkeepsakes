module.exports = {

"[project]/src/utils/logger.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// utils/logger.ts
// Version: 1.3.0 | Date: 2025-11-05
// ✅ Fixed: Added missing warn() method
// Environment-aware logging utility
__turbopack_context__.s({
    "isDevelopment": ()=>isDevelopment,
    "isProduction": ()=>isProduction,
    "isTesting": ()=>isTesting,
    "logger": ()=>logger
});
const ENV_MODE = ("TURBOPACK compile-time value", "development") || 'development';
const IS_DEV = ENV_MODE === 'development';
const IS_TEST = ENV_MODE === 'testing';
const IS_PROD = ENV_MODE === 'production';
// Only log in dev and testing modes
const shouldLog = IS_DEV || IS_TEST;
const logger = {
    // API calls
    api: (endpoint, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`🌐 API Call: ${endpoint}`, data);
    },
    // Success messages
    success: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`✅ ${message}`, data);
    },
    // Warning messages
    warn: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.warn(`⚠️ ${message}`, data);
    },
    // Error tracking
    error: (message, error)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.error(`❌ ${message}`, error);
    },
    // Image loading
    image: (status, path)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const icon = status === 'loaded' ? '✅' : status === 'error' ? '❌' : '⏳';
        console.log(`${icon} Image ${status}: ${path}`);
    },
    // Order processing
    order: (step, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`📦 Order ${step}:`, data);
    },
    // Product data
    product: (action, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`🔷 Product ${action}:`, data);
    },
    // Payment processing
    payment: (step, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`💳 Payment ${step}:`, data);
    },
    // General info
    info: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log(`ℹ️ ${message}`, data);
    }
};
const isDevelopment = IS_DEV;
const isTesting = IS_TEST;
const isProduction = IS_PROD;
}),
"[project]/src/lib/cartUtils.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// lib/cartUtils.ts
// Version: 1.4.0 - 2025-11-08 - ENHANCED QUOTA MANAGEMENT
// Fixed: QuotaExceededError with aggressive cleanup
// Removes ALL image URLs from options object (prevents duplicates)
// Better compression: 100x100 thumbnails at 50% quality
// Automatic cleanup when approaching quota limit
// Previous: 150x150 thumbnails with basic compression
__turbopack_context__.s({
    "addToCart": ()=>addToCart,
    "checkStorageHealth": ()=>checkStorageHealth,
    "clearCart": ()=>clearCart,
    "estimateSize": ()=>estimateSize,
    "getCart": ()=>getCart,
    "getCartItemCount": ()=>getCartItemCount,
    "getCartTotal": ()=>getCartTotal,
    "getFullResImage": ()=>getFullResImage,
    "removeFromCart": ()=>removeFromCart,
    "saveCart": ()=>saveCart,
    "storeFullResImage": ()=>storeFullResImage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-ssr] (ecmascript)");
;
/**
 * Compress image to TINY thumbnail for cart storage
 * Reduces base64 size by ~97% (e.g., 2MB -> 60KB)
 */ async function compressImageToThumbnail(dataUrl) {
    return new Promise((resolve, reject)=>{
        const img = new Image();
        img.onload = ()=>{
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 100 // Reduced from 150 to 100 for smaller size
            ;
            let width = img.width;
            let height = img.height;
            // Maintain aspect ratio
            if (width > height) {
                if (width > MAX_SIZE) {
                    height = height * MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width = width * MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Lower quality JPEG for minimal size (reduced from 0.6 to 0.5)
            resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = ()=>reject(new Error('Image compression failed'));
        img.src = dataUrl;
    });
}
/**
 * Clean options object - remove ALL image data URLs
 * This prevents duplicate storage of images in both customImage AND options
 */ function cleanOptions(options) {
    if (!options) return {};
    const cleaned = {
        ...options
    };
    // Remove all image data URLs from options
    delete cleaned.rawImageUrl;
    delete cleaned.imageUrl;
    delete cleaned.maskedImageUrl;
    // Keep only essential metadata
    return {
        ...cleaned,
        size: cleaned.size,
        background: cleaned.background,
        lightBase: cleaned.lightBase,
        giftStand: cleaned.giftStand,
        customText: cleaned.customText,
        // Only keep image filenames, not data URLs
        originalImageFilename: cleaned.imageFilename,
        imageFilename: cleaned.imageFilename,
        maskName: cleaned.maskName
    };
}
async function addToCart(item) {
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].order('Adding item to cart', {
        hasCustomImage: !!item.customImage,
        originalImageSize: item.customImage?.dataUrl?.length || 0
    });
    try {
        // Check storage health BEFORE adding
        const healthCheck = checkStorageHealth();
        if (!healthCheck.isHealthy) {
            throw new Error(healthCheck.message || 'Storage quota exceeded. Please clear your cart.');
        }
        const cart = getCart();
        // ✅ Upload original and masked images to server
        if (item.customImage?.dataUrl) {
            const originalUrl = item.options?.rawImageUrl || item.customImage.dataUrl;
            const maskedUrl = item.customImage.dataUrl;
            try {
                const originalRes = await fetch('/api/upload-image.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image: originalUrl,
                        orderNumber: 'temp',
                        cartItemId: item.productId,
                        imageType: 'original'
                    })
                });
                const maskedRes = await fetch('/api/upload-image.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image: maskedUrl,
                        orderNumber: 'temp',
                        cartItemId: item.productId,
                        imageType: 'masked'
                    })
                });
                const originalData = await originalRes.json();
                const maskedData = await maskedRes.json();
                if (originalData.success) {
                    cartItem.options.originalImageUrl = originalData.url;
                }
                if (maskedData.success) {
                    cartItem.options.maskedImageUrl = maskedData.url;
                }
            } catch (err) {
                console.warn('Image upload failed', err);
            }
        }
        // Store full-resolution image in sessionStorage for checkout
        let originalImageUrl = null;
        if (item.customImage?.dataUrl) {
            originalImageUrl = item.customImage.dataUrl;
            const imageId = `${item.productId}_${Date.now()}`;
            storeFullResImage(imageId, originalImageUrl);
        }
        // Compress custom image if present
        let compressedCustomImage = item.customImage;
        if (item.customImage?.dataUrl) {
            try {
                const thumbnailUrl = await compressImageToThumbnail(item.customImage.dataUrl);
                compressedCustomImage = {
                    ...item.customImage,
                    dataUrl: thumbnailUrl,
                    fullResId: originalImageUrl ? `${item.productId}_${Date.now()}` : undefined
                };
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Image compressed', {
                    original: item.customImage.dataUrl.length,
                    compressed: thumbnailUrl.length,
                    reduction: ((1 - thumbnailUrl.length / item.customImage.dataUrl.length) * 100).toFixed(1) + '%'
                });
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Image compression failed, skipping image', error);
                // Skip image entirely rather than risk quota error
                compressedCustomImage = undefined;
            }
        }
        // Clean options to remove duplicate image data
        const cleanedOptions = cleanOptions(item.options);
        // Map to CartItem format
        const cartItem = {
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            price: item.price || item.totalPrice,
            quantity: item.quantity,
            options: cleanedOptions,
            sizeDetails: item.size || item.sizeDetails,
            customImage: compressedCustomImage,
            cockpit3d_id: item.cockpit3d_id,
            dateAdded: item.dateAdded || new Date().toISOString()
        };
        // Store original uploaded image in sessionStorage
        if (item.options?.rawImageUrl || item.options?.imageUrl) {
            const originalUrl = item.options.rawImageUrl || item.options.imageUrl;
            const imageId = `original_${item.productId}_${Date.now()}`;
            sessionStorage.setItem(imageId, originalUrl);
            // Save the ID in the cart item
            cartItem.options.originalImageId = imageId;
        }
        cart.push(cartItem);
        saveCart(cart);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].success('Item added to cart', {
            totalItems: cart.length,
            hasImage: !!cartItem.customImage,
            cartSizeKB: (JSON.stringify(cart).length / 1024).toFixed(2)
        });
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to add item to cart', error);
        throw error;
    }
}
function getCart() {
    try {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to read cart', error);
        return [];
    }
}
function saveCart(cart) {
    try {
        const cartJson = JSON.stringify(cart);
        const sizeKB = (cartJson.length / 1024).toFixed(2);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Saving cart', {
            items: cart.length,
            sizeKB
        });
        // Check if we're approaching quota
        const healthCheck = checkStorageHealth();
        if (healthCheck.percentUsed > 85) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Storage approaching limit, attempting cleanup');
            // Try to compress existing images further if needed
            const cleaned = cleanupOldCartData();
            if (cleaned > 0) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info(`Cleaned up ${cleaned} bytes from cart`);
            }
        }
        localStorage.setItem('cart', cartJson);
        // Dispatch custom event to notify all listeners
        const event = new CustomEvent('cartUpdated', {
            detail: {
                itemCount: cart.length,
                totalItems: cart.reduce((sum, item)=>sum + item.quantity, 0)
            }
        });
        window.dispatchEvent(event);
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Cart storage quota exceeded', {
                itemCount: cart.length,
                sizeKB: (JSON.stringify(cart).length / 1024).toFixed(2)
            });
            // Last resort: try to save without images
            try {
                const cartWithoutImages = cart.map((item)=>({
                        ...item,
                        customImage: item.customImage ? {
                            ...item.customImage,
                            dataUrl: '' // Remove thumbnail data URL
                        } : undefined
                    }));
                localStorage.setItem('cart', JSON.stringify(cartWithoutImages));
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Cart saved without image thumbnails to prevent quota error');
                alert('Cart is full. Images have been removed to save your items. You can still checkout.');
            } catch (fallbackError) {
                throw new Error('Cart storage full. Please remove some items or clear cart.');
            }
        } else {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to save cart', error);
            throw error;
        }
    }
}
/**
 * Cleanup old or unnecessary data from cart
 */ function cleanupOldCartData() {
    try {
        const cart = getCart();
        let savedBytes = 0;
        const originalSize = JSON.stringify(cart).length;
        // Remove image thumbnails from oldest items if needed
        const updatedCart = cart.map((item, index)=>{
            if (index < cart.length - 3 && item.customImage?.dataUrl) {
                // Keep only the 3 most recent items with images
                savedBytes += item.customImage.dataUrl.length;
                return {
                    ...item,
                    customImage: {
                        ...item.customImage,
                        dataUrl: '' // Remove thumbnail from older items
                    }
                };
            }
            return item;
        });
        if (savedBytes > 0) {
            localStorage.setItem('cart', JSON.stringify(updatedCart));
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Cleaned up old cart images', {
                savedBytes
            });
        }
        return savedBytes;
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Cleanup failed', error);
        return 0;
    }
}
function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
}
function clearCart() {
    localStorage.removeItem('cart');
    // Also clear sessionStorage images
    try {
        const keys = Object.keys(sessionStorage);
        keys.forEach((key)=>{
            if (key.startsWith('fullimg_')) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Could not clear session images', error);
    }
    window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
            itemCount: 0,
            totalItems: 0
        }
    }));
}
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((sum, item)=>sum + item.quantity, 0);
}
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item)=>sum + item.price * item.quantity, 0);
}
function checkStorageHealth() {
    try {
        // Estimate total localStorage size
        let totalSize = 0;
        for(let key in localStorage){
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        // Most browsers have 5MB (5,242,880 bytes) limit
        const STORAGE_LIMIT = 5242880;
        const percentUsed = totalSize / STORAGE_LIMIT * 100;
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Storage health check', {
            usedBytes: totalSize,
            usedKB: (totalSize / 1024).toFixed(2),
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            percentUsed: percentUsed.toFixed(1) + '%'
        });
        // Warning at 80%, error at 90%
        if (percentUsed > 90) {
            return {
                isHealthy: false,
                usedSpace: totalSize,
                totalSpace: STORAGE_LIMIT,
                percentUsed,
                message: 'Storage critically full (>90%). Please clear your cart.'
            };
        }
        if (percentUsed > 80) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Storage approaching limit', {
                percentUsed: percentUsed.toFixed(1) + '%'
            });
            return {
                isHealthy: true,
                usedSpace: totalSize,
                totalSpace: STORAGE_LIMIT,
                percentUsed,
                message: 'Storage nearly full (>80%). Consider clearing cart soon.'
            };
        }
        return {
            isHealthy: true,
            usedSpace: totalSize,
            totalSpace: STORAGE_LIMIT,
            percentUsed
        };
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Storage health check failed', error);
        return {
            isHealthy: false,
            usedSpace: 0,
            totalSpace: 0,
            percentUsed: 100,
            message: 'Unable to check storage. Your browser may be blocking localStorage.'
        };
    }
}
function estimateSize(data) {
    try {
        return JSON.stringify(data).length;
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to estimate data size', error);
        return 0;
    }
}
function storeFullResImage(productId, dataUrl) {
    try {
        sessionStorage.setItem(`fullimg_${productId}`, dataUrl);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Full-res image stored in sessionStorage', {
            productId,
            sizeKB: (dataUrl.length / 1024).toFixed(2)
        });
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Could not store full-res image in sessionStorage', error);
        // Fallback: store a heavily compressed version
        try {
            compressImageToThumbnail(dataUrl).then((compressed)=>{
                sessionStorage.setItem(`fullimg_${productId}`, compressed);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Stored compressed fallback image');
            });
        } catch (e) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('All image storage methods failed', e);
        }
    }
}
function getFullResImage(productId) {
    try {
        return sessionStorage.getItem(`fullimg_${productId}`);
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Could not retrieve full-res image', error);
        return null;
    }
}
}),
"[project]/src/app/cart/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// app/cart/page.tsx
// Version: 2.0.0 - 2025-11-10
// Updated to use IndexedDB image loading
__turbopack_context__.s({
    "default": ()=>CartPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cartUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function CartPage() {
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [removing, setRemoving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [storageStats, setStorageStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Load cart with images from IndexedDB
    const loadCart = async ()=>{
        try {
            setLoading(true);
            const cartWithImages = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCartWithImages"])();
            setCart(cartWithImages);
            // Get storage stats
            const stats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getImageStorageStats"])();
            setStorageStats(stats);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Cart loaded with images', {
                items: cartWithImages.length,
                withImages: cartWithImages.filter((item)=>item.customImage).length
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to load cart', error);
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadCart();
        // Listen for cart updates
        const handleCartUpdate = ()=>{
            loadCart();
        };
        window.addEventListener('cartUpdated', handleCartUpdate);
        return ()=>{
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);
    const handleRemoveItem = async (index)=>{
        setRemoving(index);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["removeFromCart"])(index);
            await loadCart();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].success('Item removed from cart');
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to remove item', error);
        } finally{
            setRemoving(null);
        }
    };
    const handleClearCart = async ()=>{
        if (confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearCart"])();
                setCart([]);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].success('Cart cleared');
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to clear cart', error);
            }
        }
    };
    const cartTotal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCartTotal"])();
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-slate-800 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block w-12 h-12 border-4 border-[#8ac644] border-t-transparent rounded-full animate-spin mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400",
                        children: "Loading cart..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/cart/page.tsx",
            lineNumber: 114,
            columnNumber: 7
        }, this);
    }
    if (cart.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-slate-800",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "hero px-8 py-16 text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "hero-content max-w-xl mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "primary-header mb-4",
                            children: "Your Cart is Empty"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 128,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "lead mb-8",
                            children: "Add some products to get started!"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 129,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/products",
                            className: "btn-primary inline-block",
                            children: "Browse Products"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 130,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 127,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 126,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/cart/page.tsx",
            lineNumber: 125,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-slate-800",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "hero px-8 py-16 text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "hero-content max-w-xl mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "primary-header mb-4",
                            children: "Shopping Cart"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 147,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "lead",
                            children: [
                                cart.length,
                                " item",
                                cart.length !== 1 ? 's' : '',
                                " in your cart"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto px-4 py-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto",
                    children: [
                        ("TURBOPACK compile-time value", "development") === 'development' && storageStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-slate-700 rounded-lg p-4 mb-6 text-sm text-gray-300",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-bold mb-2",
                                    children: "Storage Stats:"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 157,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-2 gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "localStorage: ",
                                                storageStats.storageHealth.percentUsed.toFixed(1),
                                                "% used"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 159,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "IndexedDB Images: ",
                                                storageStats.totalImages
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 160,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "localStorage Size: ",
                                                (storageStats.storageHealth.usedSpace / 1024).toFixed(1),
                                                " KB"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 161,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "Image Storage: ",
                                                storageStats.estimatedSizeMB.toFixed(2),
                                                " MB"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 162,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 158,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 156,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-slate-700 rounded-lg shadow-xl",
                            children: [
                                cart.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-b border-slate-600 p-6 last:border-b-0",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col md:flex-row gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-full md:w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center",
                                                    children: item.customImage?.thumbnail ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: item.customImage.thumbnail,
                                                        alt: item.name,
                                                        className: "w-full h-full object-contain rounded-lg"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 175,
                                                        columnNumber: 23
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-500",
                                                        children: "No Image"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 181,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 173,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-xl font-bold text-white mb-2",
                                                            children: item.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 187,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-gray-400 mb-2",
                                                            children: [
                                                                "SKU: ",
                                                                item.sku
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 188,
                                                            columnNumber: 21
                                                        }, this),
                                                        item.options && Object.keys(item.options).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-300 mb-2",
                                                            children: Object.entries(item.options).map(([key, value])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: [
                                                                        key,
                                                                        ": ",
                                                                        String(value)
                                                                    ]
                                                                }, key, true, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 194,
                                                                    columnNumber: 27
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 192,
                                                            columnNumber: 23
                                                        }, this),
                                                        item.customImageMetadata?.hasImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-green-400",
                                                            children: [
                                                                "✓ Custom Image: ",
                                                                item.customImageMetadata.filename || 'Uploaded',
                                                                item.customImageMetadata.maskName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: [
                                                                        " (",
                                                                        item.customImageMetadata.maskName,
                                                                        ")"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 206,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 203,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col items-end justify-between",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-right",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-2xl font-bold text-[#8ac644]",
                                                                    children: [
                                                                        "$",
                                                                        (item.price * item.quantity).toFixed(2)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 215,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                    className: "text-gray-400",
                                                                    children: [
                                                                        "$",
                                                                        item.price.toFixed(2),
                                                                        " × ",
                                                                        item.quantity
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 218,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 214,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>handleRemoveItem(index),
                                                            disabled: removing === index,
                                                            className: "mt-4 p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50",
                                                            children: removing === index ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 229,
                                                                columnNumber: 25
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                size: 20
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 231,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 223,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 213,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 171,
                                            columnNumber: 17
                                        }, this)
                                    }, index, false, {
                                        fileName: "[project]/src/app/cart/page.tsx",
                                        lineNumber: 170,
                                        columnNumber: 15
                                    }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-slate-800 p-6 rounded-b-lg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-center mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xl font-bold text-white",
                                                    children: "Total:"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 242,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-3xl font-bold text-[#8ac644]",
                                                    children: [
                                                        "$",
                                                        cartTotal.toFixed(2)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 243,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 241,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: handleClearCart,
                                                    className: "flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors",
                                                    children: "Clear Cart"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 249,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/checkout",
                                                    className: "flex-1 py-3 px-6 bg-[#8ac644] hover:bg-[#7ab534] text-black rounded-lg font-bold text-center transition-colors",
                                                    children: "Proceed to Checkout"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 255,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 248,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 240,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 168,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center mt-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/products",
                                className: "text-[#8ac644] hover:underline",
                                children: "← Continue Shopping"
                            }, void 0, false, {
                                fileName: "[project]/src/app/cart/page.tsx",
                                lineNumber: 267,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 266,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 153,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 152,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/cart/page.tsx",
        lineNumber: 143,
        columnNumber: 5
    }, this);
}
}),
"[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * @license lucide-react v0.552.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ __turbopack_context__.s({
    "__iconNode": ()=>__iconNode,
    "default": ()=>Trash2
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-ssr] (ecmascript)");
;
const __iconNode = [
    [
        "path",
        {
            d: "M10 11v6",
            key: "nco0om"
        }
    ],
    [
        "path",
        {
            d: "M14 11v6",
            key: "outv1u"
        }
    ],
    [
        "path",
        {
            d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
            key: "miytrc"
        }
    ],
    [
        "path",
        {
            d: "M3 6h18",
            key: "d0wm0j"
        }
    ],
    [
        "path",
        {
            d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            key: "e791ji"
        }
    ]
];
const Trash2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])("trash-2", __iconNode);
;
 //# sourceMappingURL=trash-2.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Trash2": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript)");
}),

};

//# sourceMappingURL=_f968e4ef._.js.map