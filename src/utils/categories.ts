// utils/categoriesConfig.ts

export const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'hearts', label: 'Hearts' },
  { value: 'rectangles', label: 'Rectangles' },
  { value: 'squares', label: 'Squares' },
  { value: 'circles', label: 'Circles' },
  { value: 'keychains', label: 'Keychains' },
  { value: 'lightbases', label: 'Light Bases' },
  { value: 'memorial', label: 'Memorial' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'pet', label: 'Pet Memorial' },
  { value: 'family', label: 'Family' }
]

export const PRODUCT_TYPES = {
  ALL: 'all',
  CRYSTAL: 'crystal',
  LIGHTBASE: 'lightbase'
} as const

export type ProductType = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES]

// Helper function to detect if a product is a light base
export function isLightbaseProduct(product: any): boolean {
  if (!product) return false
  
  return (
    product.categories?.includes('lightbases') ||
    product.name?.toLowerCase().includes('light base') ||
    product.name?.toLowerCase().includes('lightbase') ||
    product.slug?.includes('light-base')
  )
}

// Helper function to get category label from value
export function getCategoryLabel(value: string): string {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value)
  return category?.label || value
}

// Helper to validate category value
export function isValidCategory(value: string): boolean {
  return PRODUCT_CATEGORIES.some(cat => cat.value === value)
}