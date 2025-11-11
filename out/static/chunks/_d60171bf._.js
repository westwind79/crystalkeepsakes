(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/utils/logger.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
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
        console.log("🌐 API Call: ".concat(endpoint), data);
    },
    // Success messages
    success: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log("✅ ".concat(message), data);
    },
    // Warning messages
    warn: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.warn("⚠️ ".concat(message), data);
    },
    // Error tracking
    error: (message, error)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.error("❌ ".concat(message), error);
    },
    // Image loading
    image: (status, path)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const icon = status === 'loaded' ? '✅' : status === 'error' ? '❌' : '⏳';
        console.log("".concat(icon, " Image ").concat(status, ": ").concat(path));
    },
    // Order processing
    order: (step, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log("📦 Order ".concat(step, ":"), data);
    },
    // Product data
    product: (action, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log("🔷 Product ".concat(action, ":"), data);
    },
    // Payment processing
    payment: (step, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log("💳 Payment ".concat(step, ":"), data);
    },
    // General info
    info: (message, data)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        console.log("ℹ️ ".concat(message), data);
    }
};
const isDevelopment = IS_DEV;
const isTesting = IS_TEST;
const isProduction = IS_PROD;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/imageStorageDB.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// lib/imageStorageDB.ts
// Version: 1.0.0 - 2025-11-10
// Purpose: Handle large image storage using IndexedDB to avoid localStorage quota issues
// IndexedDB has much higher storage limits (typically 50% of free disk space)
__turbopack_context__.s({
    "imageDB": ()=>imageDB
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-client] (ecmascript)");
;
;
const DB_NAME = 'CrystalKeepsakesImages';
const DB_VERSION = 1;
const STORE_NAME = 'cartImages';
class ImageStorageDB {
    /**
   * Initialize the database
   */ async init() {
        return new Promise((resolve, reject)=>{
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = ()=>{
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to open IndexedDB', request.error);
                reject(request.error);
            };
            request.onsuccess = ()=>{
                this.db = request.result;
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('IndexedDB initialized successfully');
                resolve();
            };
            request.onupgradeneeded = (event)=>{
                const db = event.target.result;
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, {
                        keyPath: 'id'
                    });
                    objectStore.createIndex('productId', 'productId', {
                        unique: false
                    });
                    objectStore.createIndex('timestamp', 'timestamp', {
                        unique: false
                    });
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Created IndexedDB object store');
                }
            };
        });
    }
    /**
   * Ensure database is initialized
   */ async ensureDb() {
        if (!this.db) {
            await this.init();
        }
        if (!this.db) {
            throw new Error('Failed to initialize database');
        }
        return this.db;
    }
    /**
   * Store an image in IndexedDB
   */ async storeImage(productId, dataUrl, thumbnail, metadata) {
        try {
            const db = await this.ensureDb();
            const id = "".concat(productId, "_").concat(Date.now());
            const imageRecord = {
                id,
                productId,
                dataUrl,
                thumbnail,
                metadata: metadata || {},
                timestamp: Date.now()
            };
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.add(imageRecord);
                request.onsuccess = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].success('Image stored in IndexedDB', {
                        id,
                        productId,
                        sizeKB: Math.round(dataUrl.length / 1024)
                    });
                    resolve(id);
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to store image', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error storing image', error);
            throw error;
        }
    }
    /**
   * Retrieve an image from IndexedDB
   */ async getImage(id) {
        try {
            const db = await this.ensureDb();
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.get(id);
                request.onsuccess = ()=>{
                    const result = request.result;
                    if (result) {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Image retrieved from IndexedDB', {
                            id
                        });
                        resolve(result);
                    } else {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Image not found', {
                            id
                        });
                        resolve(null);
                    }
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to retrieve image', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error retrieving image', error);
            return null;
        }
    }
    /**
   * Get all images for a product
   */ async getProductImages(productId) {
        try {
            const db = await this.ensureDb();
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const index = objectStore.index('productId');
                const request = index.getAll(productId);
                request.onsuccess = ()=>{
                    const results = request.result || [];
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info("Retrieved ".concat(results.length, " images for product"), {
                        productId
                    });
                    resolve(results);
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to retrieve product images', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error retrieving product images', error);
            return [];
        }
    }
    /**
   * Delete an image from IndexedDB
   */ async deleteImage(id) {
        try {
            const db = await this.ensureDb();
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.delete(id);
                request.onsuccess = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Image deleted from IndexedDB', {
                        id
                    });
                    resolve();
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to delete image', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error deleting image', error);
            throw error;
        }
    }
    /**
   * Clear all images (useful for cart clear)
   */ async clearAll() {
        try {
            const db = await this.ensureDb();
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const request = objectStore.clear();
                request.onsuccess = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('All images cleared from IndexedDB');
                    resolve();
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to clear images', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error clearing images', error);
            throw error;
        }
    }
    /**
   * Clean up old images (older than 7 days)
   */ async cleanupOldImages() {
        try {
            const db = await this.ensureDb();
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readwrite');
                const objectStore = transaction.objectStore(STORE_NAME);
                const index = objectStore.index('timestamp');
                const range = IDBKeyRange.upperBound(sevenDaysAgo);
                const request = index.openCursor(range);
                let deletedCount = 0;
                request.onsuccess = (event)=>{
                    const cursor = event.target.result;
                    if (cursor) {
                        objectStore.delete(cursor.primaryKey);
                        deletedCount++;
                        cursor.continue();
                    } else {
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info("Cleaned up ".concat(deletedCount, " old images"));
                        resolve(deletedCount);
                    }
                };
                request.onerror = ()=>{
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to cleanup old images', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error cleaning up old images', error);
            return 0;
        }
    }
    /**
   * Get database statistics
   */ async getStats() {
        try {
            const db = await this.ensureDb();
            return new Promise((resolve, reject)=>{
                const transaction = db.transaction([
                    STORE_NAME
                ], 'readonly');
                const objectStore = transaction.objectStore(STORE_NAME);
                const countRequest = objectStore.count();
                const getAllRequest = objectStore.getAll();
                countRequest.onsuccess = ()=>{
                    const count = countRequest.result;
                    getAllRequest.onsuccess = ()=>{
                        const records = getAllRequest.result || [];
                        const totalSize = records.reduce((sum, record)=>{
                            var _record_dataUrl, _record_thumbnail;
                            return sum + (((_record_dataUrl = record.dataUrl) === null || _record_dataUrl === void 0 ? void 0 : _record_dataUrl.length) || 0) + (((_record_thumbnail = record.thumbnail) === null || _record_thumbnail === void 0 ? void 0 : _record_thumbnail.length) || 0);
                        }, 0);
                        resolve({
                            totalImages: count,
                            estimatedSizeMB: totalSize / (1024 * 1024)
                        });
                    };
                };
                countRequest.onerror = ()=>{
                    reject(countRequest.error);
                };
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Error getting database stats', error);
            return {
                totalImages: 0,
                estimatedSizeMB: 0
            };
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "db", null);
    }
}
const imageDB = new ImageStorageDB();
// Initialize on import
if ("TURBOPACK compile-time truthy", 1) {
    imageDB.init().catch((error)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to initialize ImageStorageDB', error);
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/cartUtils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// lib/cartUtils.ts
// Version: 2.0.0 - 2025-11-10 - INDEXEDDB IMAGE STORAGE
// Fixed: Moved image storage to IndexedDB to avoid localStorage quota issues
// - Images stored in IndexedDB (50% of free disk space limit)
// - Only image IDs stored in localStorage cart
// - Automatic cleanup of orphaned images
// - Better error handling and recovery
__turbopack_context__.s({
    "addToCart": ()=>addToCart,
    "checkStorageHealth": ()=>checkStorageHealth,
    "clearCart": ()=>clearCart,
    "estimateSize": ()=>estimateSize,
    "getCart": ()=>getCart,
    "getCartItemCount": ()=>getCartItemCount,
    "getCartTotal": ()=>getCartTotal,
    "getCartWithImages": ()=>getCartWithImages,
    "getFullResImage": ()=>getFullResImage,
    "getImageStorageStats": ()=>getImageStorageStats,
    "migrateOldCart": ()=>migrateOldCart,
    "removeFromCart": ()=>removeFromCart,
    "saveCart": ()=>saveCart,
    "storeFullResImage": ()=>storeFullResImage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/imageStorageDB.ts [app-client] (ecmascript)");
;
;
/**
 * Compress image to TINY thumbnail for cart display
 * Reduces base64 size by ~97% (e.g., 2MB -> 60KB)
 */ async function compressImageToThumbnail(dataUrl) {
    return new Promise((resolve, reject)=>{
        const img = new Image();
        img.onload = ()=>{
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 100 // Small thumbnail size
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
            // Lower quality JPEG for minimal size
            resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = ()=>reject(new Error('Image compression failed'));
        img.src = dataUrl;
    });
}
/**
 * Clean options object - remove ALL image data URLs
 */ function cleanOptions(options) {
    if (!options) return {};
    const cleaned = {
        ...options
    };
    // Remove all image data URLs from options
    delete cleaned.rawImageUrl;
    delete cleaned.imageUrl;
    delete cleaned.maskedImageUrl;
    delete cleaned.dataUrl;
    delete cleaned.customImage;
    // Keep only essential metadata
    return {
        size: cleaned.size,
        background: cleaned.background,
        lightBase: cleaned.lightBase,
        giftStand: cleaned.giftStand,
        customText: cleaned.customText,
        // Only keep image filenames, not data URLs
        imageFilename: cleaned.imageFilename,
        maskName: cleaned.maskName
    };
}
async function addToCart(item) {
    var _item_customImage, _item_options;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].order('Adding item to cart', {
        productId: item.productId,
        hasCustomImage: !!((_item_customImage = item.customImage) === null || _item_customImage === void 0 ? void 0 : _item_customImage.dataUrl) || !!((_item_options = item.options) === null || _item_options === void 0 ? void 0 : _item_options.maskedImageUrl)
    });
    try {
        var _item_customImage1, _item_options1;
        const cart = getCart();
        let customImageId;
        let customImageMetadata;
        // Handle custom image storage in IndexedDB
        const imageDataUrl = ((_item_customImage1 = item.customImage) === null || _item_customImage1 === void 0 ? void 0 : _item_customImage1.dataUrl) || ((_item_options1 = item.options) === null || _item_options1 === void 0 ? void 0 : _item_options1.maskedImageUrl);
        if (imageDataUrl) {
            try {
                var _item_customImage2, _item_options2, _item_customImage3, _item_customImage4, _item_customImage5, _item_customImage6, _item_customImage7, _item_customImage8, _item_options3, _item_customImage9, _item_options4, _item_customImage10, _item_options5, _item_customImage11, _item_options6;
                // Compress thumbnail
                const thumbnail = await compressImageToThumbnail(imageDataUrl);
                // Store full image and thumbnail in IndexedDB
                customImageId = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].storeImage(item.productId, imageDataUrl, thumbnail, {
                    filename: ((_item_customImage2 = item.customImage) === null || _item_customImage2 === void 0 ? void 0 : _item_customImage2.filename) || ((_item_options2 = item.options) === null || _item_options2 === void 0 ? void 0 : _item_options2.imageFilename),
                    mimeType: ((_item_customImage3 = item.customImage) === null || _item_customImage3 === void 0 ? void 0 : _item_customImage3.mimeType) || 'image/png',
                    fileSize: ((_item_customImage4 = item.customImage) === null || _item_customImage4 === void 0 ? void 0 : _item_customImage4.fileSize) || imageDataUrl.length,
                    width: (_item_customImage5 = item.customImage) === null || _item_customImage5 === void 0 ? void 0 : _item_customImage5.width,
                    height: (_item_customImage6 = item.customImage) === null || _item_customImage6 === void 0 ? void 0 : _item_customImage6.height,
                    processedAt: ((_item_customImage7 = item.customImage) === null || _item_customImage7 === void 0 ? void 0 : _item_customImage7.processedAt) || new Date().toISOString(),
                    maskId: ((_item_customImage8 = item.customImage) === null || _item_customImage8 === void 0 ? void 0 : _item_customImage8.maskId) || ((_item_options3 = item.options) === null || _item_options3 === void 0 ? void 0 : _item_options3.maskId),
                    maskName: ((_item_customImage9 = item.customImage) === null || _item_customImage9 === void 0 ? void 0 : _item_customImage9.maskName) || ((_item_options4 = item.options) === null || _item_options4 === void 0 ? void 0 : _item_options4.maskName)
                });
                customImageMetadata = {
                    filename: ((_item_customImage10 = item.customImage) === null || _item_customImage10 === void 0 ? void 0 : _item_customImage10.filename) || ((_item_options5 = item.options) === null || _item_options5 === void 0 ? void 0 : _item_options5.imageFilename),
                    maskName: ((_item_customImage11 = item.customImage) === null || _item_customImage11 === void 0 ? void 0 : _item_customImage11.maskName) || ((_item_options6 = item.options) === null || _item_options6 === void 0 ? void 0 : _item_options6.maskName),
                    hasImage: true
                };
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].success('Image stored in IndexedDB', {
                    imageId: customImageId,
                    originalSizeKB: Math.round(imageDataUrl.length / 1024),
                    thumbnailSizeKB: Math.round(thumbnail.length / 1024)
                });
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to store image in IndexedDB', error);
                // Continue without image rather than fail entire add
                customImageId = undefined;
                customImageMetadata = {
                    hasImage: false
                };
            }
        }
        // Clean options to remove any image data
        const cleanedOptions = cleanOptions(item.options);
        // Create cart item with just image ID reference
        const cartItem = {
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            price: item.price || item.totalPrice,
            quantity: item.quantity,
            options: cleanedOptions,
            sizeDetails: item.size || item.sizeDetails,
            customImageId,
            customImageMetadata,
            cockpit3d_id: item.cockpit3d_id,
            dateAdded: item.dateAdded || new Date().toISOString()
        };
        cart.push(cartItem);
        saveCart(cart);
        // Clean up old images periodically
        if (Math.random() < 0.1) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].cleanupOldImages().catch((err)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Background image cleanup failed', err));
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].success('Item added to cart', {
            totalItems: cart.length,
            hasImage: !!customImageId
        });
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to add item to cart', error);
        throw error;
    }
}
function getCart() {
    try {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to read cart', error);
        return [];
    }
}
async function getCartWithImages() {
    const cart = getCart();
    // Load images from IndexedDB
    const cartWithImages = await Promise.all(cart.map(async (item)=>{
        if (item.customImageId) {
            try {
                const imageRecord = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].getImage(item.customImageId);
                if (imageRecord) {
                    return {
                        ...item,
                        customImage: {
                            dataUrl: imageRecord.dataUrl,
                            thumbnail: imageRecord.thumbnail,
                            metadata: imageRecord.metadata
                        }
                    };
                }
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn("Failed to load image for cart item", {
                    productId: item.productId,
                    imageId: item.customImageId,
                    error
                });
            }
        }
        return item;
    }));
    return cartWithImages;
}
function saveCart(cart) {
    try {
        const cartJson = JSON.stringify(cart);
        const sizeKB = (cartJson.length / 1024).toFixed(2);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Saving cart to localStorage', {
            items: cart.length,
            sizeKB,
            hasImages: cart.filter((item)=>item.customImageId).length
        });
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
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to save cart', error);
        if (error.name === 'QuotaExceededError') {
            // This should be rare now since images are in IndexedDB
            // Try clearing some old data
            try {
                cleanupLocalStorage();
                localStorage.setItem('cart', JSON.stringify(cart));
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Cart saved after cleanup');
            } catch (fallbackError) {
                throw new Error('Unable to save cart. Please clear browser data.');
            }
        } else {
            throw error;
        }
    }
}
async function removeFromCart(index) {
    const cart = getCart();
    const removedItem = cart[index];
    // Delete associated image from IndexedDB
    if (removedItem === null || removedItem === void 0 ? void 0 : removedItem.customImageId) {
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].deleteImage(removedItem.customImageId);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Deleted image from IndexedDB', {
                imageId: removedItem.customImageId
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Failed to delete image from IndexedDB', error);
        }
    }
    cart.splice(index, 1);
    saveCart(cart);
    return cart;
}
async function clearCart() {
    localStorage.removeItem('cart');
    // Clear all images from IndexedDB
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].clearAll();
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Cleared all images from IndexedDB');
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Failed to clear images from IndexedDB', error);
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
        let totalSize = 0;
        for(let key in localStorage){
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        // Most browsers have 5MB limit
        const STORAGE_LIMIT = 5242880;
        const percentUsed = totalSize / STORAGE_LIMIT * 100;
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Storage health check', {
            usedKB: (totalSize / 1024).toFixed(2),
            percentUsed: percentUsed.toFixed(1) + '%'
        });
        return {
            isHealthy: percentUsed < 90,
            usedSpace: totalSize,
            totalSpace: STORAGE_LIMIT,
            percentUsed,
            message: percentUsed > 80 ? 'Storage nearly full' : undefined
        };
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Storage health check failed', error);
        return {
            isHealthy: false,
            usedSpace: 0,
            totalSpace: 0,
            percentUsed: 100,
            message: 'Storage check failed'
        };
    }
}
/**
 * Clean up unnecessary data from localStorage
 */ function cleanupLocalStorage() {
    try {
        // Remove old/temporary data
        const keysToCheck = Object.keys(localStorage);
        keysToCheck.forEach((key)=>{
            // Remove old temporary data
            if (key.startsWith('temp_') || key.startsWith('old_')) {
                localStorage.removeItem(key);
            }
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Cleaned up localStorage');
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('localStorage cleanup failed', error);
    }
}
async function getImageStorageStats() {
    try {
        const stats = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].getStats();
        return {
            ...stats,
            storageHealth: checkStorageHealth()
        };
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to get storage stats', error);
        return null;
    }
}
function estimateSize(data) {
    try {
        return JSON.stringify(data).length;
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to estimate data size', error);
        return 0;
    }
}
async function storeFullResImage(productId, dataUrl) {
    try {
        // Create a thumbnail for storage
        const thumbnail = await compressImageToThumbnail(dataUrl);
        // Store in IndexedDB
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].storeImage(productId, dataUrl, thumbnail, {
            processedAt: new Date().toISOString()
        });
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Full-res image stored in IndexedDB', {
            productId,
            sizeKB: (dataUrl.length / 1024).toFixed(2)
        });
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to store full-res image', error);
        // Fallback to sessionStorage for backward compatibility
        try {
            sessionStorage.setItem("fullimg_".concat(productId), dataUrl);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Fell back to sessionStorage for image storage');
        } catch (e) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('All image storage methods failed', e);
        }
    }
}
async function getFullResImage(productId) {
    try {
        // First try IndexedDB
        const images = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].getProductImages(productId);
        if (images.length > 0) {
            return images[0].dataUrl;
        }
        // Fallback to sessionStorage
        const sessionImage = sessionStorage.getItem("fullimg_".concat(productId));
        if (sessionImage) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Retrieved image from sessionStorage fallback');
            return sessionImage;
        }
        return null;
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Could not retrieve full-res image', error);
        return null;
    }
}
async function migrateOldCart() {
    try {
        const cart = getCart();
        let needsMigration = false;
        const migratedCart = await Promise.all(cart.map(async (item)=>{
            var _item_customImage;
            // Check if item has old format with embedded image
            if (((_item_customImage = item.customImage) === null || _item_customImage === void 0 ? void 0 : _item_customImage.dataUrl) && !item.customImageId) {
                needsMigration = true;
                try {
                    // Store image in IndexedDB
                    const thumbnail = await compressImageToThumbnail(item.customImage.dataUrl);
                    const imageId = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$imageStorageDB$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["imageDB"].storeImage(item.productId, item.customImage.dataUrl, thumbnail, item.customImage);
                    // Return migrated item
                    return {
                        ...item,
                        customImageId: imageId,
                        customImageMetadata: {
                            filename: item.customImage.filename,
                            maskName: item.customImage.maskName,
                            hasImage: true
                        },
                        customImage: undefined // Remove embedded image
                    };
                } catch (error) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Failed to migrate image for item', {
                        productId: item.productId,
                        error
                    });
                    return {
                        ...item,
                        customImage: undefined
                    };
                }
            }
            return item;
        }));
        if (needsMigration) {
            saveCart(migratedCart);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Cart migrated to new format');
        }
    } catch (error) {
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Cart migration failed', error);
    }
}
// Auto-migrate on load
if ("TURBOPACK compile-time truthy", 1) {
    migrateOldCart().catch((err)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].warn('Auto-migration failed', err));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/cart/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// app/cart/page.tsx
