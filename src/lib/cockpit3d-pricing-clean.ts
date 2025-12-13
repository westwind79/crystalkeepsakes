<<<<<<< HEAD
// /lib/cockpit3d-pricing-clean.ts
=======
// /app/src/lib/cockpit3d-pricing-clean.ts
>>>>>>> development
/**
 * Crystal Keepsakes - Clean Pricing Data
 * Generated: 2024-12-12
 * Version: 1.0.0
 * 
 * Source: Cockpit3D profit.cockpit3d.com backend
 * Pricing Strategy: Cost-plus with category-based margins
 */

export interface PricingTier {
  cost: number;      // Cockpit3D manufacturing cost
  margin: number;    // Profit margin multiplier
  price: number;     // Final retail price (cost × margin)
}

export interface ProductPricing {
  sku: string;
  name: string;
  category: string;
  baseCost: number;  // 1pc cost from Cockpit3D
  margin: number;    // Standard margin for this category
  pricing: {
    qty1: PricingTier;
    qty2?: PricingTier;
    qty3?: PricingTier;
    qty4?: PricingTier;
  };
}

// Margin multipliers by category
export const MARGIN_MULTIPLIERS = {
  PREMIUM: 2.8,           // Presidential, Mantel sizes
  STANDARD: 3.2,          // Medium/Large rectangles, hearts
  POPULAR: 3.5,           // Small/XL items, ornaments
  ACCESSORIES: 4.0,       // Keychains, necklaces
  LIGHTBASES: 3.0,        // All light bases
  SERVICES: 1.7,          // Text, previews, rush services
  ADDONS: 2.5,            // Backdrops, reconstructions
} as const;

// Helper function to calculate price
function calculatePrice(cost: number, margin: number): number {
  return Math.round(cost * margin * 100) / 100;
}

