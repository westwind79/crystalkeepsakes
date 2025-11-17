'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { isLightbaseProduct, isFeaturedProduct, isOnSale } from '@/utils/categoriesConfig'
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
    
    if (!validateForm()) {
      console.error('❌ [ADD TO CART] Validation failed:', errors)
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
      
      const optionsPrice = calculateOptionsPrice()
      const totalPrice = calculateTotal()
      
      console.log('💰 [ADD TO CART] Pricing:', {
        basePrice: selectedSize?.price || product.basePrice,
        optionsPrice,
        totalPrice,
        quantity
      })
      
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
        productImage: mainImage?.src || null,
        customImage: customImage,
        customText: customTextString ? { text: customTextString } : undefined,
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
export default function ProductCard({ product }) {
  // Find the main image or fallback to first image
  const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
  
  const [imageSrc, setImageSrc] = useState(
    mainImage?.src || 'https://placehold.co/800x800?text=No+Image'
  )

  const handleImageError = () => {
    setImageSrc('https://placehold.co/800x800?text=No+Image')
  }

  const isLightbase = isLightbaseProduct(product)
  const isFeatured = isFeaturedProduct(product)
  const onSale = isOnSale(product)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-xl border border-gray-200 hover:border-[#72B01D] hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-64 bg-gray-50 overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* On Sale Badge */}
        {onSale && ( 
          <div className="absolute top-0 right-12 z-2">
            <span className="labelSale shadow-lg text-white bg-gradient-to-b text-sm from-amber-800 to-[#ce0000] tracking-wide text-white bg-[#ce0000] uppercase z-2">Sale</span> 
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute right-4 bottom-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide z-2">
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Featured</span>
          </div>
        )}
        
        {/* Lightbase Badge */}
        {isLightbase && (
          <div className="absolute top-3 left-3 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold z-2">
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            <span>Light Base</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm lg:text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#72B01D] transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.shortDescription || product.description}
        </p>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex flex-col">
            {onSale && (product.salePercent || product.salePrice) ? (
              <>
                <span className="text-2xl font-medium text-[var(--brand-400)]">
                  ${product.salePercent 
                    ? (product.basePrice * (1 - product.salePercent / 100)).toFixed(2)
                    : product.salePrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${product.basePrice?.toFixed(2) || '0.00'}
                </span>
              </>
            ) : (
              <span className="text-2xl font-medium text-[#72B01D]">
                ${product.basePrice?.toFixed(2) || '0.00'}
              </span>
            )}
          </div>

          {!isLightbase && (             
            <span className="text-sm font-medium text-[#72B01D] group-hover:text-[#5A8E17] transition-colors">
              Customize →
            </span>
          )}
          {isLightbase && (             
            <span
                type="button"
               // onClick={handleAddToCart}
                // disabled={addingToCart}
                className="cursor-pointer text-base font-medium text-[var(--brand-400)] hover:bg-[#5A8E17]focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/*{addingToCart ? 'Adding to cart...' : `Add to cart - $${calculateTotal().toFixed(2)}`}*/}
                Add to cart
              </span>
          )}
        </div>
      </div>
    </Link>
  )
}
