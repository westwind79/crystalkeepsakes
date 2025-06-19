// utils/cockpit3dMapper.js
// Maps Cockpit3D data to our product structure

class Cockpit3DMapper {
  constructor(rawProductsData, categoryData) {
    this.rawProducts = rawProductsData;
    this.categoryData = categoryData;
  }

  // Map Cockpit3D categories to our categories
  mapCategory(cockpitCategoryName, productName) {
    const name = productName.toLowerCase();
    
    // Our category mapping logic
    if (name.includes('keychain')) return ['accessories'];
    if (name.includes('ornament')) return ['christmas', 'holiday'];
    if (name.includes('heart')) return ['anniversary', 'weddings'];
    if (name.includes('cat') || name.includes('dog')) return ['pet'];
    if (name.includes('memorial') || name.includes('urn')) return ['memorial'];
    if (name.includes('necklace') || name.includes('bracelet')) return ['accessories'];
    if (name.includes('lightbase') || name.includes('light base')) return ['accessories'];
    if (name.includes('candle')) return ['memorial'];
    if (name.includes('graduation')) return ['graduation'];
    if (name.includes('birthday')) return ['birthday'];
    
    // Default mapping
    return ['home-decor'];
  }

  // Generate slug from product name
  generateSlug(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  // Map Cockpit3D options to our option structure
  mapOptions(cockpitOptions) {
    const mappedOptions = {
      sizes: [],
      backgroundOptions: [],
      lightBases: [],
      textOptions: [],
      giftStand: []
    };

    cockpitOptions.forEach(option => {
      const optionName = option.name.toLowerCase();
      
      if (optionName.includes('size') && option.values) {
        mappedOptions.sizes = option.values.map((value, index) => ({
          id: this.generateSlug(value.name),
          name: value.name,
          price: this.extractPrice(value) || (index * 20), // Base pricing logic
          faces: this.extractFaces(value.name) || '1-2'
        }));
      }
      
      if (optionName.includes('backdrop') || optionName.includes('background')) {
        if (!mappedOptions.backgroundOptions.length) {
          mappedOptions.backgroundOptions = [
            { id: 'rm', name: 'Remove Backdrop', price: 0 },
            { id: '2d', name: '2D Backdrop', price: 12 },
            { id: '3d', name: '3D Backdrop', price: 15 }
          ];
        }
      }
      
      if (optionName.includes('light base') && option.values) {
        mappedOptions.lightBases = [
          { id: 'none', name: 'No Base', price: 0 },
          ...option.values.map(value => ({
            id: this.generateSlug(value.name),
            name: value.name,
            price: this.extractPrice(value) || 25
          }))
        ];
      }
      
      if (optionName.includes('text') || optionName.includes('customer text')) {
        mappedOptions.textOptions = [
          { id: 'none', name: 'No Text', price: 0 },
          { id: 'customText', name: 'Custom Text', price: 9.50 }
        ];
      }
    });

    return mappedOptions;
  }

  // Extract price from value object
  extractPrice(value) {
    if (value.change_qty && typeof value.change_qty === 'number') {
      return value.change_qty;
    }
    return null;
  }

  // Extract face count from size name
  extractFaces(sizeName) {
    const match = sizeName.match(/(\d+)(?:\s*faces?|\s*face)/i);
    return match ? `1-${match[1]}` : null;
  }

  // Generate image path based on Cockpit3D photo
  generateImagePath(cockpitPhoto, productId) {
    if (!cockpitPhoto) return '/img/products/placeholder.jpg';
    
    // Extract filename from Cockpit3D path
    const filename = cockpitPhoto.split('/').pop();
    const extension = filename.split('.').pop();
    
    // Create our standardized filename
    return `/img/products/cockpit3d_${productId}.${extension}`;
  }

  // Main mapping function
  mapProduct(cockpitProduct, categoryName) {
    const mappedOptions = this.mapOptions(cockpitProduct.options || []);
    
    // Determine if product requires image
    const requiresImage = !cockpitProduct.name.toLowerCase().includes('lightbase') && 
                         !cockpitProduct.name.toLowerCase().includes('stand');
    
    return {
      id: parseInt(cockpitProduct.id),
      name: cockpitProduct.name,
      slug: this.generateSlug(cockpitProduct.name),
      basePrice: parseFloat(cockpitProduct.price),
      categories: this.mapCategory(categoryName, cockpitProduct.name),
      description: this.generateDescription(cockpitProduct.name, categoryName),
      shortDescription: this.generateShortDescription(cockpitProduct.name),
      longDescription: this.generateLongDescription(cockpitProduct.name),
      productMask: requiresImage ? [{ src: this.generateMaskPath(cockpitProduct.name) }] : [],
      images: [{
        id: '1',
        src: this.generateImagePath(cockpitProduct.photo, cockpitProduct.id),
        isMain: true
      }],
      sizes: mappedOptions.sizes,
      backgroundOptions: mappedOptions.backgroundOptions,
      lightBases: mappedOptions.lightBases,
      textOptions: mappedOptions.textOptions,
      giftStand: mappedOptions.giftStand,
      requiresImage: requiresImage
    };
  }

  // Generate description based on product type
  generateDescription(name, category) {
    const productType = name.toLowerCase();
    
    if (productType.includes('heart')) {
      return "A timeless symbol of love, this crystal heart beautifully captures cherished memories in stunning detail. Perfect for anniversaries, weddings, or Valentine's Day.";
    }
    
    if (productType.includes('keychain')) {
      return "A portable crystal keepsake that keeps your memories close. Perfect for gifts or personal remembrance.";
    }
    
    if (productType.includes('ornament')) {
      return "A beautiful crystal ornament that captures special moments in stunning detail. Perfect for holiday decorating or year-round display.";
    }
    
    if (productType.includes('lightbase')) {
      return "Premium LED light base designed to illuminate and enhance your crystal displays with beautiful lighting effects.";
    }
    
    return `Beautiful ${name.toLowerCase()} crystal creation, expertly crafted to preserve your most cherished memories.`;
  }

  generateShortDescription(name) {
    return this.generateDescription(name).substring(0, 150) + '...';
  }

  generateLongDescription(name) {
    return `<p>Expertly crafted using advanced laser engraving technology, this ${name.toLowerCase()} transforms your photos into stunning 3D art. Each piece is carefully created to highlight every detail with remarkable clarity.</p><p>Perfect for gifting or personal keepsakes, this crystal creation will be treasured for years to come.</p>`;
  }

  generateMaskPath(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('heart')) return '/img/masks/3d_crystal_heart.png';
    if (name.includes('rectangle')) return '/img/masks/3d_crystal_picture.png';
    if (name.includes('cat')) return '/img/masks/cat_shape_large.png';
    if (name.includes('ornament')) return '/img/masks/2d-ornament-mask.png';
    
    return '/img/masks/3d_crystal_picture.png'; // Default mask
  }

  // Convert all products
  mapAllProducts() {
    const mappedProducts = [];
    
    this.categoryData.forEach(category => {
      if (category.products) {
        category.products.forEach(product => {
          const mapped = this.mapProduct(product, category.name);
          mappedProducts.push(mapped);
        });
      }
    });
    
    return mappedProducts;
  }
}

export default Cockpit3DMapper;