// Clean product pricing data
export const PRODUCT_PRICING: ProductPricing[] = [
  
  // ===== SERVICES & ADD-ONS =====
  {
    sku: 'customer_text',
    name: 'Customer Text',
    category: 'services',
    baseCost: 2.95,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 2.95, margin: 1.7, price: 5.00 }
    }
  },
  {
    sku: 'custom_design',
    name: 'Custom Design',
    category: 'services',
    baseCost: 10.00,
    margin: MARGIN_MULTIPLIERS.ADDONS,
    pricing: {
      qty1: { cost: 10.00, margin: 2.5, price: 25.00 }
    }
  },
  {
    sku: 'Face',
    name: 'Face Enhancement',
    category: 'services',
    baseCost: 8.00,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 8.00, margin: 1.0, price: 8.00 }
    }
  },
  {
    sku: '2d_backdrop',
    name: '2D Backdrop',
    category: 'services',
    baseCost: 8.00,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 8.00, margin: 1.0, price: 8.00 }
    }
  },
  {
    sku: '3d_backdrop',
    name: '3D Backdrop',
    category: 'services',
    baseCost: 12.00,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 12.00, margin: 1.0, price: 12.00 }
    }
  },
  {
    sku: 'queue_48',
    name: 'Jump the Queue 48hr',
    category: 'services',
    baseCost: 10.00,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 10.00, margin: 1.0, price: 10.00 }
    }
  },
  {
    sku: 'red_carpet',
    name: 'Red Carpet 24hr',
    category: 'services',
    baseCost: 15.00,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 15.00, margin: 1.0, price: 15.00 }
    }
  },
  {
    sku: 'digi_preview',
    name: 'Digital Preview',
    category: 'services',
    baseCost: 3.95,
    margin: MARGIN_MULTIPLIERS.SERVICES,
    pricing: {
      qty1: { cost: 3.95, margin: 1.76, price: 6.95 },
      qty2: { cost: 3.95, margin: 1.65, price: 6.50 },
      qty3: { cost: 3.95, margin: 1.58, price: 6.25 },
      qty4: { cost: 3.95, margin: 1.52, price: 6.00 }
    }
  },
  {
    sku: 'Digital_Reconstruction',
    name: 'Digital Reconstruction',
    category: 'services',
    baseCost: 10.00,
    margin: MARGIN_MULTIPLIERS.ADDONS,
    pricing: {
      qty1: { cost: 10.00, margin: 2.0, price: 20.00 }
    }
  },

  // ===== CUT CORNER DIAMONDS =====
  {
    sku: 'Cut_Corner_Diamond_(5x5cm)',
    name: 'Cut Corner Diamond 5x5cm',
    category: 'diamonds',
    baseCost: 24.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 24.75, margin: 1.0, price: 24.75 }
    }
  },
  {
    sku: 'Cut_Corner_Diamond_(6x6cm)',
    name: 'Cut Corner Diamond 6x6cm',
    category: 'diamonds',
    baseCost: 39.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 39.75, margin: 1.0, price: 39.75 }
    }
  },
  {
    sku: 'Cut_Corner_Diamond_(8x8cm)',
    name: 'Cut Corner Diamond 8x8cm',
    category: 'diamonds',
    baseCost: 49.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 49.75, margin: 1.0, price: 49.75 }
    }
  },

  // ===== LIGHTBASES =====
  {
    sku: 'Lightbase_Rectangle',
    name: 'Lightbase Rectangle',
    category: 'lightbases',
    baseCost: 8.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 8.75, margin: 2.86, price: 25.00 },
      qty2: { cost: 8.75, margin: 2.29, price: 20.00 },
      qty3: { cost: 8.75, margin: 2.29, price: 20.00 },
      qty4: { cost: 8.75, margin: 2.29, price: 20.00 }
    }
  },
  {
    sku: 'Lightbase_Square',
    name: 'Lightbase Square',
    category: 'lightbases',
    baseCost: 8.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 8.75, margin: 2.86, price: 25.00 },
      qty2: { cost: 8.75, margin: 2.29, price: 20.00 },
      qty3: { cost: 8.75, margin: 2.11, price: 18.50 },
      qty4: { cost: 8.75, margin: 1.89, price: 16.50 }
    }
  },
  {
    sku: 'Lightbase_Wood_Small',
    name: 'Lightbase Wood Small',
    category: 'lightbases',
    baseCost: 19.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 19.75, margin: 1.77, price: 35.00 },
      qty2: { cost: 19.75, margin: 3.04, price: 60.00 }
    }
  },
  {
    sku: 'Lightbase_Wood_Medium',
    name: 'Lightbase Wood Medium',
    category: 'lightbases',
    baseCost: 22.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 22.75, margin: 1.98, price: 45.00 },
      qty2: { cost: 22.75, margin: 2.77, price: 63.00 }
    }
  },
  {
    sku: 'Lightbase_Wood_Long',
    name: 'Lightbase Wood Long',
    category: 'lightbases',
    baseCost: 29.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 29.75, margin: 1.18, price: 35.00 },
      qty2: { cost: 29.75, margin: 1.11, price: 33.00 },
      qty3: { cost: 29.75, margin: 1.08, price: 32.00 },
      qty4: { cost: 29.75, margin: 1.04, price: 31.00 }
    }
  },
  {
    sku: 'Rotating_LED_Lightbase',
    name: 'Rotating LED Lightbase',
    category: 'lightbases',
    baseCost: 9.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 9.75, margin: 2.05, price: 19.99 },
      qty2: { cost: 9.75, margin: 3.59, price: 35.00 }
    }
  },
  {
    sku: 'concave_lightbase',
    name: 'Concave Lightbase',
    category: 'lightbases',
    baseCost: 12.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 12.75, margin: 3.06, price: 39.00 }
    }
  },

  // ===== RECTANGLES - MEDIUM =====
  {
    sku: 'Rectangle_Medium_(8x5cm)',
    name: 'Rectangle Medium 8x5cm',
    category: 'rectangles',
    baseCost: 24.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 24.75, margin: 3.19, price: 79.00 },
      qty2: { cost: 24.75, margin: 2.55, price: 63.00 },
      qty3: { cost: 24.75, margin: 2.51, price: 62.00 },
      qty4: { cost: 24.75, margin: 2.46, price: 61.00 }
    }
  },

  // ===== RECTANGLES - LARGE =====
  {
    sku: 'Rectangle_Large_(9x6cm)',
    name: 'Rectangle Large 9x6cm',
    category: 'rectangles',
    baseCost: 39.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 39.75, margin: 2.99, price: 119.00 },
      qty2: { cost: 39.75, margin: 2.39, price: 95.20 },
      qty3: { cost: 39.75, margin: 2.29, price: 91.00 },
      qty4: { cost: 39.75, margin: 2.26, price: 89.99 }
    }
  },

  // ===== RECTANGLES - XLARGE =====
  {
    sku: 'Rectangle_XLarge_(12x8cm)',
    name: 'Rectangle XLarge 12x8cm',
    category: 'rectangles',
    baseCost: 59.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 59.75, margin: 2.83, price: 169.00 },
      qty2: { cost: 59.75, margin: 2.26, price: 135.00 },
      qty3: { cost: 59.75, margin: 2.24, price: 134.00 },
      qty4: { cost: 59.75, margin: 2.23, price: 133.00 }
    }
  },

  // ===== RECTANGLES - MANTEL =====
  {
    sku: 'Rectangle_Mantel_(18x12cm)',
    name: 'Rectangle Mantel 18x12cm',
    category: 'rectangles',
    baseCost: 109.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 109.75, margin: 3.42, price: 375.00 }
    }
  },
  {
    sku: 'Rectangle_Mini_Mantel_(15x10cm)',
    name: 'Rectangle Mini Mantel 15x10cm',
    category: 'rectangles',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 89.75, margin: 3.62, price: 325.00 }
    }
  },

  // ===== RECTANGLES - PRESIDENTIAL =====
  {
    sku: 'Rectangle_Presidential_(27x18cm)',
    name: 'Rectangle Presidential 27x18cm',
    category: 'rectangles',
    baseCost: 349.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 349.75, margin: 2.86, price: 1000.00 }
    }
  },
  {
    sku: 'Rectangle_Mini_Presidential_(22x16cm)',
    name: 'Rectangle Mini Presidential 22x16cm',
    category: 'rectangles',
    baseCost: 149.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 149.75, margin: 3.97, price: 595.00 }
    }
  },

  // ===== PRESTIGE SERIES =====
  {
    sku: 'Prestige_Small_(13x9cm)',
    name: 'Prestige Small 13x9cm',
    category: 'prestige',
    baseCost: 69.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 69.75, margin: 2.14, price: 149.00 },
      qty2: { cost: 69.75, margin: 1.71, price: 119.00 },
      qty3: { cost: 69.75, margin: 1.69, price: 118.00 },
      qty4: { cost: 69.75, margin: 1.68, price: 117.00 }
    }
  },
  {
    sku: 'Prestige_Medium_(16x13cm)',
    name: 'Prestige Medium 16x13cm',
    category: 'prestige',
    baseCost: 99.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 99.75, margin: 2.00, price: 199.00 },
      qty2: { cost: 99.75, margin: 1.59, price: 159.00 },
      qty3: { cost: 99.75, margin: 1.58, price: 158.00 },
      qty4: { cost: 99.75, margin: 1.57, price: 157.00 }
    }
  },
  {
    sku: 'Prestige_Large_(19x15cm)',
    name: 'Prestige Large 19x15cm',
    category: 'prestige',
    baseCost: 124.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 124.75, margin: 3.20, price: 399.00 },
      qty2: { cost: 124.75, margin: 1.92, price: 239.00 },
      qty3: { cost: 124.75, margin: 1.91, price: 238.00 },
      qty4: { cost: 124.75, margin: 1.90, price: 237.00 }
    }
  },

  // ===== KEYCHAINS =====
  {
    sku: 'Keychain_3D_Rectangle',
    name: 'Keychain 3D Rectangle',
    category: 'keychains',
    baseCost: 9.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 9.75, margin: 2.87, price: 28.00 },
      qty2: { cost: 9.75, margin: 3.59, price: 35.00 }
    }
  },
  {
    sku: 'Keychain_2D_Rectangle',
    name: 'Keychain 2D Rectangle',
    category: 'keychains',
    baseCost: 9.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 9.75, margin: 2.56, price: 25.00 },
      qty2: { cost: 9.75, margin: 3.18, price: 31.00 },
      qty3: { cost: 9.75, margin: 3.10, price: 30.25 },
      qty4: { cost: 9.75, margin: 3.08, price: 29.99 }
    }
  },
  {
    sku: 'KeychainPromo',
    name: 'Rectangle Keychain Promo',
    category: 'keychains',
    baseCost: 9.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 9.75, margin: 1.54, price: 15.00 }
    }
  },
  {
    sku: 'Keychain_2D_Heart',
    name: 'Keychain 2D Heart',
    category: 'keychains',
    baseCost: 14.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 14.75, margin: 2.03, price: 30.00 },
      qty2: { cost: 14.75, margin: 2.92, price: 43.00 },
      qty3: { cost: 14.75, margin: 2.63, price: 38.75 },
      qty4: { cost: 14.75, margin: 2.37, price: 35.00 }
    }
  },
  {
    sku: 'Keychain_3D_Heart',
    name: 'Keychain 3D Heart',
    category: 'keychains',
    baseCost: 14.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 14.75, margin: 3.05, price: 45.00 }
    }
  },
  {
    sku: 'Heart_Keychain_Promo',
    name: 'Heart Keychain Promo',
    category: 'keychains',
    baseCost: 12.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 12.75, margin: 1.96, price: 25.00 }
    }
  },
  {
    sku: 'Cat_Keychain',
    name: '3D Crystal Cat Keychain',
    category: 'keychains',
    baseCost: 15.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 15.75, margin: 2.86, price: 45.00 }
    }
  },
  {
    sku: 'Dog_Bone_Keychain',
    name: '2D Dog Bone Keychain',
    category: 'keychains',
    baseCost: 15.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 15.75, margin: 2.86, price: 45.00 }
    }
  },

  // ===== NECKLACES =====
  {
    sku: 'Necklace_Heart_2D',
    name: 'Necklace Heart 2D',
    category: 'necklaces',
    baseCost: 17.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 17.75, margin: 1.41, price: 25.00 },
      qty2: { cost: 17.75, margin: 2.21, price: 39.20 },
      qty3: { cost: 17.75, margin: 2.18, price: 38.75 },
      qty4: { cost: 17.75, margin: 1.97, price: 35.00 }
    }
  },
  {
    sku: 'Necklace_Rectangle_2D',
    name: 'Necklace Rectangle 2D',
    category: 'necklaces',
    baseCost: 17.50,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 17.50, margin: 4.29, price: 75.00 }
    }
  },
  {
    sku: 'Cat_Necklace',
    name: '2D Crystal Cat Necklace',
    category: 'necklaces',
    baseCost: 20.50,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 20.50, margin: 2.39, price: 49.00 }
    }
  },

  // ===== ORNAMENTS =====
  {
    sku: 'Ornament',
    name: 'Ornament',
    category: 'ornaments',
    baseCost: 19.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 19.75, margin: 1.77, price: 35.00 },
      qty2: { cost: 19.75, margin: 5.01, price: 99.00 }
    }
  },
  {
    sku: 'Ornament_with_Stand',
    name: 'Ornament with Stand',
    category: 'ornaments',
    baseCost: 29.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 29.75, margin: 1.68, price: 50.00 },
      qty2: { cost: 29.75, margin: 2.35, price: 70.00 }
    }
  },
  {
    sku: 'Heart_Ornament',
    name: 'Heart Ornament',
    category: 'ornaments',
    baseCost: 24.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 24.75, margin: 1.82, price: 45.00 }
    }
  },
  {
    sku: 'Flower_Ornament',
    name: '2D Crystal Flower Ornament',
    category: 'ornaments',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'Cat_Ornament',
    name: '2D Crystal Cat Ornament',
    category: 'ornaments',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'Dog_Bone_Ornament',
    name: '2D Dog Bone Crystal Ornament',
    category: 'ornaments',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'ornament_stand',
    name: 'Ornament Stand',
    category: 'ornaments',
    baseCost: 15.00,
    margin: MARGIN_MULTIPLIERS.POPULAR,
    pricing: {
      qty1: { cost: 15.00, margin: 1.67, price: 25.00 }
    }
  },

  // ===== WIDE HEARTS =====
  {
    sku: 'Wide_Heart_small_(80x70x40)',
    name: 'Wide Heart Small 80x70x40mm',
    category: 'hearts',
    baseCost: 39.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 39.75, margin: 2.24, price: 89.00 },
      qty2: { cost: 39.75, margin: 1.79, price: 71.00 },
      qty3: { cost: 39.75, margin: 1.76, price: 70.00 },
      qty4: { cost: 39.75, margin: 1.74, price: 69.00 }
    }
  },
  {
    sku: 'Wide_Heart_Medium_(100x90x50)',
    name: 'Wide Heart Medium 100x90x50mm',
    category: 'hearts',
    baseCost: 69.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 69.75, margin: 1.71, price: 119.00 },
      qty2: { cost: 69.75, margin: 1.69, price: 118.00 },
      qty3: { cost: 69.75, margin: 1.68, price: 117.00 },
      qty4: { cost: 69.75, margin: 1.66, price: 116.00 }
    }
  },
  {
    sku: 'Wide_Heart_Large_(125x110x60)',
    name: 'Wide Heart Large 125x110x60mm',
    category: 'hearts',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 89.75, margin: 1.66, price: 149.00 },
      qty2: { cost: 89.75, margin: 1.77, price: 159.00 },
      qty3: { cost: 89.75, margin: 1.76, price: 158.00 },
      qty4: { cost: 89.75, margin: 1.75, price: 157.00 }
    }
  },

  // ===== RECTANGLES WIDE =====
  {
    sku: 'RectangleWideMedium_(8x5cm)',
    name: 'Rectangle Wide Medium 8x5cm',
    category: 'rectangles',
    baseCost: 24.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 24.75, margin: 4.04, price: 100.00 }
    }
  },
  {
    sku: 'RectangleWideLarge_(9x6cm)',
    name: 'Rectangle Wide Large 9x6cm',
    category: 'rectangles',
    baseCost: 39.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 39.75, margin: 4.28, price: 170.00 }
    }
  },
  {
    sku: 'RectangleWideXLarge_(12x8cm)',
    name: 'Rectangle Wide XLarge 12x8cm',
    category: 'rectangles',
    baseCost: 59.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 59.75, margin: 4.77, price: 285.00 }
    }
  },
  {
    sku: 'RectangleWideMantel_(18x12cm)',
    name: 'Rectangle Wide Mantel 18x12cm',
    category: 'rectangles',
    baseCost: 109.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 109.75, margin: 3.42, price: 375.00 }
    }
  },
  {
    sku: 'RectangleWidePresidential_(27x18cm)',
    name: 'Rectangle Wide Presidential 27x18cm',
    category: 'rectangles',
    baseCost: 349.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 349.75, margin: 2.86, price: 1000.00 }
    }
  },
  {
    sku: 'RectangleWideMini_Presidential_(22x16cm)',
    name: 'Rectangle Wide Mini Presidential 22x16cm',
    category: 'rectangles',
    baseCost: 149.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 149.75, margin: 3.97, price: 595.00 }
    }
  },
  {
    sku: 'RectangleWideMini_Mantel_(15x10cm)',
    name: 'Rectangle Wide Mini Mantel 15x10cm',
    category: 'rectangles',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.PREMIUM,
    pricing: {
      qty1: { cost: 89.75, margin: 3.62, price: 325.00 }
    }
  },

  // ===== CANDLES & URNS =====
  {
    sku: '3D-crystal-candle10x6x6cm',
    name: 'Candle 4"x2.4x2.4 / 10x6x6cm',
    category: 'candles',
    baseCost: 49.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 49.75, margin: 2.59, price: 129.00 },
      qty2: { cost: 49.75, margin: 2.55, price: 127.00 }
    }
  },
  {
    sku: 'Urn_12x12x6',
    name: 'Urn / Candle 6"x5"x2.5" (15x12x6cm)',
    category: 'urns',
    baseCost: 109.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 109.75, margin: 2.33, price: 256.00 },
      qty2: { cost: 109.75, margin: 2.28, price: 250.00 },
      qty3: { cost: 109.75, margin: 2.27, price: 249.00 },
      qty4: { cost: 109.75, margin: 2.26, price: 248.00 }
    }
  },

  // ===== WOODEN BASES =====
  {
    sku: 'wooden_base_mini',
    name: 'Wooden Premium Base Mini',
    category: 'bases',
    baseCost: 17.75,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 17.75, margin: 3.38, price: 60.00 }
    }
  },

  // ===== 2DFLAT =====
  {
    sku: '2DFlat',
    name: '2DFlat',
    category: 'special',
    baseCost: 0.00,
    margin: 0,
    pricing: {
      qty1: { cost: 0.00, margin: 0, price: 50.00 }
    }
  },

  // ===== ENGRAVED ITEMS =====
  {
    sku: 'engraved_gift_note',
    name: 'Engraved Magnetic Gift Note',
    category: 'services',
    baseCost: 10.00,
    margin: MARGIN_MULTIPLIERS.ADDONS,
    pricing: {
      qty1: { cost: 10.00, margin: 2.5, price: 25.00 }
    }
  },

  // ===== NOTCHED CRYSTALS =====
  {
    sku: '3d_notched_crystal_tall',
    name: '3D Notched Crystal Tall 7x5x1.2" / 18x13x3cm',
    category: 'notched',
    baseCost: 95.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 95.00, margin: 2.73, price: 259.00 }
    }
  },
  {
    sku: '2d_notched_crystal_tall',
    name: '2D Notched Crystal Tall 7x5x1.2" / 18x13x3cm',
    category: 'notched',
    baseCost: 95.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 95.00, margin: 2.73, price: 259.00 }
    }
  },
  {
    sku: '3d_notched_crystal_wide',
    name: '3D Notched Crystal Wide 7x5x1.2" / 18x13x3cm',
    category: 'notched',
    baseCost: 95.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 95.00, margin: 2.73, price: 259.00 }
    }
  },
  {
    sku: '2d_notched_crystal_wide',
    name: '2D Notched Crystal Wide 7x5x1.2" / 18x13x3cm',
    category: 'notched',
    baseCost: 95.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 95.00, margin: 2.73, price: 259.00 }
    }
  },
  {
    sku: '2d_notched_small_crystal_tall',
    name: '2D Notched Small Crystal Tall 6x4x1.2" / 15x10x3cm',
    category: 'notched',
    baseCost: 85.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 85.00, margin: 1.87, price: 159.00 }
    }
  },
  {
    sku: '2d_notched_small_crystal_wide',
    name: '2D Notched Small Crystal Wide 6x4x1.2" / 15x10x3cm',
    category: 'notched',
    baseCost: 85.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 85.00, margin: 1.87, price: 159.00 }
    }
  },
  {
    sku: '3d_notched_small_crystal_tall',
    name: '3D Notched Small Crystal Tall 6x4x1.2" / 15x10x3cm',
    category: 'notched',
    baseCost: 85.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 85.00, margin: 1.87, price: 159.00 }
    }
  },
  {
    sku: '3d_notched_small_crystal_wide',
    name: '3D Notched Small Crystal Wide 6x4x1.2" / 15x10x3cm',
    category: 'notched',
    baseCost: 85.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 85.00, margin: 1.87, price: 159.00 }
    }
  },

  // ===== BALL CRYSTALS =====
  {
    sku: 'ball_small_8cm',
    name: 'Ball Crystal Small 8cm',
    category: 'balls',
    baseCost: 59.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 59.75, margin: 2.83, price: 169.00 }
    }
  },

  // ===== CUSTOM OPTIONS =====
  {
    sku: 'custom_option',
    name: 'Custom Option',
    category: 'special',
    baseCost: 0.00,
    margin: 0,
    pricing: {
      qty1: { cost: 0.00, margin: 0, price: 0.00 }
    }
  },

  // ===== DOG BONES =====
  {
    sku: 'dog_bone_vertical_one_size',
    name: 'Dog Bone Vertical Size',
    category: 'dog',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 89.75, margin: 1.44, price: 129.00 },
      qty2: { cost: 89.75, margin: 1.38, price: 124.00 },
      qty3: { cost: 89.75, margin: 1.33, price: 119.00 },
      qty4: { cost: 89.75, margin: 1.27, price: 114.00 }
    }
  },
  {
    sku: 'dog_bone_horizontal_one_size',
    name: 'Dog Bone Horizontal Size',
    category: 'dog',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 89.75, margin: 1.44, price: 129.00 },
      qty2: { cost: 89.75, margin: 1.38, price: 124.00 },
      qty3: { cost: 89.75, margin: 1.33, price: 119.00 },
      qty4: { cost: 89.75, margin: 1.27, price: 114.00 }
    }
  },
  {
    sku: 'Dog_Bone_Tag',
    name: '3d crystal Dog Bone Tag',
    category: 'dog',
    baseCost: 19.50,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 19.50, margin: 2.51, price: 49.00 }
    }
  },

  // ===== DESK LAMP =====
  {
    sku: '3d_desk_lamp',
    name: '3D Crystal Desk Lamp',
    category: 'lamps',
    baseCost: 175.00,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 175.00, margin: 2.14, price: 375.00 }
    }
  },

  // ===== POP CARDS =====
  {
    sku: '3d_thank_you_mom_popup_card',
    name: '3D Thank You Mom Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },
  {
    sku: '3d_birthday_celebration_popup_card',
    name: '3D Birthday Celebration Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },
  {
    sku: '3d_best_dad_popup_card',
    name: '3D #1 Best Dad Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },
  {
    sku: '3d_flower_heart_popup_card',
    name: '3D Flower Heart Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },
  {
    sku: '3d_christmas_tree_popup_card',
    name: '3D Christmas Tree Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },
  {
    sku: '3d_happy_holidays_popup_card',
    name: '3D Happy Holidays Pop Card',
    category: 'cards',
    baseCost: 4.95,
    margin: MARGIN_MULTIPLIERS.LIGHTBASES,
    pricing: {
      qty1: { cost: 4.95, margin: 2.98, price: 14.75 }
    }
  },

  // ===== BRACELETS =====
  {
    sku: 'Heart_Bracelet',
    name: '2D Crystal Heart Bracelet',
    category: 'bracelets',
    baseCost: 20.50,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 20.50, margin: 2.39, price: 49.00 }
    }
  },

  // ===== DOMES =====
  {
    sku: 'Small_Crystal_Dome',
    name: '3D Small Crystal Dome',
    category: 'domes',
    baseCost: 79.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 79.75, margin: 3.12, price: 249.00 }
    }
  },
  {
    sku: 'Dome_Medium',
    name: '3D Crystal Dome Medium',
    category: 'domes',
    baseCost: 134.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 134.75, margin: 2.44, price: 329.00 }
    }
  },

  // ===== LARGE CAT =====
  {
    sku: 'Large_Cat_Crystal',
    name: '3D Large Cat Crystal',
    category: 'cat',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 89.75, margin: 1.44, price: 129.00 },
      qty2: { cost: 89.75, margin: 1.38, price: 124.00 },
      qty3: { cost: 89.75, margin: 1.33, price: 119.00 },
      qty4: { cost: 89.75, margin: 1.27, price: 114.00 }
    }
  },

  // ===== PLAQUES =====
  {
    sku: 'Square_Crystal_Plaque',
    name: '3D Square Crystal Plaque',
    category: 'plaques',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 89.75, margin: 1.88, price: 169.00 }
    }
  },
  {
    sku: '2D_Medium_Plaque_Vertical',
    name: '2D Medium Plaque Vertical with Silver Stand',
    category: 'plaques',
    baseCost: 49.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 49.75, margin: 3.40, price: 169.00 }
    }
  },
  {
    sku: '2D_Medium_Plaque_Horizontal',
    name: '2D Medium Plaque Horizontal with Silver Stand',
    category: 'plaques',
    baseCost: 49.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 49.75, margin: 3.40, price: 169.00 }
    }
  },
  {
    sku: 'Silver_Stand',
    name: 'Silver Stand',
    category: 'stands',
    baseCost: 0.00,
    margin: 0,
    pricing: {
      qty1: { cost: 0.00, margin: 0, price: 0.00 }
    }
  },

  // ===== SPECIALTY SHAPES =====
  {
    sku: '3D_Crystal_Arch_size',
    name: '3D Crystal Arch 6.25" x 4.25 x 1.25 / 16x10.5x3cm',
    category: 'specialty',
    baseCost: 74.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 74.75, margin: 4.00, price: 299.00 }
    }
  },
  {
    sku: '3D_Crystal_Oval_size',
    name: '3D Crystal Oval 5.25" x 7 x 1 / 13.5 x 17.5 x 2.5cm',
    category: 'specialty',
    baseCost: 89.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 89.75, margin: 4.00, price: 359.00 }
    }
  },
  {
    sku: '3D_Crystal_Circle_Small_size',
    name: '3D Crystal Circle Small 4.75" x 5 x 1.25 / 12 x 12.5 x 3cm',
    category: 'specialty',
    baseCost: 49.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 49.75, margin: 4.00, price: 199.00 }
    }
  },
  {
    sku: '3D_Crystal_Circle_Medium_size',
    name: '3D Crystal Circle Medium 6" x 5.75 x 1.25 / 15 x 14.5 x 3cm',
    category: 'specialty',
    baseCost: 62.25,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 62.25, margin: 4.00, price: 249.00 }
    }
  },
  {
    sku: '3D_Crystal_Monument_size',
    name: '3D Crystal Monument 5" x 7 x 1.25 / 12.5 x 17.5 x 3cm',
    category: 'specialty',
    baseCost: 99.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 99.75, margin: 4.00, price: 399.00 }
    }
  },

  // ===== ADD-ON ORNAMENTS =====
  {
    sku: 'Circle-Ornament-Addon',
    name: 'Circle Ornament',
    category: 'ornament-addons',
    baseCost: 19.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 19.75, margin: 2.28, price: 45.00 }
    }
  },
  {
    sku: 'Heart-Ornament-Addon',
    name: 'Heart Ornament',
    category: 'ornament-addons',
    baseCost: 19.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 19.75, margin: 2.28, price: 45.00 }
    }
  },
  {
    sku: 'Cat-Ornament-Addon',
    name: 'Cat Ornament',
    category: 'ornament-addons',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'Dog-Bone-Ornament-Addon',
    name: 'Dog Bone Ornament',
    category: 'ornament-addons',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'Flower-Ornament-Addon',
    name: 'Flower Ornament',
    category: 'ornament-addons',
    baseCost: 25.75,
    margin: MARGIN_MULTIPLIERS.STANDARD,
    pricing: {
      qty1: { cost: 25.75, margin: 1.75, price: 45.00 }
    }
  },
  {
    sku: 'Dog-Bone-Keychain-Addon',
    name: 'Dog Bone Keychain',
    category: 'keychain-addons',
    baseCost: 15.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 15.75, margin: 2.86, price: 45.00 }
    }
  },
  {
    sku: 'Cat-Keychain-Addon',
    name: 'Cat Keychain',
    category: 'keychain-addons',
    baseCost: 15.75,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 15.75, margin: 2.86, price: 45.00 }
    }
  },
  {
    sku: 'Cat-Necklace-Addon',
    name: 'Cat Necklace',
    category: 'necklace-addons',
    baseCost: 20.50,
    margin: MARGIN_MULTIPLIERS.ACCESSORIES,
    pricing: {
      qty1: { cost: 20.50, margin: 2.20, price: 45.00 }
    }
  }
];

