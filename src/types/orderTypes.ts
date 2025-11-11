// types/orderTypes.ts
// Version: 2.0.0 | Date: 2025-01-03
// Clean order structure for Crystal Keepsakes e-commerce
// Integrates with Cockpit3D API and Stripe payments

/**
 * Custom Image Data
 * Stores user-uploaded/edited images for product customization
 */
export interface CustomImage {
  dataUrl: string              // Masked/compressed for Cockpit3D
  originalDataUrl?: string     // ✅ ADD: Original uploaded for display
  filename: string
  mimeType: string
  fileSize: number
  width: number
  height: number
  processedAt: string
  maskId?: string
  maskName?: string
  fullResId?: string
}

/**
 * Product Size Details from Cockpit3D
 */
export interface SizeDetails {
  sizeId: string
  sizeName: string
  length?: number
  width?: number
  height?: number
  unit?: 'inches' | 'cm' | 'mm'
  basePrice: number
}

/**
 * Product Option (e.g., engraving style, base type, lighting)
 */
export interface ProductOption {
  category: string
  optionId: string
  name: string
  value: string
  priceModifier: number
  skuSuffix?: string
}

/**
 * Line Item - Individual product in cart/order
 */
export interface OrderLineItem {
  lineItemId: string
  productId: string
  cockpit3d_id: string
  name: string
  sku: string
  basePrice: number
  optionsPrice: number
  totalPrice: number
  quantity: number
  size: SizeDetails
  options: ProductOption[]
  customImage?: CustomImage
  customText?: {
    text: string
    font?: string
    maxCharacters?: number
  }
  dateAdded: string
  lastModified: string
}

/**
 * Customer Information
 */
export interface CustomerInfo {
  email: string
  phone?: string
  firstName: string
  lastName: string
  shippingAddress: {
    street1: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress?: {
    street1: string
    street2?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  orderNotes?: string
}

/**
 * Payment Information
 */
export interface PaymentInfo {
  paymentIntentId: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  amountTotal: number
  amountSubtotal: number
  amountShipping: number
  amountTax: number
  currency: string
  paymentMethod?: 'card' | 'paypal' | 'other'
  last4?: string
  brand?: string
  createdAt: string
  paidAt?: string
}

/**
 * Complete Order Structure
 */
export interface Order {
  orderId: string
  cockpit3dOrderId?: string
  status: 'cart' | 'checkout' | 'payment_pending' | 'processing' | 'shipped' | 'delivered' | 'canceled'
  lineItems: OrderLineItem[]
  customer?: CustomerInfo
  payment?: PaymentInfo
  pricing: {
    subtotal: number
    shipping: number
    tax: number
    discount: number
    total: number
  }
  tracking?: {
    carrier?: string
    trackingNumber?: string
    estimatedDelivery?: string
    shippedAt?: string
  }
  createdAt: string
  updatedAt: string
  submittedAt?: string
  notes?: string
  flags?: {
    hasCustomImages: boolean
    requiresApproval: boolean
    isTestOrder: boolean
  }
}

/**
 * Shopping Cart
 */
export interface ShoppingCart {
  items: OrderLineItem[]
  itemCount: number
  subtotal: number
  estimatedShipping: number
  estimatedTax: number
  estimatedTotal: number
  lastUpdated: string
}

/**
 * Helper function to create a new line item
 */
export function createLineItem(
  product: {
    productId: string
    cockpit3d_id: string
    name: string
    sku: string
  },
  size: SizeDetails,
  options: ProductOption[],
  quantity: number = 1,
  customImage?: CustomImage,
  customText?: string
): OrderLineItem {
  const optionsPrice = options.reduce((sum, opt) => sum + opt.priceModifier, 0)
  const totalPrice = (size.basePrice + optionsPrice) * quantity
  
  const now = new Date().toISOString()
  
  return {
    lineItemId: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productId: product.productId,
    cockpit3d_id: product.cockpit3d_id,
    name: product.name,
    sku: product.sku,
    basePrice: size.basePrice,
    optionsPrice,
    totalPrice,
    quantity,
    size,
    options,
    customImage,
    customText: customText ? { text: customText } : undefined,
    dateAdded: now,
    lastModified: now
  }
}

/**
 * Helper function to calculate cart totals
 */
export function calculateCartTotals(items: OrderLineItem[]): {
  subtotal: number
  itemCount: number
} {
  return {
    subtotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
  }
}

/**
 * Validation helper
 */
export function validateLineItem(item: OrderLineItem): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!item.productId) errors.push('Missing product ID')
  if (!item.cockpit3d_id) errors.push('Missing Cockpit3D ID')
  if (!item.size) errors.push('Missing size selection')
  if (item.quantity < 1) errors.push('Quantity must be at least 1')
  if (item.totalPrice < 0) errors.push('Invalid price')
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Helper to create CustomImage object from ImageEditor output
 */
export function createCustomImage(
  dataUrl: string,
  filename: string,
  maskId?: string,
  maskName?: string
): CustomImage {
  // Parse image dimensions from data URL
  const img = new Image()
  img.src = dataUrl
  
  // Calculate file size from base64
  const base64Data = dataUrl.split(',')[1]
  const fileSize = Math.ceil((base64Data.length * 3) / 4)
  
  // Extract MIME type
  const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0]
  
  return {
    dataUrl,
    filename,
    mimeType,
    fileSize,
    width: img.naturalWidth || 0,
    height: img.naturalHeight || 0,
    processedAt: new Date().toISOString(),
    maskId,
    maskName
  }
}