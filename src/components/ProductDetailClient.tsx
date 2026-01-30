// components/ProductDetailClient.tsx
// Version: 3.2.0 - FIX: Upload images on SAVE (not Add to Cart)
// ✅ Premium e-commerce design inspired by Tailwind UI
// ✅ Clean spacing, modern typography, professional polish
// ✅ Fixed: File input resets after upload to allow same file selection
// ✅ Fixed: Images now upload immediately when customer clicks "Save" in editor
// ✅ Fixed: Server URLs stored immediately for Cockpit3D integration
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import ImageEditor from '@/components/ImageEditor'
import type { CustomImage, OrderLineItem, SizeDetails, ProductOption } from '@/types/orderTypes'
import { logger } from '@/utils/logger'
import { addToCart, checkStorageHealth, storeFullResImage } from '@/lib/cartUtils'
import { uploadCustomerImages } from '@/lib/customerImageUpload'
import { getOrCreateOrderSession, updateOrderImages as updateSessionImages, markOrderInCart as markSessionInCart, getOrderIdForUpload, forceNewOrderSession, clearOrderSession } from '@/lib/unifiedOrderId'
import AddedToCartModal from '@/components/cart/AddedToCartModal'
import { isFeaturedProduct, isLightbaseProduct, isOnSale, getProductCategories, getCategoryLabel } from '@/utils/categoriesConfig'
import { assetPath } from '@/lib/assetPath'
import { calculateTotal, calculateOptionsPrice, getSaleInfo } from '@/utils/pricingUtils'
import ProductGallery from '@/components/ProductGallery'
import ProductBadges from '@/components/ProductBadges'
import gsap from 'gsap';

import { ArrowBigLeft, ArrowLeft, CornerRightDown } from 'lucide-react'; 

