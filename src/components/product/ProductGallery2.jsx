// components/product/ProductGallery2.jsx
import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-bootstrap';

export default function ProductGallery2({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ PRODUCTGALLERY2: Rendering with images:', {
      imagesCount: images?.length || 0,
      hasImages: Array.isArray(images),
      firstImage: images?.[0]
    });
  }

  // Ensure we have valid images array
  const validImages = Array.isArray(images) ? images : [];
  
  // If no images, show placeholder
  if (validImages.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ PRODUCTGALLERY2: No valid images provided, showing placeholder');
    }
    
    return (
      <div className="product-gallery2 no-images">
        <div className="placeholder-image d-flex align-items-center justify-content-center" 
             style={{ height: '400px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
          <span className="text-muted">No image available</span>
        </div>
      </div>
    );
  }

  const handleSelect = (selectedIndex) => {
    setActiveIndex(selectedIndex);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ PRODUCTGALLERY2: Selected image index:', selectedIndex);
    }
  };

  // Single image display
  if (validImages.length === 1) {
    const image = validImages[0];
    const imageSrc = typeof image === 'string' ? image : image.src;
    const imageAlt = typeof image === 'string' ? 'Product image' : (image.alt || 'Product image');

    return (
      <div className="product-gallery2 single-image">
        <img 
          src={imageSrc} 
          alt={imageAlt}
          className="img-fluid w-100"
          style={{ maxHeight: '500px', objectFit: 'cover' }}
          onError={(e) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ PRODUCTGALLERY2: Image load error:', imageSrc);
            }
            e.target.src = '/img/placeholder.jpg';
          }}
          onLoad={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ PRODUCTGALLERY2: Image loaded:', imageSrc);
            }
          }}
        />
      </div>
    );
  }

  // Multiple images carousel
  return (
    <div className="product-gallery2 carousel-gallery">
      <Carousel 
        activeIndex={activeIndex} 
        onSelect={handleSelect}
        interval={null}
        controls={true}
        indicators={true}
        fade={false}
      >
        {validImages.map((image, index) => {
          const imageSrc = typeof image === 'string' ? image : image.src;
          const imageAlt = typeof image === 'string' ? `Product image ${index + 1}` : (image.alt || `Product image ${index + 1}`);
          
          return (
            <Carousel.Item key={index}>
              <img
                className="d-block w-100"
                src={imageSrc}
                alt={imageAlt}
                style={{ height: '500px', objectFit: 'cover' }}
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`❌ PRODUCTGALLERY2: Image ${index} load error:`, imageSrc);
                  }
                  e.target.src = 'https://placehold.co/600x400';
                }}
                onLoad={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ PRODUCTGALLERY2: Image ${index} loaded:`, imageSrc);
                  }
                }}
              />
              {(typeof image === 'object' && image.caption) && (
                <Carousel.Caption>
                  <p>{image.caption}</p>
                </Carousel.Caption>
              )}
            </Carousel.Item>
          );
        })}
      </Carousel>

      {/* Thumbnail navigation for multiple images */}
      {validImages.length > 1 && (
        <div className="thumbnail-nav mt-3">
          <div className="row g-2">
            {validImages.map((image, index) => {
              const imageSrc = typeof image === 'string' ? image : image.src;
              return (
                <div key={index} className="col-3">
                  <img
                    src={imageSrc}
                    alt={`Thumbnail ${index + 1}`}
                    className={`img-fluid thumbnail ${index === activeIndex ? 'active' : ''}`}
                    style={{ 
                      height: '80px', 
                      objectFit: 'cover', 
                      cursor: 'pointer',
                      border: index === activeIndex ? '2px solid #007bff' : '1px solid #dee2e6'
                    }}
                    onClick={() => handleSelect(index)}
                    onError={(e) => {
                      e.target.src = '/img/placeholder.jpg';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info mt-3 p-2 bg-light border rounded">
          <small>
            Gallery2 Debug: {validImages.length} images, active: {activeIndex}
          </small>
        </div>
      )}
    </div>
  );
}