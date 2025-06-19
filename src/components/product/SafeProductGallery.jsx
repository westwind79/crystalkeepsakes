// components/product/SafeProductGallery.jsx
import React, { useState } from 'react';

export default function SafeProductGallery({ images = [] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ SAFEPRODUCTGALLERY2: Rendering with images:', {
      imagesCount: images?.length || 0,
      hasImages: Array.isArray(images),
      firstImage: images?.[0]
    });
  }

  // Ensure we have valid images array
  const validImages = Array.isArray(images) ? images.filter(img => img) : [];
  
  // If no images, show placeholder
  if (validImages.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ SAFEPRODUCTGALLERY2: No valid images provided, showing placeholder');
    }
    
    return (
      <div className="safe-product-gallery2 no-images">
        <div className="placeholder-image d-flex align-items-center justify-content-center" 
             style={{ 
               height: '400px', 
               backgroundColor: '#f8f9fa', 
               border: '1px solid #dee2e6',
               borderRadius: '8px'
             }}>
          <span className="text-muted">No image available</span>
        </div>
      </div>
    );
  }

  // Get current image source
  const getCurrentImageSrc = () => {
    const currentImage = validImages[currentImageIndex];
    return typeof currentImage === 'string' ? currentImage : currentImage?.src;
  };

  const handleImageError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ SAFEPRODUCTGALLERY2: Image error for index:', currentImageIndex);
    }
    setImageError(true);
  };

  const handleImageLoad = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SAFEPRODUCTGALLERY2: Image loaded for index:', currentImageIndex);
    }
    setImageError(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
    setImageError(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    setImageError(false);
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
    setImageError(false);
  };

  const currentImageSrc = getCurrentImageSrc();

  return (
    <div className="safe-product-gallery2">
      {/* Main Image */}
      <div className="main-image-container position-relative">
        <img 
          src={imageError ? '/img/placeholder.jpg' : currentImageSrc}
          alt={`Product image ${currentImageIndex + 1}`}
          className="main-image img-fluid w-100"
          style={{ 
            height: '400px', 
            objectFit: 'cover',
            borderRadius: '8px'
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        
        {/* Navigation buttons for multiple images */}
        {validImages.length > 1 && (
          <>
            <button
              className="nav-btn nav-btn-prev position-absolute top-50 start-0 translate-middle-y"
              onClick={prevImage}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '0 4px 4px 0',
                cursor: 'pointer'
              }}
            >
              ‹
            </button>
            <button
              className="nav-btn nav-btn-next position-absolute top-50 end-0 translate-middle-y"
              onClick={nextImage}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '4px 0 0 4px',
                cursor: 'pointer'
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Image counter */}
        {validImages.length > 1 && (
          <div 
            className="image-counter position-absolute bottom-0 end-0 m-2"
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}
          >
            {currentImageIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail navigation */}
      {validImages.length > 1 && (
        <div className="thumbnail-nav mt-3">
          <div className="d-flex gap-2 flex-wrap">
            {validImages.map((image, index) => {
              const thumbSrc = typeof image === 'string' ? image : image?.src;
              return (
                <img
                  key={index}
                  src={thumbSrc}
                  alt={`Thumbnail ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  style={{ 
                    width: '60px',
                    height: '60px', 
                    objectFit: 'cover', 
                    cursor: 'pointer',
                    border: index === currentImageIndex ? '2px solid #007bff' : '1px solid #dee2e6',
                    borderRadius: '4px'
                  }}
                  onClick={() => selectImage(index)}
                  onError={(e) => {
                    e.target.src = '/img/placeholder.jpg';
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info mt-3 p-2 bg-light border rounded">
          <small>
            SafeGallery2 Debug: {validImages.length} images, current: {currentImageIndex}, error: {imageError ? 'yes' : 'no'}
          </small>
        </div>
      )}
    </div>
  );
}