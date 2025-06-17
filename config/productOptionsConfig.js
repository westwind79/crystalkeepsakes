// config/productOptionsConfig.js
// FIXED VERSION - DIRECT PRICING FROM DATA ONLY
// ALL prices come from the cockpit3d-products.js file

/**
 * OPTION TYPES - Defines the form element type and behavior
 */
export const OPTION_TYPES = {
  TEXT_INPUT: 'text_input',
  RADIO_BUTTONS: 'radio_buttons', 
  CHECKBOX: 'checkbox',
  SELECT_DROPDOWN: 'select_dropdown',
  IMAGE_UPLOAD: 'image_upload'
};

/**
 * PRICING TYPES - How the option affects pricing
 */
export const PRICING_TYPES = {
  FIXED_PRICE: 'fixed_price',      // Adds fixed amount (+$10.00)
  REPLACE_BASE: 'replace_base',    // Replaces base price entirely  
  PERCENTAGE: 'percentage',        // Adds percentage of base (+15%)
  FREE: 'free'                     // No additional cost
};

/**
 * STANDARD OPTIONS - Only used when needed (image upload for products that require it)
 */
export const STANDARD_OPTIONS = {
  IMAGE_UPLOAD: {
    id: 'image_upload',
    name: 'Photo Upload',
    type: OPTION_TYPES.IMAGE_UPLOAD,
    required: true,
    validation: { errorMessage: 'Please upload an image' }
  }
};

// Lightbase pricing lookup table from cockpit3d data
// const LIGHTBASE_PRICES = {
//   'Lightbase Rectangle': 25,
//   'Lightbase Square': 25,
//   'Lightbase Wood Small': 60,
//   'Lightbase Wood Medium': 60,
//   'Lightbase Wood Long': 60,
//   'Rotating LED Lightbase': 35,
//   'Wooden Premium Base Mini': 60,
//   'Concave Lightbase': 39,
//   'Ornament Stand': 25
// };

// Service pricing lookup
// const SERVICE_PRICES = {
//   '24': 65,
//   '48': 35,
//   'red_carpet': 65,
//   'jump': 35,
//   'pop_card': 15,
//   'digital_preview': 15
// };

/**
 * COCKPIT3D OPTION MAPPING - SIMPLIFIED
 */
export const COCKPIT3D_MAPPINGS = {
  
  /**
   * Determines the UI type based on option name
   */
  detectUIType(optionName) {
    const name = optionName.toLowerCase();
    
    if (name.includes('figure') || name.includes('face') || name.includes('faces')) {
      return OPTION_TYPES.SELECT_DROPDOWN;
    }
    if (name.includes('lightbase') || name.includes('light_base')) {
      return OPTION_TYPES.SELECT_DROPDOWN;
    }
    if (name.includes('backdrop') && (name.includes('2d') || name.includes('3d'))) {
      return OPTION_TYPES.RADIO_BUTTONS;
    }
    if (name.includes('digital') && name.includes('preview')) {
      return OPTION_TYPES.CHECKBOX;
    }
    if (name.includes('custom_design')) {
      return OPTION_TYPES.RADIO_BUTTONS;
    }
    if (name.includes('text') || name.includes('customer_text')) {
      return OPTION_TYPES.TEXT_INPUT;
    }
    if (this.detectSizeOption(optionName)) {
      return OPTION_TYPES.RADIO_BUTTONS;
    }
    
    // Default
    return OPTION_TYPES.RADIO_BUTTONS;
  },

  /**
   * Detect if option is a size option
   */
  detectSizeOption(optionName) {
    const name = optionName.toLowerCase();
    const sizeIndicators = [
      'size', 'small', 'medium', 'large', 'xl', 'xxl',
      'mini', 'prestige', 'inch', 'cm', 'x'
    ];
    return sizeIndicators.some(indicator => name.includes(indicator));
  },



  /**
   * Main mapping function - SIMPLIFIED
   */
  mapOption(cockpitOption, catalog = [], currentProduct = null) {
    const baseOption = {
      id: cockpitOption.id,
      name: cockpitOption.name,
      required: cockpitOption.required || false
    };

    console.log(`🔧 Mapping option: ${cockpitOption.name}`);

    // Handle options without values (text inputs, etc.)
    if (!Array.isArray(cockpitOption.values) || cockpitOption.values.length === 0) {
      if (cockpitOption.name.toLowerCase().includes('digital') && 
          cockpitOption.name.toLowerCase().includes('preview')) {
        return {
          ...baseOption,
          type: OPTION_TYPES.CHECKBOX,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: 15,
          displayPrice: '+$15.00',
          description: 'Get a digital preview before production'
        };
      }
      
      return {
        ...baseOption,
        type: OPTION_TYPES.TEXT_INPUT,
        pricingType: PRICING_TYPES.FREE,
        priceChange: 0,
        displayPrice: 'Included',
        placeholder: `Enter ${cockpitOption.name.toLowerCase()}`,
        validation: {
          maxLength: 100,
          errorMessage: `Please enter ${cockpitOption.name.toLowerCase()}`
        }
      };
    }

    // Handle options with values
    const uiType = this.detectUIType(cockpitOption.name);
    const isSize = this.detectSizeOption(cockpitOption.name);
    
    // Special handling for service options
    if (cockpitOption.name.toLowerCase().includes('service') || 
        cockpitOption.name.toLowerCase().includes('queue')) {
      
      const serviceValues = [
        { 
          id: 'none', 
          name: 'Standard Processing', 
          pricingType: PRICING_TYPES.FREE, 
          priceChange: 0, 
          displayPrice: 'Included' 
        }
      ];
      
      cockpitOption.values.forEach(value => {
        const serviceName = value.name.toLowerCase();
        let displayName = value.name;
        let price = parseFloat(value.price || 0);
        
        // Check service pricing if no price in data
        if (price === 0) {
          if (serviceName.includes('24') || serviceName.includes('red_carpet')) {
            price = 65;
          } else if (serviceName.includes('48') || serviceName.includes('jump')) {
            price = 35;
          }
        }
        
        if (serviceName.includes('48') || serviceName.includes('jump')) {
          displayName = '48 Hour Rush Service';
        } else if (serviceName.includes('24') || serviceName.includes('red_carpet')) {
          displayName = '24 Hour Rush Service';
        }
        
        serviceValues.push({
          id: value.id,
          name: displayName,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: price,
          displayPrice: price > 0 ? `+${price.toFixed(2)}` : 'Included'
        });
      });
      
      return {
        ...baseOption,
        name: 'Processing Speed',
        type: OPTION_TYPES.RADIO_BUTTONS,
        values: serviceValues,
        displayStyle: 'toggle',
        validation: cockpitOption.required ? {
          errorMessage: 'Please select processing speed'
        } : undefined
      };
    }
    
    // Regular options with values - prices come from data
    const mappedValues = cockpitOption.values.map(value => {
      // Prices should come from the data structure, not calculated
      let price = 0;
      let pricingType = PRICING_TYPES.FIXED_PRICE;
      
      if (isSize) {
        pricingType = PRICING_TYPES.REPLACE_BASE;
        // For sizes, price should be in the product.sizes array or value itself
        price = parseFloat(value.price || 0);
      } else {
        // For other options, price should be in the value or lookup tables
        price = parseFloat(value.price || 0);
        if (price === 0 && LIGHTBASE_PRICES[value.name]) {
          price = LIGHTBASE_PRICES[value.name];
        }
        if (price === 0 && SERVICE_PRICES[value.name.toLowerCase()]) {
          price = SERVICE_PRICES[value.name.toLowerCase()];
        }
      }
      
      console.log(`💰 Option "${value.name}" price: ${price}`);
      
      return {
        id: value.id,
        name: value.name,
        pricingType,
        priceChange: price,
        displayPrice: price === 0 ? 'Included' : 
                     isSize ? `${price.toFixed(2)}` : 
                     `+${price.toFixed(2)}`
      };
    });

    // Add "No base" option for lightbase
    if (cockpitOption.name.toLowerCase().includes('light') && 
        cockpitOption.name.toLowerCase().includes('base')) {
      
      mappedValues.unshift({
        id: 'none',
        name: 'No base',
        pricingType: PRICING_TYPES.FIXED_PRICE,
        priceChange: 0,
        displayPrice: 'Included'
      });
    }

    let displayStyle = null;
    if (uiType === OPTION_TYPES.RADIO_BUTTONS) {
      if (isSize) {
        displayStyle = 'size_selector';
      } else if (cockpitOption.name.toLowerCase().includes('backdrop') || 
                 cockpitOption.name.toLowerCase().includes('preview')) {
        displayStyle = 'toggle';
      }
    }

    return {
      ...baseOption,
      type: uiType,
      values: mappedValues,
      displayStyle,
      placeholder: uiType === OPTION_TYPES.SELECT_DROPDOWN ? 
        this.getSelectPlaceholder(cockpitOption.name) : undefined,
      validation: cockpitOption.required ? {
        errorMessage: `Please select ${cockpitOption.name.toLowerCase()}`
      } : undefined
    };
  },

  /**
   * Get placeholder text for select dropdowns
   */
  getSelectPlaceholder(optionName) {
    const name = optionName.toLowerCase();
    if (name.includes('figure') || name.includes('face')) {
      return 'Choose number of faces';
    }
    if (name.includes('lightbase')) {
      return 'Choose light base';
    }
    return 'Choose option';
  },

  /**
   * Check if product requires image upload
   */
  requiresImage(product) {
    if (!product?.name) return true;
    
    const productName = product.name.toLowerCase();
    const nonImageProducts = [
      'lightbase', 'light_base', 'stand', 'base', 'backdrop', 'card', 'gift_note'
    ];
    
    return !nonImageProducts.some(item => productName.includes(item));
  },

  /**
   * Remove duplicate options
   */
  deduplicateOptions(mappedOptions) {
    const seen = new Set();
    return mappedOptions.filter(option => {
      const key = option.name.toLowerCase();
      if (seen.has(key)) {
        console.log(`🗑️ Removing duplicate option: ${option.name}`);
        return false;
      }
      seen.add(key);
      return true;
    });
  }
};

