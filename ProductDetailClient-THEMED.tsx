// components/ProductDetailClient.tsx
// Version: 2.4.0 - THEMED VERSION
// ✅ Applied clean theme with glass-morphism styling
// ✅ Uses product-detail-theme.css and product-options.css
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ImageEditor from '@/components/ImageEditor'
import type { CustomImage, OrderLineItem, SizeDetails, ProductOption } from '@/types/orderTypes'
import { logger } from '@/utils/logger'
import { addToCart, checkStorageHealth, storeFullResImage } from '@/lib/cartUtils'
import AddedToCartModal from '@/components/cart/AddedToCartModal'

import '../app/css/modal.css'
import '../app/css/product-options.css'

// Environment
const ENV_MODE = process.env.NEXT_PUBLIC_ENV_MODE || 'development'
const isDevelopment = ENV_MODE === 'development' || ENV_MODE === 'testing'

// TypeScript Interfaces
interface Size {
  id: string
  name: string
  price: number
}

interface LightBase {
  id: string
  name: string
  price: number | null
}

interface BackgroundOption {
  id: string
  name: string
  price: number
}

interface TextOption {
  id: string
  name: string
  price: number
}

interface ProductImage {
  src: string
  isMain: boolean
}

interface Product {
  id: number | string
  name: string
  slug: string
  sku: string
  basePrice: number
  description: string
  longDescription?: string
  images: ProductImage[]
  sizes?: Size[]
  lightBases?: LightBase[]
  backgroundOptions?: BackgroundOption[]
  textOptions?: TextOption[]
  requiresImage?: boolean
  categories?: string[]
  maskImageUrl?: string
  cockpit3d_id?: string
}

