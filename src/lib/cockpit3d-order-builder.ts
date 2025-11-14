// lib/cockpit3d-order-builder.ts
// Version: 1.0.0 - 2025-01-15
// Builds properly formatted orders for Cockpit3D API

import type { OrderLineItem, CustomerInfo, Order } from '@/types/orderTypes'
import { logger } from '@/utils/logger'

// Cockpit3D API structure
export interface Cockpit3DOrderItem {
  sku: string
  qty: string
  client_item_id: string
  original_photo?: string
  cropped_photo?: string
  special_instructions?: string
  options: Array<{
    id: string
    qty?: string
    value?: string | string[]
  }>
  price: number
}

export interface Cockpit3DOrder {
  retailer_id: string
  order_id: string
  address: {
    email: string
    firstname: string
    lastname: string
    telephone: string
    region: string
    country: string
    street: string
    city: string
    postcode: string
    shipping_method: string
    destination: string
    staff_user?: string
  }
  billing_address?: {
    email: string
    firstname: string
    lastname: string
    telephone: string
    region: string
    country: string
    street: string
    city: string
    postcode: string
  }
  items: Cockpit3DOrderItem[]
  total?: number
  subtotal?: number
}

/**
 * Map internal option categories to Cockpit3D option IDs
 * These need to be obtained from your Cockpit3D catalog
 */
const OPTION_ID_MAP: Record<string, string> = {
  // Background options
  'background_rm': '154',  // Remove Backdrop
  'background_2d': '154',  // 2D Backdrop
  'background_3d': '155',  // 3D Backdrop
  
  // Text options
  'text_none': '198',      // No Text
  'text_custom': '199',    // Custom Text
  
  // These will be dynamically mapped from product data
  'lightBase': 'lightBase',
  'size': 'size',
}

/**
 * Build a Cockpit3D order from cart items and customer info
 */
export function buildCockpit3DOrder(
  orderNumber: string,
  cartItems: any[],
  customer?: CustomerInfo,
  retailerId?: string
): Cockpit3DOrder {
  console.log('🏗️ [COCKPIT3D BUILDER] Starting order build')
  console.log('🏗️ [COCKPIT3D BUILDER] Input:', {
    orderNumber,
    itemCount: cartItems.length,
    hasCustomer: !!customer,
    retailerId
  })
  
  logger.info('Building Cockpit3D order', {
    orderNumber,
    itemCount: cartItems.length,
    hasCustomer: !!customer
  })

  // Build items array
  console.log('🏗️ [COCKPIT3D BUILDER] Processing cart items...')
  const items: Cockpit3DOrderItem[] = cartItems.map((item, index) => {
    console.log(`🏗️ [COCKPIT3D BUILDER] Processing item ${index + 1}/${cartItems.length}:`, {
      name: item.name,
      sku: item.sku,
      cockpit3d_id: item.cockpit3d_id,
      quantity: item.quantity
    })
    const orderItem = buildCockpit3DOrderItem(item, index)
    console.log(`🏗️ [COCKPIT3D BUILDER] Built order item ${index + 1}:`, JSON.stringify(orderItem, null, 2))
    return orderItem
  })

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.price || item.totalPrice || 0
    return sum + (itemPrice * item.quantity)
  }, 0)

  // Build address from customer info or use defaults
  const shippingAddress = customer?.shippingAddress || {
    street1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  }

  const billingAddress = customer?.billingAddress || customer?.shippingAddress

  const order: Cockpit3DOrder = {
    retailer_id: retailerId || process.env.COCKPIT3D_RETAIL_ID || process.env.NEXT_PUBLIC_COCKPIT3D_SHOP_ID || '256568874',
    order_id: orderNumber,
    address: {
      email: customer?.email || '',
      firstname: customer?.firstName || '',
      lastname: customer?.lastName || '',
      telephone: customer?.phone || '',
      region: shippingAddress.state,
      country: shippingAddress.country,
      street: shippingAddress.street1 + (shippingAddress.street2 ? '\n' + shippingAddress.street2 : ''),
      city: shippingAddress.city,
      postcode: shippingAddress.zipCode,
      shipping_method: 'air',
      destination: 'customer_home',
      staff_user: 'Web Order'
    },
    items,
    subtotal,
    total: subtotal
  }

  // Add billing address if different from shipping
  if (billingAddress && billingAddress !== shippingAddress) {
    order.billing_address = {
      email: customer?.email || '',
      firstname: customer?.firstName || '',
      lastname: customer?.lastName || '',
      telephone: customer?.phone || '',
      region: billingAddress.state,
      country: billingAddress.country,
      street: billingAddress.street1 + (billingAddress.street2 ? '\n' + billingAddress.street2 : ''),
      city: billingAddress.city,
      postcode: billingAddress.zipCode
    }
  }

  logger.success('Cockpit3D order built', {
    orderNumber,
    itemCount: items.length,
    total: subtotal
  })

  return order
}

/**
 * Build a single Cockpit3D order item from cart item
 */