/**
 * PRICING CALCULATOR - SIMPLIFIED
 */
export class PricingCalculator {
  constructor(basePrice) {
    this.basePrice = basePrice || 0;
  }

  calculateTotal(selectedOptions, productOptions) {
    console.log(`💰 Calculating total price - base: ${this.basePrice}`);
    
    let totalPrice = 0;
    let hasSelectedSize = false;

    productOptions.forEach(option => {
      const selectedValue = selectedOptions[option.id];
      if (!selectedValue) return;

      switch (option.type) {
        case OPTION_TYPES.RADIO_BUTTONS:
        case OPTION_TYPES.SELECT_DROPDOWN:
          const selectedValueObj = option.values?.find(v => v.id === selectedValue);
          if (selectedValueObj) {
            console.log(`💰 Adding ${selectedValueObj.name}: ${selectedValueObj.priceChange}`);
            if (selectedValueObj.pricingType === PRICING_TYPES.REPLACE_BASE) {
              totalPrice = selectedValueObj.priceChange;
              hasSelectedSize = true;
            } else {
              totalPrice += selectedValueObj.priceChange || 0;
            }
          }
          break;

        case OPTION_TYPES.CHECKBOX:
          if (selectedValue === true) {
            console.log(`💰 Adding checkbox option: ${option.priceChange}`);
            totalPrice += option.priceChange || 0;
          }
          break;
      }
    });

    // Add base price if no size was selected
    if (!hasSelectedSize) {
      totalPrice += this.basePrice;
    }

    console.log(`💰 Final total: ${totalPrice}`);
    return Math.round(totalPrice * 100) / 100;
  }
}

/**
 * OPTION VALIDATION
 */
export class OptionValidator {
  validateOptions(selectedOptions, productOptions) {
    const errors = {};

    productOptions.forEach(option => {
      const selectedValue = selectedOptions[option.id];
      
      if (option.required) {
        if (!selectedValue || 
            (typeof selectedValue === 'string' && selectedValue.trim() === '') ||
            (Array.isArray(selectedValue) && selectedValue.length === 0)) {
          errors[option.id] = option.validation?.errorMessage || `${option.name} is required`;
        }
      }

      // Validate text length
      if (option.type === OPTION_TYPES.TEXT_INPUT && selectedValue) {
        const maxLength = option.validation?.maxLength;
        if (maxLength && selectedValue.length > maxLength) {
          errors[option.id] = `${option.name} must be ${maxLength} characters or less`;
        }
      }
    });

    return errors;
  }
}