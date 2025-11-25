// components/ProductGallery.tsx
'use client'

import { useState, useEffect } from 'react'
import { assetPath } from '@/lib/assetPath'

export default function ProductGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const isDev = process.env.NEXT_PUBLIC_ENV_MODE === 'development'

  // ✅ FIX: Sort images so isMain comes first
  const sortedImages = [...images].sort((a, b) => {
    const aIsMain = typeof a === 'object' && a.isMain ? 1 : 0
    const bIsMain = typeof b === 'object' && b.isMain ? 1 : 0
    return bIsMain - aIsMain  // isMain=true comes first
  })

  // Reset active index when images change
  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  if (isDev) {
    console.log('🖼️ Gallery images:', images?.length || 0, 'Main image first:', sortedImages[0])
  }

  if (!sortedImages || sortedImages.length === 0) {
    return (
      <div className="product-gallery">
        <div 
          className="placeholder-image d-flex align-items-center justify-content-center" 
          style={{ height: '400px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}
        >
          <span className="text-muted">No image available</span>
        </div>
      </div>
    )
  }

  const currentImage = sortedImages[activeIndex]
  const imageSrc = typeof currentImage === 'string' ? currentImage : currentImage?.src
  
  // ✅ Use assetPath for all images - works in dev and production
  const displaySrc = assetPath(imageSrc || '')

  if (isDev) {
    console.log('📸 Image source:', imageSrc, '→', displaySrc)
    
    // 🐛 DEBUG: Emit debug event for gallery display
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('debug-step', {
        detail: {
          id: 'gallery-display',
          label: `Gallery displaying image ${activeIndex + 1}/${sortedImages.length}`,
          status: 'active',
          data: {
            originalSrc: imageSrc,
            displaySrc: displaySrc,
            imageCount: sortedImages.length,
            activeIndex: activeIndex
          }
        }
      }));
    }
  }

  return (
    <div className="product-gallery">
      {/* Main Image with Navigation */}
      <div className="main-image mb-3" style={{ position: 'relative', height: '500px' }}>
        <img
          src={displaySrc || 'https://placehold.co/800x800?text=No+Image'}
          alt={`Product image ${activeIndex + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onLoad={(e) => {
            if (isDev) {
              console.log('✅ Image loaded successfully:', displaySrc);
              // 🐛 DEBUG: Success event
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('debug-step', {
                  detail: {
                    id: 'gallery-display',
                    label: `✅ Image loaded: ${displaySrc}`,
                    status: 'complete',
                    data: { src: displaySrc, naturalWidth: e.currentTarget.naturalWidth, naturalHeight: e.currentTarget.naturalHeight }
                  }
                }));
              }
            }
          }}
          onError={(e) => {
            if (isDev) {
              console.log('❌ Image error:', displaySrc);
              // 🐛 DEBUG: Error event
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('debug-step', {
                  detail: {
                    id: 'gallery-display',
                    label: `❌ Image failed to load`,
                    status: 'error',
                    error: `Failed to load: ${displaySrc}`,
                    data: { attemptedSrc: displaySrc }
                  }
                }));
              }
            }
            e.currentTarget.src = 'https://placehold.co/800x800?text=No+Image'
          }}
        />

        {/* Navigation Arrows - Only show if multiple images */}
        {sortedImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % sortedImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {activeIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="thumbnails">
          <div className="row g-2">
            
            {sortedImages.map((img, idx) => {
              const thumbSrc = typeof img === 'string' ? img : img?.src
              const thumbDisplaySrc = assetPath(thumbSrc || '')
              const isMainImage = typeof img === 'object' && img.isMain
              
              return (
                <div key={idx} className="col-3">
                  <div 
                    className={`thumbnail ${idx === activeIndex ? 'active' : ''}`}
                    style={{ 
                      position: 'relative',
                      height: '80px',
                      cursor: 'pointer',
                      border: idx === activeIndex ? '2px solid var(--brand-500)' : '1px solid #dee2e6',
                      overflow: 'hidden',
                      borderRadius: '4px'
                    }}
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img
                      src={thumbDisplaySrc || 'https://placehold.co/800x800?text=No+Image'}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/800x800?text=No+Image'
                      }}
                    />
                    {/* Main badge on thumbnail */}
                    {isMainImage && (
                      <div 
                        className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded"
                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                      >
                        MAIN
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