// Version: 3.0.0 - 2025-11-11 - MERGED & FIXED
// ✅ Merged: All functions from original files preserved
// ✅ Fixed: updateQuantity uses cartUtils.saveCart
// ✅ Fixed: Options display handles both formats
// ✅ Enhanced: Layout from page-1/page-2
__turbopack_context__.s({
    "default": ()=>CartPage
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cartUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function CartPage() {
    _s();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [removing, setRemoving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [storageStats, setStorageStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [checkoutLoading, setCheckoutLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [total, setTotal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0) // ✅ PRESERVE: total state
    ;
    // ✅ PRESERVE: loadCart from page.tsx
    const loadCart = async ()=>{
        try {
            setLoading(true);
            const cartWithImages = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCartWithImages"])();
            setCart(cartWithImages);
            // ✅ PRESERVE: Calculate total like page-2
            const sum = cartWithImages.reduce((acc, item)=>{
                const itemPrice = item.price || item.totalPrice || 0;
                return acc + itemPrice * item.quantity;
            }, 0);
            setTotal(sum);
            // ✅ PRESERVE: Storage stats from page.tsx
            const stats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getImageStorageStats"])();
            setStorageStats(stats);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].info('Cart loaded with images', {
                items: cartWithImages.length,
                withImages: cartWithImages.filter((item)=>item.customImage).length
            });
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to load cart', error);
        } finally{
            setLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CartPage.useEffect": ()=>{
            loadCart();
            // ✅ PRESERVE: Event listener from page.tsx
            const handleCartUpdate = {
                "CartPage.useEffect.handleCartUpdate": ()=>{
                    loadCart();
                }
            }["CartPage.useEffect.handleCartUpdate"];
            window.addEventListener('cartUpdated', handleCartUpdate);
            return ({
                "CartPage.useEffect": ()=>{
                    window.removeEventListener('cartUpdated', handleCartUpdate);
                }
            })["CartPage.useEffect"];
        }
    }["CartPage.useEffect"], []);
    // ✅ PRESERVE: handleRemoveItem from page.tsx
    const handleRemoveItem = async (index)=>{
        setRemoving(index);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeFromCart"])(index);
            await loadCart();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].success('Item removed from cart');
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to remove item', error);
        } finally{
            setRemoving(null);
        }
    };
    // ✅ PRESERVE: handleClearCart from page.tsx
    const handleClearCart = async ()=>{
        if (confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearCart"])();
                setCart([]);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].success('Cart cleared');
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to clear cart', error);
            }
        }
    };
    // ✅ FIXED: updateQuantity uses cartUtils.saveCart (strips images)
    const updateQuantity = async (index, newQuantity)=>{
        if (newQuantity < 1) return;
        try {
            const currentCart = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCartWithImages"])();
            currentCart[index].quantity = newQuantity;
            // ✅ FIXED: Import and use saveCart from cartUtils
            const { saveCart } = await __turbopack_context__.r("[project]/src/lib/cartUtils.ts [app-client] (ecmascript, async loader)")(__turbopack_context__.i);
            saveCart(currentCart);
            await loadCart();
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logger"].error('Failed to update quantity', error);
        }
    };
    // ✅ ENHANCED: Normalize options for display
    const getDisplayOptions = (item)=>{
        var _item_sizeDetails;
        const options = {};
        // New format: options array
        if (Array.isArray(item.options)) {
            item.options.forEach((opt)=>{
                if (opt.category === 'customText') {
                    options['Custom Text'] = opt.value;
                } else if (opt.value && opt.value !== 'None') {
                    options[opt.category || opt.name] = opt.value;
                }
            });
        } else if (item.options) {
            Object.entries(item.options).forEach((param)=>{
                let [key, value] = param;
                if (value && value !== 'None' && key !== 'imageFilename' && key !== 'maskName') {
                    options[key] = String(value);
                }
            });
        }
        if ((_item_sizeDetails = item.sizeDetails) === null || _item_sizeDetails === void 0 ? void 0 : _item_sizeDetails.sizeName) {
            options['Size'] = item.sizeDetails.sizeName;
        }
        return options;
    };
    // ✅ PRESERVE: buildCockpitOrder from page-2
    function buildCockpitOrder() {
        const orderNumber = "CK-".concat(Date.now());
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
            items: cart.map((item)=>{
                var _item_customImage, _item_options, _item_options1;
                return {
                    sku: item.sku || item.productId,
                    qty: item.quantity,
                    price: item.price || item.totalPrice || 0,
                    name: item.name,
                    custom_options: buildCustomOptions(item),
                    custom_image_url: ((_item_customImage = item.customImage) === null || _item_customImage === void 0 ? void 0 : _item_customImage.dataUrl) || ((_item_options = item.options) === null || _item_options === void 0 ? void 0 : _item_options.rawImageUrl) || ((_item_options1 = item.options) === null || _item_options1 === void 0 ? void 0 : _item_options1.imageUrl) || undefined
                };
            }),
            total: total
        };
    }
    // ✅ PRESERVE: buildCustomOptions from page-2
    function buildCustomOptions(item) {
        const options = [];
        const getOptionValue = (option)=>{
            if (!option) return '';
            if (typeof option === 'string') return option;
            if (typeof option === 'object') return option.name || option.id || String(option);
            return String(option);
        };
        if (item.options.size) {
            var _item_sizeDetails;
            options.push({
                option_id: 'size',
                option_value: ((_item_sizeDetails = item.sizeDetails) === null || _item_sizeDetails === void 0 ? void 0 : _item_sizeDetails.name) || getOptionValue(item.options.size)
            });
        }
        if (item.options.background) {
            options.push({
                option_id: 'background',
                option_value: getOptionValue(item.options.background)
            });
        }
        if (item.options.lightBase) {
            options.push({
                option_id: 'lightBase',
                option_value: getOptionValue(item.options.lightBase)
            });
        }
        if (item.options.giftStand) {
            options.push({
                option_id: 'giftStand',
                option_value: getOptionValue(item.options.giftStand)
            });
        }
        if (item.options.customText) {
            const textValue = typeof item.options.customText === 'string' ? item.options.customText : [
                item.options.customText.line1 && "Line 1: ".concat(item.options.customText.line1),
                item.options.customText.line2 && "Line 2: ".concat(item.options.customText.line2)
            ].filter(Boolean).join(' | ');
            options.push({
                option_id: 'customText',
                option_value: textValue
            });
        }
        return options;
    }
    // ✅ PRESERVE: proceedToCheckout from page-2
    async function proceedToCheckout() {
        setCheckoutLoading(true);
        try {
            const orderData = buildCockpitOrder();
            sessionStorage.setItem('pendingOrder', JSON.stringify({
                cartItems: cart,
                subtotal: total,
                total: total,
                orderNumber: orderData.order_id,
                cockpitOrderData: orderData
            }));
            window.location.href = '/checkout';
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to proceed to checkout. Please try again.');
            setCheckoutLoading(false);
        }
    }
    // ✅ PRESERVE: Loading state from page-2
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 283,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-slate-600",
                        children: "Loading your cart..."
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 284,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 282,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/cart/page.tsx",
            lineNumber: 281,
            columnNumber: 7
        }, this);
    }
    // ✅ PRESERVE: Empty state from page-2
    if (cart.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gradient-to-tr from-gray-200 via-gray-100 to-gray-50",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center py-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-semibold text-slate-900 mb-4",
                            children: "Your cart is empty"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 296,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-slate-600 mb-6",
                            children: "Add some beautiful crystal keepsakes to get started!"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 297,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/products",
                            className: "inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors",
                            children: "Continue Shopping"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 298,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 295,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/cart/page.tsx",
                lineNumber: 294,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/cart/page.tsx",
            lineNumber: 293,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gradient-to-tr from-green-900 via-gray-300 to-green-100",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl max-lg:max-w-4xl mx-auto p-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-6 text-slate-900",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-xl font-semibold text-slate-900",
                            children: "Your shopping cart"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 315,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleClearCart,
                            className: "text-sm text-red-600 hover:text-red-700 font-medium",
                            children: "Clear Cart"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 316,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 314,
                    columnNumber: 9
                }, this),
                ("TURBOPACK compile-time value", "development") === 'development' && storageStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-slate-700 rounded-lg p-4 mb-6 text-sm text-gray-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-bold mb-2",
                            children: "Storage Stats:"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 327,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-2 gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        "localStorage: ",
                                        storageStats.storageHealth.percentUsed.toFixed(1),
                                        "% used"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 329,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        "IndexedDB Images: ",
                                        storageStats.totalImages
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 330,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        "localStorage Size: ",
                                        (storageStats.storageHealth.usedSpace / 1024).toFixed(1),
                                        " KB"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 331,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        "Image Storage: ",
                                        storageStats.estimatedSizeMB.toFixed(2),
                                        " MB"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 332,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 328,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 326,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid lg:grid-cols-3 gap-4 relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-2 space-y-4",
                            children: cart.map((item, index)=>{
                                var _item_customImage, _item_sizeDetails, _item_customImageMetadata, _item_customImageMetadata1, _item_customImage_metadata;
                                const displayImage = ((_item_customImage = item.customImage) === null || _item_customImage === void 0 ? void 0 : _item_customImage.thumbnail) || 'https://placehold.co/800x800?text=No+Image';
                                const displayOptions = getDisplayOptions(item);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-6 text-slate-900 bg-white shadow-sm border border-gray-300 rounded-md relative",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start max-sm:flex-col gap-4 max-sm:gap-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-32 h-32 shrink-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: displayImage,
                                                        alt: item.name,
                                                        className: "w-full h-full object-contain rounded-lg"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 353,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                        src: item.customImageMetadata,
                                                        alt: item.name,
                                                        className: "w-full h-full object-contain rounded-lg"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 358,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/cart/page.tsx",
                                                lineNumber: 352,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "sm:border-l sm:pl-4 sm:border-gray-300 w-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-base font-semibold text-slate-900",
                                                        children: item.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 23
                                                    }, this),
                                                    Object.keys(displayOptions).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-600 mt-2 space-y-1",
                                                        children: Object.entries(displayOptions).map((param)=>{
                                                            let [key, val] = param;
                                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                        children: [
                                                                            key,
                                                                            ":"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 373,
                                                                        columnNumber: 42
                                                                    }, this),
                                                                    " ",
                                                                    val
                                                                ]
                                                            }, key, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 373,
                                                                columnNumber: 29
                                                            }, this);
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 371,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "mt-4 text-sm text-slate-500 font-medium space-y-1",
                                                        children: [
                                                            item.sku && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: [
                                                                    "SKU: ",
                                                                    item.sku
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 38
                                                            }, this),
                                                            ((_item_sizeDetails = item.sizeDetails) === null || _item_sizeDetails === void 0 ? void 0 : _item_sizeDetails.sizeName) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: [
                                                                    "Size: ",
                                                                    item.sizeDetails.sizeName
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 381,
                                                                columnNumber: 56
                                                            }, this),
                                                            ((_item_customImageMetadata = item.customImageMetadata) === null || _item_customImageMetadata === void 0 ? void 0 : _item_customImageMetadata.hasImage) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                className: "text-emerald-600",
                                                                children: [
                                                                    "✓ Custom Image: ",
                                                                    item.customImageMetadata.filename
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 383,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 379,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                                                        className: "border-gray-300 my-4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between flex-wrap gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                        className: "text-sm font-semibold text-slate-900",
                                                                        children: "Qty:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 392,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: ()=>updateQuantity(index, item.quantity - 1),
                                                                        className: "flex items-center justify-center w-[18px] h-[18px] bg-blue-600 hover:bg-blue-700 outline-none rounded-sm cursor-pointer",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                            xmlns: "http://www.w3.org/2000/svg",
                                                                            className: "w-2 fill-white",
                                                                            viewBox: "0 0 124 124",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                d: "M112 50H12C5.4 50 0 55.4 0 62s5.4 12 12 12h100c6.6 0 12-5.4 12-12s-5.4-12-12-12z"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                                lineNumber: 399,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                                            lineNumber: 398,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 393,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "font-semibold text-base leading-[16px]",
                                                                        children: item.quantity
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 402,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: ()=>updateQuantity(index, item.quantity + 1),
                                                                        className: "flex items-center justify-center w-[18px] h-[18px] bg-blue-600 hover:bg-blue-700 outline-none rounded-sm cursor-pointer",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                            xmlns: "http://www.w3.org/2000/svg",
                                                                            className: "w-2 fill-white",
                                                                            viewBox: "0 0 42 42",
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                                d: "M37.059 16H26V4.941C26 2.224 23.718 0 21 0s-5 2.224-5 4.941V16H4.941C2.224 16 0 18.282 0 21s2.224 5 4.941 5H16v11.059C16 39.776 18.282 42 21 42s5-2.224 5-4.941V26h11.059C39.776 26 42 23.718 42 21s-2.224-5-4.941-5z"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                                lineNumber: 409,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                                            lineNumber: 408,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 403,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 391,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                        className: "text-base font-semibold text-slate-900",
                                                                        children: [
                                                                            "$",
                                                                            (item.price * item.quantity).toFixed(2)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 415,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>handleRemoveItem(index),
                                                                        disabled: removing === index,
                                                                        className: "p-2 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50",
                                                                        children: removing === index ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                                            lineNumber: 426,
                                                                            columnNumber: 31
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                            size: 20
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                                            lineNumber: 428,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                                        lineNumber: 420,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/app/cart/page.tsx",
                                                                lineNumber: 414,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 390,
                                                        columnNumber: 23
                                                    }, this),
                                                    ("TURBOPACK compile-time value", "development") === 'development' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-full mt-3 p-2 rounded border border-blue-200 bg-blue-50",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "text-blue-700",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                    children: "Debug:"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 438,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 438,
                                                                    columnNumber: 52
                                                                }, this),
                                                                "SKU: ",
                                                                item.sku || 'N/A',
                                                                " | Cockpit3D ID: ",
                                                                item.cockpit3d_id || 'N/A',
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                                    lineNumber: 440,
                                                                    columnNumber: 71
                                                                }, this),
                                                                "Image: ",
                                                                ((_item_customImageMetadata1 = item.customImageMetadata) === null || _item_customImageMetadata1 === void 0 ? void 0 : _item_customImageMetadata1.hasImage) ? 'Yes' : 'No',
                                                                " |",
                                                                item.customImage && " ".concat((((_item_customImage_metadata = item.customImage.metadata) === null || _item_customImage_metadata === void 0 ? void 0 : _item_customImage_metadata.fileSize) / 1024).toFixed(1), "KB")
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/app/cart/page.tsx",
                                                            lineNumber: 437,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 436,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/cart/page.tsx",
                                                lineNumber: 366,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/cart/page.tsx",
                                        lineNumber: 349,
                                        columnNumber: 19
                                    }, this)
                                }, index, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 348,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 340,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-slate-900 bg-white h-max rounded-md p-6 shadow-sm border border-gray-300 sticky top-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-base font-semibold text-slate-900",
                                    children: "Order Summary"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 455,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "text-slate-500 font-medium text-sm divide-y divide-gray-300 mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex flex-wrap gap-4 py-3",
                                            children: [
                                                "Subtotal",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-auto font-semibold text-slate-900",
                                                    children: [
                                                        "$",
                                                        total.toFixed(2)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 459,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 457,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex flex-wrap gap-4 py-3",
                                            children: [
                                                "Shipping",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-auto font-semibold text-slate-900",
                                                    children: "Calculated at checkout"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 463,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 461,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex flex-wrap gap-4 py-3",
                                            children: [
                                                "Tax",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-auto font-semibold text-slate-900",
                                                    children: "Calculated at checkout"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 467,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 465,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "flex flex-wrap gap-4 py-3 font-semibold text-slate-900 text-lg",
                                            children: [
                                                "Total",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "ml-auto",
                                                    children: [
                                                        "$",
                                                        total.toFixed(2)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/cart/page.tsx",
                                                    lineNumber: 471,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/cart/page.tsx",
                                            lineNumber: 469,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 456,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: proceedToCheckout,
                                    disabled: checkoutLoading,
                                    className: "mt-6 text-sm font-medium px-4 py-2.5 tracking-wide w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                                    children: checkoutLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "flex items-center justify-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white",
                                                xmlns: "http://www.w3.org/2000/svg",
                                                fill: "none",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        className: "opacity-25",
                                                        cx: "12",
                                                        cy: "12",
                                                        r: "10",
                                                        stroke: "currentColor",
                                                        strokeWidth: "4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 485,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        className: "opacity-75",
                                                        fill: "currentColor",
                                                        d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/cart/page.tsx",
                                                        lineNumber: 486,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/cart/page.tsx",
                                                lineNumber: 484,
                                                columnNumber: 19
                                            }, this),
                                            "Processing..."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/cart/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 17
                                    }, this) : 'Proceed to Checkout'
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 476,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-center text-slate-500 text-xs mt-4",
                                    children: "🔒 Secure checkout powered by Stripe"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 494,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 454,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 338,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mt-8",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/products",
                        className: "text-blue-600 hover:underline font-medium",
                        children: "← Continue Shopping"
                    }, void 0, false, {
                        fileName: "[project]/src/app/cart/page.tsx",
                        lineNumber: 502,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 501,
                    columnNumber: 9
                }, this),
                ("TURBOPACK compile-time value", "development") === 'development' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 pt-4 border-t border-gray-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h6", {
                            className: "text-amber-600 font-semibold mb-3",
                            children: "🔧 Developer Mode - Cart Debug"
                        }, void 0, false, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 513,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-slate-900 p-4 rounded mb-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h6", {
                                    className: "text-slate-400 text-sm mb-2",
                                    children: "📦 Raw Cart Data (with IndexedDB images)"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 516,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                    className: "text-slate-100 text-xs overflow-auto",
                                    style: {
                                        maxHeight: '300px'
                                    },
                                    children: JSON.stringify(cart, null, 2)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/cart/page.tsx",
                                    lineNumber: 517,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/cart/page.tsx",
                            lineNumber: 515,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/cart/page.tsx",
                    lineNumber: 512,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/cart/page.tsx",
            lineNumber: 312,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/cart/page.tsx",
        lineNumber: 311,
        columnNumber: 5
    }, this);
}
_s(CartPage, "fhJ7j5TXYbPK3aNOIqHvl7JKJj8=");
_c = CartPage;
var _c;
__turbopack_context__.k.register(_c, "CartPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript)": ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)");
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
const Trash2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])("trash-2", __iconNode);
;
 //# sourceMappingURL=trash-2.js.map
}),
"[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "Trash2": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript)");
}),
"[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "_": ()=>_define_property
});
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else obj[key] = value;
    return obj;
}
;
}),
}]);

//# sourceMappingURL=_d60171bf._.js.map