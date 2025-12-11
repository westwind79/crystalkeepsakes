// components/ProductGallery.tsx
'use client'

import { useState, useEffect } from 'react'
import { assetPath } from '@/lib/assetPath'

export default function ProductGallery({ images = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const isDev = process.env.NEXT_PUBLIC_ENV_MODE === 'development'

  if (isDev) {
    console.log('🖼️ Gallery images:', images?.length || 0)
  }

  if (!images || images.length === 0) {
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

  const currentImage = images[activeIndex]
  const imageSrc = typeof currentImage === 'string' ? currentImage : currentImage?.src
  
  // ✅ Use assetPath for all images - works in dev and production
  const displaySrc = assetPath(imageSrc || '')

  if (isDev) {
    console.log('📸 Image source:', imageSrc, '→', displaySrc)
  }
  
  // 🐛 DEBUG: Emit debug event for gallery display
  useEffect(() => {
    if (isDev && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('debug-step', {
        detail: {
          id: 'gallery-display',
          label: `Gallery displaying image ${activeIndex + 1}/${images.length}`,
          status: 'active',
          data: {
            originalSrc: imageSrc,
            displaySrc: displaySrc,
            imageCount: images.length,
            activeIndex: activeIndex
          }
        }
      }));
    }
  }, [isDev, imageSrc, displaySrc, activeIndex, images.length])

  return (
    <div className="product-gallery">
      {/* Main Image - Use regular img tag to avoid Next.js optimization issues */}
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
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="thumbnails">
          <div className="grid grid-cols-5 gap-4 align-center justify-center g-2">
            
            {images.map((img, idx) => {
              const thumbSrc = typeof img === 'string' ? img : img?.src
              const thumbDisplaySrc = assetPath(thumbSrc || '')
              
              return (
                <div  
                  key={idx}
                  className={`thumbnail ${idx === activeIndex ? 'active' : ''}`}
                  style={{ 
                    position: 'relative',
                    height: '80px',
                    cursor: 'pointer',
                    border: idx === activeIndex ? '2px solid var(--brand-400)' : '2px solid var(--surface-300)',
                    overflow: 'hidden'
                  }}
                  onClick={() => setActiveIndex(idx)}
                >
                  <img
                    src={thumbDisplaySrc || 'https://placehold.co/800x800?text=No+Image'}
                    alt={`Thumbnail ${idx + 1}`}
                    className="p-2"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/800x800?text=No+Image'
                    }}
                  />
                </div> 
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}