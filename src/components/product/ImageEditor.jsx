import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const ImageEditor = ({ show, onHide, uploadedImage, maskImage, onSave }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const maskRef = useRef(null);
  const canvasRef = useRef(null);

  // Compression settings for the final masked image
  const compressionSettings = {
    maxSizeMB: 0.75,         // 750KB max
    maxWidthOrHeight: 1600,   
    useWebWorker: true,
    fileType: 'image/png',
    initialQuality: 0.8
  };

  // Helper function to compress image
  const compressImage = async (dataUrl) => {
    try {
      // Convert data URL to blob
      const base64Data = dataUrl.split(',')[1];
      const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      console.log(`Original image size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Compress the blob
      const compressedFile = await imageCompression(blob, compressionSettings);
      
      console.log(`Compressed image size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Convert back to data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(compressedFile);
      });
      
    } catch (error) {
      console.error('Compression failed:', error);
      // Return original if compression fails
      return dataUrl;
    }
  };

  // Load and store the mask image dimensions
  const [maskDimensions, setMaskDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageRef.current && maskRef.current) {
      const maskRect = maskRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();

      // Center the uploaded image within the mask
      const initialX = (maskRect.width - imgRect.width) / 2;
      const initialY = (maskRect.height - imgRect.height) / 2;
      setPosition({ x: initialX, y: initialY });
    }
  }, [uploadedImage, maskImage]);

  // In the useEffect that sets aspect ratio
  useEffect(() => {
  // Only run when modal is actually shown AND we have the mask image
    if (!show || !maskImage || !containerRef.current) return;
    
    console.log('🖼️ Modal is open, setting up mask...');
    
    const img = new Image();
    img.onload = () => {
      // Double-check refs still exist after async image load
      if (!containerRef.current) {
        console.warn('Container ref lost during image load');
        return;
      }
      
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      console.log('📏 Setting aspect ratio:', aspectRatio);
      
      containerRef.current.style.aspectRatio = `${aspectRatio}`;
      
      setMaskDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.src = maskImage;
  }, [show, maskImage]); // Add 'show' as dependency!

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
      const rect = imageRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const factor = newScale / scale;
      const newX = position.x - centerX * (factor - 1);
      const newY = position.y - centerY * (factor - 1);
      setPosition({ x: newX, y: newY });
    }

    setScale(newScale);
  };

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

  const handleMouseDown = (e) => {
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

  const handleMouseUp = () => {
    setIsDragging(false);

    // Change cursor back to grab
    const workspace = containerRef.current;
    if (workspace) {
      workspace.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleReset = () => {
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };
  
  const handleSave = async () => {
    if (!uploadedImage || !maskImage || !imageRef.current || !maskRef.current) {
      console.error('Missing required elements for saving');
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Load images
      const [uploadedImg, maskImg] = await Promise.all([
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = uploadedImage;
        }),
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = maskImage;
        })
      ]);

      // Get rendered dimensions of the mask
      const maskRect = maskRef.current.getBoundingClientRect();

      // Set canvas to mask's natural dimensions
      canvas.width = maskImg.naturalWidth;
      canvas.height = maskImg.naturalHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate scaling factors to map rendered coordinates to intrinsic coordinates
      const scaleFactorX = maskImg.naturalWidth / maskRect.width;
      const scaleFactorY = maskImg.naturalHeight / maskRect.height;

      // Calculate the scaled dimensions of the uploaded image
      const scaledWidth = imageRef.current.width * scale * scaleFactorX;
      const scaledHeight = imageRef.current.height * scale * scaleFactorY;

      // Calculate the position relative to the mask's intrinsic size
      const canvasX = position.x * scaleFactorX;
      const canvasY = position.y * scaleFactorY;

      // Save context state
      ctx.save();

      // Create clipping mask using the mask dimensions
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

      // Validate data URL
      if (dataUrl === 'data:,') {
        throw new Error('Generated data URL is invalid');
      }

      // COMPRESS THE FINAL IMAGE HERE
      console.log('Compressing final masked image...');
      const compressedDataUrl = await compressImage(dataUrl);

      onSave(compressedDataUrl); // Pass compressed image
      onHide();

    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, position]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="image-editor-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="h6">Edit Image</Modal.Title>
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
          {/* Zoom Controls Toolbar */}
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
          </div>

          <img
            ref={imageRef}
            src={uploadedImage}
            alt="Upload"
            className="uploaded-image"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0'
            }}
          />

          {/* Mask Image */} 
          {maskImage && (
            <img
              ref={maskRef}
              src={maskImage}
              alt="Mask"
              className="mask-image"
              onLoad={() => console.log('🎭 Mask image element loaded')}
              onError={(e) => console.error('❌ Mask image element failed:', e)}
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
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                borderRadius: '8px'
              }}
            >
              <div style={{ textAlign: 'center', color: 'white' }}>
                <div 
                  className="spinner-border text-light mb-2" 
                  role="status"
                  style={{ width: '3rem', height: '3rem' }}
                >
                  <span className="visually-hidden">Processing...</span>
                </div>
                <div>Compressing and saving...</div>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        {/* Left side - Utility actions */}
        <div className="modal-footer-group">
          <button 
            className="btn-reset"
            onClick={handleReset}
            title="Reset Image Position"
            disabled={isProcessing}
          >
            <RotateCcw size={18} />
            <span className="ms-2">Reset</span>
          </button>
        </div>

        {/* Right side - Primary actions */}
        <div className="modal-footer-group">
          <button 
            className="btn btn-secondary"
            onClick={onHide}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageEditor;