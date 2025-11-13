// lib/cockpit3d-pricing-map.ts
// Version: 1.0.0 | Date: 2025-10-23
// Temporary pricing map until API provides real prices

/**
 * TEMPORARY SOLUTION
 * This maps Cockpit3D option IDs to prices
 * Update these prices from your Cockpit3D dashboard or when API provides them
 */

export interface PricingRule {
  id: string
  name: string
  price: number
  type: 'fixed' | 'multiplier' | 'percentage'
}

// Size pricing (these affect base product price)
export const SIZE_PRICING: Record<string, PricingRule> = {
  // Cut Corner Diamond sizes
  '202': { id: '202', name: 'Cut Corner Diamond (5x5cm)', price: 70, type: 'fixed' },
  '549': { id: '549', name: 'Cut Corner Diamond (6x6cm)', price: 85, type: 'fixed' },
  '550': { id: '550', name: 'Cut Corner Diamond (8x8cm)', price: 110, type: 'fixed' },
  
  // Add more sizes as needed...
}

// Add-on pricing (these add to the total)
export const ADDON_PRICING: Record<string, PricingRule> = {
  // Light bases
  '207': { id: '207', name: 'Lightbase Rectangle', price: 25, type: 'fixed' },
  '476': { id: '476', name: 'Rotating LED Lightbase', price: 35, type: 'fixed' },
  '857': { id: '857', name: 'Wooden Premium Base Mini', price: 20, type: 'fixed' },
  '206': { id: '206', name: 'Lightbase Square', price: 25, type: 'fixed' },
  
  // Service queue
  '381': { id: '381', name: 'Red Carpet 24 hour service', price: 50, type: 'fixed' },
  '212': { id: '212', name: 'Jump the Queue 48 hour service', price: 25, type: 'fixed' },
  
  // 3D Pop-up cards
  '1437': { id: '1437', name: '3D Flower Heart Pop Card', price: 8, type: 'fixed' },
  '1438': { id: '1438', name: '3D #1 Best Dad Pop Card', price: 8, type: 'fixed' },
  '1439': { id: '1439', name: '3D Birthday Celebration Pop Card', price: 8, type: 'fixed' },
  '1440': { id: '1440', name: '3D Thank You Mom Pop Card', price: 8, type: 'fixed' },
  '1518': { id: '1518', name: '3D Happy Holidays Pop Card', price: 8, type: 'fixed' },
  '1519': { id: '1519', name: '3D Christmas Tree Pop Card', price: 8, type: 'fixed' },
  
  // Add more add-ons as needed...
}

// Backdrop pricing
export const BACKDROP_PRICING: Record<string, PricingRule> = {
  '154': { id: '154', name: '2D Backdrop', price: 15, type: 'fixed' },
  '155': { id: '155', name: '3D Backdrop', price: 25, type: 'fixed' },
}

/**
 * Get price for a specific option by ID
 */
export function getOptionPrice(optionId: string): number {
  // Check size pricing first
  if (SIZE_PRICING[optionId]) {
    return SIZE_PRICING[optionId].price
  }
  
  // Check add-on pricing
  if (ADDON_PRICING[optionId]) {
    return ADDON_PRICING[optionId].price
  }
  
  // Check backdrop pricing
  if (BACKDROP_PRICING[optionId]) {
    return BACKDROP_PRICING[optionId].price
  }
  
  // Not found - log warning
  console.warn(`⚠️ No price found for option ID: ${optionId}`)
  return 0
}

/**
 * Calculate total price for a product with options
 */
export function calculateProductPrice(
  basePrice: number,
  selectedOptions: Array<{ id: string; qty?: number }>
): number {
  let total = basePrice
  
  for (const option of selectedOptions) {
    const optionPrice = getOptionPrice(option.id)
    const quantity = option.qty || 1
    
    const pricing = SIZE_PRICING[option.id] || ADDON_PRICING[option.id] || BACKDROP_PRICING[option.id]
    
    if (pricing) {
      if (pricing.type === 'fixed') {
        // For size options, replace base price
        if (SIZE_PRICING[option.id]) {
          total = optionPrice
        } else {
          // For add-ons, multiply by quantity
          total += optionPrice * quantity
        }
      }
    }
  }
  
  return total
}

/**
 * Get pricing info for display
 */
export function getPricingInfo(optionId: string): PricingRule | null {
  return SIZE_PRICING[optionId] || ADDON_PRICING[optionId] || BACKDROP_PRICING[optionId] || null
}

/**
 * Check if option changes quantity/pricing
 */
export function isQuantityOption(optionId: string): boolean {
  const pricing = getPricingInfo(optionId)
  return pricing !== null && !SIZE_PRICING[optionId]
}

// Example usage:
/*
const cartItem = {
  basePrice: 70,
  selectedOptions: [
    { id: '549', qty: 1 },  // 6x6cm size = $85 (replaces base)
    { id: '207', qty: 2 },  // 2x Rectangle lightbase = $50
    { id: '1437', qty: 1 }  // 1x Pop card = $8
  ]
}

const total = calculateProductPrice(cartItem.basePrice, cartItem.selectedOptions)
console.log(total) // $143 (85 + 50 + 8)
*/