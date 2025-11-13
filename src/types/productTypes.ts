// Product Types with Multi-Image Support
// Extended from existing product schema

export interface ProductImage {
  src: string;
  isMain: boolean;
  alt?: string;
  caption?: string;
}

export interface ProductSize {
  id: string;
  name: string;
  price: number;
  cockpit3d_id?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  price: number | null;
  cockpit3d_id?: string;
  cockpit3d_option_id?: string;
}

export interface Cockpit3DOptions {
  sizeOptionId?: string;
  faceOptionId?: string;
  lightBaseOptionId?: string;
  twoDBackdropOptionId?: string;
  threeDBackdropOptionId?: string;
  serviceQueueOptionId?: string;
  customerTextOptionId?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  description: string;
  longDescription?: string;
  images: ProductImage[];
  options?: any[];
  requiresImage: boolean;
  sizes?: ProductSize[];
  lightBases?: ProductOption[];
  backgroundOptions?: ProductOption[];
  textOptions?: ProductOption[];
  maskImageUrl?: string | null;
  categories?: string[];
  featured?: boolean;
  cockpit3dOptions?: Cockpit3DOptions;
}

export interface ProductCustomization {
  name?: string;
  description?: string;
  longDescription?: string;
  basePrice?: number;
  featured?: boolean;
  categories?: string[];
  cockpit3dOptions?: Cockpit3DOptions;
  images?: ProductImage[];
  sizes?: Partial<ProductSize>[];
}

export interface ProductCustomizations {
  [productId: string]: ProductCustomization;
}
