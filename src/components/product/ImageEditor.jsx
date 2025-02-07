import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

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

  const handleWheel = (e) => {
    if (e.cancelable) e.preventDefault();
    
    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const scaleFactor = 0.1;
    const newScale = Math.max(0.1, Math.min(5, scale + Math.sign(-e.deltaY) * scaleFactor));

    const factor = newScale / scale;
    const newX = position.x - cursorX * (factor - 1);
    const newY = position.y - cursorY * (factor - 1);

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  useEffect(() => {
    if (maskRef.current) {
      const maskRect = maskRef.current.getBoundingClientRect();
      const workspace = containerRef.current;
      if (workspace) {
        workspace.style.width = `${maskRect.width}px`;
        workspace.style.height = `${maskRect.height}px`;
      }
    }
  }, [maskImage]);

  return (
    <Modal show={show} onHide={onHide} dialogClassName="image-editor-modal" size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Edit Image</Modal.Title>
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
          {/* Uploaded Image */}
          <img
            ref={imageRef}
            src={uploadedImage}
            alt="Upload"
            className="uploaded-image"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          />

          {/* Bounding Box */}
          <div
            style={{
              position: 'absolute',
              border: '2px dashed rgba(255, 255, 255, 0.5)',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              width: imageRef.current?.width || 0,
              height: imageRef.current?.height || 0,
              pointerEvents: 'none', // Ensure it doesn't interfere with dragging
            }}
          />

          {/* Mask Image */}
          <img
            ref={maskRef}
            src={maskImage}
            alt="Mask"
            className="mask-image"
            style={{ width: '100%', height: 'auto' }}
          />

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Cancel
        </button>
        <button className="btn btn-secondary" onClick={handleReset}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageEditor;