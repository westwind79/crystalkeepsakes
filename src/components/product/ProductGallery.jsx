import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ProductGallery = ({ images, size = 'large' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const selectImage = (index) => {
    setCurrentIndex(index);
  };

  // Different sizes for different use cases
  const containerClass = size === 'small' 
    ? 'h-48' 
    : 'h-96';

  if (!images || images.length === 0) {
    return (
      <div className={` ${containerClass} bg-gray-100 flex items-center justify-center`}>
        <p>No images available</p>
      </div>
    );
  }

  return (
    <div className="product-gallery-container">
      {/* Main Image */}
      <div className={`product-gallery mb-2 ${containerClass}`}>
        <img
          src={images[currentIndex].src}
          alt={`Product view ${currentIndex + 1}`}
          className="w-full h-full object-cover rounded img-fluid"
        />
        
        {/* Navigation Arrows - Only show if more than one image */}
        {images.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="previousImage btn-gallery-contols"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="nextImage btn-gallery-contols"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Navigation - Only show if more than one image */}
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => selectImage(index)}
              className={`gallery-thumbnail overflow-hidden
                ${currentIndex === index ? 'active' : 'border-transparent'}`}
            >
              <img
                src={image.src}
                alt={`Thumbnail ${index + 1}`}
                className="object-cover img-fluid"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;