export default function ProductDetailClient() {
  const params = useParams()
  const router = useRouter()
  
  // Product State
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  
  // Selection State
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [selectedLightBase, setSelectedLightBase] = useState<LightBase | null>(null)
  const [selectedBackground, setSelectedBackground] = useState<BackgroundOption | null>(null)
  const [selectedTextOption, setSelectedTextOption] = useState<TextOption | null>(null)
  const [customText, setCustomText] = useState({ line1: '', line2: '' })
  const [quantity, setQuantity] = useState(1)
  
  // Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [finalMaskedImage, setFinalMaskedImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  
  // UI State
  const [addingToCart, setAddingToCart] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddedModal, setShowAddedModal] = useState(false)
  const [addedItemDetails, setAddedItemDetails] = useState<any>(null)

  // Fetch product on mount
  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  /**
   * Fetch product data - READ FROM CACHED FILE
   */
  const fetchProduct = async (slug: string) => {
    try {
      logger.info('Fetching product', { slug, envMode: ENV_MODE })
      
      // Import from cached file directly
      const { cockpit3dProducts } = await import('@/data/cockpit3d-products.js')
      
      logger.info(`Loaded ${cockpit3dProducts.length} products from cache`)
      
      // Find product by slug
      const foundProduct = cockpit3dProducts.find((p: Product) => p.slug === slug)
      
      if (!foundProduct) {
        throw new Error('Product not found')
      }
      
      setProduct(foundProduct)
      
      // Set default selections
      if (foundProduct.sizes && foundProduct.sizes.length > 0) {
        setSelectedSize(foundProduct.sizes[0])
      }
      
      if (foundProduct.lightBases && foundProduct.lightBases.length > 0) {
        setSelectedLightBase(foundProduct.lightBases[0])
      }
      
      if (foundProduct.backgroundOptions && foundProduct.backgroundOptions.length > 0) {
        setSelectedBackground(foundProduct.backgroundOptions[0])
      }
      
      if (foundProduct.textOptions && foundProduct.textOptions.length > 0) {
        setSelectedTextOption(foundProduct.textOptions[0])
      }
      
      logger.success('Product loaded', { name: foundProduct.name, id: foundProduct.id })
      
    } catch (err: any) {
      logger.error('Failed to fetch product', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle image file upload
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Store filename
    setOriginalFileName(file.name)

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'Image must be less than 5MB' })
      return
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setErrors({ ...errors, image: 'Please upload JPG, PNG, or GIF' })
      return
    }

    // Read and show editor immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setUploadedImage(dataUrl)
      setShowEditor(true)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Handle save from ImageEditor - THIS IS CRITICAL
   */
  const handleImageEditorSave = (compressedImage: string) => {
    logger.info('Image saved from editor', { 
      size: compressedImage.length 
    })
    
    // Save the masked/compressed image
    setFinalMaskedImage(compressedImage)
    setShowEditor(false)
    
    // Clear any errors
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.image
      delete newErrors.finalImage
      return newErrors
    })
  }

  /**
   * Form validation
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Validate size if product has sizes
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      newErrors.size = 'Please select a size'
    }
    
    // Validate image if product requires it
    if (product?.requiresImage) {
      if (!uploadedImage) {
        newErrors.image = 'Please upload an image'
      } else if (!finalMaskedImage) {
        newErrors.finalImage = 'Please save your edited image before adding to cart'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Calculate total price
   */
  const calculateTotal = (): number => {
    let total = selectedSize?.price || product?.basePrice || 0
    
    if (selectedLightBase?.price) total += selectedLightBase.price
    if (selectedBackground?.price) total += selectedBackground.price
    if (selectedTextOption?.price) total += selectedTextOption.price
    
    return total * quantity
  }
  
  /**
   * Calculate options price (for order line item)
   */
  const calculateOptionsPrice = (): number => {
    let optionsPrice = 0
    if (selectedLightBase?.price) optionsPrice += selectedLightBase.price
    if (selectedBackground?.price) optionsPrice += selectedBackground.price
    if (selectedTextOption?.price) optionsPrice += selectedTextOption.price
    return optionsPrice
  }

  /**
   * Convert selections to ProductOption array
   */
  const buildProductOptions = (): ProductOption[] => {
    const options: ProductOption[] = []
    
    if (selectedLightBase) {
      options.push({
        category: 'lightBase',
        optionId: selectedLightBase.id,
        name: selectedLightBase.name,
        value: selectedLightBase.name,
        priceModifier: selectedLightBase.price || 0
      })
    }
    
    if (selectedBackground) {
      options.push({
        category: 'background',
        optionId: selectedBackground.id,
        name: selectedBackground.name,
        value: selectedBackground.name,
        priceModifier: selectedBackground.price
      })
    }
    
    if (selectedTextOption) {
      options.push({
        category: 'textOption',
        optionId: selectedTextOption.id,
        name: selectedTextOption.name,
        value: selectedTextOption.name,
        priceModifier: selectedTextOption.price
      })
    }
    
    // Custom text as separate options
    if (customText.line1) {
      options.push({
        category: 'customText',
        optionId: 'text_line1',
        name: 'Text Line 1',
        value: customText.line1,
        priceModifier: 0
      })
    }
    
    if (customText.line2) {
      options.push({
        category: 'customText',
        optionId: 'text_line2',
        name: 'Text Line 2',
        value: customText.line2,
        priceModifier: 0
      })
    }
    
    return options
  }

  /**
   * Add to cart with full order structure
   */
  const handleAddToCart = async () => {
    // Validate first
    if (!validateForm()) {
      logger.warn('Form validation failed', errors)
      return
    }

    setAddingToCart(true)
    setError('')
    setSuccessMessage('')

    try {
      if (!product) {
        throw new Error('Product not loaded')
      }

      // Build CustomImage object if image exists
      let customImage: CustomImage | undefined

      if (finalMaskedImage) {
        const img = new window.Image()
        img.src = finalMaskedImage
        
        // Store BOTH images - original for display, masked for Cockpit3D
        if (uploadedImage) {
          storeFullResImage(product.id.toString(), uploadedImage)
        }
        
        await new Promise(resolve => { img.onload = resolve })
        
        customImage = {
          dataUrl: finalMaskedImage,
          originalDataUrl: uploadedImage,
          filename: originalFileName || `product-${product.id}-${Date.now()}.png`,
          mimeType: 'image/png',
          fileSize: finalMaskedImage.length,
          width: img.width,
          height: img.height,
          processedAt: new Date().toISOString(),
          maskId: product.maskImageUrl,
          maskName: 'Product Mask'
        }
      }
      
      // Build size details
      const sizeDetails: SizeDetails = {
        sizeId: selectedSize?.id || 'default',
        sizeName: selectedSize?.name || 'Default Size',
        basePrice: selectedSize?.price || product.basePrice
      }
      
      // Build product options
      const productOptions = buildProductOptions()
      
      // Build custom text string
      const customTextString = customText.line1 || customText.line2
        ? `${customText.line1}${customText.line2 ? '\n' + customText.line2 : ''}`
        : undefined
      
      // Calculate prices
      const optionsPrice = calculateOptionsPrice()
      const totalPrice = calculateTotal()
      
      // Create line item with COMPLETE order data structure
      const lineItem: OrderLineItem = {
        lineItemId: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: String(product.id),
        cockpit3d_id: product.cockpit3d_id || String(product.id),
        name: product.name,
        sku: product.sku,
        basePrice: selectedSize?.price || product.basePrice,
        optionsPrice: optionsPrice,
        totalPrice: totalPrice,
        quantity: quantity,
        size: sizeDetails,
        options: productOptions,
        productImage: product.images?.[0]?.src || null,
        customImage: customImage,
        customText: customTextString ? { text: customTextString } : undefined,
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
      
      logger.order('Adding item to cart', {
        productId: lineItem.productId,
        name: lineItem.name,
        quantity: lineItem.quantity,
        totalPrice: lineItem.totalPrice,
        hasCustomImage: !!lineItem.customImage,
        hasCustomText: !!lineItem.customText,
        imageSize: lineItem.customImage ? lineItem.customImage.fileSize : 0
      })
      
      // Add to cart using cartUtils
      try {
        await addToCart(lineItem)
        logger.success('Item successfully added to cart')
      } catch (cartError: any) {
        logger.error('Cart add failed', cartError)
        throw new Error(`Failed to add to cart: ${cartError.message}`)
      }
      
      // Success! Show modal
      setSuccessMessage(`Added ${quantity} ${product.name} to cart!`)
      
      // Prepare item details for modal
      const optionsList: string[] = []
      if (selectedSize) optionsList.push(`Size: ${selectedSize.name}`)
      if (selectedBackground) optionsList.push(`Background: ${selectedBackground.name}`)
      if (selectedLightBase && selectedLightBase.id !== 'none') {
        optionsList.push(`Light Base: ${selectedLightBase.name}`)
      }
      if (customText.line1 || customText.line2) {
        optionsList.push('Custom Text: Yes')
      }
      
      setAddedItemDetails({
        name: product.name,
        image: finalMaskedImage || product.images?.[0]?.src || '/placeholder.png',
        price: totalPrice,
        quantity: quantity,
        options: optionsList
      })
      
      setShowAddedModal(true)
      
    } catch (error: any) {
      logger.error('Failed to add to cart', error)
      setError(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading product...</p>
      </div>
    )
  }

  // Error state
  if (error && !product) {
    return (
      <div className="product-container py-12">
        <div className="alert alert-error max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="mb-4">{error}</p>
          <Link href="/products" className="btn btn-primary">
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  if (!product) return null

  const mainImage = product.images.find(img => img.isMain) || product.images[0]

  return (    
    <div className="product-page"> 
      {/* Breadcrumbs */}
      <nav className="breadcrumbs py-4">
        <div className="container mx-auto px-4">
          <Link href="/">Home</Link>  
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/products">Products</Link> 
          <span className="mx-2 text-gray-600">/</span> 
          <span className="text-text-tertiary">{product.name}</span>
        </div>
      </nav>        
      
      {/* Product Container */}
      <div className="product-container">
        <div className="product-grid">
          
          {/* LEFT: Product Image */}
          <div>
            {finalMaskedImage ? (
              <div className="sticky-product-image">
                <div className="product-image-wrapper">
                  <Image
                    src={finalMaskedImage} 
                    alt="Customer Preview" 
                    className="product-image"
                    width={1024}
                    height={1024}
                  />
                </div>
                <div className="image-actions">
                  <button
                    type="button"
                    onClick={() => setShowEditor(true)}
                    className="btn btn-secondary"
                  >
                    Edit Image Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalMaskedImage(null)}
                    className="btn btn-secondary"
                  >
                    Remove & Show Product
                  </button>
                </div>
              </div>
            ) : product.images && product.images.length > 1 ? (
              <div className="sticky-product-image">
                <ProductGallery images={product.images} />
              </div>
            ) : (
              <div className="sticky-product-image">
                <div className="product-image-wrapper">
                  <Image
                    src={mainImage.src}
                    alt={product.name}
                    width={1024}
                    height={1024}
                    className="product-image"
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Product Info & Options */}
          <div className="product-info">
            {/* Product Title */}
            <h1 className="product-title">{product.name}</h1>
            
            {/* Product Description */}
            <p className="product-description">{product.description}</p>
            
            {/* Product Price */}
            <div className="product-price">
              <span className="product-price-currency">$</span>
              {calculateTotal().toFixed(2)}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="alert alert-success">
                <p>{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-error">
                <p>{error}</p>
              </div>
            )}
            
            {/* Image Upload */}
            {product.requiresImage && (
              <div className="product-option-section">
                <label className="option-label option-label-required">Upload Your Image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="file-upload-input"
                />
                {errors.image && (
                  <span className="error-message">{errors.image}</span>
                )}
                {errors.finalImage && (
                  <span className="error-message">{errors.finalImage}</span>
                )}
                <div className="image-requirements">
                  <p><strong>Image Requirements:</strong></p>
                  <ul>
                    <li>File type: JPG, PNG, or GIF</li>
                    <li>Maximum size: 5MB</li>
                    <li>Minimum dimensions: 500x500 pixels</li>
                    <li>Higher resolution recommended for best results</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="product-option-section">
                <label className="option-label option-label-required">Select Size</label>
                <div className="radio-option-group">
                  {product.sizes.map(size => (
                    <label key={size.id} className="crystal-radio">
                      <input
                        type="radio"
                        name="size"
                        value={size.id}
                        checked={selectedSize?.id === size.id}
                        onChange={() => setSelectedSize(size)}
                      />
                      <span>{size.name}</span>
                      {size.price > 0 && (
                        <span className="option-price-tag">+${size.price.toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
                {errors.size && (
                  <span className="error-message">{errors.size}</span>
                )}
              </div>
            )}

            {/* Background Options */}
            {product.backgroundOptions && product.backgroundOptions.length > 0 && (
              <div className="product-option-section">
                <label className="option-label">Background Style</label>
                <div className="radio-option-group">
                  {product.backgroundOptions.map(bg => (
                    <label key={bg.id} className="crystal-radio">
                      <input
                        type="radio"
                        name="background"
                        value={bg.id}
                        checked={selectedBackground?.id === bg.id}
                        onChange={() => setSelectedBackground(bg)}
                      />
                      <span>{bg.name}</span>
                      {bg.price > 0 && (
                        <span className="option-price-tag">+${bg.price.toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Light Base Options */}
            {product.lightBases && product.lightBases.length > 0 && (
              <div className="product-option-section">
                <label className="option-label">Light Base</label>
                <div className="radio-option-group">
                  {product.lightBases.map(base => (
                    <label key={base.id} className="crystal-radio">
                      <input
                        type="radio"
                        name="lightBase"
                        value={base.id}
                        checked={selectedLightBase?.id === base.id}
                        onChange={() => setSelectedLightBase(base)}
                      />
                      <span>{base.name}</span>
                      {base.price && base.price > 0 && (
                        <span className="option-price-tag">+${base.price.toFixed(2)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Text */}
            {product.textOptions && product.textOptions.length > 0 && (
              <div className="product-option-section">
                <label className="option-label">Custom Text (Optional)</label>
                <input
                  type="text"
                  placeholder="Line 1 (e.g., Anniversary 2024)"
                  value={customText.line1}
                  onChange={(e) => setCustomText({ ...customText, line1: e.target.value })}
                  className="text-input mb-2"
                  maxLength={30}
                />
                <input
                  type="text"
                  placeholder="Line 2 (e.g., Forever & Always)"
                  value={customText.line2}
                  onChange={(e) => setCustomText({ ...customText, line2: e.target.value })}
                  className="text-input"
                  maxLength={30}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="product-option-section">
              <label className="option-label">Quantity</label>
              <div className="quantity-control">
                <button 
                  className="quantity-btn" 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="quantity-input"
                />
                <button 
                  className="quantity-btn" 
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="btn btn-primary add-to-cart-btn"
            >
              {addingToCart ? 'Adding to Cart...' : `Add to Cart - $${calculateTotal().toFixed(2)}`}
            </button>
          </div>
        </div>

        {/* ImageEditor Modal */}
        {product.requiresImage && (
          <ImageEditor
            show={showEditor}
            onHide={() => setShowEditor(false)}
            uploadedImage={uploadedImage}
            maskImage={product.maskImageUrl || null}
            onSave={handleImageEditorSave}
          />
        )}

        {/* Added to Cart Modal */}
        <AddedToCartModal
          show={showAddedModal}
          onClose={() => {
            setShowAddedModal(false)
            setAddedItemDetails(null)
          }}
          itemDetails={addedItemDetails}
        />
      </div>
    </div>
  )
}

// Product Gallery Component
const ProductGallery = ({ images }: { images: ProductImage[] }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="product-gallery">
      <div className="product-image-wrapper">
        <Image
          src={images[currentImageIndex].src}
          alt={`Gallery Image ${currentImageIndex + 1}`}
          width={1024}
          height={1024}
          className="gallery-image"
        />
      </div>
      
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="gallery-nav-btn prev"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            className="gallery-nav-btn next"
            aria-label="Next image"
          >
            ›
          </button>
          
          <div className="gallery-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`gallery-indicator ${index === currentImageIndex ? 'active' : ''}`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
