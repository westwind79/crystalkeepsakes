'use client';

import React, { useState } from 'react';
import { ProductImage } from '@/types/productTypes';

interface ImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesUpdated: (images: ProductImage[]) => void;
}

export default function ImageUpload({ productId, images, onImagesUpdated }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: ProductImage[] = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

      try {
        // 🐛 DEBUG: Emit debug event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug-step', {
            detail: {
              id: `upload-${i}`,
              label: `Starting upload: ${file.name}`,
              status: 'active',
              data: { fileName: file.name, fileSize: file.size, fileType: file.type }
            }
          }));
        }

        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('image', file);  // ✅ PHP expects 'image' field name

        // ✅ Use Next.js API route for development, PHP for production
        const isDev = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_PHP_BACKEND_URL;
        const apiUrl = isDev ? '/api/upload-image/' : `${process.env.NEXT_PUBLIC_PHP_BACKEND_URL}/api/upload-image.php`;
        
        console.log('📤 Uploading to:', apiUrl, '(mode:', isDev ? 'Next.js API' : 'PHP', ')');
        
        // 🐛 DEBUG: Track fetch
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('debug-step', {
            detail: {
              id: `upload-${i}`,
              label: `Sending request to ${apiUrl}`,
              status: 'active',
              data: { apiUrl, productId }
            }
          }));
        }
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // 🐛 DEBUG: Log full response for debugging
        console.log('📥 Upload Response:', result);

        if (result.success) {
          // 🐛 DEBUG: Success event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('debug-step', {
              detail: {
                id: `upload-${i}`,
                label: `✅ Upload successful: ${result.filename}`,
                status: 'complete',
                data: {
                  url: result.url,
                  fileSize: result.size,
                  originalSize: result.originalSize,
                  compressed: result.compressed,
                  phpInfo: result.phpInfo,
                  debug: result.debug
                }
              }
            }));
          }

          // Add new image to array
          // First image becomes main if no main exists
          const isMain = newImages.length === 0 || !newImages.some(img => img.isMain);
          
          newImages.push({
            src: result.url,  // ✅ PHP returns 'url' not 'data.url'
            isMain: isMain,
            alt: file.name,
          });

          // ✅ Update state immediately after each upload
          onImagesUpdated([...newImages]);

          console.log(`✅ Uploaded image: ${result.url}`);
          console.log('📊 Upload Stats:', {
            filename: result.filename,
            size: `${(result.size / 1024).toFixed(2)} KB`,
            originalSize: `${(result.originalSize / 1024).toFixed(2)} KB`,
            compressed: result.compressed,
            compressionError: result.compressionError,
            debug: result.debug
          });
          
          // 🔧 PHP Environment Info
          if (result.phpInfo) {
            console.log('🔧 PHP Environment:', result.phpInfo);
            
            // Warn if GD not available
            if (!result.phpInfo.gdAvailable) {
              console.warn('⚠️ GD Library NOT available - image compression disabled');
            } else {
              console.log(`✅ GD Library available: ${result.phpInfo.gdVersion}`);
            }
          }

          // Show compression warning if needed
          if (!result.compressed && result.compressionError) {
            console.warn(`⚠️ Image compression: ${result.compressionError}`);
          }
        } else {
          // 🐛 DEBUG: Error event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('debug-step', {
              detail: {
                id: `upload-${i}`,
                label: `❌ Upload failed: ${file.name}`,
                status: 'error',
                error: result.error
              }
            }));
          }
          
          console.error('❌ Upload failed:', result.error);
          alert(`Failed to upload ${file.name}: ${result.error}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Error uploading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setUploading(false);
    setUploadProgress('');
    // State already updated after each upload
    
    // Reset input
    event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    
    // If we removed the main image, set the first remaining image as main
    if (images[index].isMain && newImages.length > 0) {
      newImages[0].isMain = true;
    }
    
    onImagesUpdated(newImages);
  };

  const handleSetMainImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isMain: i === index,
    }));
    onImagesUpdated(newImages);
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedItem] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedItem);
    onImagesUpdated(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`file-upload-${productId}`}
        />
        <label
          htmlFor={`file-upload-${productId}`}
          className="cursor-pointer inline-block"
        >
          {uploading ? (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">{uploadProgress}</p>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                Click to upload images or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 10MB each
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-2">
                💡 Images are automatically compressed & optimized for web
              </p>
              <p className="text-xs text-green-600 font-semibold">
                ✨ Multiple images auto-create gallery view
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-700">Current Images ({images.length})</h4>
          {images.length > 1 && (
            <p className="text-sm text-green-600 font-medium">✅ Gallery mode enabled - customers can browse all images</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group border rounded-lg overflow-hidden bg-gray-50"
              >
                {/* Image Preview */}
                <div className="aspect-square">
                  <img
                    src={image.src}
                    alt={image.alt || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Main Badge */}
                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                    MAIN
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {!image.isMain && (
                    <button
                      onClick={() => handleSetMainImage(index)}
                      className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
                      title="Set as main image"
                    >
                      Set Main
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </div>

                {/* Reorder Buttons */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={() => handleReorderImages(index, index - 1)}
                      className="bg-gray-800 text-white p-1 rounded text-xs hover:bg-gray-700"
                      title="Move left"
                    >
                      ←
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={() => handleReorderImages(index, index + 1)}
                      className="bg-gray-800 text-white p-1 rounded text-xs hover:bg-gray-700"
                      title="Move right"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