import '../app/css/modal.css'
import '../app/css/product-options.css'
import '../app/css/gallery.css'
import '../app/css/animations.css'

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
  const textRef = useRef(null);
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
  
  // Server URLs for uploaded images (populated on Save, not Add to Cart)
  const [maskedImageServerUrl, setMaskedImageServerUrl] = useState<string | null>(null)
  const [rawImageServerUrl, setRawImageServerUrl] = useState<string | null>(null)
  const [tempOrderRef, setTempOrderRef] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  
  // UI State
  const [addingToCart, setAddingToCart] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddedModal, setShowAddedModal] = useState(false)
  const [addedItemDetails, setAddedItemDetails] = useState<any>(null)

    // Animation State
  const [isPageLoaded, setIsPageLoaded] = useState(false)
  const [filterChanged, setFilterChanged] = useState<string | null>(null)

  // File input ref for resetting
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Only run animation if textRef exists (for products that require images)
    if (textRef.current) {
      const letters = textRef.current.querySelectorAll("span");

      gsap.fromTo(
        letters,
        { y: 0, color: "#72B01D"  },
        {
          y: -10,
          color: "#a3d77a",
          duration: 0.15,
          delay: 1,     
          ease: "power1.out",
          stagger: {
            each: 0.05,
            yoyo: true,
            repeat: 1,
          },
        }
      );
    }
  }, [product?.requiresImage]); // Add dependency to re-run when product changes

  const text = "Upload Your Image";
  // Fetch product on mount
  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  // Page load animation trigger
  useEffect(() => {
    setIsPageLoaded(true)
    console.log('[Animation] Page loaded')
  }, [])

  // Track size filter changes
  useEffect(() => {
    if (selectedSize) {
      setFilterChanged('size')
      console.log('[Animation] Size filter changed:', selectedSize.name)
      const timer = setTimeout(() => setFilterChanged(null), 300)
      return () => clearTimeout(timer)
    }
  }, [selectedSize?.id])

  // Track lightBase filter changes
  useEffect(() => {
    if (selectedLightBase) {
      setFilterChanged('lightBase')
      console.log('[Animation] LightBase filter changed:', selectedLightBase.name)
      const timer = setTimeout(() => setFilterChanged(null), 300)
      return () => clearTimeout(timer)
    }
  }, [selectedLightBase?.id])


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

    // ✅ NEW IMAGE = NEW ORDER SESSION
    // Clear any existing server URLs and order ref since this is a fresh upload
    console.log('🆕 [IMAGE UPLOAD] New image uploaded - clearing existing session data')
    setMaskedImageServerUrl(null)
    setRawImageServerUrl(null)
    setTempOrderRef(null)
    setFinalMaskedImage(null)
    
    // Force a new order session for this new image
    // This ensures each new image customization gets a unique folder
    clearOrderSession()

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
   * ✅ Uses UNIFIED ORDER ID system - same ID everywhere!
   * ✅ Uploads images immediately to server
   */
  const handleImageEditorSave = async (compressedImage: string) => {
    console.log('🎨 [IMAGE EDITOR SAVE] ==========================')
    console.log('🎨 [IMAGE EDITOR SAVE] Received compressedImage:', {
      exists: !!compressedImage,
      length: compressedImage?.length,
      startsWithData: compressedImage?.startsWith('data:'),
      first50chars: compressedImage?.substring(0, 50)
    })
    console.log('🎨 [IMAGE EDITOR SAVE] Raw image available:', {
      exists: !!rawUploadedImage,
      length: rawUploadedImage?.length
    })
    
    logger.info('Image saved from editor - STARTING ORDER', { 
      size: compressedImage.length,
      productId: product?.id
    })
    
    // Save the masked/compressed image (final product) for local display
    setFinalMaskedImage(compressedImage)
    setShowEditor(false)
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors.image
      delete newErrors.finalImage
      return newErrors
    })
    
    // ✅ GET UNIFIED ORDER ID - same ID used everywhere!
    const orderId = getOrderIdForUpload(product?.id?.toString())
    setTempOrderRef(orderId)
    
    console.log('📦 [IMAGE SAVE] Using unified order ID:', {
      orderId,
      productId: product?.id,
      productName: product?.name
    })
    
    // ✅ IMMEDIATELY UPLOAD to server using unified order ID
    setIsUploadingImage(true)
    
    try {
      console.log('📤 [IMAGE SAVE] Starting uploads...')
      console.log('📤 [IMAGE SAVE] Masked image (compressedImage):', compressedImage ? `${compressedImage.length} chars` : 'NULL!')
      console.log('📤 [IMAGE SAVE] Raw image (rawUploadedImage):', rawUploadedImage ? `${rawUploadedImage.length} chars` : 'NULL!')
      
      // Upload both masked and raw images using the UNIFIED order ID
      const uploadResult = await uploadCustomerImages(
        compressedImage,
        rawUploadedImage || undefined,
        product?.id?.toString() || 'unknown',
        orderId // Use unified order ID for folder organization
      )
      
      console.log('📤 [IMAGE SAVE] Upload result:', JSON.stringify({
        maskedUrl: uploadResult.maskedUrl,
        rawUrl: uploadResult.rawUrl,
        errors: uploadResult.errors
      }, null, 2))
      
      // ✅ Check if at least the masked image uploaded successfully
      if (uploadResult.maskedUrl) {
        setMaskedImageServerUrl(uploadResult.maskedUrl)
        console.log('✅ [IMAGE SAVE] Masked image uploaded:', uploadResult.maskedUrl)
        
        // ✅ UPDATE SESSION with server URLs - ONLY if we have at least masked URL
        updateSessionImages(uploadResult.maskedUrl, uploadResult.rawUrl)
        console.log('✅ [IMAGE SAVE] Session updated with image URLs')
        
        // Clear any previous upload errors
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.imageUpload
          return newErrors
        })
      } else {
        console.error('❌ [IMAGE SAVE] ⚠️ MASKED IMAGE NOT UPLOADED! serverUrl is empty!')
        console.error('❌ [IMAGE SAVE] Upload errors:', uploadResult.errors)
        console.error('❌ [IMAGE SAVE] Full upload result:', uploadResult)
        // Show error to user!
        setErrors(prev => ({
          ...prev,
          imageUpload: `Masked image failed to upload. ${uploadResult.errors.join('. ')}. Please try saving again.`
        }))
        // ❌ Do NOT update session with empty URLs
      }
      
      if (uploadResult.rawUrl) {
        setRawImageServerUrl(uploadResult.rawUrl)
        console.log('✅ [IMAGE SAVE] Raw image uploaded:', uploadResult.rawUrl)
      }
      
      if (uploadResult.errors.length > 0) {
        console.warn('⚠️ [IMAGE SAVE] Upload warnings:', uploadResult.errors)
      }
      
      logger.success('Order started and images uploaded', {
        orderId,
        maskedUrl: uploadResult.maskedUrl,
        rawUrl: uploadResult.rawUrl,
        hasErrors: uploadResult.errors.length > 0
      })
      
    } catch (error) {
      console.error('❌ [IMAGE SAVE] Failed to upload images:', error)
      logger.error('Image upload failed on save', error)
      setErrors(prev => ({
        ...prev,
        imageUpload: 'Image upload failed. Please try saving again.'
      }))
    } finally {
      setIsUploadingImage(false)
    }
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
      } else if (isUploadingImage) {
        newErrors.imageUpload = 'Please wait for image upload to complete'
      } else if (!maskedImageServerUrl) {
        // ✅ NEW: Block add to cart if server upload failed
        newErrors.imageUpload = 'Image upload failed. Please click "Edit Image" and save again.'
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
      isUploadingImage,
      hasServerUrl: !!maskedImageServerUrl,
      serverUrl: maskedImageServerUrl,
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
      } else if (validation.errors.imageUpload) {
        alert('⚠️ ' + validation.errors.imageUpload)
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
        
        // Store full-res locally as backup
        if (uploadedImage) {
          storeFullResImage(product.id.toString(), uploadedImage)
        }
        
        await new Promise(resolve => { img.onload = resolve })
        
        // ✅ USE ALREADY-UPLOADED SERVER URLs (uploaded on Save, not here)
        // Images were uploaded in handleImageEditorSave, so we just use the stored URLs
        console.log('📸 ===== ADD TO CART: IMAGE URL CHECK =====')
        console.log('📸 [ADD TO CART] maskedImageServerUrl state:', maskedImageServerUrl)
        console.log('📸 [ADD TO CART] rawImageServerUrl state:', rawImageServerUrl)
        console.log('📸 [ADD TO CART] tempOrderRef state:', tempOrderRef)
        console.log('📸 [ADD TO CART] finalMaskedImage exists:', !!finalMaskedImage, finalMaskedImage?.length)
        
        // ⚠️ CRITICAL CHECK: If server URL is missing, log warning
        if (!maskedImageServerUrl) {
          console.error('⚠️ [ADD TO CART] WARNING: maskedImageServerUrl is empty!')
          console.error('⚠️ [ADD TO CART] Image will be added WITHOUT server URL - Cockpit3D will NOT have the image!')
        }
        
        customImage = {
          // ✅ Keep base64 for thumbnail generation (IndexedDB storage)
          dataUrl: finalMaskedImage, // Always keep base64 for local processing
          originalDataUrl: uploadedImage, // Always keep base64 for local processing
          // ✅ Use server URLs that were uploaded on Save
          serverUrl: maskedImageServerUrl || undefined,
          originalServerUrl: rawImageServerUrl || undefined,
          filename: originalFileName || `product-${product.id}-${Date.now()}.png`,
          mimeType: 'image/png',
          fileSize: finalMaskedImage.length,
          width: img.width,
          height: img.height,
          processedAt: new Date().toISOString(),
          maskId: product.maskImageUrl,
          maskName: 'Product Mask',
          tempOrderRef: tempOrderRef || undefined // Unified order ID
        }
        
        // Mark order as in cart using unified session
        if (tempOrderRef) {
          markSessionInCart()
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
          
          {/* LEFT: Gallery - Sticky on desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="w-full overflow-hidden">
              {finalMaskedImage ? (
                <div className="space-y-4">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 relative">
                    <Image
                      src={finalMaskedImage} 
                      alt="Customer Preview" 
                      className="h-full w-full object-cover object-center"
                      width={1024}
                      height={1024}
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm">Uploading...</p>
                        </div>
                      </div>
                    )}
                    {!isUploadingImage && maskedImageServerUrl && (
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditor(true)}
                      disabled={isUploadingImage}
                      className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinalMaskedImage(null)
                        setMaskedImageServerUrl(null)
                        setRawImageServerUrl(null)
                        setTempOrderRef(null)
                      }}
                      disabled={isUploadingImage}
                      className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : product.images && product.images.length > 1 ? (
                <div className={`${isPageLoaded ? 'fade-in' : 'opacity-0'}`}>
                  <ProductGallery images={product.images} productName={product.name} />
                  <ProductBadges product={product} position="gallery" />
                </div>
              ) : (
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100 relative">
                  <Image
                    src={mainImage.src}
                    alt={product.name}
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover object-center"
                  />
                  <ProductBadges product={product} position="detail" />
                </div>
              )}
            </div>
            
            {/* Description - Desktop only, below gallery */}
            <div className="hidden lg:block mt-8">
              {product.longDescription && (
                <div className="prose prose-sm max-w-none text-gray-600">
                  <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Product Info + Options */}
          <div className="mt-8 lg:mt-0">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mt-4">
              {isOnSale(product) && (product.salePercent || product.salePrice) ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-semibold text-[#72B01D]">
                    ${getTotalPrice().toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ${(selectedSize?.price || product.basePrice)?.toFixed(2)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-500 text-white text-xs font-medium">
                    {product.salePercent ? `${product.salePercent}% OFF` : 'SALE'}
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-semibold text-gray-900">${getTotalPrice().toFixed(2)}</span>
              )}
            </div>

            {/* Short description */}
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">{product.description}</p>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-6">
              {/* Image Upload */}
              {product.requiresImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload your image <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer flex justify-center rounded border-2 border-dashed border-gray-300 px-4 py-6 hover:border-gray-400 transition-colors">
                    <div className="text-center">
                      <svg className="mx-auto h-10 w-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="mt-2 block text-sm text-gray-600">Click to upload</span>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="sr-only"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleImageUpload}
                      />
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </label>
                  {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
                  {errors.finalImage && <p className="mt-1 text-sm text-red-600">{errors.finalImage}</p>}
                  {errors.imageUpload && <p className="mt-1 text-sm text-red-600">{errors.imageUpload}</p>}
                </div>
              )}

              {/* Size */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="product-option pt-2 mt-2">
                  <fieldset>
                    <legend className="h5">Select Size <span className="text-red-500">*</span></legend>
                    {errors.size && <div className="text-red-500 small">{errors.size}</div>}
                    {product.sizes.map((size) => (
                      <label key={size.id} className="crystal-radio">
                        <span className="h5">{size.name}</span>
                        <span className="option-price">
                          <span className="option-price__wrapper h5">
                            {size.price === 0 ? (
                              <span className="option-price__included">
                                <span className="option-price__paren">(</span>
                                <span className="option-price__text">Included</span>
                                <span className="option-price__paren">)</span>
                              </span>
                            ) : (
                              <span className="option-price__additional">
                                <span className="option-price__currency">$</span>
                                <span className="option-price__value">{size.price}</span>
                              </span>
                            )}
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="size"
                          value={size.id}
                          checked={selectedSize?.id === size.id}
                          onChange={() => setSelectedSize(size)}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}

              {/* Background Options */}
              {product.backgroundOptions && product.backgroundOptions.length > 0 && (
                <div className="product-option pt-2 mt-2">
                  <fieldset>
                    <legend className="h5">Background Style <span className="text-red-500">*</span></legend>
                    {product.backgroundOptions.map((bg) => (
                      <label key={bg.id} className="crystal-radio">
                        {bg.name}
                        <span className="option-price">
                          {bg.price === 0 ? '' : `(+$${bg.price.toFixed(2)})`}
                        </span>
                        <input
                          type="radio"
                          name="background"
                          value={bg.id}
                          checked={selectedBackground?.id === bg.id}
                          onChange={() => setSelectedBackground(bg)}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}

              {/* Light Base */}
              {product.lightBases && product.lightBases.length > 0 && (
                <div className="product-option pt-2 mt-2">
                  <fieldset>
                    <legend className="h5">Light Base <span className="text-red-500">*</span></legend>
                    {product.lightBases.map((base) => (
                      <label key={base.id} className="crystal-radio">
                        {base.name}
                        <span className="option-price">
                          {base.price && base.price > 0 ? `(+$${base.price.toFixed(2)})` : ''}
                        </span>
                        <input
                          type="radio"
                          name="lightBase"
                          value={base.id}
                          checked={selectedLightBase?.id === base.id}
                          onChange={() => setSelectedLightBase(base)}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}

              {/* Custom Text Checkbox Option */}
              {product.textOptions && product.textOptions.length > 0 && (
                <div className="product-option pt-2 mt-2">
                  <div className="flex items-center">
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
                      className="w-4 h-4 rounded border-gray-300 text-[#72B01D] focus:ring-[#72B01D] mr-2"
                    />
                    <label htmlFor="add-custom-text" className="h5 mb-0 cursor-pointer">
                      {(() => {
                        const textPrice = (product.textOptions.find(t => t.price > 0) || product.textOptions[1])?.price || 0;
                        return textPrice > 0 
                          ? `Add Custom Text (+$${textPrice.toFixed(2)})`
                          : 'Add Custom Text (No Extra Cost)';
                      })()}
                    </label>
                  </div>
                  
                  {showCustomText && (
                    <div className="mt-3">
                      <div className="mb-3">
                        <label htmlFor="text-line-1" className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Text Line 1 <span className="text-gray-400">({customText.line1.length}/30)</span>
                        </label>
                        <input
                          type="text"
                          id="text-line-1"
                          placeholder="e.g., In Loving Memory"
                          value={customText.line1}
                          onChange={(e) => setCustomText({ ...customText, line1: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#72B01D] focus:border-transparent"
                          maxLength={30}
                        />
                      </div>
                      <div>
                        <label htmlFor="text-line-2" className="block text-sm font-medium text-gray-700 mb-1">
                          Custom Text Line 2 <span className="text-gray-400">({customText.line2.length}/30)</span>
                        </label>
                        <input
                          type="text"
                          id="text-line-2"
                          placeholder="e.g., Forever in Our Hearts"
                          value={customText.line2}
                          onChange={(e) => setCustomText({ ...customText, line2: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#72B01D] focus:border-transparent"
                          maxLength={30}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="product-option pt-2 mt-2">
                <label className="h5">Quantity</label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#72B01D]"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
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
                className="w-full mt-4 px-6 py-3 bg-[#72B01D] text-white text-lg font-semibold rounded-md hover:bg-[#5a8c17] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingToCart ? 'Adding to cart...' : `Add to Cart - $${getTotalPrice().toFixed(2)}`}
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

