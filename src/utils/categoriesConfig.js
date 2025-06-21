// src/config/categoriesConfig.js
import { Heart, Gift, Gem, Flower2, PawPrint, GraduationCap, TreePine, Lightbulb } from 'lucide-react';

export const PRODUCT_CATEGORIES = [
  { 
    value: 'all',          // Internal value used for filtering
    label: 'All Products', // Display label shown to users
    path: '/products2',     // URL path
  },
  {
    value: 'lightbases',
    label: 'Light Bases',
    description: 'Illuminated bases for your crystal art',
    icon: Lightbulb,          // Lucide icon component
    path: '/products2/lightbases',
    image: '/img/categories/lightbases.jpg', // Default category image
  },
  {
    value: 'anniversary',
    label: 'Anniversary',
    description: 'Celebrate years of love and commitment',
    icon: Heart,          // Lucide icon component
    path: '/products2/anniversary',
    image: '/img/categories/anniversary.jpg', // Default category image
  },
  {
    value: 'weddings',
    label: 'Weddings',
    description: 'Capture magical wedding moments',
    icon: Gem,
    path: '/products2/weddings',
    image: '/img/categories/weddings.jpg',
  },
  {
    value: 'memorial',
    label: 'Memorial & Tribute',
    description: 'Honor and remember loved ones',
    icon: Flower2,
    path: '/products2/memorial',
    image: '/img/categories/memorial.jpg',
  },
  {
    value: 'pet',
    label: 'Pet Series',
    description: 'Preserve memories of beloved pets',
    icon: PawPrint,
    path: '/products2/pet',
    image: '/img/categories/pet.jpg',
  },
  {
    value: 'birthday',
    label: 'Birthday & Celebration',
    description: 'Mark special milestones',
    icon: Gift,
    path: '/products2/birthday',
    image: '/img/categories/birthday.jpg',
  },
  {
    value: 'christmas',
    label: 'Christmas',
    description: 'Have a joyful holiday',
    icon: TreePine,
    path: '/products2/christmas',
    image: '/img/categories/christmas.jpg',
  },
  {
    value: 'graduation',
    label: 'Graduation',
    description: 'Celebrate academic achievements',
    icon: GraduationCap,
    path: '/products2/graduation',
    image: '/img/categories/graduation.jpg',
  },
  {
    value: 'home-decor',
    label: 'Home Decor',
    description: 'A beautiful piece of art for your home',
    icon: GraduationCap,
    path: '/products2/home-decor',
    image: '/img/categories/home-decor.jpg',
  }
];

/**
 * Product type definitions for filtering
 * These help distinguish between different product types
 */
export const PRODUCT_TYPES = {
  CRYSTAL: 'crystal',
  LIGHTBASE: 'lightbase',
  ALL: 'all'
};

/**
 * Helper function to determine if a product is a lightbase
 * Based on product ID, name, or other characteristics
 */
export const isLightbaseProduct = (product) => {
  if (!product) return false;
  
  // Check if product ID is in known lightbase IDs from Cockpit3D catalog
  const lightbaseIds = ['105', '106', '107', '108', '119', '160', '252', '276', '279'];
  if (lightbaseIds.includes(product.id.toString())) {
    return true;
  }
  
  // Check if name contains lightbase keywords
  const name = product.name?.toLowerCase() || '';
  const lightbaseKeywords = [
    'lightbase', 'light base', 'led base', 'wooden base', 
    'rotating led', 'concave', 'ornament stand'
  ];
  
  return lightbaseKeywords.some(keyword => name.includes(keyword));
};

/**
 * Helper function to get category label from value
 */
export const getCategoryLabel = (value) => {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : value;
};

/**
 * Helper function to get all category values (excluding 'all')
 */
export const getCategoryValues = () => {
  return PRODUCT_CATEGORIES
    .filter(cat => cat.value !== 'all')
    .map(cat => cat.value);
};

/**
 * Helper function to get sorted categories
 */
export const getSortedCategories = () => {
  return [...PRODUCT_CATEGORIES].sort((a, b) => a.order - b.order);
};

/**
 * Helper function to get category by path
 */
export const getCategoryByPath = (path) => {
  return PRODUCT_CATEGORIES.find(cat => cat.path === path);
};

/**
 * Helper function to get category icon
 */
export const getCategoryIcon = (value) => {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category?.icon;
};