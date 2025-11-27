// src/utils/pricingUtils.ts
// Centralized pricing logic for Crystal Keepsakes products
// Single source of truth for all price calculations

import { isOnSale } from './categoriesConfig'

/**
 * Price information interface
 */
export interface PriceInfo {
  min: number
  max: number
  originalMin: number
  originalMax: number
  hasRange: boolean
  discount?: number
  discountPercent?: number
}

/**
 * Calculate display price for a product (for product cards and listings)
 * Handles both single-price products and products with size variations
 * 
 * @param product - The product object
 * @returns PriceInfo object with min/max prices and sale information
 */
export function getDisplayPrice(product: any): PriceInfo {
  const onSale = isOnSale(product)
  
  // If product has sizes, show the price range
  if (product.sizes && product.sizes.length > 0) {
    const prices = product.sizes
      .filter((s: any) => s.enabled !== false)
      .map((s: any) => s.price)
    
    if (prices.length === 0) {
      return { 
        min: product.basePrice, 
        max: product.basePrice, 
        originalMin: product.basePrice,
        originalMax: product.basePrice,
        hasRange: false 
      }
    }
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    
    // Apply sale discount if applicable
    if (onSale) {
      // Priority 1: Fixed dollar discount (subtract from each size)
      if (product.salePrice && product.salePrice > 0) {
        const discountedMin = Math.max(0, minPrice - product.salePrice)
        const discountedMax = Math.max(0, maxPrice - product.salePrice)
        
        return {
          min: discountedMin,
          max: discountedMax,
          originalMin: minPrice,
          originalMax: maxPrice,
          hasRange: minPrice !== maxPrice,
          discount: product.salePrice,
          discountPercent: Math.round((product.salePrice / minPrice) * 100)
        }
      }
      
      // Priority 2: Percentage discount
      if (product.salePercent && product.salePercent > 0) {
        return {
          min: minPrice * (1 - product.salePercent / 100),
          max: maxPrice * (1 - product.salePercent / 100),
          originalMin: minPrice,
          originalMax: maxPrice,
          hasRange: minPrice !== maxPrice,
          discountPercent: product.salePercent
        }
      }
    }
    
    return { 
      min: minPrice, 
      max: maxPrice, 
      originalMin: minPrice, 
      originalMax: maxPrice, 
      hasRange: minPrice !== maxPrice 
    }
  }
  
  // Single price product (no sizes) - salePrice is FINAL price
  const base = product.basePrice || 0
  
  if (onSale) {
    // Priority 1: Fixed sale price (final price for no-size products)
    if (product.salePrice && product.salePrice > 0) {
      return { 
        min: product.salePrice, 
        max: product.salePrice, 
        originalMin: base, 
        originalMax: base, 
        hasRange: false,
        discount: base - product.salePrice,
        discountPercent: Math.round(((base - product.salePrice) / base) * 100)
      }
    }
    
    // Priority 2: Percentage discount
    if (product.salePercent && product.salePercent > 0) {
      const discountedPrice = base * (1 - product.salePercent / 100)
      return { 
        min: discountedPrice, 
        max: discountedPrice, 
        originalMin: base, 
        originalMax: base, 
        hasRange: false,
        discountPercent: product.salePercent,
        discount: base - discountedPrice
      }
    }
  }
  
  return { 
    min: base, 
    max: base, 
    originalMin: base, 
    originalMax: base, 
    hasRange: false 
  }
}

/**
 * Calculate total price for a product with selected options
 * Used in product detail page when adding to cart
 * 
 * @param product - The product object
 * @param selectedSize - The selected size object
 * @param optionsPrice - Additional price from selected options
 * @param quantity - Quantity to purchase
 * @returns Total price after all calculations
 */
export function calculateTotal(
  product: any,
  selectedSize: any | null,
  optionsPrice: number = 0,
  quantity: number = 1
): number {
  // Get the base price from selected size or product basePrice
  let basePrice = selectedSize?.price || product?.basePrice || 0
  const onSale = isOnSale(product)
  
  // Apply sale discount if product is on sale
  if (onSale) {
    // Priority 1: Fixed dollar discount
    if (product?.salePrice && product.salePrice > 0) {
      // For products WITH sizes: salePrice is discount amount (subtract)
      // For products WITHOUT sizes: salePrice is final price
      if (product.sizes && product.sizes.length > 0) {
        basePrice = Math.max(0, basePrice - product.salePrice)
      } else {
        basePrice = product.salePrice
      }
    } 
    // Priority 2: Percentage discount
    else if (product?.salePercent && product.salePercent > 0) {
      basePrice = basePrice * (1 - product.salePercent / 100)
    }
  }
  
  // Add options price and multiply by quantity
  const total = (basePrice + optionsPrice) * quantity
  return Number(total.toFixed(2))
}

/**
 * Calculate the options price from selected options
 * Used in product detail page
 * 
 * @param selectedLightBase - Selected light base object
 * @param selectedBackground - Selected background object
 * @param selectedTextOption - Selected text option object
 * @param showCustomText - Whether custom text is enabled
 * @param textOptions - Array of available text options
 * @returns Total options price
 */
export function calculateOptionsPrice(
  selectedLightBase: any | null,
  selectedBackground: any | null,
  selectedTextOption: any | null,
  showCustomText: boolean = false,
  textOptions: any[] = []
): number {
  let optionsPrice = 0
  
  if (selectedLightBase?.price) {
    optionsPrice += selectedLightBase.price
  }
  
  if (selectedBackground?.price) {
    optionsPrice += selectedBackground.price
  }
  
  if (selectedTextOption?.price) {
    optionsPrice += selectedTextOption.price
  }
  
  // Add custom text price if enabled
  if (showCustomText && textOptions && textOptions.length > 0) {
    const textOption = textOptions.find(t => t.price > 0) || textOptions[1]
    if (textOption?.price) {
      optionsPrice += textOption.price
    }
  }
  
  return optionsPrice
}

/**
 * Get sale information for display
 * 
 * @param product - The product object
 * @param currentPrice - The current calculated price
 * @param originalPrice - The original price before discount
 * @returns Sale information object
 */
export function getSaleInfo(product: any, currentPrice: number, originalPrice: number) {
  const onSale = isOnSale(product)
  
  if (!onSale) {
    return {
      isOnSale: false,
      discountAmount: 0,
      discountPercent: 0,
      savedAmount: 0
    }
  }
  
  const savedAmount = originalPrice - currentPrice
  const discountPercent = originalPrice > 0 
    ? Math.round((savedAmount / originalPrice) * 100)
    : 0
  
  return {
    isOnSale: true,
    discountAmount: savedAmount,
    discountPercent: discountPercent,
    savedAmount: savedAmount,
    salePrice: product.salePrice,
    salePercent: product.salePercent
  }
}

/**
 * Format price for display
 * 
 * @param price - The price number
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`
}

/**
 * Get price range display text
 * 
 * @param priceInfo - PriceInfo object
 * @returns Formatted price range string
 */
export function getPriceRangeText(priceInfo: PriceInfo): string {
  if (!priceInfo.hasRange || priceInfo.min === priceInfo.max) {
    return formatPrice(priceInfo.min)
  }
  
  return `${formatPrice(priceInfo.min)} - ${formatPrice(priceInfo.max)}`
}
