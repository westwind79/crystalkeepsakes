import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

const ImageEditor = ({ show, onHide, uploadedImage, maskImage, onSave }) => {
  // State for tracking image position and scale
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Refs for accessing DOM elements
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const maskRef = useRef(null);
  const canvasRef = useRef(null);

  // State to track container and mask dimensions
  const [dimensions, setDimensions] = useState({
    container: { width: 0, height: 0 },
    mask: { width: 0, height: 0 }
  });

  // Effect to initialize mask dimensions when image loads
  useEffect(() => {
    if (maskRef.current) {
      const maskImg = new Image();
      maskImg.onload = () => {
        setDimensions(prev => ({
          ...prev,
          mask: {
            width: maskImg.naturalWidth,
            height: maskImg.naturalHeight
          }
        }));
      };
      maskImg.src = maskImage;
    }
  }, [maskImage]);

  // Handle mouse wheel for zooming
const handleWheel = (e) => {
    if (e.cancelable) e.preventDefault(); // ✅ Only prevent default when allowed
    
    if (!imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const scaleFactor = 0.1;
    const newScale = Math.max(0.1, Math.min(5, scale + Math.sign(-e.deltaY) * scaleFactor));

    // Adjust zoom to center on the cursor
    const factor = newScale / scale;
    const newX = position.x - cursorX * (factor - 1);
    const newY = position.y - cursorY * (factor - 1);

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };


  // Handle mouse down for starting drag
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    setPosition({ x: newX, y: newY });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Function to save the edited image
  const handleSave = () => {
    if (!uploadedImage || !maskImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const uploadedImg = new Image();
    const maskImg = new Image();

    Promise.all([
        new Promise(resolve => {
            uploadedImg.onload = resolve;
            uploadedImg.src = uploadedImage;
        }),
        new Promise(resolve => {
            maskImg.onload = resolve;
            maskImg.src = maskImage;
        })
    ]).then(() => {
        // Set canvas size to match mask
        canvas.width = maskImg.width;
        canvas.height = maskImg.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Scale and position uploaded image to fit inside the mask
        let scaledWidth, scaledHeight;
        const aspectRatio = uploadedImg.width / uploadedImg.height;

        if (aspectRatio > 1) { // Landscape image
            scaledWidth = maskImg.width;
            scaledHeight = scaledWidth / aspectRatio;
        } else { // Portrait or square image
            scaledHeight = maskImg.height;
            scaledWidth = scaledHeight * aspectRatio;
        }

        // Center the scaled image within the mask
        const offsetX = (maskImg.width - scaledWidth) / 2;
        const offsetY = (maskImg.height - scaledHeight) / 2;

        // Clip the image using the mask
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, maskImg.width, maskImg.height);
        ctx.clip();

        // Draw the uploaded image at the correct scale and position
        ctx.drawImage(uploadedImg, offsetX, offsetY, scaledWidth, scaledHeight);

        // Restore canvas clipping
        ctx.restore();

        // Draw the mask over the image
        ctx.drawImage(maskImg, 0, 0, maskImg.width, maskImg.height);

        // Save final image
        const finalImage = canvas.toDataURL('image/png');
        onSave(finalImage);
        onHide();
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e) => handleWheel(e);

    // ✅ Add event listener with `{ passive: false }`
    container.addEventListener("wheel", handleWheelEvent, { passive: false });

    return () => {
        container.removeEventListener("wheel", handleWheelEvent);
    };
  }, []);

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      dialogClassName="image-editor-modal"
      size="xl"
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit Image</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div 
          ref={containerRef}
          className="editor-workspace"
          style={{ 
            width: '80vw',
            height: '80vh',
            position: 'relative',
            overflow: 'hidden'
          }}
          onWheel={(e) => {
            e.stopPropagation();  // Add this
            handleWheel(e);
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Uploaded image */}
          <img
            ref={imageRef}
            src={uploadedImage}
            alt="Upload"
            style={{
              position: 'absolute',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              userSelect: 'none'
            }}
          />
          
          {/* Mask overlay */}
          <img
            ref={maskRef}
            src={maskImage}
            alt="Mask"
            className="mask-image"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          />
          
          {/* Hidden canvas for final image generation */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageEditor;