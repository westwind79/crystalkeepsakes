// data/products.js
export const products = [
  {
    id: 1,
    name: "3D Crystal Heart",    
    slug: "crystal-heart",
    basePrice: 85,
    salePrice: 69.99,
    categories: ["anniversary", "birthday", "weddings"],
    description: "Celebrate love and cherished memories with our 3D Laser-Etched Crystal Heart. Perfect for weddings, anniversaries, or Valentine’s Day, this elegant keepsake beautifully captures life’s most meaningful moments in breathtaking 3D.",
    shortDescription: "A timeless symbol of love, this 3D Heart Crystal beautifully captures cherished memories in stunning detail. Perfect for anniversaries, weddings, or Valentine’s Day, it’s a heartfelt keepsake for someone special.",
    longDescription: "<p>Crafted with precision, its sleek design enhances any space, reflecting light to highlight every detail. A heartfelt gift for a partner, friend, or loved one, this timeless crystal is a stunning expression of love, gratitude, or remembrance.</p>",
    productMask: [
      {src: '/img/masks/3d_crystal_heart.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg', isMain: true},
    ],
    sizes: [
      { id: 'small', name: 'Small (3.2" x 2.8 x 1.6 / 8x7x4cm)', price: 85, faces: '1-2' },
      { id: 'medium', name: 'Medium (4" x 3.5 x 2.4 / 10x9x5cm)', price: 119, faces: '1-3' },
      { id: 'large', name: 'Large (5" x 4.3 x 2.4 / 13x11x5cm)', price: 159, faces: '1-4' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  },
  {
    id: 2,
    name: "3D Crystal Rectangle Tall",
    slug: "crystal-rectangle-tall",
    basePrice: 89,
    categories: ["birthday", "weddings","memorial"],
    description: "Showcase your cherished memories in stunning 3D with our Tall Rectangle Crystal. Perfect for desks, nightstands, or display cabinets, its sleek design enhances any space with brilliance.",
    shortDescription: "Showcase your portrait-oriented photos in breathtaking 3D with our Tall Rectangle Crystal. Its sleek design and expert engraving bring every detail to life, making it a stunning display piece.",
    longDescription: "<p>Expertly crafted using advanced engraving technology, this crystal brings your portrait-oriented photos to life with remarkable clarity. Ideal for single portraits, couples, or full-length images, it beautifully highlights moments where height is key.</p><p>Simply upload your photo, choose your size, and let our designers create a breathtaking 3D engraving.</p>",
    productMask: [
      {src: '/img/masks/3d_crystal_picture.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d-rectangle-tall.jpg', isMain: true}, 
    ],
    sizes: [
      { id: 'small', name: 'Medium (3")', price: 89, faces: '1-2' },
      { id: 'medium', name: 'Large (3.5")', price: 129, faces: '1-3' },
      { id: 'xlarge', name: 'XLarge (4.8")', price: 129, faces: '1-4' },
      { id: 'minimantel', name: 'Mini Mantel (6")', price: 299, faces: '1-6' },
      { id: 'largemantel', name: 'Large Mantel (6")', price: 359, faces: '1-8' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ],
  },
  {
    id: 3,
    name: "3D Crystal Rectangle Wide",
    slug: "crystal-rectangle-wide",
    basePrice: 89,
    categories: ["birthday", "weddings","memorial"],
    description: "Showcase your cherished memories in stunning 3D with our Wide Rectangle Crystal. Perfect for landscape-oriented images like family portraits or panoramic shots, it beautifully illuminates every detail.",
    shortDescription: "Designed for landscape-oriented images, our Wide Rectangle Crystal turns your favorite moments into a stunning 3D display. Ideal for family portraits or panoramic scenes, it’s a timeless keepsake.",
    longDescription: "<p>Expertly crafted with advanced engraving technology, this crystal catches light from all angles for a breathtaking effect. Simply upload your photo, select your size, and let our designers transform it into a timeless keepsake.</p>",
    productMask: [
      {src: '/img/masks/3d_crystal_picture.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d-rectangle-wide.jpg', isMain: true}, 
    ],
    sizes: [
      { id: 'small', name: 'Medium (3")', price: 89, faces: '1-2' },
      { id: 'medium', name: 'Large (3.5")', price: 129, faces: '1-3' },
      { id: 'xlarge', name: 'XLarge (4.8")', price: 129, faces: '1-4' },
      { id: 'minimantel', name: 'Mini Mantel (6")', price: 299, faces: '1-6' },
      { id: 'largemantel', name: 'Large Mantel (6")', price: 359, faces: '1-8' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ],
  },
  {
    id: 4,
    name: "3D Crystal Dog Bone Horizontal",
    slug: "dog-bone-horizontal",
    basePrice: 119.99,
    categories: ["pet"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    shortDescription: "A timeless symbol of love, this 3D Heart Crystal beautifully captures cherished memories in stunning detail. Perfect for anniversaries, weddings, or Valentine’s Day, it’s a heartfelt keepsake for someone special.",
    longDescription: "",
    productMask: [
      {src: '/img/masks/3d_dogbone_horizontal.png'}
    ],
    images: [     
      {id: '1', src: '/img/products/dog-bone-horizontal.jpg', isMain: true},
    ],
    sizes: [
      { id: 'small', name: 'Small (2")', price: 0, faces: '1-2' },
      { id: 'medium', name: 'Medium (3")', price: 20, faces: '1-3' },
      { id: 'large', name: 'Large (4")', price: 40, faces: '1-4' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  },
  {
    id: 5,
    name: "3D Crystal Dog Bone Vertical",
    slug: "dog-bone-vertical",
    basePrice: 119.99,
    categories: ["pet"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    shortDescription: "A timeless symbol of love, this 3D Heart Crystal beautifully captures cherished memories in stunning detail. Perfect for anniversaries, weddings, or Valentine’s Day, it’s a heartfelt keepsake for someone special.",
    longDescription: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_dogbone_vertical.png'}
    ],
    images: [
      {id: '1', src: '/img/products/dog-bone-vertical.jpg', isMain: true},
    ],
    sizes: [
      { id: 'small', name: 'Small (2")', price: 0, faces: '1-2' },
      { id: 'medium', name: 'Medium (3")', price: 20, faces: '1-3' },
      { id: 'large', name: 'Large (4")', price: 40, faces: '1-4' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  }, 
  {
    id: 6,
    name: "3D Prestige",
    slug: "prestige",
    basePrice: 89.99,
    categories: ["anniversary", "birthday", "weddings","memorial"],
    description: "Elegant and timeless, our 3D Photo Crystal Iceberg is a stunning keepsake for life’s biggest moments. Expertly crafted from pure K9 crystal and engraved with advanced laser technology, it captures every detail with breathtaking precision. Its multi-faceted design reflects light beautifully, creating a dazzling effect.",
    shortDescription: "Elegant and striking, our 3D Iceberg Crystal transforms your most treasured moments into a dazzling masterpiece. Its multi-faceted design reflects light beautifully, making it a timeless keepsake.",
    longDescription: "<p>Perfect for desks, mantels, or display cabinets, this crystal becomes even more radiant with an optional light base. Ideal for weddings, anniversaries, graduations, or corporate awards, it transforms cherished memories into a timeless masterpiece.</p>",
    productMask: [
      {src: '/img/masks/3D-crystal-prestige-iceberg.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d-prestige.jpg', isMain: true}      
    ],
    sizes: [
      { id: 'small', name: 'Small (2")', price: 0, faces: '1-2' },
      { id: 'medium', name: 'Medium (3")', price: 20, faces: '1-3'},
      { id: 'large', name: 'Large (4")', price: 40, faces: '1-4' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  },
  {
    id: 7,
    name: "3D Crystal Cat",
    slug: "crystal-cat",
    basePrice: 89.99,
    categories: ["pet"],
    description: "Celebrate your beloved pet with our 3D Cat-Shaped Crystal, a beautiful tribute to your furry friend. Expertly laser-etched, it transforms your pet’s photo into a stunning 3D image with lifelike detail.",
    shortDescription: "Celebrate your pet with a 3D Cat-Shaped Crystal, expertly engraved to bring their image to life. A perfect tribute or gift for pet lovers, it’s a lasting way to honor your furry companion.",
    longDescription: "<p>Perfect for honoring a cherished companion or gifting a fellow pet lover, this elegant crystal reflects light beautifully, making it a captivating display piece for any desk, mantel, or home space. A timeless keepsake, it’s a heartfelt way to keep your pet’s memory close forever.</p>",
    productMask: [
      {src: '/img/masks/cat_shape_large.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d-cat.png', isMain: true}, 
    ],
    sizes: [
      { id: 'small', name: 'Small (2")', price: 0, faces: '1-2' },
      { id: 'medium', name: 'Medium (3")', price: 20, faces: '1-3' },
      { id: 'large', name: 'Large (4")', price: 40, faces: '1-4' }
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: '2D Backdrop', price: 12 },
      { id: '3d', name: '3D Backdrop', price: 15 }
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Text', price: 9.50 }
    ]
  },
   
  // More products...
]