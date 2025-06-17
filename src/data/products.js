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
      {id: '2', src: '/img/products/Heart.jpg'},
    ],
    sizes: [
      { id: 'small', name: 'Small (3.2" x 2.8 x 1.6 / 80x70x40cm)', price: 89, faces: '1-2' },
      { id: 'medium', name: 'Medium (4" x 3.5 x 2.4 / 100x90x50cm)', price: 119, faces: '1-3' },
      { id: 'large', name: 'Large (5" x 4.3 x 2.4 / 125x110x60cm)', price: 149, faces: '1-4' }
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
      {id: '2', src: '/img/products/brooks-memorial.jpg'}, 
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
      {src: '/img/masks/3d_crystal_rectangle-wide.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d-rectangle-wide.jpg', isMain: true}, 
      {id: '2', src: '/img/products/lalena-gift.jpg'}, 
      {id: '2', src: '/img/products/180x120-horizondal-people-copy_8.png'}, 
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
      { id: 'small', name: 'Small (2")', price: 99, faces: '1-2' }
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
    categories: ["anniversary", "birthday", "weddings","memorial","graduation"],
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
  {
    id: 8,
    name: "2D Crystal Ornament",
    slug: "crystal-christmas-ornament",
    basePrice: 45,
    categories: ["christmas", "holiday", "gifts"],
    description: "Celebrate the joy of the holiday season with our 3D Crystal Christmas Tree. Expertly crafted and laser-etched, it shines with festive spirit and captures your cherished holiday memories.",
    shortDescription: "A dazzling 3D Crystal Christmas Tree, perfect for holiday gifting or decorating your home. Customizable with your favorite photo or message.",
    longDescription: "<p>Its all about laser innovation. Custom etch family photos into this sparkly ornament. We have customized our ornament to be the most precious photo laser etched option on the market, exclusively offered to our prestigious customers. Most competitors offer circle ornaments that are just 1/8\" thin, brittle and have a diameter of 1.5\". Our ornaments are 3/8\" thick, robust, have a diameter of 3\" (double others) and rich with facets along the entire circumference.</p>",
    productMask: [{ src: '/img/masks/2d-ornament-mask.png'}],
    images: [
      { id: '1', src: '/img/products/2d-christmas-ornament-1.jpg', isMain: true },
      { id: '2', src: '/img/products/2d-christmas-ornament-2.png'},
      { id: '3', src: '/img/products/2d-christmas-ornament-3.png'},
      // { id: '1', src: '/img/products/ornament-stand.jpg'}
    ],
    sizes: [
      { id: 'small', name: 'Small (3" x 3")', price: 45, faces: '1-5' },
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: 'Keep Background', price: 25 },
    ],
    lightBases: [],
    giftStand: [
      { id: 'none', name: 'No Stand', price: 0 },
      { id: 'with_stand', name: 'Add Ornament Stand', price: 25 }
    ],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Message', price: 9.50 }
    ]
  },
  {
    id: 9,
    name: "3D Crystal Candle Urn - Small",
    slug: "crystal-urn-small",
    basePrice: 45,
    categories: ["memorial", "holiday", "gifts"],
    description: "Celebrate the joy of the holiday season with our 3D Crystal Christmas Tree. Expertly crafted and laser-etched, it shines with festive spirit and captures your cherished holiday memories.",
    shortDescription: "A dazzling 3D Crystal Christmas Tree, perfect for holiday gifting or decorating your home. Customizable with your favorite photo or message.",
    longDescription: "<p>Its all about laser innovation. Custom etch family photos into this sparkly ornament. We have customized our ornament to be the most precious photo laser etched option on the market, exclusively offered to our prestigious customers. Most competitors offer circle ornaments that are just 1/8\" thin, brittle and have a diameter of 1.5\". Our ornaments are 3/8\" thick, robust, have a diameter of 3\" (double others) and rich with facets along the entire circumference.</p>",
    productMask: [{ src: '/img/masks/3d_crystal_candle.png'}],
    images: [
      { id: '1', src: '/img/products/3dc_candle_urn_small.jpg', isMain: true },      
      {id: '2', src: '/img/products/brooks-memorial.jpg'},
    ],
    sizes: [
      { id: 'small', name: '4" x 2.4" x 2.4"', price: 129, faces: '1-5' },
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: 'Keep Background', price: 25 },
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    giftStand: [],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Message', price: 9.50 }
    ]
  },
  {
    id: 10,
    name: "3D Crystal Candle Urn - Large",
    slug: "crystal-urn-large",
    basePrice: 45,
    categories: ["memorial", "holiday", "gifts"],
    description: "Celebrate the joy of the holiday season with our 3D Crystal Christmas Tree. Expertly crafted and laser-etched, it shines with festive spirit and captures your cherished holiday memories.",
    shortDescription: "A dazzling 3D Crystal Christmas Tree, perfect for holiday gifting or decorating your home. Customizable with your favorite photo or message.",
    longDescription: "<p>Its all about laser innovation. Custom etch family photos into this sparkly ornament. We have customized our ornament to be the most precious photo laser etched option on the market, exclusively offered to our prestigious customers. Most competitors offer circle ornaments that are just 1/8\" thin, brittle and have a diameter of 1.5\". Our ornaments are 3/8\" thick, robust, have a diameter of 3\" (double others) and rich with facets along the entire circumference.</p>",
    productMask: [{ src: '/img/masks/3d_crystal_urn_candle.png'}],
    images: [
      { id: '1', src: '/img/products/3dc_candle_urn_large.jpg', isMain: true },
    ],
    sizes: [
      { id: 'small', name: '6" x 5" x 2.5"', price: 256, faces: '1-5' },
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: 'Keep Background', price: 25 },
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    giftStand: [],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Message', price: 9.50 }
    ]
  },
  {
    id: 11,
    name: "Lightbase Rectangle",
    slug: "lightbase-rectangle",
    basePrice: 40,
    categories: ["accessories"],
    description: "Premium rectangular LED light base designed to illuminate and enhance crystal displays.",
    shortDescription: "Rectangular LED light base for crystal displays",
    longDescription: "<p>This rectangular LED light base provides perfect illumination for your crystal creations. Its sleek design complements any decor while showcasing your crystal's intricate details.</p>",
    productMask: [],
    images: [
      { id: '1', src: '/img/products/rect_light_base_1.jpg', isMain: true },
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    giftStand: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 12,
    name: "Lightbase Square",
    slug: "lightbase-square",
    basePrice: 25,
    categories: ["accessories"],
    description: "Square LED light base that provides elegant illumination for smaller crystal pieces.",
    shortDescription: "Square LED base for crystal displays",
    longDescription: "<p>This square LED base offers perfect illumination for smaller crystal pieces. Its compact size makes it ideal for desktop displays.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/square_light_base_1.jpg', isMain: true}
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 13,
    name: "Lightbase Wood Small",
    slug: "lightbase-wood-small",
    basePrice: 60,
    categories: ["accessories"],
    description: "Small wooden light base with premium finish and built-in LED lighting.",
    shortDescription: "Small wooden LED base with premium finish",
    longDescription: "<p>Crafted from high-quality wood, this small LED base provides warm illumination and stable support for your crystal pieces.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/wooden_small.jpg', isMain: true}
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 14,
    name: "Lightbase Wood Medium",
    slug: "lightbase-wood-medium",
    basePrice: 79,
    salePrice: 87,
    categories: ["accessories"],
    description: "Medium-sized wooden light base offering stable support and elegant illumination.",
    shortDescription: "Medium wooden LED base for crystal displays",
    longDescription: "<p>This medium wooden base combines natural beauty with functional LED lighting to showcase your crystals beautifully.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/wooden_medium.jpg', isMain: true}
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 15,
    name: "Lightbase Wood Long",
    slug: "lightbase-wood-long",
    basePrice: 108,
    categories: ["accessories"],
    description: "Long wooden light base designed for larger crystal pieces and premium displays.",
    shortDescription: "Long wooden LED base for large crystals",
    longDescription: "<p>This extended wooden base provides perfect illumination and support for larger crystal pieces, ideal for mantelpieces or display cabinets.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/wooden_large.jpg', isMain: true}
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 16,
    name: "Rectangle Vertical Crystals",
    slug: "rectangle-vertical-crystals",
    basePrice: 35,
    categories: ["home-decor"],
    description: "Elegant vertical rectangle crystal pieces for sophisticated home decoration.",
    shortDescription: "Vertical rectangle crystal decor pieces",
    longDescription: "<p>These precisely crafted vertical rectangle crystals catch and reflect light beautifully, creating stunning visual effects.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/rectangle-vertical-crystals.jpg', isMain: true}
    ],
    sizes: [
      { id: 'standard', name: 'Standard', price: 35 }
    ],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 17,
    name: "Rectangle Horizontal Crystals",
    slug: "rectangle-horizontal-crystals",
    basePrice: 35,
    categories: ["home-decor"],
    description: "Beautiful horizontal rectangle crystal pieces for modern decorative displays.",
    shortDescription: "Horizontal rectangle crystal decor pieces",
    longDescription: "<p>These horizontal rectangle crystals are perfect for displaying on shelves, tables, or with included light bases.</p>",
    productMask: [],
    images: [
      {id: '1', src: '/img/products/rectangle-horizontal-crystals.jpg', isMain: true}
    ],
    sizes: [
      { id: 'standard', name: 'Standard', price: 35 }
    ],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: false,
    textOptions: []
  },
  {
    id: 18,
    name: "3D Cut Corner Diamond",
    slug: "cut-corner-diamond",
    basePrice: 45,
    categories: ["memorial", "holiday", "gifts"],
    description: "Celebrate the joy of the holiday season with our 3D Crystal Christmas Tree. Expertly crafted and laser-etched, it shines with festive spirit and captures your cherished holiday memories.",
    shortDescription: "A dazzling 3D Crystal Christmas Tree, perfect for holiday gifting or decorating your home. Customizable with your favorite photo or message.",
    longDescription: "<p>Its all about laser innovation. Custom etch family photos into this sparkly ornament. We have customized our ornament to be the most precious photo laser etched option on the market, exclusively offered to our prestigious customers. Most competitors offer circle ornaments that are just 1/8\" thin, brittle and have a diameter of 1.5\". Our ornaments are 3/8\" thick, robust, have a diameter of 3\" (double others) and rich with facets along the entire circumference.</p>",
    productMask: [{ src: '/img/masks/3d_crystal_diamond_cut_corner.png'}],
    images: [
      {id: '1', src: '/img/products/3dc_cutcornerdiamond.jpg', isMain: true},      
      {id: '2', src: '/img/products/noahs-keepsake-1.png'},
      {id: '3', src: '/img/products/diamond-corner-cut-1.png'},
      {id: '4', src: '/img/products/CutCorner.jpg'},
    ],
    sizes: [
      { id: 'small', name: '5" x 5"', price: 69, faces: '1-2' },
      { id: 'medium', name: '6" x 6"', price: 89, faces: '3-4' },
      { id: 'large', name: '8" x 8"', price: 119, faces: '5-6' },
    ],
    backgroundOptions: [
      { id: 'rm', name: 'Remove Backdrop', price: 0 },
      { id: '2d', name: 'Keep Background', price: 25 },
    ],
    lightBases: [
      { id: 'none', name: 'No Base', price: 0 },
      { id: 'standard', name: 'Standard LED Base', price: 25 },
      { id: 'premium', name: 'Premium RGB Base', price: 40 }
    ],
    giftStand: [],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Message', price: 9.50 }
    ]
  },
  {
    id: 19,
    name: "3D Heart Keychain",
    slug: "heart-keychain",
    basePrice: 45,
    categories: ["accessories", "gifts"],
    description: "Beautiful heart-shaped crystal keychain that makes a perfect sentimental gift.",
    shortDescription: "Crystal heart keychain",
    longDescription: "<p>This delicate heart-shaped crystal keychain is both practical and meaningful, making it an ideal gift for loved ones.</p>",
    productMask: [{src: '/img/masks/New-Heart%20Keychain.png'}],
    images: [
      {id: '1', src: '/img/products/heart_keychain.png', isMain: true},
      {id: '2', src: '/img/products/heart-keychain-cat.png'},
      {id: '3', src: '/img/products/heart-keychain_lifestyle02.png'},
    ],
    sizes: [],
    backgroundOptions: [],
    lightBases: [],
    requiresImage: true,
    textOptions: [
      { id: 'none', name: 'No Text', price: 0 },
      { id: 'customText', name: 'Custom Message', price: 9.50 }
    ]
  },
  // {
  //   id: 19,
  //   name: "2D Crystal Heart Ornament",
  //   slug: "2d-crystal-heart-ornament",
  //   basePrice: 45,
  //   categories: ["home-decor", "gifts"],
  //   description: "Beautiful 2D heart-shaped crystal ornament perfect for display or gifting.",
  //   shortDescription: "2D heart crystal ornament",
  //   longDescription: "<p>This heart-shaped crystal ornament makes a beautiful decorative piece or heartfelt gift for special occasions.</p>",
  //   productMask: [],
  //   images: [
  //     {id: '1', src: '/img/products/2d-crystal-heart-ornament.jpg', isMain: true}
  //   ],
  //   sizes: [
  //     { id: 'standard', name: 'Standard', price: 45 }
  //   ],
  //   backgroundOptions: [],
  //   lightBases: [],
  //   requiresImage: false,
  //   textOptions: []
  // },
]