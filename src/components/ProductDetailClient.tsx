// components/ProductDetailClient.tsx
// Version: 2.3.0 - 2025-11-05 - CART ADD FIX
// ✅ Fixed: Storage property names (used→usedSpace, limit→totalSpace)
// ✅ Cart add to cart now works - NaN error resolved
// Previous: Storage check for high-res PNG files
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
    
    // ✅ ADD: Custom text as separate options
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
    
    return options  // ✅ NOW INCLUDES ALL OPTIONS
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
        
        // ✅ Store BOTH images - original for display, masked for Cockpit3D
        if (uploadedImage) {
          storeFullResImage(product.id.toString(), uploadedImage)
        }
        
        await new Promise(resolve => { img.onload = resolve })
        
        customImage = {
          dataUrl: finalMaskedImage,  // For Cockpit3D order
          originalDataUrl: uploadedImage,  // ✅ ADD: For cart display
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
        productImage: product.images?.[0]?.src || null,  // ← ADD PRODUCT'S IMAGE
        customImage: customImage,  // ← THE MASKED IMAGE
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

       // addToCart(lineItem)
        logger.success('Item successfully added to cart')
      } catch (cartError: any) {
        logger.error('Cart add failed', cartError)
        throw new Error(`Failed to add to cart: ${cartError.message}`)
      }
      
      // Success!
      setSuccessMessage(`Added ${quantity} ${product.name} to cart!`)
      
      // Reset form and redirect
      setTimeout(() => {
        setQuantity(1)
        setCustomText({ line1: '', line2: '' })
        setUploadedImage(null)
        setFinalMaskedImage(null)
        
        router.push('/cart')
      }, 1500)
      
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[var(--brand-400)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Product Not Found</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Link href="/products" className="btn btn-primary px-6 py-2 rounded-lg">
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  if (!product) return null

  const mainImage = product.images.find(img => img.isMain) || product.images[0]

  return (    
    <div className="min-h-screen"> 

      <nav className="breadcrumbs py-4">
        <div className="container mx-auto px-4">
          <Link href="/" className="hover:text-brand-400 transition-colors">Home</Link>  
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/products" className="hover:text-brand-400 transition-colors">Products</Link> 
          <span className="mx-2 text-gray-600">/</span> 
          <span className="text-text-tertiary">{product.name}</span>
        </div>
      </nav>        
      
      <div className="container mx-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          
          {/* Product Image */}
          <div>
            {finalMaskedImage ? (
              // STAGE 1: Show user's uploaded/edited image
              <div className="sticky top-[var(--header-height)] z-1 mt-4">
                <Image
                  src={finalMaskedImage} 
                  alt="Customer Preview" 
                  className="w-full max-w-xs rounded-lg border border-[var(--surface-700)]"
                  width={1024}
                  height={1024}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditor(true)}
                    className="btn btn-secondary px-4 py-3 rounded-md cursor-pointer"
                  >
                    Edit Image Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setFinalMaskedImage(null)}
                    className="btn btn-secondary px-4 py-3 rounded-md cursor-pointer"
                  >
                    Remove & Show Product
                  </button>
                </div>
              </div>
            ) : product.images && product.images.length > 1 ? (
              // STAGE 2: Show gallery if multiple images exist
              <div className="sticky top-[var(--header-height)]">
                <ProductGallery images={product.images} />
              </div>
            ) : (
            // STAGE 3: Show single product image as fallback
              <div className="sticky top-[var(--header-height)]">
                <Image
                  src={mainImage.src}
                  alt={product.name}
                  width={1024}
                  height={1024}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}
            
          </div>

          {/* Product Options Form */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-gray-400 mb-6">{product.description}</p>
            
            <div className="text-2xl font-bold mb-6">
              ${calculateTotal().toFixed(2)}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
                <p className="text-green-400">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            {/* Image Upload */}
            {product.requiresImage && (
              <div className="mb-6">
                <label className="block text-xl font-medium mb-2">Upload Image *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-400 border-[var(--primary)] border-1 rounded-lg
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[var(--primary)] file:text-white
                    hover:file:bg-[var(--brand-600)]
                    file:cursor-pointer cursor-pointer"
                />
                {errors.image && (
                  <p className="text-red-400 text-sm mt-2">{errors.image}</p>
                )}
                {errors.finalImage && (
                  <p className="text-red-400 text-sm mt-2">{errors.finalImage}</p>
                )}
                <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 px-3 py-1 text-left">
                  <p className="text-sm mt-2"><strong>Image Requirements:</strong></p>
                  <ul className="list-inside list-disc font-thin text-sm p-2">
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
              <div className="mb-6">
                <label className="block text-xl font-medium mb-2">Size *</label>
                <div className="space-y-2">
                  {product.sizes.map(size => (
                    <label key={size.id} className="crystal-radio flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value={size.id}
                        checked={selectedSize?.id === size.id}
                        onChange={() => setSelectedSize(size)}
                        className="mr-3"
                      />
                      <span>
                        {size.name} {size.price > 0 && `(+$${size.price})`}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.size && (
                  <p className="text-red-400 text-sm mt-2">{errors.size}</p>
                )}
              </div>
            )}

            {/* Background Options */}
            {product.backgroundOptions && product.backgroundOptions.length > 0 && (
              <div className="mb-6">
                <label className="block text-xl font-medium mb-2">Background</label>
                <div className="space-y-2">
                  {product.backgroundOptions.map(bg => (
                    <label key={bg.id} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="background"
                        value={bg.id}
                        checked={selectedBackground?.id === bg.id}
                        onChange={() => setSelectedBackground(bg)}
                        className="mr-3"
                      />
                      <span>
                        {bg.name} {bg.price > 0 && `(+$${bg.price})`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Light Base Options */}
            {product.lightBases && product.lightBases.length > 0 && (
              <div className="mb-6">
                <label className="block text-xl font-medium mb-2">Light Base</label>
                <div className="space-y-2">
                  {product.lightBases.map(base => (
                    <label key={base.id} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="lightBase"
                        value={base.id}
                        checked={selectedLightBase?.id === base.id}
                        onChange={() => setSelectedLightBase(base)}
                        className="mr-3"
                      />
                      <span>
                        {base.name} {base.price && base.price > 0 && `(+$${base.price})`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Text */}
            {product.textOptions && product.textOptions.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Custom Text (Optional)</label>
                <input
                  type="text"
                  placeholder="Line 1"
                  value={customText.line1}
                  onChange={(e) => setCustomText({ ...customText, line1: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)] mb-2"
                  maxLength={30}
                />
                <input
                  type="text"
                  placeholder="Line 2"
                  value={customText.line2}
                  onChange={(e) => setCustomText({ ...customText, line2: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)]"
                  maxLength={30}
                />
              </div>
            )}

            

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-2 rounded-lg bg-[var(--surface-800)] border border-[var(--surface-700)]"
              />
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full btn btn-primary py-3 rounded-lg text-lg font-semibold disabled:opacity-50"
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
      </div>
    </div>
  )
}