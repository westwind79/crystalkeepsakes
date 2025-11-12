// components/ImageEditor.tsx
// Version: 2.2.0 - 2025-11-05 - HIGH-RES PNG FOR LASER ENGRAVING
// ✅ Fixed: Changed to PNG format for transparency support
// ✅ Fixed: Increased resolution to 2400px for laser engraving quality
// ✅ Fixed: Increased file size limit to 2MB for high-res images
// ✅ Fixed: Increased quality to 0.95 for best engraving results
// - Kept: Disabled image movement during save/processing
// - Kept: Converts uploaded images to black & white (grayscale) on save
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import imageCompression from 'browser-image-compression'

// TypeScript interfaces
interface ImageEditorProps {
  show: boolean
  onHide: () => void
  uploadedImage: string | null
  maskImage: string | null
  onSave: (compressedImage: string) => void
}

interface Position {
  x: number
  y: number
}

interface MaskDimensions {
  width: number
  height: number
}

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  show, 
  onHide, 
  uploadedImage, 
  maskImage, 
  onSave 
}) => {
  // State management
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [scale, setScale] = useState<number>(1)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [maskDimensions, setMaskDimensions] = useState<MaskDimensions>({ width: 0, height: 0 })
  const [isImageCentered, setIsImageCentered] = useState<boolean>(false)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const maskRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Environment check
  const isDev = process.env.NEXT_PUBLIC_ENV_MODE === 'development'
  const isTest = process.env.NEXT_PUBLIC_ENV_MODE === 'testing'
  const isProd = process.env.NEXT_PUBLIC_ENV_MODE === 'production'

  // Compression settings based on environment
  // PNG for transparency support, higher resolution for laser engraving
  const compressionSettings = {
    maxSizeMB: 2, // Allow larger files for high-res PNG
    maxWidthOrHeight: 2400, // Higher resolution for engraving
    useWebWorker: true,
    fileType: 'image/png' as const, // PNG for transparency
    initialQuality: 0.95 // High quality for engraving
  }

  // Log only in dev/test
  const log = (...args: any[]) => {
    if (isDev || isTest) {
      console.log('[IMAGE_EDITOR]', ...args)
    }
  }

  const logError = (...args: any[]) => {
    if (isDev || isTest) {
      console.error('[IMAGE_EDITOR ERROR]', ...args)
    }
  }

  /**
   * Center the uploaded image within the mask
   * Called after both images are loaded
   */
  const centerImage = () => {
    if (!imageRef.current || !containerRef.current || isImageCentered) return
    
    const imgRect = imageRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Calculate center position
    const centerX = (containerRect.width - imgRect.width) / 2
    const centerY = (containerRect.height - imgRect.height) / 2
    
    setPosition({ x: centerX, y: centerY })
    setIsImageCentered(true)
    
    log('Image centered at:', { x: centerX, y: centerY })
  }

  /**
   * Convert image to grayscale (black & white)
   */
  const convertToGrayscale = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    log('Converting to grayscale...')
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Convert each pixel to grayscale
    for (let i = 0; i < data.length; i += 4) {
      // Get RGB values
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate grayscale using luminosity method (more accurate)
      // Formula: 0.299*R + 0.587*G + 0.114*B
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
      
      // Set RGB to same gray value
      data[i] = gray      // Red
      data[i + 1] = gray  // Green
      data[i + 2] = gray  // Blue
      // Alpha (data[i + 3]) stays the same
    }
    
    // Put grayscale data back
    ctx.putImageData(imageData, 0, 0)
    
    log('Grayscale conversion complete')
  }

  /**
   * Compress image to reduce file size
   */
  const compressImage = async (dataUrl: string): Promise<string> => {
    try {
      // Convert data URL to blob
      const base64Data = dataUrl.split(',')[1]
      const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      
      log(`Original size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Compress the blob
      const compressedFile = await imageCompression(blob, compressionSettings)
      
      log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Convert back to data URL
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(compressedFile)
      })
      
    } catch (error) {
      logError('Compression failed:', error)
      return dataUrl // Return original if compression fails
    }
  }

  /**
   * Set up mask dimensions and aspect ratio
   * If no mask, use uploaded image dimensions
   */
  useEffect(() => {
    if (!show || !containerRef.current) return
    
    // If we have a mask, use its dimensions
    if (maskImage) {
      log('Setting up mask...')
      
      const img = new Image()
      img.onload = () => {
        if (!containerRef.current) {
          logError('Container ref lost during image load')
          return
        }
        
        const aspectRatio = img.naturalWidth / img.naturalHeight
        log('Aspect ratio:', aspectRatio)
        
        containerRef.current.style.aspectRatio = `${aspectRatio}`
        
        setMaskDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.src = maskImage
    } else if (uploadedImage) {
      // No mask - use uploaded image dimensions
      log('No mask - using uploaded image dimensions')
      
      const img = new Image()
      img.onload = () => {
        if (!containerRef.current) return
        
        const aspectRatio = img.naturalWidth / img.naturalHeight
        log('Image aspect ratio:', aspectRatio)
        
        containerRef.current.style.aspectRatio = `${aspectRatio}`
        
        setMaskDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.src = uploadedImage
    }
  }, [show, maskImage, uploadedImage])

  /**
   * Center image when modal opens or image changes
   */
  useEffect(() => {
    if (show && uploadedImage) {
      // Reset centering flag when new image or modal opens
      setIsImageCentered(false)
      // Small delay to ensure images are rendered
      setTimeout(() => {
        centerImage()
      }, 100)
    }
  }, [show, uploadedImage])

  /**
   * Handle zoom with optional cursor position
   * FIX: Disabled during processing
   */
  const handleZoom = (newScale: number, cursorX: number | null = null, cursorY: number | null = null) => {
    // FIX: Don't allow zoom during processing
    if (isProcessing) return
    
    const minScale = 0.1
    const maxScale = 5
    newScale = Math.max(minScale, Math.min(maxScale, newScale))

    if (cursorX !== null && cursorY !== null) {
      // Cursor-based zoom (mousewheel)
      const factor = newScale / scale
      const newX = position.x - cursorX * (factor - 1)
      const newY = position.y - cursorY * (factor - 1)
      setPosition({ x: newX, y: newY })
    } else {
      // Center-based zoom (buttons)
      if (!imageRef.current) return
      const rect = imageRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const factor = newScale / scale
      const newX = position.x - centerX * (factor - 1)
      const newY = position.y - centerY * (factor - 1)
      setPosition({ x: newX, y: newY })
    }

    setScale(newScale)
  }

  /**
   * Handle mouse wheel zoom
   * FIX: Disabled during processing
   */
  const handleWheel = (e: WheelEvent) => {
    // FIX: Don't allow zoom during processing
    if (isProcessing) return
    
    if (e.cancelable) e.preventDefault()

    if (!imageRef.current || !containerRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const cursorX = e.clientX - rect.left
    const cursorY = e.clientY - rect.top

    const scaleFactor = 0.025
    const newScale = scale + Math.sign(-e.deltaY) * scaleFactor

    handleZoom(newScale, cursorX, cursorY)
  }

  /**
   * Handle mouse down - start dragging
   * FIX: Disabled during processing
   */
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // FIX: Don't allow dragging during processing
    if (isProcessing) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing'
    }
  }

  /**
   * Handle mouse up - stop dragging
   */
  const handleMouseUp = () => {
    setIsDragging(false)

    if (containerRef.current) {
      containerRef.current.style.cursor = isProcessing ? 'not-allowed' : 'grab'
    }
  }

  /**
   * Handle mouse move - drag image
   * FIX: Disabled during processing
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // FIX: Don't allow dragging during processing
    if (!isDragging || isProcessing) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    setPosition({ x: newX, y: newY })
  }

  /**
   * Reset position and scale - returns to centered position
   */
  const handleReset = () => {
    // Don't allow reset during processing
    if (isProcessing) return
    
    setScale(1)
    setIsImageCentered(false)
    // Re-center after reset
    setTimeout(() => {
      centerImage()
    }, 50)
    log('Reset position and scale')
  }
  
  /**
   * Save the masked image
   * FIX: Converts to grayscale (black & white) before saving
   */
  const handleSave = async () => {
    if (!uploadedImage || !maskImage || !imageRef.current || !maskRef.current) {
      logError('Missing required elements for saving')
      return
    }

    setIsProcessing(true)
    
    // FIX: Update cursor to indicate processing
    if (containerRef.current) {
      containerRef.current.style.cursor = 'not-allowed'
    }
    
    log('Starting save process...')

    try {
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not found')
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas context not found')

      // Load images
      const [uploadedImg, maskImg] = await Promise.all([
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = uploadedImage
        }),
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = maskImage
        })
      ])

      // Get rendered dimensions
      const maskRect = maskRef.current.getBoundingClientRect()

      // Set canvas to mask's natural dimensions
      canvas.width = maskImg.naturalWidth
      canvas.height = maskImg.naturalHeight

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate scaling factors
      const scaleFactorX = maskImg.naturalWidth / maskRect.width
      const scaleFactorY = maskImg.naturalHeight / maskRect.height

      // Calculate scaled dimensions
      const scaledWidth = imageRef.current.width * scale * scaleFactorX
      const scaledHeight = imageRef.current.height * scale * scaleFactorY

      // Calculate position
      const canvasX = position.x * scaleFactorX
      const canvasY = position.y * scaleFactorY

      // Save context state
      ctx.save()

      // Create clipping mask
      ctx.beginPath()
      ctx.rect(0, 0, maskImg.naturalWidth, maskImg.naturalHeight)
      ctx.clip()

      // Draw uploaded image
      ctx.drawImage(
        uploadedImg,
        canvasX, canvasY,
        scaledWidth, scaledHeight
      )

      // Restore context (remove clipping)
      ctx.restore()

      // FIX: Convert to grayscale BEFORE adding the mask
      convertToGrayscale(ctx, canvas)

      // Draw mask on top (after grayscale conversion)
      ctx.drawImage(maskImg, 0, 0)

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0)

      if (dataUrl === 'data:,') {
        throw new Error('Generated data URL is invalid')
      }

      // Compress final image
      log('Compressing final image...')
      const compressedDataUrl = await compressImage(dataUrl)

      log('Save complete!')
      onSave(compressedDataUrl)
      onHide()

    } catch (error) {
      logError('Error saving image:', error)
    } finally {
      setIsProcessing(false)
      
      // Reset cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab'
      }
    }
  }

  /**
   * Set up wheel event listener
   */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [scale, position, isProcessing]) // FIX: Added isProcessing dependency

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show && !isProcessing) {
        onHide()
      }
    }
    
    if (show) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [show, isProcessing, onHide])

  // FIX: Update cursor when processing state changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = isProcessing ? 'not-allowed' : 'grab'
    }
  }, [isProcessing])

  // Don't render if not showing
  if (!show) return null

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-[1040] transition-opacity"
        onClick={!isProcessing ? onHide : undefined}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="image-editor-modal relative w-full max-w-[90vw] mx-auto my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content - uses your custom .image-editor-modal CSS */}
          <div className="bg-[var(--surface-900)] rounded-lg shadow-xl w-fit mx-auto max-w-[90vw]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--surface-700)] px-6 py-4">
              <h3 className="text-[var(--surface-50)] text-xl font-medium">
                Edit Image
              </h3>
              <button
                onClick={onHide}
                disabled={isProcessing}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div 
                ref={containerRef}
                className={`editor-workspace ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Zoom Controls - uses your custom .editor-zoom-controls CSS */}
                <div className="editor-zoom-controls">
                  <button 
                    onClick={() => handleZoom(scale * 1.1)}
                    title="Zoom In"
                    disabled={isProcessing}
                    className="w-10 h-10 flex items-center justify-center bg-[var(--surface-700)] border border-[var(--surface-600)] text-[var(--surface-50)] rounded hover:bg-[var(--surface-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZoomIn size={18} />
                  </button>
                  
                  <div className="zoom-value text-center text-[var(--surface-200)] text-sm py-1">
                    {Math.round(scale * 100)}%
                  </div>
                  
                  <button 
                    onClick={() => handleZoom(scale * 0.9)}
                    title="Zoom Out"
                    disabled={isProcessing}
                    className="w-10 h-10 flex items-center justify-center bg-[var(--surface-700)] border border-[var(--surface-600)] text-[var(--surface-50)] rounded hover:bg-[var(--surface-600)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ZoomOut size={18} />
                  </button>
                </div>

                {/* Uploaded Image */}
                <img
                  ref={imageRef}
                  src={uploadedImage || ''}
                  alt="Upload"
                  className="uploaded-image"
                  onLoad={centerImage}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    pointerEvents: isProcessing ? 'none' : 'auto'
                  }}
                />

                {/* Mask Image */} 
                {maskImage && (
                  <img
                    ref={maskRef}
                    src={maskImage}
                    alt="Mask"
                    className="mask-image"
                    onLoad={() => log('Mask loaded')}
                    onError={(e) => logError('Mask failed:', e)}
                  />
                )}
                
                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20 rounded-lg">
                    <div className="text-center text-white">
                      <div 
                        className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"
                        role="status"
                      >
                        <span className="sr-only">Processing...</span>
                      </div>
                      <div className="font-semibold">Converting to Black & White...</div>
                      <div className="text-sm text-gray-300 mt-1">Compressing and saving...</div>
                    </div>
                  </div>
                )}
                
                {/* Hidden canvas for rendering */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-t border-[var(--surface-700)] px-6 py-4 flex justify-between gap-4">
              {/* Left side - Utility actions */}
              <div className="modal-footer-group flex gap-3">
                <button 
                  className="btn-reset flex items-center gap-2 text-[var(--surface-400)] hover:text-[var(--surface-200)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleReset}
                  title="Reset Image Position"
                  disabled={isProcessing}
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Right side - Primary actions */}
              <div className="modal-footer-group flex gap-3">
                <button 
                  className="btn btn-secondary px-6 py-2 rounded-lg disabled:cursor-not-allowed"
                  onClick={onHide}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSave}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span 
                        className="cursor-pointer inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                        role="status" 
                        aria-hidden="true"
                      />
                      Processing...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ImageEditor