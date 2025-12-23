// components/ProductDetailClient.tsx
// Version: 3.1.0 - FIX: Reset file input for re-upload same image
// ✅ Premium e-commerce design inspired by Tailwind UI
// ✅ Clean spacing, modern typography, professional polish
// ✅ Fixed: File input resets after upload to allow same file selection
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ImageEditor from '@/components/ImageEditor'
import type { CustomImage, OrderLineItem, SizeDetails, ProductOption } from '@/types/orderTypes'
import { logger } from '@/utils/logger'
import { addToCart, checkStorageHealth, storeFullResImage } from '@/lib/cartUtils'
import AddedToCartModal from '@/components/cart/AddedToCartModal'
import { isFeaturedProduct, isLightbaseProduct, isOnSale, getProductCategories, getCategoryLabel } from '@/utils/categoriesConfig'
import { assetPath } from '@/lib/assetPath'
import { calculateTotal, calculateOptionsPrice, getSaleInfo } from '@/utils/pricingUtils'
import ProductGallery from '@/components/ProductGallery'
import ProductBadges from '@/components/ProductBadges'

import '../app/css/modal.css'
import '../app/css/product-options.css'
import '../app/css/gallery.css'

import { getProducts } from '@/lib/products'

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
  cockpit3d_id?: string
}

interface BackgroundOption {
  id: string
  name: string
  price: number
  cockpit3d_id?: string
}

interface TextOption {
  id: string
  name: string
  price: number
  cockpit3d_id?: string
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
  const [showCustomText, setShowCustomText] = useState(false)
  const [customText, setCustomText] = useState({ line1: '', line2: '' })
  const [textCharCount, setTextCharCount] = useState({ line1: 0, line2: 0 })
  const [quantity, setQuantity] = useState(1)
  