<<<<<<< HEAD
// Helper functions
=======
// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pricing data by SKU
 */
>>>>>>> development
export function getPricingBySKU(sku: string): ProductPricing | undefined {
  return PRODUCT_PRICING.find(p => p.sku === sku);
}

<<<<<<< HEAD
=======
/**
 * Get price for a specific quantity (1-4)
 */
>>>>>>> development
export function getPriceForQuantity(sku: string, quantity: 1 | 2 | 3 | 4): number | null {
  const product = getPricingBySKU(sku);
  if (!product) return null;
  
  const qtyKey = `qty${quantity}` as keyof typeof product.pricing;
  return product.pricing[qtyKey]?.price ?? null;
}

<<<<<<< HEAD
=======
/**
 * Get cost for a specific quantity (1-4)
 */
>>>>>>> development
export function getCostForQuantity(sku: string, quantity: 1 | 2 | 3 | 4): number | null {
  const product = getPricingBySKU(sku);
  if (!product) return null;
  
  const qtyKey = `qty${quantity}` as keyof typeof product.pricing;
  return product.pricing[qtyKey]?.cost ?? null;
}

<<<<<<< HEAD
=======
/**
 * Get margin for a specific quantity (1-4)
 */
>>>>>>> development
export function getMarginForQuantity(sku: string, quantity: 1 | 2 | 3 | 4): number | null {
  const product = getPricingBySKU(sku);
  if (!product) return null;
  
  const qtyKey = `qty${quantity}` as keyof typeof product.pricing;
  return product.pricing[qtyKey]?.margin ?? null;
}