function buildCockpit3DOrderItem(item: any, index: number): Cockpit3DOrderItem {
  const clientItemId = `${item.productId || item.cockpit3d_id}-${index + 1}`
  
  // Build options array in Cockpit3D format
  const options = buildCockpit3DOptions(item)

  const orderItem: Cockpit3DOrderItem = {
    sku: item.sku,
    qty: String(item.quantity),
    client_item_id: clientItemId,
    options,
    price: item.price || item.totalPrice || item.basePrice || 0
  }

  // Add custom image URLs if present
  // Note: Images need to be uploaded to accessible URL first
  if (item.customImageId) {
    // Placeholder - actual implementation needs image upload
    orderItem.special_instructions = `Custom image ID: ${item.customImageId}`
    // TODO: Upload image and set original_photo and cropped_photo URLs
  }

  // Add custom text as special instructions
  const customTextValue = getCustomTextValue(item)
  if (customTextValue) {
    const textLines = Array.isArray(customTextValue) ? customTextValue : [customTextValue]
    const textFormatted = textLines.map((line, idx) => `Line ${idx + 1}: ${line}`).join(', ')
    
    orderItem.special_instructions = (orderItem.special_instructions || '') + 
      `\nCustom Text: ${textFormatted}`
  }

  return orderItem
}

/**
 * Build Cockpit3D options array from cart item options
 */
function buildCockpit3DOptions(item: any): Array<{
  id: string
  qty?: string
  value?: string | string[]
}> {
  const options: Array<{ id: string; qty?: string; value?: string | string[] }> = []

  // Handle size option
  if (item.sizeDetails || item.size) {
    const sizeDetails = item.sizeDetails || item.size
    const sizeId = sizeDetails.sizeId || sizeDetails.id
    const cockpit3dSizeId = sizeDetails.cockpit3d_id || sizeId
    
    if (cockpit3dSizeId) {
      options.push({
        id: String(cockpit3dSizeId),
        qty: '1'
      })
    }
  }

  // Handle options array (new format from ProductDetailClient)
  if (Array.isArray(item.options)) {
    item.options.forEach((opt: any) => {
      // Skip custom text - handle separately
      if (opt.category === 'customText') {
        // Custom text is added to special_instructions
        return
      }

      // Get Cockpit3D option ID
      const optionId = opt.cockpit3d_option_id || opt.optionId || opt.id
      
      if (optionId) {
        options.push({
          id: String(optionId),
          qty: '1',
          value: opt.value
        })
      }
    })
  }
  // Handle old flat options object
  else if (item.options && typeof item.options === 'object') {
    // Background
    if (item.options.background) {
      const bgValue = typeof item.options.background === 'string' 
        ? item.options.background 
        : item.options.background.name || item.options.background.id
      
      const bgOptionId = OPTION_ID_MAP[`background_${bgValue.toLowerCase()}`]
      if (bgOptionId) {
        options.push({ id: bgOptionId, qty: '1' })
      }
    }

    // Light Base
    if (item.options.lightBase && item.options.lightBase !== 'none') {
      const lbValue = typeof item.options.lightBase === 'string'
        ? item.options.lightBase
        : item.options.lightBase.name || item.options.lightBase.id
      
      // Use cockpit3d_id if available
      const lbId = item.options.lightBase.cockpit3d_id || lbValue
      options.push({ id: String(lbId), qty: '1' })
    }
  }

  // Handle custom text
  const customTextValue = getCustomTextValue(item)
  if (customTextValue) {
    const textOptionId = OPTION_ID_MAP['text_custom']
    options.push({
      id: textOptionId,
      value: Array.isArray(customTextValue) ? customTextValue : [customTextValue]
    })
  }

  return options
}

/**
 * Extract custom text value from various formats
 */
function getCustomTextValue(item: any): string | string[] | null {
  // Check customText object
  if (item.customText) {
    if (typeof item.customText === 'string') {
      return item.customText
    }
    if (item.customText.text) {
      // Split by newline for multi-line text
      return item.customText.text.split('\n').filter(Boolean)
    }
  }

  // Check options.customText
  if (item.options?.customText) {
    if (typeof item.options.customText === 'string') {
      return item.options.customText
    }
    if (item.options.customText.line1 || item.options.customText.line2) {
      return [
        item.options.customText.line1,
        item.options.customText.line2
      ].filter(Boolean)
    }
  }

  // Check options array for customText category
  if (Array.isArray(item.options)) {
    const textOption = item.options.find((opt: any) => opt.category === 'customText')
    
    if (textOption) {
      // New format: line1 and line2 as separate properties
      if (textOption.line1 || textOption.line2) {
        return [textOption.line1, textOption.line2].filter(Boolean)
      }
      // Old format: single value string
      if (textOption.value) {
        return textOption.value
      }
    }
  }

  return null
}

/**
 * Validate Cockpit3D order before submission
 */
export function validateCockpit3DOrder(order: Cockpit3DOrder): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!order.retailer_id) errors.push('Missing retailer_id')
  if (!order.order_id) errors.push('Missing order_id')
  if (!order.address) errors.push('Missing address')
  if (!order.items || order.items.length === 0) errors.push('No items in order')

  // Validate address
  if (order.address) {
    if (!order.address.email) errors.push('Missing email in address')
    if (!order.address.firstname) errors.push('Missing firstname in address')
    if (!order.address.lastname) errors.push('Missing lastname in address')
  }

  // Validate items
  order.items.forEach((item, index) => {
    if (!item.sku) errors.push(`Item ${index + 1}: Missing SKU`)
    if (!item.qty) errors.push(`Item ${index + 1}: Missing quantity`)
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
