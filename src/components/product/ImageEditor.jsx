import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react';


const ImageEditor = ({ show, onHide, uploadedImage, maskImage, onSave }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const maskRef = useRef(null);
  const canvasRef = useRef(null);

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

  useEffect(() => {
    if (maskImage) {
      const img = new Image();
      img.onload = () => {
        setMaskDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = maskImage;
    }
  }, [maskImage]);

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

    const scaleFactor = 0.1;
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

      onSave(dataUrl);
      onHide();

    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, position]);

  // Set aspect ratio based on mask image
  useEffect(() => {
    if (maskImage && containerRef.current) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        containerRef.current.style.aspectRatio = `${aspectRatio}`;
      };
      img.src = maskImage;
    }
  }, [maskImage]);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="image-editor-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="h6">Edit Image</Modal.Title>
{/*        <button className="btn btn-secondary" onClick={() => handleZoom(scale * 1.1)}>
          Zoom In
        </button>
        <button className="btn btn-secondary" onClick={() => handleZoom(scale * 0.9)}>
          Zoom Out
        </button>
        
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-secondary" onClick={onHide}>
          Cancel
        </button>*/}
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
            >
              <ZoomIn size={18} />
            </button>
            
            <div className="zoom-value">
              {Math.round(scale * 100)}%
            </div>
            
            <button 
              onClick={() => handleZoom(scale * 0.9)}
              title="Zoom Out"
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
          
{/*          <div
            style={{
              position: 'absolute',
              border: '2px dashed rgba(255, 255, 255, 0.5)',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              width: imageRef.current?.width || 0,
              height: imageRef.current?.height || 0,
              pointerEvents: 'none',
            }}
          />*/}

          {/* Mask Image */}
          <img
            ref={maskRef}
            src={maskImage}
            alt="Mask"
            className="mask-image" 
          />
          
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
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageEditor;