// CREATE NEW FILE: src/data/size-pricing.js
// This file contains the real pricing for all size options

export const SIZE_PRICING = {
  // Rectangle sizes
  "Rectangle Small (6x4cm)": { price: 65, originalPrice: 100 },
  "Rectangle Medium (8x5cm)": { price: 85, originalPrice: 140 },
  "Rectangle Large (9x6cm)": { price: 129, originalPrice: 215 },
  "Rectangle XLarge (12x8cm)": { price: 199, originalPrice: 332 },
  "Rectangle Mini Mantel (15x10cm)": { price: 299, originalPrice: 465 },
  "Rectangle Mantel (18x12cm)": { price: 359, originalPrice: 599 },
  "Rectangle Mini Presidential (22x16cm)": { price: 469, originalPrice: 799 },
  "Rectangle Presidential (27x18cm)": { price: 705, originalPrice: 1200 },

  // Rectangle Tall sizes
  "Rectangle Tall Small (2.5\" x 1.5 x 1.5 / 6x4x4cm)": { price: 65, originalPrice: 100 },
  "Rectangle Tall Medium (3\" x 2 x 2 / 8x5x5cm)": { price: 85, originalPrice: 140 },
  "Rectangle Tall Large (3.5\" x 2.5 x 2.5 / 9x6x6cm)": { price: 129, originalPrice: 215 },
  "Rectangle Tall XLarge (4.5\" x 3.2 x 2.4 / 12x8x6cm)": { price: 199, originalPrice: 332 },
  "Rectangle Tall Mini Mantel (6\" x 4 x 2.5 / 15x10x6cm)": { price: 299, originalPrice: 465 },
  "Rectangle Tall Large Mantel (7\" x 4.8 x 3.2 / 18x12x8cm)": { price: 359, originalPrice: 599 },
  "Rectangle Tall Mini Presidential (8.7\" x 6.3 x 3.2 / 22x16x8cm)": { price: 469, originalPrice: 799 },
  "Rectangle Tall Large Presidential (10.7\" x 7 x 3.2 / 27x18x8cm)": { price: 705, originalPrice: 1200 },

  // Ball Crystal sizes
  "Ball Crystal Small 8cm": { price: 149, originalPrice: 220 },
  "Ball Crystal Medium 10cm": { price: 199, originalPrice: 299 },

  // Notched Crystal sizes
  "2D Notched Small Crystal Tall 6x4x1.2\" / 15x10x3cm": { price: 119, originalPrice: 180 },
  "3D Notched Small Crystal Tall 6x4x1.2\" / 15x10x3cm": { price: 139, originalPrice: 210 },
  "2D Notched Crystal Tall  7x5x1.2\" / 18x13x3cm": { price: 149, originalPrice: 225 },
  "3D Notched Crystal Tall  7x5x1.2\" / 18x13x3cm": { price: 169, originalPrice: 255 },

  // Heart sizes
  "Heart Small (6x4cm)": { price: 69, originalPrice: 105 },
  "Heart Medium (8x5cm)": { price: 89, originalPrice: 145 },
  "Heart Large (9x6cm)": { price: 135, originalPrice: 220 },

  // Diamond sizes
  "Cut Corner Diamond (5x5cm)": { price: 79, originalPrice: 125 },
  "Cut Corner Diamond (6x6cm)": { price: 99, originalPrice: 155 },
  "Cut Corner Diamond (8x8cm)": { price: 149, originalPrice: 235 },

  // Default fallback for unknown sizes
  "default": { price: 89, originalPrice: 150 }
};

// Helper function to get pricing for a size
export const getSizePricing = (sizeName) => {
  // Try exact match first
  if (SIZE_PRICING[sizeName]) {
    return SIZE_PRICING[sizeName];
  }
  
  // Try partial matching for similar names
  const lowerSizeName = sizeName.toLowerCase();
  for (const [key, pricing] of Object.entries(SIZE_PRICING)) {
    if (key.toLowerCase().includes(lowerSizeName.split(' ')[0]) || 
        lowerSizeName.includes(key.toLowerCase().split(' ')[0])) {
      return pricing;
    }
  }
  
  // Return default if no match found
  console.warn(`No pricing found for size: ${sizeName}, using default`);
  return SIZE_PRICING.default;
};