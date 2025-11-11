module.exports = {

"[project]/src/components/ImageEditor.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// components/ImageEditor.tsx
// Version: 2.2.0 - 2025-11-05 - HIGH-RES PNG FOR LASER ENGRAVING
// ✅ Fixed: Changed to PNG format for transparency support
// ✅ Fixed: Increased resolution to 2400px for laser engraving quality
// ✅ Fixed: Increased file size limit to 2MB for high-res images
// ✅ Fixed: Increased quality to 0.95 for best engraving results
// - Kept: Disabled image movement during save/processing
// - Kept: Converts uploaded images to black & white (grayscale) on save
__turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zoom-in.js [app-ssr] (ecmascript) <export default as ZoomIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/zoom-out.js [app-ssr] (ecmascript) <export default as ZoomOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/rotate-ccw.js [app-ssr] (ecmascript) <export default as RotateCcw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$browser$2d$image$2d$compression$2f$dist$2f$browser$2d$image$2d$compression$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/browser-image-compression/dist/browser-image-compression.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const ImageEditor = ({ show, onHide, uploadedImage, maskImage, onSave })=>{
    // State management
    const [position, setPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [scale, setScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [dragStart, setDragStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [maskDimensions, setMaskDimensions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        width: 0,
        height: 0
    });
    const [isImageCentered, setIsImageCentered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Refs
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const imageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const maskRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Environment check
    const isDev = ("TURBOPACK compile-time value", "development") === 'development';
    const isTest = ("TURBOPACK compile-time value", "development") === 'testing';
    const isProd = ("TURBOPACK compile-time value", "development") === 'production';
    // Compression settings based on environment
    // PNG for transparency support, higher resolution for laser engraving
    const compressionSettings = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: 'image/png',
        initialQuality: 0.95 // High quality for engraving
    };
    // Log only in dev/test
    const log = (...args)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            console.log('[IMAGE_EDITOR]', ...args);
        }
    };
    const logError = (...args)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            console.error('[IMAGE_EDITOR ERROR]', ...args);
        }
    };
    /**
   * Center the uploaded image within the mask
   * Called after both images are loaded
   */ const centerImage = ()=>{
        if (!imageRef.current || !containerRef.current || isImageCentered) return;
        const imgRect = imageRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate center position
        const centerX = (containerRect.width - imgRect.width) / 2;
        const centerY = (containerRect.height - imgRect.height) / 2;
        setPosition({
            x: centerX,
            y: centerY
        });
        setIsImageCentered(true);
        log('Image centered at:', {
            x: centerX,
            y: centerY
        });
    };
    /**
   * Convert image to grayscale (black & white)
   */ const convertToGrayscale = (ctx, canvas)=>{
        log('Converting to grayscale...');
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Convert each pixel to grayscale
        for(let i = 0; i < data.length; i += 4){
            // Get RGB values
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Calculate grayscale using luminosity method (more accurate)
            // Formula: 0.299*R + 0.587*G + 0.114*B
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            // Set RGB to same gray value
            data[i] = gray; // Red
            data[i + 1] = gray; // Green
            data[i + 2] = gray; // Blue
        // Alpha (data[i + 3]) stays the same
        }
        // Put grayscale data back
        ctx.putImageData(imageData, 0, 0);
        log('Grayscale conversion complete');
    };
    /**
   * Compress image to reduce file size
   */ const compressImage = async (dataUrl)=>{
        try {
            // Convert data URL to blob
            const base64Data = dataUrl.split(',')[1];
            const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for(let i = 0; i < byteCharacters.length; i++){
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([
                byteArray
            ], {
                type: mimeType
            });
            log(`Original size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
            // Compress the blob
            const compressedFile = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$browser$2d$image$2d$compression$2f$dist$2f$browser$2d$image$2d$compression$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(blob, compressionSettings);
            log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            // Convert back to data URL
            return new Promise((resolve)=>{
                const reader = new FileReader();
                reader.onloadend = ()=>resolve(reader.result);
                reader.readAsDataURL(compressedFile);
            });
        } catch (error) {
            logError('Compression failed:', error);
            return dataUrl // Return original if compression fails
            ;
        }
    };
    /**
   * Set up mask dimensions and aspect ratio
   */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!show || !maskImage || !containerRef.current) return;
        log('Setting up mask...');
        const img = new Image();
        img.onload = ()=>{
            if (!containerRef.current) {
                logError('Container ref lost during image load');
                return;
            }
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            log('Aspect ratio:', aspectRatio);
            containerRef.current.style.aspectRatio = `${aspectRatio}`;
            setMaskDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight
            });
        };
        img.src = maskImage;
    }, [
        show,
        maskImage
    ]);
    /**
   * Center image when modal opens or image changes
   */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (show && uploadedImage) {
            // Reset centering flag when new image or modal opens
            setIsImageCentered(false);
            // Small delay to ensure images are rendered
            setTimeout(()=>{
                centerImage();
            }, 100);
        }
    }, [
        show,
        uploadedImage
    ]);
    /**
   * Handle zoom with optional cursor position
   * FIX: Disabled during processing
   */ const handleZoom = (newScale, cursorX = null, cursorY = null)=>{
        // FIX: Don't allow zoom during processing
        if (isProcessing) return;
        const minScale = 0.1;
        const maxScale = 5;
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        if (cursorX !== null && cursorY !== null) {
            // Cursor-based zoom (mousewheel)
            const factor = newScale / scale;
            const newX = position.x - cursorX * (factor - 1);
            const newY = position.y - cursorY * (factor - 1);
            setPosition({
                x: newX,
                y: newY
            });
        } else {
            // Center-based zoom (buttons)
            if (!imageRef.current) return;
            const rect = imageRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const factor = newScale / scale;
            const newX = position.x - centerX * (factor - 1);
            const newY = position.y - centerY * (factor - 1);
            setPosition({
                x: newX,
                y: newY
            });
        }
        setScale(newScale);
    };
    /**
   * Handle mouse wheel zoom
   * FIX: Disabled during processing
   */ const handleWheel = (e)=>{
        // FIX: Don't allow zoom during processing
        if (isProcessing) return;
        if (e.cancelable) e.preventDefault();
        if (!imageRef.current || !containerRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const scaleFactor = 0.025;
        const newScale = scale + Math.sign(-e.deltaY) * scaleFactor;
        handleZoom(newScale, cursorX, cursorY);
    };
    /**
   * Handle mouse down - start dragging
   * FIX: Disabled during processing
   */ const handleMouseDown = (e)=>{
        // FIX: Don't allow dragging during processing
        if (isProcessing) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        if (containerRef.current) {
            containerRef.current.style.cursor = 'grabbing';
        }
    };
    /**
   * Handle mouse up - stop dragging
   */ const handleMouseUp = ()=>{
        setIsDragging(false);
        if (containerRef.current) {
            containerRef.current.style.cursor = isProcessing ? 'not-allowed' : 'grab';
        }
    };
    /**
   * Handle mouse move - drag image
   * FIX: Disabled during processing
   */ const handleMouseMove = (e)=>{
        // FIX: Don't allow dragging during processing
        if (!isDragging || isProcessing) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({
            x: newX,
            y: newY
        });
    };
    /**
   * Reset position and scale - returns to centered position
   */ const handleReset = ()=>{
        // Don't allow reset during processing
        if (isProcessing) return;
        setScale(1);
        setIsImageCentered(false);
        // Re-center after reset
        setTimeout(()=>{
            centerImage();
        }, 50);
        log('Reset position and scale');
    };
    /**
   * Save the masked image
   * FIX: Converts to grayscale (black & white) before saving
   */ const handleSave = async ()=>{
        if (!uploadedImage || !maskImage || !imageRef.current || !maskRef.current) {
            logError('Missing required elements for saving');
            return;
        }
        setIsProcessing(true);
        // FIX: Update cursor to indicate processing
        if (containerRef.current) {
            containerRef.current.style.cursor = 'not-allowed';
        }
        log('Starting save process...');
        try {
            const canvas = canvasRef.current;
            if (!canvas) throw new Error('Canvas not found');
            const ctx = canvas.getContext('2d', {
                willReadFrequently: true
            });
            if (!ctx) throw new Error('Canvas context not found');
            // Load images
            const [uploadedImg, maskImg] = await Promise.all([
                new Promise((resolve, reject)=>{
                    const img = new Image();
                    img.onload = ()=>resolve(img);
                    img.onerror = reject;
                    img.src = uploadedImage;
                }),
                new Promise((resolve, reject)=>{
                    const img = new Image();
                    img.onload = ()=>resolve(img);
                    img.onerror = reject;
                    img.src = maskImage;
                })
            ]);
            // Get rendered dimensions
            const maskRect = maskRef.current.getBoundingClientRect();
            // Set canvas to mask's natural dimensions
            canvas.width = maskImg.naturalWidth;
            canvas.height = maskImg.naturalHeight;
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Calculate scaling factors
            const scaleFactorX = maskImg.naturalWidth / maskRect.width;
            const scaleFactorY = maskImg.naturalHeight / maskRect.height;
            // Calculate scaled dimensions
            const scaledWidth = imageRef.current.width * scale * scaleFactorX;
            const scaledHeight = imageRef.current.height * scale * scaleFactorY;
            // Calculate position
            const canvasX = position.x * scaleFactorX;
            const canvasY = position.y * scaleFactorY;
            // Save context state
            ctx.save();
            // Create clipping mask
            ctx.beginPath();
            ctx.rect(0, 0, maskImg.naturalWidth, maskImg.naturalHeight);
            ctx.clip();
            // Draw uploaded image
            ctx.drawImage(uploadedImg, canvasX, canvasY, scaledWidth, scaledHeight);
            // Restore context (remove clipping)
            ctx.restore();
            // FIX: Convert to grayscale BEFORE adding the mask
            convertToGrayscale(ctx, canvas);
            // Draw mask on top (after grayscale conversion)
            ctx.drawImage(maskImg, 0, 0);
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            if (dataUrl === 'data:,') {
                throw new Error('Generated data URL is invalid');
            }
            // Compress final image
            log('Compressing final image...');
            const compressedDataUrl = await compressImage(dataUrl);
            log('Save complete!');
            onSave(compressedDataUrl);
            onHide();
        } catch (error) {
            logError('Error saving image:', error);
        } finally{
            setIsProcessing(false);
            // Reset cursor
            if (containerRef.current) {
                containerRef.current.style.cursor = 'grab';
            }
        }
    };
    /**
   * Set up wheel event listener
   */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener("wheel", handleWheel, {
            passive: false
        });
        return ()=>container.removeEventListener("wheel", handleWheel);
    }, [
        scale,
        position,
        isProcessing
    ]); // FIX: Added isProcessing dependency
    // Handle ESC key to close modal
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleEscape = (e)=>{
            if (e.key === 'Escape' && show && !isProcessing) {
                onHide();
            }
        };
        if (show) {
            document.addEventListener('keydown', handleEscape);
            return ()=>document.removeEventListener('keydown', handleEscape);
        }
    }, [
        show,
        isProcessing,
        onHide
    ]);
    // FIX: Update cursor when processing state changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (containerRef.current) {
            containerRef.current.style.cursor = isProcessing ? 'not-allowed' : 'grab';
        }
    }, [
        isProcessing
    ]);
    // Don't render if not showing
    if (!show) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/70 z-[1040] transition-opacity",
                onClick: !isProcessing ? onHide : undefined
            }, void 0, false, {
                fileName: "[project]/src/components/ImageEditor.tsx",
                lineNumber: 487,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[1050] flex items-center justify-center p-4 overflow-y-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "image-editor-modal relative w-full max-w-[90vw] mx-auto my-8",
                    onClick: (e)=>e.stopPropagation(),
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[var(--surface-900)] rounded-lg shadow-xl w-fit mx-auto max-w-[90vw]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between border-b border-[var(--surface-700)] px-6 py-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-[var(--surface-50)] text-xl font-medium",
                                        children: "Edit Image"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                        lineNumber: 502,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: onHide,
                                        disabled: isProcessing,
                                        className: "text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                            size: 24
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 510,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                        lineNumber: 505,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ImageEditor.tsx",
                                lineNumber: 501,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    ref: containerRef,
                                    className: `editor-workspace ${isProcessing ? 'pointer-events-none opacity-75' : ''}`,
                                    onMouseDown: handleMouseDown,
                                    onMouseMove: handleMouseMove,
                                    onMouseUp: handleMouseUp,
                                    onMouseLeave: handleMouseUp,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "editor-zoom-controls",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleZoom(scale * 1.1),
                                                    title: "Zoom In",
                                                    disabled: isProcessing,
                                                    className: "w-10 h-10 flex items-center justify-center bg-[var(--surface-700)] border border-[var(--surface-600)] text-[var(--surface-50)] rounded hover:bg-[var(--surface-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__["ZoomIn"], {
                                                        size: 18
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                                        lineNumber: 532,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 526,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "zoom-value text-center text-[var(--surface-200)] text-sm py-1",
                                                    children: [
                                                        Math.round(scale * 100),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 535,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>handleZoom(scale * 0.9),
                                                    title: "Zoom Out",
                                                    disabled: isProcessing,
                                                    className: "w-10 h-10 flex items-center justify-center bg-[var(--surface-700)] border border-[var(--surface-600)] text-[var(--surface-50)] rounded hover:bg-[var(--surface-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__["ZoomOut"], {
                                                        size: 18
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                                        lineNumber: 545,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 539,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 525,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            ref: imageRef,
                                            src: uploadedImage || '',
                                            alt: "Upload",
                                            className: "uploaded-image",
                                            onLoad: centerImage,
                                            style: {
                                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                                transformOrigin: '0 0',
                                                pointerEvents: isProcessing ? 'none' : 'auto'
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 550,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        maskImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                            ref: maskRef,
                                            src: maskImage,
                                            alt: "Mask",
                                            className: "mask-image",
                                            onLoad: ()=>log('Mask loaded'),
                                            onError: (e)=>logError('Mask failed:', e)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 565,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        isProcessing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "absolute inset-0 bg-black/70 flex items-center justify-center z-20 rounded-lg",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-center text-white",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-2",
                                                        role: "status",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "sr-only",
                                                            children: "Processing..."
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                                            lineNumber: 583,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                                        lineNumber: 579,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "font-semibold",
                                                        children: "Converting to Black & White..."
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                                        lineNumber: 585,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-gray-300 mt-1",
                                                        children: "Compressing and saving..."
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                                        lineNumber: 586,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ImageEditor.tsx",
                                                lineNumber: 578,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 577,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                            ref: canvasRef,
                                            style: {
                                                display: 'none'
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 592,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                    lineNumber: 516,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/src/components/ImageEditor.tsx",
                                lineNumber: 515,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "modal-footer border-t border-[var(--surface-700)] px-6 py-4 flex justify-between gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "modal-footer-group flex gap-3",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn-reset flex items-center gap-2 text-[var(--surface-400)] hover:text-[var(--surface-200)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                            onClick: handleReset,
                                            title: "Reset Image Position",
                                            disabled: isProcessing,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$rotate$2d$ccw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RotateCcw$3e$__["RotateCcw"], {
                                                    size: 18
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 609,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Reset"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 610,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                            lineNumber: 603,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                        lineNumber: 602,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "modal-footer-group flex gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn btn-secondary px-6 py-2 rounded-lg disabled:cursor-not-allowed",
                                                onClick: onHide,
                                                disabled: isProcessing,
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ImageEditor.tsx",
                                                lineNumber: 616,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn btn-primary px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed",
                                                onClick: handleSave,
                                                disabled: isProcessing,
                                                children: isProcessing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "flex items-center gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "cursor-pointer inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin",
                                                            role: "status",
                                                            "aria-hidden": "true"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/ImageEditor.tsx",
                                                            lineNumber: 630,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        "Processing..."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/ImageEditor.tsx",
                                                    lineNumber: 629,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)) : 'Save Changes'
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ImageEditor.tsx",
                                                lineNumber: 623,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ImageEditor.tsx",
                                        lineNumber: 615,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ImageEditor.tsx",
                                lineNumber: 600,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ImageEditor.tsx",
                        lineNumber: 499,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/ImageEditor.tsx",
                    lineNumber: 494,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/ImageEditor.tsx",
                lineNumber: 493,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
const __TURBOPACK__default__export__ = ImageEditor;
}),
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
"[project]/src/components/ProductDetailClient.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// components/ProductDetailClient.tsx
// Version: 2.3.0 - 2025-11-05 - CART ADD FIX
// ✅ Fixed: Storage property names (used→usedSpace, limit→totalSpace)
// ✅ Cart add to cart now works - NaN error resolved
// Previous: Storage check for high-res PNG files
__turbopack_context__.s({
    "default": ()=>ProductDetailClient
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ImageEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ImageEditor.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/cartUtils.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
// Environment
const ENV_MODE = ("TURBOPACK compile-time value", "development") || 'development';
const isDevelopment = ENV_MODE === 'development' || ENV_MODE === 'testing';
function ProductDetailClient() {
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // Product State
    const [product, setProduct] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    // Selection State
    const [selectedSize, setSelectedSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedLightBase, setSelectedLightBase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedBackground, setSelectedBackground] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedTextOption, setSelectedTextOption] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [customText, setCustomText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        line1: '',
        line2: ''
    });
    const [quantity, setQuantity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    // Image State
    const [uploadedImage, setUploadedImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [originalFileName, setOriginalFileName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [finalMaskedImage, setFinalMaskedImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showEditor, setShowEditor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // UI State
    const [addingToCart, setAddingToCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [successMessage, setSuccessMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    // Fetch product on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (params.slug) {
            fetchProduct(params.slug);
        }
    }, [
        params.slug
    ]);
    /**
   * Fetch product data - READ FROM CACHED FILE
   */ const fetchProduct = async (slug)=>{
        try {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Fetching product', {
                slug,
                envMode: ENV_MODE
            });
            // Import from cached file directly
            const { cockpit3dProducts } = await __turbopack_context__.r("[project]/src/data/cockpit3d-products.js [app-ssr] (ecmascript, async loader)")(__turbopack_context__.i);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info(`Loaded ${cockpit3dProducts.length} products from cache`);
            // Find product by slug
            const foundProduct = cockpit3dProducts.find((p)=>p.slug === slug);
            if (!foundProduct) {
                throw new Error('Product not found');
            }
            setProduct(foundProduct);
            // Set default selections
            if (foundProduct.sizes && foundProduct.sizes.length > 0) {
                setSelectedSize(foundProduct.sizes[0]);
            }
            if (foundProduct.lightBases && foundProduct.lightBases.length > 0) {
                setSelectedLightBase(foundProduct.lightBases[0]);
            }
            if (foundProduct.backgroundOptions && foundProduct.backgroundOptions.length > 0) {
                setSelectedBackground(foundProduct.backgroundOptions[0]);
            }
            if (foundProduct.textOptions && foundProduct.textOptions.length > 0) {
                setSelectedTextOption(foundProduct.textOptions[0]);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].success('Product loaded', {
                name: foundProduct.name,
                id: foundProduct.id
            });
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to fetch product', err);
            setError(err.message);
        } finally{
            setLoading(false);
        }
    };
    /**
   * Handle image file upload
   */ const handleImageUpload = (e)=>{
        const file = e.target.files?.[0];
        if (!file) return;
        // Store filename
        setOriginalFileName(file.name);
        // Validate
        if (file.size > 5 * 1024 * 1024) {
            setErrors({
                ...errors,
                image: 'Image must be less than 5MB'
            });
            return;
        }
        if (![
            'image/jpeg',
            'image/png',
            'image/gif'
        ].includes(file.type)) {
            setErrors({
                ...errors,
                image: 'Please upload JPG, PNG, or GIF'
            });
            return;
        }
        // Read and show editor immediately
        const reader = new FileReader();
        reader.onload = (e)=>{
            const dataUrl = e.target?.result;
            setUploadedImage(dataUrl);
            setShowEditor(true);
        };
        reader.readAsDataURL(file);
    };
    /**
   * Handle save from ImageEditor - THIS IS CRITICAL
   */ const handleImageEditorSave = (compressedImage)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].info('Image saved from editor', {
            size: compressedImage.length
        });
        // Save the masked/compressed image
        setFinalMaskedImage(compressedImage);
        setShowEditor(false);
        // Clear any errors
        setErrors((prev)=>{
            const newErrors = {
                ...prev
            };
            delete newErrors.image;
            delete newErrors.finalImage;
            return newErrors;
        });
    };
    /**
   * Form validation
   */ const validateForm = ()=>{
        const newErrors = {};
        // Validate size if product has sizes
        if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
            newErrors.size = 'Please select a size';
        }
        // Validate image if product requires it
        if (product?.requiresImage) {
            if (!uploadedImage) {
                newErrors.image = 'Please upload an image';
            } else if (!finalMaskedImage) {
                newErrors.finalImage = 'Please save your edited image before adding to cart';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    /**
   * Calculate total price
   */ const calculateTotal = ()=>{
        let total = selectedSize?.price || product?.basePrice || 0;
        if (selectedLightBase?.price) total += selectedLightBase.price;
        if (selectedBackground?.price) total += selectedBackground.price;
        if (selectedTextOption?.price) total += selectedTextOption.price;
        return total * quantity;
    };
    /**
   * Calculate options price (for order line item)
   */ const calculateOptionsPrice = ()=>{
        let optionsPrice = 0;
        if (selectedLightBase?.price) optionsPrice += selectedLightBase.price;
        if (selectedBackground?.price) optionsPrice += selectedBackground.price;
        if (selectedTextOption?.price) optionsPrice += selectedTextOption.price;
        return optionsPrice;
    };
    /**
   * Convert selections to ProductOption array
   */ const buildProductOptions = ()=>{
        const options = [];
        if (selectedLightBase) {
            options.push({
                category: 'lightBase',
                optionId: selectedLightBase.id,
                name: selectedLightBase.name,
                value: selectedLightBase.name,
                priceModifier: selectedLightBase.price || 0
            });
        }
        if (selectedBackground) {
            options.push({
                category: 'background',
                optionId: selectedBackground.id,
                name: selectedBackground.name,
                value: selectedBackground.name,
                priceModifier: selectedBackground.price
            });
        }
        if (selectedTextOption) {
            options.push({
                category: 'textOption',
                optionId: selectedTextOption.id,
                name: selectedTextOption.name,
                value: selectedTextOption.name,
                priceModifier: selectedTextOption.price
            });
        }
        // ✅ ADD: Custom text as separate options
        if (customText.line1) {
            options.push({
                category: 'customText',
                optionId: 'text_line1',
                name: 'Text Line 1',
                value: customText.line1,
                priceModifier: 0
            });
        }
        if (customText.line2) {
            options.push({
                category: 'customText',
                optionId: 'text_line2',
                name: 'Text Line 2',
                value: customText.line2,
                priceModifier: 0
            });
        }
        return options // ✅ NOW INCLUDES ALL OPTIONS
        ;
    };
    /**
   * Add to cart with full order structure
   */ const handleAddToCart = async ()=>{
        // Validate first
        if (!validateForm()) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('Form validation failed', errors);
            return;
        }
        setAddingToCart(true);
        setError('');
        setSuccessMessage('');
        try {
            if (!product) {
                throw new Error('Product not loaded');
            }
            // Build CustomImage object if image exists
            let customImage;
            if (finalMaskedImage) {
                const img = new window.Image();
                img.src = finalMaskedImage;
                // ✅ Store BOTH images - original for display, masked for Cockpit3D
                if (uploadedImage) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeFullResImage"])(product.id.toString(), uploadedImage);
                }
                await new Promise((resolve)=>{
                    img.onload = resolve;
                });
                customImage = {
                    dataUrl: finalMaskedImage,
                    originalDataUrl: uploadedImage,
                    filename: originalFileName || `product-${product.id}-${Date.now()}.png`,
                    mimeType: 'image/png',
                    fileSize: finalMaskedImage.length,
                    width: img.width,
                    height: img.height,
                    processedAt: new Date().toISOString(),
                    maskId: product.maskImageUrl,
                    maskName: 'Product Mask'
                };
            }
            // Build size details
            const sizeDetails = {
                sizeId: selectedSize?.id || 'default',
                sizeName: selectedSize?.name || 'Default Size',
                basePrice: selectedSize?.price || product.basePrice
            };
            // Build product options
            const productOptions = buildProductOptions();
            // Build custom text string
            const customTextString = customText.line1 || customText.line2 ? `${customText.line1}${customText.line2 ? '\n' + customText.line2 : ''}` : undefined;
            // Calculate prices
            const optionsPrice = calculateOptionsPrice();
            const totalPrice = calculateTotal();
            // Create line item with COMPLETE order data structure
            const lineItem = {
                lineItemId: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                productId: String(product.id),
                cockpit3d_id: product.cockpit3d_id || String(product.id),
                name: product.name,
                sku: product.sku,
                basePrice: selectedSize?.price || product.basePrice,
                optionsPrice: optionsPrice,
                totalPrice: totalPrice,
                quantity: quantity,
                size: sizeDetails,
                options: productOptions,
                customImage: customImage,
                customText: customTextString ? {
                    text: customTextString
                } : undefined,
                dateAdded: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].order('Adding item to cart', {
                productId: lineItem.productId,
                name: lineItem.name,
                quantity: lineItem.quantity,
                totalPrice: lineItem.totalPrice,
                hasCustomImage: !!lineItem.customImage,
                hasCustomText: !!lineItem.customText,
                imageSize: lineItem.customImage ? lineItem.customImage.fileSize : 0
            });
            // Add to cart using cartUtils
            try {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$cartUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addToCart"])(lineItem);
                // addToCart(lineItem)
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].success('Item successfully added to cart');
            } catch (cartError) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Cart add failed', cartError);
                throw new Error(`Failed to add to cart: ${cartError.message}`);
            }
            // Success!
            setSuccessMessage(`Added ${quantity} ${product.name} to cart!`);
            // Reset form and redirect
            setTimeout(()=>{
                setQuantity(1);
                setCustomText({
                    line1: '',
                    line2: ''
                });
                setUploadedImage(null);
                setFinalMaskedImage(null);
                router.push('/cart');
            }, 1500);
        } catch (error) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].error('Failed to add to cart', error);
            setError(error.message || 'Failed to add to cart');
        } finally{
            setAddingToCart(false);
        }
    };
    // Loading state
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center min-h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-block w-12 h-12 border-4 border-[var(--brand-400)] border-t-transparent rounded-full animate-spin mb-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 448,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400",
                        children: "Loading product..."
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 449,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ProductDetailClient.tsx",
                lineNumber: 447,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/ProductDetailClient.tsx",
            lineNumber: 446,
            columnNumber: 7
        }, this);
    }
    // Error state
    if (error && !product) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "container mx-auto px-4 py-12",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-2xl mx-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-red-400 mb-2",
                        children: "Product Not Found"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 460,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-300 mb-4",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 461,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/products",
                        className: "btn btn-primary px-6 py-2 rounded-lg",
                        children: "Browse All Products"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 462,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ProductDetailClient.tsx",
                lineNumber: 459,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/ProductDetailClient.tsx",
            lineNumber: 458,
            columnNumber: 7
        }, this);
    }
    if (!product) return null;
    const mainImage = product.images.find((img)=>img.isMain) || product.images[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "breadcrumbs py-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "container mx-auto px-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "hover:text-brand-400 transition-colors",
                            children: "Home"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                            lineNumber: 479,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "mx-2 text-gray-600",
                            children: "/"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                            lineNumber: 480,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/products",
                            className: "hover:text-brand-400 transition-colors",
                            children: "Products"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                            lineNumber: 481,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "mx-2 text-gray-600",
                            children: "/"
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                            lineNumber: 482,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-text-tertiary",
                            children: product.name
                        }, void 0, false, {
                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                            lineNumber: 483,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                    lineNumber: 478,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/ProductDetailClient.tsx",
                lineNumber: 477,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "container mx-auto py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: finalMaskedImage ? // STAGE 1: Show user's uploaded/edited image
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sticky top-[var(--header-height)] z-1 mt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                            src: finalMaskedImage,
                                            alt: "Customer Preview",
                                            className: "w-full max-w-xs rounded-lg border border-[var(--surface-700)]",
                                            width: 1024,
                                            height: 1024
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                                            lineNumber: 495,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-2 flex gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>setShowEditor(true),
                                                    className: "btn btn-secondary px-4 py-3 rounded-md cursor-pointer",
                                                    children: "Edit Image Again"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                    lineNumber: 503,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>setFinalMaskedImage(null),
                                                    className: "btn btn-secondary px-4 py-3 rounded-md cursor-pointer",
                                                    children: "Remove & Show Product"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                    lineNumber: 510,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                                            lineNumber: 502,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                                    lineNumber: 494,
                                    columnNumber: 15
                                }, this) : product.images && product.images.length > 1 ? // STAGE 2: Show gallery if multiple images exist
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sticky top-[var(--header-height)]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProductGallery, {
                                        images: product.images
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 522,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                                    lineNumber: 521,
                                    columnNumber: 15
                                }, this) : // STAGE 3: Show single product image as fallback
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sticky top-[var(--header-height)]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        src: mainImage.src,
                                        alt: product.name,
                                        width: 1024,
                                        height: 1024,
                                        className: "w-full h-auto rounded-lg"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 527,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ProductDetailClient.tsx",
                                    lineNumber: 526,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                lineNumber: 491,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-3xl font-bold mb-4",
                                        children: product.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 541,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-400 mb-6",
                                        children: product.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 542,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-2xl font-bold mb-6",
                                        children: [
                                            "$",
                                            calculateTotal().toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 544,
                                        columnNumber: 13
                                    }, this),
                                    successMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-green-400",
                                            children: successMessage
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                                            lineNumber: 551,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 550,
                                        columnNumber: 15
                                    }, this),
                                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-red-400",
                                            children: error
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                                            lineNumber: 558,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 557,
                                        columnNumber: 15
                                    }, this),
                                    product.requiresImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xl font-medium mb-2",
                                                children: "Upload Image *"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 565,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "file",
                                                accept: "image/jpeg,image/png,image/gif",
                                                onChange: handleImageUpload,
                                                className: "block w-full text-sm text-gray-400 border-[var(--primary)] border-1 rounded-lg   file:mr-4 file:py-2 file:px-4   file:rounded-md file:border-0   file:text-sm file:font-semibold   file:bg-[var(--primary)] file:text-white   hover:file:bg-[var(--brand-600)]   file:cursor-pointer cursor-pointer"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 566,
                                                columnNumber: 17
                                            }, this),
                                            errors.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-red-400 text-sm mt-2",
                                                children: errors.image
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 579,
                                                columnNumber: 19
                                            }, this),
                                            errors.finalImage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-red-400 text-sm mt-2",
                                                children: errors.finalImage
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 582,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 px-3 py-1 text-left",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm mt-2",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Image Requirements:"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                            lineNumber: 585,
                                                            columnNumber: 47
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                        lineNumber: 585,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                        className: "list-inside list-disc font-thin text-sm p-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: "File type: JPG, PNG, or GIF"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 587,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: "Maximum size: 5MB"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 588,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: "Minimum dimensions: 500x500 pixels"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 589,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                children: "Higher resolution recommended for best results"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 590,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                        lineNumber: 586,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 584,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 564,
                                        columnNumber: 15
                                    }, this),
                                    product.sizes && product.sizes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xl font-medium mb-2",
                                                children: "Size *"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 600,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: product.sizes.map((size)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "crystal-radio flex items-center cursor-pointer",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "radio",
                                                                name: "size",
                                                                value: size.id,
                                                                checked: selectedSize?.id === size.id,
                                                                onChange: ()=>setSelectedSize(size),
                                                                className: "mr-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 604,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: [
                                                                    size.name,
                                                                    " ",
                                                                    size.price > 0 && `(+$${size.price})`
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 612,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, size.id, true, {
                                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                        lineNumber: 603,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 601,
                                                columnNumber: 17
                                            }, this),
                                            errors.size && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-red-400 text-sm mt-2",
                                                children: errors.size
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 619,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 599,
                                        columnNumber: 15
                                    }, this),
                                    product.backgroundOptions && product.backgroundOptions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xl font-medium mb-2",
                                                children: "Background"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 627,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: product.backgroundOptions.map((bg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "flex items-center cursor-pointer",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "radio",
                                                                name: "background",
                                                                value: bg.id,
                                                                checked: selectedBackground?.id === bg.id,
                                                                onChange: ()=>setSelectedBackground(bg),
                                                                className: "mr-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 631,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: [
                                                                    bg.name,
                                                                    " ",
                                                                    bg.price > 0 && `(+$${bg.price})`
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 639,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, bg.id, true, {
                                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                        lineNumber: 630,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 628,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 626,
                                        columnNumber: 15
                                    }, this),
                                    product.lightBases && product.lightBases.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xl font-medium mb-2",
                                                children: "Light Base"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 651,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: product.lightBases.map((base)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        className: "flex items-center cursor-pointer",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "radio",
                                                                name: "lightBase",
                                                                value: base.id,
                                                                checked: selectedLightBase?.id === base.id,
                                                                onChange: ()=>setSelectedLightBase(base),
                                                                className: "mr-3"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 655,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: [
                                                                    base.name,
                                                                    " ",
                                                                    base.price && base.price > 0 && `(+$${base.price})`
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                                lineNumber: 663,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, base.id, true, {
                                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                        lineNumber: 654,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 652,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 650,
                                        columnNumber: 15
                                    }, this),
                                    product.textOptions && product.textOptions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium mb-2",
                                                children: "Custom Text (Optional)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 675,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                placeholder: "Line 1",
                                                value: customText.line1,
                                                onChange: (e)=>setCustomText({
                                                        ...customText,
                                                        line1: e.target.value
                                                    }),
                                                className: "w-full px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)] mb-2",
                                                maxLength: 30
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 676,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                placeholder: "Line 2",
                                                value: customText.line2,
                                                onChange: (e)=>setCustomText({
                                                        ...customText,
                                                        line2: e.target.value
                                                    }),
                                                className: "w-full px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)]",
                                                maxLength: 30
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 684,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 674,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium mb-2",
                                                children: "Quantity"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 699,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "number",
                                                min: "1",
                                                value: quantity,
                                                onChange: (e)=>setQuantity(parseInt(e.target.value) || 1),
                                                className: "w-24 px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)]"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                                lineNumber: 700,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 698,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleAddToCart,
                                        disabled: addingToCart,
                                        className: "w-full btn btn-primary py-3 rounded-lg text-lg font-semibold disabled:opacity-50",
                                        children: addingToCart ? 'Adding to Cart...' : `Add to Cart - $${calculateTotal().toFixed(2)}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                                        lineNumber: 710,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ProductDetailClient.tsx",
                                lineNumber: 540,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 488,
                        columnNumber: 9
                    }, this),
                    product.requiresImage && product.maskImageUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ImageEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        show: showEditor,
                        onHide: ()=>setShowEditor(false),
                        uploadedImage: uploadedImage,
                        maskImage: product.maskImageUrl,
                        onSave: handleImageEditorSave
                    }, void 0, false, {
                        fileName: "[project]/src/components/ProductDetailClient.tsx",
                        lineNumber: 722,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ProductDetailClient.tsx",
                lineNumber: 487,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ProductDetailClient.tsx",
        lineNumber: 475,
        columnNumber: 5
    }, this);
}
}),

};

//# sourceMappingURL=src_c9e6c971._.js.map