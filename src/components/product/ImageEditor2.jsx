// components/product/ImageEditor2.jsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const ImageEditor2 = ({ show, onHide, uploadedImage, maskImage, onSave }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskDimensions, setMaskDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const maskRef = useRef(null);
  const canvasRef = useRef(null);

  // Enhanced compression settings for Detail2
  const compressionSettings = {
    maxSizeMB: 0.5,           // 500KB max for Detail2
    maxWidthOrHeight: 1400,   
    useWebWorker: true,
    fileType: 'image/png',
    initialQuality: 0.75
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 IMAGEEDITOR_V2: Component rendered with:', {
      show,
      hasUploadedImage: !!uploadedImage,
      hasMaskImage: !!maskImage
    });
  }

  // Helper function to compress image
  const compressImage = async (dataUrl) => {
    try {
      const base64Data = dataUrl.split(',')[1];
      const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📦 V2 Original size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const compressedFile = await imageCompression(blob, compressionSettings);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📦 V2 Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressedFile);
      });
      
    } catch (error) {
      console.error('❌ V2 Compression failed:', error);
      return dataUrl;
    }
  };

  // FIXED: Zoom handlers (copied from working ImageEditor)
  const handleZoom = (newScale, cursorX = null, cursorY = null) => {
    const minScale = 0.1;
    const maxScale = 5;
    newScale = Math.max(minScale, Math.min(maxScale, newScale));

    if (cursorX !== null && cursorY !== null) {
      // Cursor-based zoom (for mousewheel)
      const factor = newScale / scale;
      const newX = position.x - cursorX * (factor - 1);
      const newY = position.y - cursorY * (factor - 1);
      setPosition({ x: newX, y: newY });
    } else {
      // Center-based zoom (for buttons)
      const rect = imageRef.current?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const factor = newScale / scale;
        const newX = position.x - centerX * (factor - 1);
        const newY = position.y - centerY * (factor - 1);
        setPosition({ x: newX, y: newY });
      }
    }

    setScale(newScale);
  };

  // FIXED: Wheel handler (copied from working ImageEditor)
  const handleWheel = (e) => {
    if (e.cancelable) e.preventDefault();

    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const scaleFactor = 0.025;
    const newScale = scale + Math.sign(-e.deltaY) * scaleFactor;

    handleZoom(newScale, cursorX, cursorY);
  };

  // FIXED: Mouse event handlers (copied from working ImageEditor)
  const handleMouseDown = (e) => {
    if (isProcessing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });

    // Change cursor to grabbing
    const workspace = containerRef.current;
    if (workspace) {
      workspace.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isProcessing) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    // Change cursor back to grab
    const workspace = containerRef.current;
    if (workspace) {
      workspace.style.cursor = 'grab';
    }
  };

  // Reset function
  const handleReset = () => {
    if (isProcessing) return;
    setPosition({ x: 0, y: 0 });
    setScale(1);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 V2 Reset image position and scale');
    }
  };

  // Save function
  const handleSave = async () => {
    if (!uploadedImage || !maskImage || isProcessing) return;

    setIsProcessing(true);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('💾 V2 Starting save process...');
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Load images
      const uploadedImg = new Image();
      const maskImg = new Image();
      
      await Promise.all([
        new Promise((resolve) => {
          uploadedImg.onload = resolve;
          uploadedImg.src = uploadedImage;
        }),
        new Promise((resolve) => {
          maskImg.onload = resolve;
          maskImg.src = maskImage;
        })
      ]);

      // Set canvas size to mask dimensions
      canvas.width = maskImg.naturalWidth;
      canvas.height = maskImg.naturalHeight;

      // FIXED: Get rendered dimensions of the mask (like in original ImageEditor)
      const maskRect = maskRef.current.getBoundingClientRect();

      // Calculate scaling factors
      const scaleFactorX = maskImg.naturalWidth / maskRect.width;
      const scaleFactorY = maskImg.naturalHeight / maskRect.height;

      // FIXED: Calculate image dimensions on canvas (like in original ImageEditor) 
      const scaledWidth = imageRef.current.width * scale * scaleFactorX;
      const scaledHeight = imageRef.current.height * scale * scaleFactorY;

      // Calculate position on canvas
      const canvasX = position.x * scaleFactorX;
      const canvasY = position.y * scaleFactorY;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state
      ctx.save();

      // Create clipping mask
      ctx.beginPath();
      ctx.rect(0, 0, maskImg.naturalWidth, maskImg.naturalHeight);
      ctx.clip();

      // Draw the uploaded image
      ctx.drawImage(
        uploadedImg,
        canvasX, canvasY,
        scaledWidth, scaledHeight
      );

      // Restore context
      ctx.restore();

      // Draw the mask on top
      ctx.drawImage(maskImg, 0, 0);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      if (dataUrl === 'data:,') {
        throw new Error('Generated data URL is invalid');
      }

      // Compress the final image
      if (process.env.NODE_ENV === 'development') {
        console.log('🗜️ V2 Compressing final masked image...');
      }
      
      const compressedDataUrl = await compressImage(dataUrl);

      // Send back to Detail2
      onSave(compressedDataUrl);
      onHide();

    } catch (error) {
      console.error('❌ V2 Save error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Set up mask dimensions when modal opens
  useEffect(() => {
    if (!show || !maskImage || !containerRef.current) return;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ V2 Setting up mask dimensions...');
    }
    
    const img = new Image();
    img.onload = () => {
      if (!containerRef.current) {
        console.warn('⚠️ V2 Container ref lost during image load');
        return;
      }
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      containerRef.current.style.aspectRatio = `${aspectRatio}`;
      
      setMaskDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📏 V2 Mask dimensions set:', { 
          width: img.naturalWidth, 
          height: img.naturalHeight, 
          aspectRatio 
        });
      }
    };
    img.src = maskImage;
  }, [show, maskImage]);

  // Set up wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, position]);

  // FIXED: Center image with proper timing - use a function that can be called from onLoad
  const centerImage = () => {
    if (imageRef.current && maskRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        const maskRect = maskRef.current.getBoundingClientRect();
        const imgRect = imageRef.current.getBoundingClientRect();

        if (maskRect.width > 0 && imgRect.width > 0) {
          // Center the uploaded image within the mask
          const initialX = (maskRect.width - imgRect.width) / 2;
          const initialY = (maskRect.height - imgRect.height) / 2;
          setPosition({ x: initialX, y: initialY });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('📍 V2 Centered image at:', { x: initialX, y: initialY, maskRect, imgRect });
          }
        }
      });
    }
  };

  // Center image when both images are loaded - but use a timeout for safety
  useEffect(() => {
    if (uploadedImage && maskImage) {
      // Give a small delay to ensure both images have rendered
      const timer = setTimeout(centerImage, 100);
      return () => clearTimeout(timer);
    }
  }, [uploadedImage, maskImage]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="image-editor-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="h6">Edit Image - Detail2</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div 
          ref={containerRef}
          className="editor-workspace"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom Controls */}
          <div className="editor-zoom-controls">
            <button 
              onClick={() => handleZoom(scale * 1.1)}
              title="Zoom In"
              disabled={isProcessing}
            >
              <ZoomIn size={18} />
            </button>
            
            <div className="zoom-value">
              {Math.round(scale * 100)}%
            </div>
            
            <button 
              onClick={() => handleZoom(scale * 0.9)}
              title="Zoom Out"
              disabled={isProcessing}
            >
              <ZoomOut size={18} />
            </button>
            
            <button 
              onClick={handleReset}
              title="Reset Position"
              disabled={isProcessing}
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Uploaded Image */}
          <img
            ref={imageRef}
            src={uploadedImage}
            alt="Upload"
            className="uploaded-image"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0'  // Keep this as 0 0 to match the working version
            }}
            onLoad={() => {
              if (process.env.NODE_ENV === 'development') {
                console.log('🖼️ V2 Uploaded image loaded');
              }
              // Try to center when the uploaded image loads
              centerImage();
            }}
          />

          {/* Mask Image */} 
          {maskImage && (
            <img
              ref={maskRef}
              src={maskImage}
              alt="Mask"
              className="mask-image"
              onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('🎭 V2 Mask image element loaded');
                }
                // Try to center when the mask image loads
                centerImage();
              }}
              onError={(e) => {
                if (process.env.NODE_ENV === 'development') {
                  console.error('❌ V2 Mask image element failed:', e);
                }
              }}
            />
          )}
          
          {/* Processing Overlay */}
          {isProcessing && (
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.1rem',
                zIndex: 100
              }}
            >
              Processing...
            </div>
          )}
        </div>
        
        {/* Hidden canvas for rendering */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
        />
      </Modal.Body>
      
      <Modal.Footer>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onHide}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isProcessing || !uploadedImage || !maskImage}
          >
            {isProcessing ? 'Processing...' : 'Save'}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageEditor2;