<<<<<<< HEAD
// Export total count
console.log(`✅ Loaded ${PRODUCT_PRICING.length} products with clean pricing data`);
=======
/**
 * Get the best price based on quantity (returns discounted price if available)
 */
export function getBestPriceForQuantity(sku: string, quantity: number): number | null {
  const product = getPricingBySKU(sku);
  if (!product) return null;
  
  // Clamp quantity to 1-4 range
  const qty = Math.min(Math.max(quantity, 1), 4) as 1 | 2 | 3 | 4;
  
  // Find highest available quantity tier <= requested quantity
  for (let q = qty; q >= 1; q--) {
    const qtyKey = `qty${q}` as keyof typeof product.pricing;
    if (product.pricing[qtyKey]) {
      return product.pricing[qtyKey]!.price;
    }
  }
  
  return product.pricing.qty1.price;
}

/**
 * Calculate total price for an item with quantity
 */
export function calculateItemTotal(sku: string, quantity: number): number {
  const unitPrice = getBestPriceForQuantity(sku, quantity);
  if (unitPrice === null) return 0;
  return unitPrice * quantity;
}

/**
 * Check if a product has quantity discounts
 */
export function hasQuantityDiscounts(sku: string): boolean {
  const product = getPricingBySKU(sku);
  if (!product) return false;
  return !!product.pricing.qty2 || !!product.pricing.qty3 || !!product.pricing.qty4;
}

