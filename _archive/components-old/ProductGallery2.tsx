'use client';

import React, { useState } from 'react';
import { ProductImage } from '@/types/productTypes';

interface ProductGallery2Props {
  images: ProductImage[];
  productName?: string;
}

export default function ProductGallery2({ images, productName = 'Product' }: ProductGallery2Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Find main image or use first image
  const mainImageIndex = images.findIndex(img => img.isMain);
  const [currentIndex, setCurrentIndex] = useState(mainImageIndex >= 0 ? mainImageIndex : 0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-400">No images available</p>
      </div>
    );
  }

  // Single image display
  if (images.length === 1) {
    return (
      <div className="w-full">
        <img
          src={images[0].src}
          alt={images[0].alt || productName}
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>
    );
  }

  // Multiple images gallery
  return (
    <div className="w-full space-y-4">
      {/* Main Image Display */}
      <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt || `${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnail Navigation */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              aspect-square rounded-lg overflow-hidden border-2 transition-all
              ${currentIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'}
            `}
          >
            <img
              src={image.src}
              alt={image.alt || `${productName} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {image.isMain && (
              <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                Main
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Image Caption */}
      {images[currentIndex].caption && (
        <p className="text-sm text-gray-600 text-center italic">
          {images[currentIndex].caption}
        </p>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
