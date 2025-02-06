// data/products.js
export const products = [
  {
    id: 1,
    name: "3D Crystal Heart",    
    slug: "crystal-heart",
    basePrice: 69.99,
    categories: ["anniversary", "birthday", "weddings"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_crystal_heart.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg', isMain: true},
      // {id: '2', src: '/img/products/01_dogbonehorizontal.jpg'},
      // {id: '3', src: '/img/products/3dc_prestige.jpg'}, 
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
    id: 2,
    name: "3D Crystal Rectangle Tall",
    slug: "crystal-rectangle-tall",
    basePrice: 89,
    categories: ["birthday", "weddings","memorial"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_crystal_picture.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg'},
      {id: '2', src: '/img/products/01_dogbonehorizontal.jpg'},
      {id: '3', src: '/img/products/3dc_prestige.jpg', isMain: true}, 
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
    name: "3D Crystal Dog Bone Horizontal",
    slug: "dog-bone-horizontal",
    basePrice: 119.99,
    categories: ["pet"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_dogbone_horizontal.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg', isMain: true},
      {id: '2', src: '/img/products/01_dogbonehorizontal.jpg'},
      {id: '3', src: '/img/products/3dc_prestige.jpg'}, 
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
    id: 4,
    name: "3D Crystal Dog Bone Vertical",
    slug: "dog-bone-vertical",
    basePrice: 119.99,
    categories: ["pet"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_dogbone_vertical.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg', isMain: true},
      {id: '2', src: '/img/products/01_dogbonehorizontal.jpg'},
      {id: '3', src: '/img/products/3dc_prestige.jpg'}, 
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
    name: "3D Prestige",
    slug: "prestige",
    basePrice: 89.99,
    categories: ["anniversary", "birthday", "weddings","memorial"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/3d_crystal_large_prestige_iceberg_1_1.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3dc_prestige.jpg', isMain: true}      
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
    id: 6,
    name: "3D Crystal Cat",
    slug: "crystal-cat",
    basePrice: 89.99,
    categories: ["pet"],
    description: "Beautiful crystal heart, perfect for capturing memories",
    productMask: [
      {src: '/img/masks/cat_shape_large.png'}
    ],
    images: [
      {id: '1', src: '/img/products/3d_heart.jpg'},
      {id: '2', src: '/img/products/01_dogbonehorizontal.jpg'},
      {id: '3', src: '/img/products/3dc_prestige.jpg', isMain: true}, 
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