/**
 * Get all quantity tiers for a product
 */
export function getQuantityTiers(sku: string): Array<{ qty: number; price: number; savings?: number }> {
  const product = getPricingBySKU(sku);
  if (!product) return [];
  
  const tiers: Array<{ qty: number; price: number; savings?: number }> = [];
  const basePrice = product.pricing.qty1.price;
  
  for (let q = 1; q <= 4; q++) {
    const qtyKey = `qty${q}` as keyof typeof product.pricing;
    const tier = product.pricing[qtyKey];
    if (tier) {
      tiers.push({
        qty: q,
        price: tier.price,
        savings: q > 1 ? basePrice - tier.price : undefined
      });
    }
  }
  
  return tiers;
}

/**
 * Get pricing by category
 */
export function getPricingByCategory(category: string): ProductPricing[] {
  return PRODUCT_PRICING.filter(p => p.category === category);
}

/**
 * Search pricing by name (partial match)
 */
export function searchPricingByName(searchTerm: string): ProductPricing[] {
  const term = searchTerm.toLowerCase();
  return PRODUCT_PRICING.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.sku.toLowerCase().includes(term)
  );
}

// Export total count for verification
export const TOTAL_PRODUCTS = PRODUCT_PRICING.length;

// Log on import (for debugging)
if (typeof window !== 'undefined') {
  console.log(`✅ Loaded ${PRODUCT_PRICING.length} products with clean pricing data`);
}
>>>>>>> development
