(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

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

//# sourceMappingURL=_34fe0e53._.js.map