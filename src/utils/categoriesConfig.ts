// src/utils/categoriesConfig.ts
// Categories configuration for Crystal Keepsakes products

export const PRODUCT_CATEGORIES = [
  {
    value: 'all',
    label: 'All Products',
    path: '/products',
  },
  {
    value: 'sale',
    label: 'On Sale',
    description: 'Special Deals',
    path: '/products?category=sale',
  },
  {
    value: 'featured',
    label: 'Featured',
    description: 'Our most popular crystal designs',
    path: '/products?category=featured',
  },
  {
    value: 'lightbases',
    label: 'Light Bases',
    description: 'Illuminated bases for your crystal art',
    path: '/products?category=lightbases',
  },
  {
    value: '3d-crystals',
    label: '3D Crystals',
    description: 'Premium 3D laser-engraved crystals',
    path: '/products?category=3d-crystals',
  },
  {
    value: '2d-crystals',
    label: '2D Crystals',
    description: 'Beautiful 2D engraved crystals',
    path: '/products?category=2d-crystals',
  },
  {
    value: 'keychains-necklaces',
    label: 'Keychains & Necklaces',
    description: 'Portable crystal keepsakes',
    path: '/products?category=keychains-necklaces',
  },
  {
    value: 'ornaments',
    label: 'Ornaments',
    description: 'Crystal ornaments for special occasions',
    path: '/products?category=ornaments',
  },
  {
    value: 'heart-shapes',
    label: 'Heart Shapes',
    description: 'Heart-shaped crystal designs',
    path: '/products?category=heart-shapes',
  },
  {
    value: 'memorial',
    label: 'Memorial & Tribute',
    description: 'Honor and remember loved ones',
    path: '/products?category=memorial',
  },
  {
    value: 'pet',
    label: 'Pet Series',
    description: 'Preserve memories of beloved pets',
    path: '/products?category=pet',
  },
  {
    value: 'custom',
    label: 'Custom Projects',
    description: 'Unique laser engraving and custom creations',
    path: '/products?category=custom',
  },
];

/**
 * Product type definitions for filtering
 */
export const PRODUCT_TYPES = {
  CRYSTAL: 'crystal',
  LIGHTBASE: 'lightbase',
  ACCESSORY: 'accessory',
  FEATURED: 'featured',
  SALE: 'sale',
  ALL: 'all'
};

/**
 * Helper function to determine if a product is a lightbase
 * Based on product ID, name, or other characteristics
 * FIXED: Excludes Ornament Stand (ID 279) which is an accessory, not a lightbase
 */
export const isLightbaseProduct = (product: any): boolean => {
  if (!product) return false;

  // Known lightbase IDs from Cockpit3D catalog
  // NOTE: ID 279 (Ornament Stand) is EXCLUDED - it's an accessory, not a lightbase
  const lightbaseIds = ['105', '106', '107', '108', '119', '160', '252', '276'];
  
  if (lightbaseIds.includes(product.id.toString())) {
    return true;
  }

  // Check if name contains lightbase keywords (but not ornament stand)
  const name = product.name?.toLowerCase() || '';
  
  // Explicit exclusion for ornament stand
  if (name.includes('ornament stand')) {
    return false;
  }

  const lightbaseKeywords = [
    'lightbase', 'light base', 'led base', 'wooden base',
    'rotating led', 'concave lightbase'
  ];

  return lightbaseKeywords.some(keyword => name.includes(keyword));
};

/**
 * Helper function to determine if a product is featured
 */
export const isFeaturedProduct = (product: any): boolean => {
  return product?.featured === true;
};

/**
 * Helper function to determine if a product is on Sale
 */
export const isOnSale = (product: any): boolean => {
  return product?.sale === true;
};

/**
 * Helper function to determine if a product is a keychain or necklace
 */
export const isKeychainOrNecklace = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  return name.includes('keychain') || name.includes('necklace') || name.includes('bracelet');
};

/**
 * Helper function to determine if a product is an ornament
 */
export const isOrnament = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  return name.includes('ornament') || (product.id === '279'); // Ornament Stand is an ornament accessory
};

/**
 * Helper function to determine if a product is heart-shaped
 */
export const isHeartShape = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  return name.includes('heart');
};

/**
 * Helper function to determine if a product is 3D crystal
 */
export const is3DCrystal = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  
  // Exclude lightbases and accessories
  if (isLightbaseProduct(product) || isOrnament(product)) {
    return false;
  }
  
  return name.includes('3d') || 
         name.includes('ball') || 
         name.includes('dome') ||
         name.includes('monument') ||
         name.includes('prestige');
};

/**
 * Helper function to determine if a product is 2D crystal
 */
export const is2DCrystal = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  
  // Exclude lightbases and accessories
  if (isLightbaseProduct(product) || isOrnament(product)) {
    return false;
  }
  
  return name.includes('2d') || name.includes('plaque');
};

/**
 * Helper function to determine if a product is pet-related
 */
export const isPetProduct = (product: any): boolean => {
  if (!product) return false;
  const name = product.name?.toLowerCase() || '';
  return name.includes('pet') || 
         name.includes('dog') || 
         name.includes('cat') || 
         name.includes('paw');
};

/**
 * Helper function to get product categories
 * Returns an array of category values that apply to the product
 */
export const getProductCategories = (product: any): string[] => {
  if (!product) return [];
  
  const categories: string[] = [];
  
  if (isFeaturedProduct(product)) categories.push('featured');
  if (isLightbaseProduct(product)) categories.push('lightbases');
  if (is3DCrystal(product)) categories.push('3d-crystals');
  if (is2DCrystal(product)) categories.push('2d-crystals');
  if (isKeychainOrNecklace(product)) categories.push('keychains-necklaces');
  if (isOrnament(product)) categories.push('ornaments');
  if (isHeartShape(product)) categories.push('heart-shapes');
  if (isPetProduct(product)) categories.push('pet');
  
  return categories;
};

/**
 * Helper function to get category label from value
 */
export const getCategoryLabel = (value: string): string => {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : value;
};

/**
 * Helper function to get all category values (excluding 'all')
 */
export const getCategoryValues = (): string[] => {
  return PRODUCT_CATEGORIES
    .filter(cat => cat.value !== 'all')
    .map(cat => cat.value);
};

/**
 * Helper function to filter products by category
 */
export const filterProductsByCategory = (products: any[], categoryValue: string): any[] => {
  if (!products || products.length === 0) return [];
  if (categoryValue === 'all') return products;
  
  return products.filter(product => {
    const productCategories = getProductCategories(product);
    return productCategories.includes(categoryValue);
  });
};
