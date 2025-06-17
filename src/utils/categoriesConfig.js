// src/config/categoriesConfig.js
import { Heart, Gift, Gem, Flower2, PawPrint, GraduationCap, TreePine } from 'lucide-react';

/**
 * Shared category definitions for the application
 * Used across product listings, filters, and navigation
 */
export const PRODUCT_CATEGORIES = [
  { 
    value: 'all',          // Internal value used for filtering
    label: 'All Products', // Display label shown to users
    path: '/products',     // URL path
  },
  {
    value: 'accessories',
    label: 'Accessories',
    description: 'Light bases for your crystal art',
    icon: Heart,          // Lucide icon component
    path: '/products/accessories',
    image: '/img/categories/accessories.jpg', // Default category image
  },
  {
    value: 'anniversary',
    label: 'Anniversary',
    description: 'Celebrate years of love and commitment',
    icon: Heart,          // Lucide icon component
    path: '/products/anniversary',
    image: '/img/categories/anniversary.jpg', // Default category image
  },
  {
    value: 'weddings',
    label: 'Weddings',
    description: 'Capture magical wedding moments',
    icon: Gem,
    path: '/products/weddings',
    image: '/img/categories/weddings.jpg',
  },
  {
    value: 'memorial',
    label: 'Memorial & Tribute',
    description: 'Honor and remember loved ones',
    icon: Flower2,
    path: '/products/memorial',
    image: '/img/categories/memorial.jpg',
  },
  {
    value: 'pet',
    label: 'Pet Series',
    description: 'Preserve memories of beloved pets',
    icon: PawPrint,
    path: '/products/pet',
    image: '/img/categories/pet.jpg',
  },
  {
    value: 'birthday',
    label: 'Birthday & Celebration',
    description: 'Mark special milestones',
    icon: Gift,
    path: '/products/birthday',
    image: '/img/categories/birthday.jpg',
  },
  {
    value: 'christmas',
    label: 'Christmas',
    description: 'Have a joyful holiday',
    icon: TreePine,
    path: '/products/christmas',
    image: '/img/categories/christmas.jpg',
  },
  {
    value: 'graduation',
    label: 'Graduation',
    description: 'Celebrate academic achievements',
    icon: GraduationCap,
    path: '/products/graduation',
    image: '/img/categories/graduation.jpg',
  },
  {
    value: 'home-decor',
    label: 'Home Decor',
    description: 'A beautiful piece  of art for your home',
    icon: GraduationCap,
    path: '/products/home-decor',
    image: '/img/categories/home-decor.jpg',
  }
];

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