  // Image State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [rawUploadedImage, setRawUploadedImage] = useState<string | null>(null) // Original before masking
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [finalMaskedImage, setFinalMaskedImage] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  
  // UI State
  const [addingToCart, setAddingToCart] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddedModal, setShowAddedModal] = useState(false)
  const [addedItemDetails, setAddedItemDetails] = useState<any>(null)

  // File input ref for resetting
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch product on mount
  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      logger.info('Fetching product', { slug, envMode: ENV_MODE })
      // Use JSON file as single source of truth
      const allProducts = await getProducts()
      logger.info(`Loaded ${allProducts.length} products from JSON`)
      const foundProduct = allProducts.find((p: Product) => p.slug === slug)

      if (!foundProduct) {
        throw new Error('Product not found')
      }
      
      setProduct(foundProduct)
      
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOriginalFileName(file.name)

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: 'Image must be less than 5MB' })
      return
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setErrors({ ...errors, image: 'Please upload JPG, PNG, or GIF' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setRawUploadedImage(dataUrl) // Store original raw image
      setUploadedImage(dataUrl)
      setShowEditor(true)
      
      // ✅ FIX: Reset file input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  /**
   * Handle save from ImageEditor - THIS IS CRITICAL
   * Receives the masked/compressed image from editor
   */
  const handleImageEditorSave = (compressedImage: string) => {
    logger.info('Image saved from editor', { 
      size: compressedImage.length 
    })
    
    // Save the masked/compressed image (final product)
    setFinalMaskedImage(compressedImage)
    setShowEditor(false)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.image
      delete newErrors.finalImage
      return newErrors
    })
  }

  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {}
    
    // Only validate size if product has sizes AND none is selected
    // Skip validation if product doesn't have sizes array or it's empty
    const hasSizes = product?.sizes && Array.isArray(product.sizes) && product.sizes.length > 0
    if (hasSizes && !selectedSize) {
      newErrors.size = 'Please select a size'
    }
    
    // Only validate image if product explicitly requires it
    if (product?.requiresImage === true) {
      if (!uploadedImage) {
        newErrors.image = 'Please upload an image'
      } else if (!finalMaskedImage) {
        newErrors.finalImage = 'Please save your edited image before adding to cart'
      }
    }
    
    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    
    // Detailed logging for debugging
    console.log('🔍 [VALIDATION] Checking form...', {
      hasSizes,
      sizesCount: product?.sizes?.length || 0,
      selectedSize: selectedSize?.name || null,
      requiresImage: product?.requiresImage,
      hasUploadedImage: !!uploadedImage,
      hasMaskedImage: !!finalMaskedImage,
      errors: newErrors,
      isValid
    })
    
    return { isValid, errors: newErrors }
  }

  // Use centralized pricing utilities
  const getTotalPrice = (): number => {
    const optionsPrice = calculateOptionsPrice(
      selectedLightBase,
      selectedBackground,
      selectedTextOption,
      showCustomText,
      product?.textOptions
    )
    
    return calculateTotal(
      product,
      selectedSize,
      optionsPrice,
      quantity
    )
  }
  
  const getOptionsPrice = (): number => {
    return calculateOptionsPrice(
      selectedLightBase,
      selectedBackground,
      selectedTextOption,
      showCustomText,
      product?.textOptions
    )
  }

  const buildProductOptions = (): ProductOption[] => {
    const options: ProductOption[] = []
    
    if (selectedLightBase) {
      options.push({
        category: 'lightBase',
        optionId: selectedLightBase.id,
        cockpit3d_option_id: selectedLightBase.cockpit3d_id,
        name: selectedLightBase.name,
        value: selectedLightBase.name,
        priceModifier: selectedLightBase.price || 0
      })
    }
    
    if (selectedBackground) {
      options.push({
        category: 'background',
        optionId: selectedBackground.id,
        cockpit3d_option_id: selectedBackground.cockpit3d_id,
        name: selectedBackground.name,
        value: selectedBackground.name,
        priceModifier: selectedBackground.price
      })
    }
    
    // Add custom text option with price if enabled
    if (showCustomText && (customText.line1 || customText.line2)) {
      const textOption = product?.textOptions?.find(t => t.price > 0) || product?.textOptions?.[1]
      
      options.push({
        category: 'customText',
        optionId: 'custom-text',
        name: 'Custom Text',
        value: 'Custom Text Added',
        priceModifier: textOption?.price || 0,
        line1: customText.line1,
        line2: customText.line2
      })
    }
    
    return options
  }

  const handleAddToCart = async () => {
    console.log('🛒 [ADD TO CART] Starting add to cart process')
    console.log('🛒 [ADD TO CART] Product:', {
      id: product?.id,
      name: product?.name,
      sku: product?.sku,
      cockpit3d_id: product?.cockpit3d_id,
      basePrice: product?.basePrice,
      requiresImage: product?.requiresImage,
      maskImageUrl: product?.maskImageUrl
    })
    
    const validation = validateForm()
    if (!validation.isValid) {
      // Scroll to top to show error messages
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Show user-friendly alert based on validation errors
      if (validation.errors.image) {
        alert('⚠️ Please upload your image before adding to cart.')
      } else if (validation.errors.finalImage) {
        alert('⚠️ Please save your edited image before adding to cart.')
      } else if (validation.errors.size) {
        alert('⚠️ Please select a size before adding to cart.')
      } else if (Object.keys(validation.errors).length > 0) {
        alert('⚠️ Please complete all required fields before adding to cart.')
      }
      
      console.log('⚠️ [ADD TO CART] Validation failed:', validation.errors)
      logger.warn('Form validation failed', validation.errors)
      return
    }

    setAddingToCart(true)
    setError('')
    setSuccessMessage('')

    try {
      if (!product) {
        throw new Error('Product not loaded')
      }

      let customImage: CustomImage | undefined

      if (finalMaskedImage) {
        const img = new window.Image()
        img.src = finalMaskedImage
        
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
      
      const sizeDetails: SizeDetails = {
        sizeId: selectedSize?.id || 'default',
        sizeName: selectedSize?.name || 'Default Size',
        basePrice: selectedSize?.price || product.basePrice
      }
      
      console.log('📐 [ADD TO CART] Size Details:', sizeDetails)
      
      const productOptions = buildProductOptions()
      console.log('⚙️ [ADD TO CART] Product Options:', JSON.stringify(productOptions, null, 2))
      
      const customTextString = customText.line1 || customText.line2
        ? `${customText.line1}${customText.line2 ? '\n' + customText.line2 : ''}`
        : undefined
      
      if (customTextString) {
        console.log('✍️ [ADD TO CART] Custom Text:', customTextString)
      }
      
      const optionsPrice = getOptionsPrice()
      const totalPrice = getTotalPrice()
      const originalPrice = selectedSize?.price || product.basePrice
      
      // Calculate per-unit price (basePrice after sale discount + options)
      const unitPrice = totalPrice / quantity
      
      // Get sale information using centralized utility
      const saleInfo = getSaleInfo(product, unitPrice, originalPrice)
      
      console.log('💰 [ADD TO CART] Pricing:', {
        basePrice: originalPrice,
        optionsPrice,
        unitPrice,
        totalPrice,
        quantity,
        saleInfo
      })
      
      const lineItem: OrderLineItem = {
        lineItemId: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: String(product.id),
        cockpit3d_id: product.cockpit3d_id || String(product.id),
        name: product.name,
        sku: product.sku,
        basePrice: originalPrice,
        optionsPrice: optionsPrice,
        price: unitPrice,  // Per-unit price for cart calculations
        totalPrice: totalPrice,
        quantity: quantity,
        size: sizeDetails,
        options: productOptions,
        productImage: mainImage?.src || null,
        customImage: customImage,
        customText: customTextString ? { text: customTextString } : undefined,
        // Sale information for cart display - use centralized isOnSale utility
        onSale: isOnSale(product),
        salePrice: product.salePrice,
        salePercent: product.salePercent,
        originalPrice: originalPrice,
        discountAmount: saleInfo.discountAmount * quantity,
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
      
      console.log('📦 [ADD TO CART] Complete Line Item:', JSON.stringify({
        ...lineItem,
        customImage: lineItem.customImage ? {
          filename: lineItem.customImage.filename,
          mimeType: lineItem.customImage.mimeType,
          fileSize: lineItem.customImage.fileSize,
          width: lineItem.customImage.width,
          height: lineItem.customImage.height,
          maskId: lineItem.customImage.maskId,
          dataUrlLength: lineItem.customImage.dataUrl?.length
        } : undefined
      }, null, 2))
      
      logger.order('Adding item to cart', {
        productId: lineItem.productId,
        name: lineItem.name,
        quantity: lineItem.quantity,
        totalPrice: lineItem.totalPrice,
        hasCustomImage: !!lineItem.customImage,
        hasCustomText: !!lineItem.customText,
        imageSize: lineItem.customImage ? lineItem.customImage.fileSize : 0
      })
      
      try {
        await addToCart(lineItem)
        logger.success('Item successfully added to cart')
      } catch (cartError: any) {
        logger.error('Cart add failed', cartError)
        throw new Error(`Failed to add to cart: ${cartError.message}`)
      }
      
      setSuccessMessage(`Added ${quantity} ${product.name} to cart!`)
      
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
        image: finalMaskedImage || mainImage?.src || '/placeholder.png',
        price: totalPrice / quantity, // Price per item for display
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
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-900">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-[#72B01D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Loading product...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !product) {
    return (
      <div className="bg-white text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <p className="text-base font-semibold text-red-600">404</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Product not found</h1>
            <p className="mt-2 text-base text-gray-500">{error}</p>
            <div className="mt-6">
              <Link href="/products" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#72B01D] hover:bg-[#5A8E17] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#72B01D]">
                Browse all products
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const mainImage = product.images.find(img => img.isMain) || product.images[0]
  const primaryCategory = product.categories?.[0] || getProductCategories(product)[0] || null

  return (    
    <div className="bg-white text-slate-900">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-4 text-sm">
            <Link href="/" className="font-medium text-gray-500 hover:text-gray-900">Home</Link>
            <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
            </svg>
            <Link href="/products" className="font-medium text-gray-500 hover:text-gray-900">Products</Link>
            
            {/* Show category if available */}
            {primaryCategory && (
              <>
                <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link 
                  href={`/products?category=${primaryCategory}`} 
                  className="font-medium text-gray-500 hover:text-gray-900"
                >
                  {getCategoryLabel(primaryCategory)}
                </Link>
              </>
            )}
            
            <svg className="h-5 w-5 flex-shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
            </svg>
            <span className="font-medium text-gray-500">{product.name}</span>
          </div>
        </div>
      </nav>

      {/* Product */}
      <div className="mx-auto max-w-2xl px-4 md:py-12 sm:px-6 lg:max-w-7xl lg:px-8">

        <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 lg:items-start lg:gap-x-12">
        
          <div className="relative lg:sticky lg:top-[85px]">
            {/* Image gallery */}
            <div className="flex flex-col-reverse">
              
              <div className="mt-6">
                <h3 className="sr-only">Product Description</h3>
                <div className="space-y-6 text-base text-gray-700">
                  {product.longDescription && (
                    <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                  )}
                </div>
              </div>

              <div className="w-full overflow-hidden">

                {finalMaskedImage ? (
                  <div className="space-y-4">
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        src={finalMaskedImage} 
                        alt="Customer Preview" 
                        className="h-full w-full object-cover object-center"
                        width={1024}
                        height={1024}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowEditor(true)}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#72B01D] focus:ring-offset-2"
                      >
                        Edit Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinalMaskedImage(null)}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#72B01D] focus:ring-offset-2"
                      >
                        Remove Image
                      </button>
                    </div>
                  </div>
                ) : product.images && product.images.length > 1 ? (
                  <>
                    <ProductGallery images={product.images} />
                    {/* Centralized Badges Component */}
                    <ProductBadges product={product} position="gallery" />
                  </>
                ) : (
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 relative">
                    <Image
                      src={mainImage.src}
                      alt={product.name}
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover object-center"
                    />
                    {/* Centralized Badges Component */}
                    <ProductBadges product={product} position="detail" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0 col-span-2">
            <div className="flex items-start flex-wrap">
              <h1 className="text-6xl font-bold tracking-tight text-gray-900">{product.name}</h1>             
            </div>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              {isOnSale(product) && (product.salePercent || product.salePrice) ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-4xl font-bold tracking-tight text-[#72B01D]">
                    ${getTotalPrice().toFixed(2)}
                  </p>
                  <p className="text-2xl tracking-tight text-gray-500 line-through">
                    ${(selectedSize?.price || product.basePrice)?.toFixed(2)}
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white shadow-md">
                    {product.salePercent 
                      ? `${product.salePercent}% OFF` 
                      : `SAVE ${Math.round((((selectedSize?.price || product.basePrice) - (getTotalPrice() / quantity)) / (selectedSize?.price || product.basePrice)) * 100)}%`}
                  </span>
                </div>
              ) : (
                <p className="text-4xl font-bold tracking-tight text-gray-900">${getTotalPrice().toFixed(2)}</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="space-y-6 text-base text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mt-6 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="mt-6">
              {/* Image Upload */}
              {product.requiresImage && (
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Upload your image <span className="text-red-500">*</span>
                  </label>
                  <label className="mt-1 cursor-pointer flex justify-center rounded-lg border border-dashed border-gray-900/25 px-3 py-4">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                      </svg>
                       
                      <span className="text-green-800">Upload a file</span>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="sr-only"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleImageUpload}
                        /> 
                        {/*<p className="pl-1">or drag and drop</p>*/}
                      
                      <p className="text-xs leading-5 text-gray-600">PNG, JPG, GIF up to 5MB<br/>Minimum dimensions: 500x500 pixels<br/>Higher resolution recommended for best results</p>
                    </div>
                  </label>
                  {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
                  {errors.finalImage && <p className="mt-2 text-sm text-red-600">{errors.finalImage}</p>}
                </div>
              )}

              {/* Size */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">Size</h3>
                  </div>
                  <fieldset className="mt-4">
                    <legend className="sr-only">Choose a size</legend>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-auto">
                      {product.sizes.map((size) => (
                        <label
                          key={size.id}
                          className={`cursor-pointer rounded-md px-3 py-3 text-sm font-semibold uppercase shadow-sm focus:outline-none sm:flex-1 ${
                            selectedSize?.id === size.id
                              ? 'bg-[#72B01D] text-white hover:bg-[#5A8E17]'
                              : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="size"
                            value={size.id}
                            checked={selectedSize?.id === size.id}
                            onChange={() => setSelectedSize(size)}
                            className="sr-only"
                          />
                          <span className="block text-center">{size.name}</span>
                          {size.price > 0 && (
                            <span className="block text-center text-xs mt-1">${size.price}</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {errors.size && <p className="mt-2 text-sm text-red-600">{errors.size}</p>}
                </div>
              )}

              {/* Background Options */}
              {product.backgroundOptions && product.backgroundOptions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-900">Background</h3>
                  <fieldset className="mt-4">
                    <legend className="sr-only">Choose a background</legend>
                    <div className="space-y-3">
                      {product.backgroundOptions.map((bg) => (
                        <label
                          key={bg.id}
                          className={`relative block cursor-pointer rounded-lg border px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between ${
                            selectedBackground?.id === bg.id
                              ? 'border-transparent ring-2 ring-[#72B01D]'
                              : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="background"
                            value={bg.id}
                            checked={selectedBackground?.id === bg.id}
                            onChange={() => setSelectedBackground(bg)}
                            className="sr-only"
                          />
                          <span className="flex items-center">
                            <span className="flex flex-col text-sm">
                              <span className="font-medium text-gray-900">{bg.name}</span>
                            </span>
                          </span>
                          <span className="mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right">
                            <span className="font-medium text-gray-900">
                              {bg.price > 0 ? `+$${bg.price.toFixed(2)}` : 'No Extra Cost'}
                            </span>
                          </span>
                          {selectedBackground?.id === bg.id && (
                            <span className="pointer-events-none absolute -inset-px rounded-lg border-2 border-[#72B01D]" />
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Light Base */}
              {product.lightBases && product.lightBases.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-900">Light Base</h3>
                  <fieldset className="mt-4">
                    <legend className="sr-only">Choose a light base</legend>
                    <div className="space-y-3">
                      {product.lightBases.map((base) => (
                        <label
                          key={base.id}
                          className={`relative block cursor-pointer rounded-lg border px-6 py-4 shadow-sm focus:outline-none sm:flex sm:justify-between ${
                            selectedLightBase?.id === base.id
                              ? 'border-transparent ring-2 ring-[#72B01D]'
                              : 'border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lightBase"
                            value={base.id}
                            checked={selectedLightBase?.id === base.id}
                            onChange={() => setSelectedLightBase(base)}
                            className="sr-only"
                          />
                          <span className="flex items-center">
                            <span className="flex flex-col text-sm">
                              <span className="font-medium text-gray-900">{base.name}</span>
                            </span>
                          </span>
                          <span className="mt-2 flex text-sm sm:ml-4 sm:mt-0 sm:flex-col sm:text-right">
                            <span className="font-medium text-gray-900">
                              {base.price && base.price > 0 ? `+$${base.price.toFixed(2)}` : 'No Extra Cost'}
                            </span>
                          </span>
                          {selectedLightBase?.id === base.id && (
                            <span className="pointer-events-none absolute -inset-px rounded-lg border-2 border-[#72B01D]" />
                          )}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Custom Text Checkbox Option */}
              {product.textOptions && product.textOptions.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <input
                      id="add-custom-text"
                      name="showCustomText"
                      type="checkbox"
                      checked={showCustomText}
                      onChange={(e) => {
                        setShowCustomText(e.target.checked)
                        if (!e.target.checked) {
                          setCustomText({ line1: '', line2: '' })
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-[#72B01D] focus:ring-[#72B01D]"
                    />
                    <label htmlFor="add-custom-text" className="ml-3 text-sm font-medium text-gray-900">
                      {(() => {
                        const textPrice = (product.textOptions.find(t => t.price > 0) || product.textOptions[1])?.price || 0;
                        return textPrice > 0 
                          ? `Add Custom Text (+$${textPrice.toFixed(2)})`
                          : 'Add Custom Text (No Extra Cost)';
                      })()}
                    </label>
                  </div>
                  
                  {showCustomText && (
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="text-line-1" className="block text-sm text-gray-700 mb-1">
                          Line 1 <span className="text-gray-400">({customText.line1.length}/30)</span>
                        </label>
                        <input
                          type="text"
                          id="text-line-1"
                          placeholder="e.g., Anniversary 2024"
                          value={customText.line1}
                          onChange={(e) => setCustomText({ ...customText, line1: e.target.value })}
                          className="block w-full 
                          rounded-md 
                          border-0 
                          py-2.5 
                          pl-4 
                          text-gray-900 
                          shadow-sm 
                          ring-1 
                          ring-inset 
                          ring-gray-300 
                          placeholder:text-gray-400 
                          focus:ring-2 
                          focus:ring-inset 
                          focus:ring-[var(--brand-400)]
                          active:ring-[var(--brand-400)]
                          sm:text-sm 
                          sm:leading-6"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <label htmlFor="text-line-2" className="block text-sm text-gray-700 mb-1">
                          Line 2 <span className="text-gray-400">({customText.line2.length}/30)</span>
                        </label>
                        <input
                          type="text"
                          id="text-line-2"
                          placeholder="e.g., Forever & Always"
                          value={customText.line2}
                          onChange={(e) => setCustomText({ ...customText, line2: e.target.value })}
                          className="block w-full rounded-md border-0 py-2.5 pl-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#72B01D] sm:text-sm sm:leading-6"
                          maxLength={30}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-900 mb-2">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <span className="sr-only">Decrease quantity</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="block w-20 rounded-md border-0 py-2 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#72B01D] sm:text-sm sm:leading-6"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <span className="sr-only">Increase quantity</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="cursor-pointer flex w-full items-center justify-center rounded-md border border-transparent bg-[#72B01D] px-8 py-3 text-base font-medium text-white hover:bg-[#5A8E17] focus:outline-none focus:ring-2 focus:ring-[#72B01D] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding to cart...' : `Add to cart - $${getTotalPrice().toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      {product.requiresImage && (
        <ImageEditor
          show={showEditor}
          onHide={() => setShowEditor(false)}
          uploadedImage={uploadedImage}
          maskImage={product.maskImageUrl || null}
          onSave={handleImageEditorSave}
        />
      )}

      <AddedToCartModal
        show={showAddedModal}
        onClose={() => {
          setShowAddedModal(false)
          setAddedItemDetails(null)
        }}
        itemDetails={addedItemDetails}
      />
    </div>
  )
}

