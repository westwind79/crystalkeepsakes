// pages/ProductDetail2.jsx - COMPLETELY CLEAN VERSION
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { Container, Row, Col, Alert, Button, Form } from 'react-bootstrap';

import { useCart } from '../contexts/CartContext';
import { normalizeCockpitProduct } from '../utils/normalizeCockpitProducts';
import { getSizePricing } from '../data/size-pricing';

import { 
  OPTION_TYPES, 
  PRICING_TYPES,
  STANDARD_OPTIONS, 
  COCKPIT3D_MAPPINGS,
  PricingCalculator,
  OptionValidator
} from '../../config/productOptionsConfig';

import { PageLayout } from '../components/layout/PageLayout';
import ProductGallery2 from '../components/product/ProductGallery2';
import ImageEditor2 from '../components/product/ImageEditor2';
import gsap from 'gsap';
 

const getProductImages = (product) => {
  // Method 1: Check merged product images array (multiple images)
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PRODUCTDETAIL2: Using product.images array:', product.images.length, 'images');
      console.log('✅ PRODUCTDETAIL2: Images data:', product.images);
    }
    return product.images;
  }
  
  // Method 2: Check legacy photo property (single image)
  if (product.photo) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ PRODUCTDETAIL2: Using legacy product.photo:', product.photo);
    }
    return [{ src: product.photo, isMain: true }];
  }
  
  // Method 3: No images available
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ PRODUCTDETAIL2: No images found, will show placeholder');
  }
  return [];
};

// Enhanced ProductGallery2 wrapper with fallback
const ProductImageDisplay = ({ product, finalImage }) => {
  const images = getProductImages(product);
  
  // Show final/edited image if available
  if (finalImage) {
    return (
      <div className="saved-image-preview">
        <h4>Saved Image Preview:</h4>
        <img src={finalImage} alt="Final design" className="img-fluid rounded shadow" />
      </div>
    );
  }
  
  // Show gallery if we have images
  if (images.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 PRODUCTDETAIL2: Rendering ProductGallery2 with', images.length, 'images');
    }
    return <ProductGallery2 images={images} />;
  }
  
  // Fallback to placeholder with debugging
  const fallbackSrc = `https://placehold.co/600x400/e9ecef/6c757d?text=${encodeURIComponent(product.name)}`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 PRODUCTDETAIL2: Using fallback placeholder:', fallbackSrc);
  }
  
  return (
    <div className="bg-light p-5 rounded text-center">
      <img 
        src={fallbackSrc}
        alt={`${product.name} placeholder`}
        className="img-fluid rounded shadow"
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ PRODUCTDETAIL2: Placeholder loaded successfully');
          }
        }}
        onError={(e) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ PRODUCTDETAIL2: Even placeholder failed, showing icon');
          }
          // Hide broken image and show icon instead
          e.target.style.display = 'none';
          e.target.nextElementSibling.style.display = 'block';
        }}
      />
      <div style={{ display: 'none' }}>
        <ImageIcon size={48} className="text-muted mb-2" />
        <p className="text-muted">No image available</p>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <small className="text-muted d-block mt-2">
          Debug: No product.photo or product.images found - showing placeholder
        </small>
      )}
    </div>
  );
};

// Enhanced cart item preparation for merged products
const prepareCartItem = (product, selectedOptions, finalImage, totalPrice) => {
  const cartItem = {
    productId: product.id,
    name: product.name,
    price: totalPrice,
    quantity: 1,
    options: {
      ...selectedOptions,
      imageUrl: finalImage || selectedOptions.imageUrl
    },
    dateAdded: new Date().toISOString()
  };

  // Add enhanced size information to cart
  if (selectedOptions.size && product.sizes) {
    const selectedSize = product.sizes.find(s => s.id === selectedOptions.size);
    if (selectedSize) {
      cartItem.sizeDetails = {
        name: selectedSize.name,
        price: selectedSize.price,
        originalPrice: selectedSize.originalPrice || null
      };
    }
  }

  // Add cockpit3d_id if this is a merged product
  if (product.cockpit3d_id) {
    cartItem.cockpit3d_id = product.cockpit3d_id;
    console.log('🔗 Added cockpit3d_id to cart item:', product.cockpit3d_id);
  }

  if (product.sku) {
    cartItem.sku = product.sku;
  }

  console.log('🛒 Enhanced cart item with size pricing:', cartItem);
  return cartItem;
};


// FIXED DEFAULT OPTIONS HOOK
const useDefaultOptions = (product, selectedOptions, setSelectedOptions) => {
  useEffect(() => {
    if (product && Object.keys(selectedOptions).length === 0) {
      const defaultOptions = {};
      
      // Auto-select first size (handles both static and merged products)
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        defaultOptions.size = product.sizes[0].id;
        console.log('🎯 Auto-selected default size:', product.sizes[0].name, '$' + product.sizes[0].price);
      }
      
      // Auto-select "No base" for lightbase (handles merged lightBase options)
      if (product.lightBases && Array.isArray(product.lightBases) && product.lightBases.length > 0) {
        const noBaseOption = product.lightBases.find(base => 
          base.id === 'none' || base.name.toLowerCase().includes('no base')
        );
        if (noBaseOption) {
          defaultOptions.lightBase = noBaseOption.id;
          console.log('🔗 Auto-selected no base option:', noBaseOption.name);
        }
      }
      
      // Auto-select first background (handles merged backgroundOptions)
      if (product.backgroundOptions && Array.isArray(product.backgroundOptions) && product.backgroundOptions.length > 0) {
        defaultOptions.background = product.backgroundOptions[0].id;
        console.log('🎨 Auto-selected background:', product.backgroundOptions[0].name);
      }
      
      // Auto-select standard processing
      defaultOptions.processingSpeed = 'standard';
      
      if (Object.keys(defaultOptions).length > 0) {
        setSelectedOptions(defaultOptions);
        console.log('✅ Set default options for merged product:', defaultOptions);
      }
    }
  }, [product, setSelectedOptions]);
};

function useCatalogData() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        // Use the default export from the dynamic import
        const jsModule = await import(`../data/final-product-list.js`);
        const catalogData = jsModule.finalProductList;
        
        if (catalogData && Array.isArray(catalogData)) {
          setCatalog(catalogData);
          console.log('✅ Products loaded:', catalogData.length);
        } else {
          throw new Error('No valid products data found');
        }
      } catch (err) {
        console.error('Products load error:', err);
        setError(`Failed to load products: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  return { catalog, loading, error };
}
// PRODUCT LOOKUP
function getProductFromCatalog(slug, catalog) {
  if (!catalog || !Array.isArray(catalog)) return null;
  
  for (const product of catalog) {
    const productSlug = product.slug || product.name?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (productSlug === slug) {
      return {
        ...product,
        slug: productSlug,
        basePrice: product.basePrice || parseFloat(product.price || 89),
        requiresImage: product.requiresImage !== undefined ? product.requiresImage : COCKPIT3D_MAPPINGS.requiresImage(product)
      };
    }
  }
  
  return null;
}

// OPTION COMPONENTS
const TextInputOption = ({ option, selectedValue, onChange, error, hasAttemptedSubmit }) => {
  const handleChange = (e) => {
    const value = e.target.value.replace(/<[^>]*>/g, '');
    onChange(option.id, value);
  };

  return (
    <Form.Group className="product-option pt-2 mt-2">
      <Form.Label className="h5" htmlFor={`option-${option.id}`}>
        {option.required && <span className="text-danger">* </span>}
        {option.name}
        {option.priceChange > 0 && (
          <span className="option-price ms-2 text-success">{option.displayPrice}</span>
        )}
      </Form.Label>
      
      {hasAttemptedSubmit && error && (
        <div className="text-danger small">{error}</div>
      )}
      
      <Form.Control
        type="text"
        id={`option-${option.id}`}
        placeholder={option.placeholder}
        value={selectedValue || ''}
        onChange={handleChange}
        isInvalid={!!error}
        maxLength={option.validation?.maxLength}
      />
      
      {option.validation?.maxLength && (
        <Form.Text className="text-light">
          Characters: {(selectedValue || '').length}/{option.validation.maxLength}
        </Form.Text>
      )}
    </Form.Group>
  );
};

const RadioButtonOption = ({ option, selectedValue, onChange, error, hasAttemptedSubmit }) => {
  if (option.displayStyle === 'toggle') {
    return (
      <Form.Group className="product-option pt-2 mt-2">
        <Form.Label className="h5">
          {option.required && <span className="text-danger">* </span>}
          {option.name}
        </Form.Label>
        
        {hasAttemptedSubmit && error && (
          <div className="text-danger small">{error}</div>
        )}
        
        <div className="d-flex gap-2 mt-2">
          {option.values?.map(value => (
            <button
              key={value.id}
              type="button"
              className={`btn ${selectedValue === value.id ? 'btn-primary' : 'btn-outline-secondary'} flex-fill`}
              onClick={() => onChange(option.id, value.id)}
            >
              <div>{value.name}</div>
              {value.displayPrice && value.displayPrice !== 'Included' && (
                <small className="d-block">{value.displayPrice}</small>
              )}
            </button>
          ))}
        </div>
      </Form.Group>
    );
  }

  // Replace the size_selector section with this:
  if (option.displayStyle === 'size_selector') {
    return (
      <Form.Group className="product-option pt-2 mt-2">
        <Form.Label className="h5">
          {option.required && <span className="text-danger">* </span>}
          {option.name}
        </Form.Label>
        
        {hasAttemptedSubmit && error && (
          <div className="text-danger small">{error}</div>
        )}
        
        <div className="row g-2 mt-2">
          {option.values?.map(value => (
            <div key={value.id} className="col-6 col-md-4">
              <button
                type="button"
                className={`btn w-100 ${selectedValue === value.id ? 'btn-primary' : 'btn-outline-secondary'} d-flex flex-column align-items-center p-3`}
                onClick={() => onChange(option.id, value.id)}
              >
                <div className="fw-bold text-center">{value.name}</div>
                <div className="size-pricing mt-1 text-center">
                  <div className="current-price text-success fw-bold">{value.displayPrice}</div>
                  {value.originalPrice && (
                    <div className="original-price text-muted" style={{textDecoration: 'line-through', fontSize: '0.8em'}}>
                      {value.originalPrice}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </Form.Group>
    );
  }

  return (
    <Form.Group className="product-option pt-2 mt-2">
      <fieldset>
        <legend className="h5">
          {option.name}
          {option.required && <span className="text-danger"> *</span>}
        </legend>
        
        {hasAttemptedSubmit && error && (
          <div className="text-danger small mb-2">{error}</div>
        )}
        
        {option.values?.map(value => (
          <label key={value.id} className="crystal-radio">
            <span className="h6">{value.name}</span>
            <span className="option-price ms-2">
              {value.priceChange === 0 ? (
                <span className="option-price__included">(Included)</span>
              ) : (
                <span className="option-price__additional text-success">
                  ${value.priceChange.toFixed(2)}
                </span>
              )}
            </span>
            
            <input
              type="radio"
              id={`option-${option.id}-${value.id}`}
              name={`option-${option.id}`}
              checked={selectedValue === value.id}
              onChange={() => onChange(option.id, value.id)}
              required={option.required}
            />
            <span className="radio-checkmark"></span>
          </label>
        ))}
      </fieldset>
    </Form.Group>
  );
};

const SelectDropdownOption = ({ option, selectedValue, onChange, error, hasAttemptedSubmit }) => {
  return (
    <Form.Group className="product-option pt-2 mt-2">
      <Form.Label className="h5" htmlFor={`option-${option.id}`}>
        {option.required && <span className="text-danger">* </span>}
        {option.name}
      </Form.Label>
      
      {hasAttemptedSubmit && error && (
        <div className="text-danger small">{error}</div>
      )}
      
      <Form.Select
        id={`option-${option.id}`}
        value={selectedValue || ''}
        onChange={(e) => onChange(option.id, e.target.value || null)}
        isInvalid={hasAttemptedSubmit && !!error}
      >
        <option value="">{option.placeholder || 'Choose option'}</option>
        {option.values?.map(value => (
          <option key={value.id} value={value.id}>
            {value.name} {value.displayPrice && value.displayPrice !== 'Included' ? `(${value.displayPrice})` : ''}
          </option>
        ))}
      </Form.Select>
      
      {selectedValue && (
        <div className="mt-1">
          {(() => {
            const selected = option.values?.find(v => v.id === selectedValue);
            if (selected && selected.priceChange > 0) {
              return <small className="text-success">{selected.displayPrice}</small>;
            }
            return null;
          })()}
        </div>
      )}
    </Form.Group>
  );
};

const CheckboxOption = ({ option, selectedValue, onChange, error, hasAttemptedSubmit }) => {
  return (
    <Form.Group className="product-option pt-2 mt-2">
      <Form.Label htmlFor={`option-${option.id}`} className="d-flex justify-content-start align-items-center">
        <Form.Check
          type="checkbox"
          id={`option-${option.id}`}
          checked={selectedValue || false}
          onChange={(e) => onChange(option.id, e.target.checked)}
        />
        <span className="h5 ms-2">
          {option.name}
          {option.priceChange > 0 && (
            <span className="option-price ms-2 text-success">{option.displayPrice}</span>
          )}
        </span>
      </Form.Label>
      
      {hasAttemptedSubmit && error && (
        <div className="text-danger small">{error}</div>
      )}
    </Form.Group>
  );
};

const StickyPriceBar = ({ totalPrice, onAddToCart, isAddingToCart, isMainButtonVisible }) => {
  return (
    <div 
      className={`sticky-price-bar position-fixed bottom-0 start-0 end-0 text-white p-3 shadow-lg ${isMainButtonVisible ? 'fade-out' : ''}`}
      style={{ 
        zIndex: 1050,
        opacity: isMainButtonVisible ? 0 : 1,
        visibility: isMainButtonVisible ? 'hidden' : 'visible',
        transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out'
      }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-6">
            <div className="h3 mb-0">Total: ${totalPrice.toFixed(2)}</div>
          </div>
          <div className="col-6">
            <Button 
              variant="light" 
              size="sm" 
              className="w-100 fw-bold"
              onClick={onAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const useIntersectionObserver = (ref, product) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!product) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, product]);

  return isVisible;
};

// PRODUCT OPTIONS RENDERER
export const ProductOptionsRenderer = ({
  product,
  selectedOptions,
  onOptionChange,
  errors = {},
  hasAttemptedSubmit = false,
  className = ""
}) => {
  
  // DETECT LIGHTBASE PRODUCTS - Use compiled data structure
  const isLightbaseProduct = product && (
    product.requiresImage === false && 
    (!product.sizes || product.sizes.length === 0)
  );
  
  console.log('🔍 Product type detection:', {
    name: product?.name,
    requiresImage: product?.requiresImage,
    sizesLength: product?.sizes?.length || 0,
    isLightbase: isLightbaseProduct
  });

  // EARLY RETURN FOR LIGHTBASE PRODUCTS - NO OPTIONS NEEDED
  if (isLightbaseProduct) {
    console.log('🎯 Lightbase product detected - showing simple add to cart only');
    return (
      <div className={`product-options-simple ${className}`}>
        <div className="alert alert-info">
          <small>This is a ready-to-use lightbase product - no customization needed!</small>
        </div>
      </div>
    );
  }
  const getProductOptions = () => {
    if (!product) return [];
    const options = [];

    // SIZE OPTIONS (Crystal products only)
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      options.push({
        id: 'size',
        name: 'Size',
        type: OPTION_TYPES.RADIO_BUTTONS,
        required: true,
        displayStyle: 'size_selector',
        values: product.sizes.map(size => {
          const pricing = getSizePricing(size.name);
          return {
            id: size.id,
            name: size.name,
            pricingType: PRICING_TYPES.REPLACE_BASE,
            priceChange: pricing.price,
            displayPrice: `$${pricing.price.toFixed(2)}`,
            originalPrice: pricing.originalPrice ? `$${pricing.originalPrice.toFixed(2)}` : null
          };
        }),
        validation: { errorMessage: 'Please select a size' }
      });
    }

    // LIGHTBASE OPTIONS (Crystal products only - to add a lightbase)
    if (product.lightBases && Array.isArray(product.lightBases) && product.lightBases.length > 0) {
      options.push({
        id: 'lightBase',
        name: 'Light Base',
        type: OPTION_TYPES.SELECT_DROPDOWN,
        required: false,
        placeholder: 'Choose light base',
        values: product.lightBases.map(base => ({
          id: base.id,
          name: base.name,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: parseFloat(base.price || 0),
          displayPrice: parseFloat(base.price || 0) === 0 ? 'Included' : `+$${parseFloat(base.price || 0).toFixed(2)}`
        }))
      });
    }

    // BACKGROUND OPTIONS (Crystal products only)
    if (product.backgroundOptions && Array.isArray(product.backgroundOptions) && product.backgroundOptions.length > 0) {
      options.push({
        id: 'background',
        name: 'Background Style',
        type: OPTION_TYPES.RADIO_BUTTONS,
        required: true,
        displayStyle: 'toggle',
        values: product.backgroundOptions.map(bg => ({
          id: bg.id,
          name: bg.name,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: parseFloat(bg.price || 0),
          displayPrice: parseFloat(bg.price || 0) === 0 ? 'Included' : `+$${parseFloat(bg.price || 0).toFixed(2)}`
        })),
        validation: { errorMessage: 'Please select a background style' }
      });
    }

    // TEXT OPTIONS (Crystal products only)
    if (product.textOptions && Array.isArray(product.textOptions) && product.textOptions.length > 0) {
      const customTextOption = product.textOptions.find(opt => 
        opt.name.toLowerCase().includes('custom') || opt.id === 'customText'
      );
      if (customTextOption && parseFloat(customTextOption.price || 0) > 0) {
        options.push({
          id: 'customText',
          name: 'Custom Text',
          type: OPTION_TYPES.TEXT_INPUT,
          required: false,
          placeholder: 'Enter custom text (optional)',
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: parseFloat(customTextOption.price || 0),
          validation: { maxLength: 50 }
        });
      }
    }

    // PROCESSING SPEED (All crystal products)
    options.push({
      id: 'processingSpeed',
      name: 'Processing Speed',
      type: OPTION_TYPES.RADIO_BUTTONS,
      required: true,
      displayStyle: 'toggle',
      values: [
        {
          id: 'standard',
          name: 'Standard (7-10 days)',
          pricingType: PRICING_TYPES.FREE,
          priceChange: 0,
          displayPrice: 'Included'
        },
        {
          id: 'rush48',
          name: 'Rush (2-3 days)',
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: 35,
          displayPrice: '+$35.00'
        },
        {
          id: 'rush24',
          name: 'Express (1-2 days)',
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: 65,
          displayPrice: '+$65.00'
        }
      ],
      validation: { errorMessage: 'Please select processing speed' }
    });

    return options;
  };

  const productOptions = getProductOptions();

// RENDER OPTION COMPONENTS - Use existing components directly
  const renderOption = (option) => {
    const props = {
      option,
      error: errors[option.id],
      hasAttemptedSubmit,
      selectedValue: selectedOptions[option.id],
      onChange: (optionId, value) => onOptionChange(optionId, value)
    };

    switch (option.type) {
      case OPTION_TYPES.TEXT_INPUT:
        return <TextInputOption key={option.id} {...props} />;
      case OPTION_TYPES.SELECT_DROPDOWN:
        return <SelectDropdownOption key={option.id} {...props} />;
      case OPTION_TYPES.RADIO_BUTTONS:
        return <RadioButtonOption key={option.id} {...props} />;
      case OPTION_TYPES.CHECKBOX:
        return <CheckboxOption key={option.id} {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className={`product-options ${className}`}>
      {productOptions
        .filter(option => option.type !== OPTION_TYPES.IMAGE_UPLOAD)
        .map(renderOption)}
    </div>
  );
};

// Enhanced pricing hook for new size structure
export const useProductPricing = (product, selectedOptions) => {
  const calculator = useMemo(() => {
    if (!product) return null;
    return new PricingCalculator(product.basePrice || 89);
  }, [product]);

  const totalPrice = useMemo(() => {
    if (!calculator || !product) return 89;
    
    const productOptions = [];
    
    // Handle sizes with new pricing structure
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
      productOptions.push({
        id: 'size',
        type: OPTION_TYPES.RADIO_BUTTONS,
        values: product.sizes.map(size => {
          // Get pricing from the pricing file
          const pricing = getSizePricing(size.name);
          
          return {
            id: size.id,
            name: size.name,
            pricingType: PRICING_TYPES.REPLACE_BASE,
            priceChange: pricing.price,
            originalPrice: pricing.originalPrice
          };
        })
      });
    }

    // Handle lightbases (same as before)
    if (product.lightBases && Array.isArray(product.lightBases) && product.lightBases.length > 0) {
      productOptions.push({
        id: 'lightBase',
        type: OPTION_TYPES.SELECT_DROPDOWN,
        values: product.lightBases.map(base => ({
          id: base.id,
          name: base.name,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: parseFloat(base.price || 0)
        }))
      });
    }

    // Handle backgrounds (same as before)
    if (product.backgroundOptions && Array.isArray(product.backgroundOptions) && product.backgroundOptions.length > 0) {
      productOptions.push({
        id: 'background',
        type: OPTION_TYPES.RADIO_BUTTONS,
        values: product.backgroundOptions.map(bg => ({
          id: bg.id,
          name: bg.name,
          pricingType: PRICING_TYPES.FIXED_PRICE,
          priceChange: parseFloat(bg.price || 0)
        }))
      });
    }

    // Handle text options (same as before)
    if (product.textOptions && Array.isArray(product.textOptions) && product.textOptions.length > 0) {
      const customTextOption = product.textOptions.find(opt => 
        opt.name.toLowerCase().includes('custom') || opt.id === 'customText'
      );
      if (customTextOption && parseFloat(customTextOption.price || 0) > 0) {
        productOptions.push({
          id: 'customText',
          type: OPTION_TYPES.TEXT_INPUT,
          priceChange: parseFloat(customTextOption.price || 0)
        });
      }
    }

    // Add processing speed options (same as before)
    productOptions.push({
      id: 'processingSpeed',
      type: OPTION_TYPES.RADIO_BUTTONS,
      values: [
        { id: 'standard', pricingType: PRICING_TYPES.FREE, priceChange: 0 },
        { id: 'rush48', pricingType: PRICING_TYPES.FIXED_PRICE, priceChange: 35 },
        { id: 'rush24', pricingType: PRICING_TYPES.FIXED_PRICE, priceChange: 65 }
      ]
    });
    
    const finalPrice = calculator.calculateTotal(selectedOptions, productOptions);
    
    // Enhanced logging for size pricing
    if (selectedOptions.size && product.sizes) {
      const selectedSize = product.sizes.find(s => s.id === selectedOptions.size);
      if (selectedSize) {
        console.log('💰 Size pricing details:', {
          size_name: selectedSize.name,
          current_price: selectedSize.price,
          original_price: selectedSize.originalPrice,
          cost: selectedSize.cost,
          multiplier: selectedSize.sizeMultiplier
        });
      }
    }
    
    return finalPrice;
  }, [calculator, product, selectedOptions]);

  return { totalPrice, calculator };
};

// VALIDATION HOOK
export const useProductValidation = (product, selectedOptions, hasAttemptedSubmit) => {
  const errors = useMemo(() => {
    if (!hasAttemptedSubmit || !product) return {};
    
    const errors = {};
    
    // Validate size selection (for products that have sizes)
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedOptions.size) {
      errors.size = 'Please select a size';
    }
    
    // Validate image upload (if required - works for both static and merged)
    if (product.requiresImage && !selectedOptions.imageUrl && !selectedOptions.finalImage) {
      errors.image = 'Please upload an image';
    }
    
    // Validate lightbase selection (for products that have lightbase options)
    if (product.lightBases && Array.isArray(product.lightBases) && product.lightBases.length > 0 && !selectedOptions.lightBase) {
      errors.lightBase = 'Please select a light base option';
    }
    
    // Validate background selection (for products that have background options)
    if (product.backgroundOptions && Array.isArray(product.backgroundOptions) && product.backgroundOptions.length > 0 && !selectedOptions.background) {
      errors.background = 'Please select a background option';
    }
    
    // Validate text input length
    if (selectedOptions.customText && selectedOptions.customText.length > 50) {
      errors.customText = 'Custom text must be 50 characters or less';
    }
    
    return errors;
  }, [product, selectedOptions, hasAttemptedSubmit]);

  return errors;
};

export function findMatchingProduct(productFromPage) {
  const normalizedCatalog = cockpit3dProducts.map(normalizeCockpitProduct);

  return (
    normalizedCatalog.find(p => p.id === productFromPage.id) ||
    normalizedCatalog.find(p => p.sku === productFromPage.sku) ||
    normalizedCatalog.find(p => p.name.toLowerCase() === productFromPage.name?.toLowerCase())
  );
}

// MAIN COMPONENT
export function ProductDetail2() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const textRef = useRef(null);
  const addToCartRef = useRef(null);

  const { catalog, loading: catalogLoading, error: catalogError } = useCatalogData();


  // Rest of the state and hooks...
  // DECLARE ALL STATE VARIABLES FIRST - BEFORE ANY HOOKS THAT USE THEM
  const [selectedOptions, setSelectedOptions] = useState({});
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  

  // Get product from catalog
  const product = useMemo(() => {
    return getProductFromCatalog(slug, catalog);
  }, [slug, catalog]);

  useDefaultOptions(product, selectedOptions, setSelectedOptions);

  // use hooks that depend on product
  const isMainButtonVisible = useIntersectionObserver(addToCartRef, product);
  const { totalPrice } = useProductPricing(product, selectedOptions, catalog);
  const { errors, isValid } = useProductValidation(product, selectedOptions, hasAttemptedSubmit, catalog);


  useEffect(() => {
    setFormErrors(errors);
  }, [errors]);

  const maskImage = useMemo(() => {
    if (!product || !product.requiresImage) return null;
    
    const productName = product.name?.toLowerCase() || '';
    
    // Comprehensive mask mapping based on your available masks
    const maskMap = {
      // Crystal shapes
      'diamond': '/img/masks/diamond-mask.png',
      'crystal diamond': '/img/masks/3d_crystal_diamond_cut_corner_2.png',
      'heart': '/img/masks/heart-mask.png',
      'crystal heart': '/img/masks/crystal-heart-mask.png',
      'rectangle': '/img/masks/rectangle-mask.png',
      'crystal rectangle': '/img/masks/3d-rectangle-tall-mask.png',
      'square': '/img/masks/3d-crystal-rectangle-wide-mask.png',
      'oval': '/img/masks/3d-crystal-oval-mask.png',
      'circle': '/img/masks/globe-mask.png',
      'octagon': '/img/masks/3d-crystal-octagon-mask.png',
      
      // Specific product types
      'ornament': '/img/masks/ornament-mask.png',
      'globe': '/img/masks/globe-mask.png',
      'iceberg': '/img/masks/3d-crystal-prestige-iceberg-mask.png',
      'prestige': '/img/masks/prestige-mask.png',
      'keychain': '/img/masks/rectangle-keychain-horizontal-mask.png',
      'pendant': '/img/masks/3CSS-portrait-mask.png',
      'portrait': '/img/masks/3CSS-portrait-mask.png',
      
      // Size variations
      'small': '/img/masks/3d-crystal-black.png',
      'medium': '/img/masks/3d-crystal-rectangle-wide-mask.png',
      'large': '/img/masks/3d-rectangle-tall-mask.png',
      
      // Special shapes
      'dog bone': '/img/masks/dogbone-horizontal-mask.png',
      'bone': '/img/masks/dogbone-horizontal-mask.png',
      'vertical': '/img/masks/dogbone-vertical-mask.png',
      'notched': '/img/masks/notched-horizontal-mask.png',
      'beveled': '/img/masks/rectangle-keychain-vertical-mask.png'
    };
    
    // Try exact matches first
    for (const [keyword, maskPath] of Object.entries(maskMap)) {
      if (productName.includes(keyword)) {
        console.log(`🎭 Mask matched: "${keyword}" -> ${maskPath}`);
        return maskPath;
      }
    }
    
    // Advanced pattern matching for complex product names
    if (productName.includes('3d') && productName.includes('crystal')) {
      if (productName.includes('heart')) return '/img/masks/crystal-heart-mask.png';
      if (productName.includes('diamond')) return '/img/masks/3d_crystal_diamond_cut_corner_2.png';
      if (productName.includes('rectangle')) return '/img/masks/3d-crystal-rectangle-wide-mask.png';
      if (productName.includes('prestige')) return '/img/masks/3d-crystal-prestige-iceberg-mask.png';
    }
    
    // Shape-based fallbacks
    if (productName.includes('round') || productName.includes('circular')) {
      return '/img/masks/globe-mask.png';
    }
    
    if (productName.includes('tall') || productName.includes('vertical')) {
      return '/img/masks/3d-rectangle-tall-mask.png';
    }
    
    if (productName.includes('wide') || productName.includes('horizontal')) {
      return '/img/masks/3d-crystal-rectangle-wide-mask.png';
    }
    
    // Default fallback
    console.log(`🎭 Using default mask for: ${productName}`);
    return '/img/masks/3d_crystal_picture.png';
  }, [product]);

  // Optional: Add this helper function to get all available masks for admin/debugging
  // export const getAllAvailableMasks = () => {
  //   return [
  //     '/img/masks/2d-ornament-mask.png',
  //     '/img/masks/3CRS-portrait-mask.png',
  //     '/img/masks/3d-crystal-black.png',
  //     '/img/masks/3d_crystal_diamond_cut_corner_2.png',
  //     '/img/masks/3d-crystal-prestige-iceberg-mask.png',
  //     '/img/masks/3d-crystal-rectangle-wide-mask.png',
  //     '/img/masks/3d-crystal-sun-small-mask.png',
  //     '/img/masks/3d_crystal_picture.png',
  //     '/img/masks/3d-rectangle-tall-mask.png',
  //     '/img/masks/crystal-heart-mask.png',
  //     '/img/masks/crystal-sun-large-mask.png',
  //     '/img/masks/desk-lamp-mask.png',
  //     '/img/masks/diamond-mask.png',
  //     '/img/masks/dogbone-horizontal-mask.png',
  //     '/img/masks/dogbone-vertical-mask.png',
  //     '/img/masks/globe-mask.png',
  //     '/img/masks/heart-keychain-mask.png',
  //     '/img/masks/heart-mask.png',
  //     '/img/masks/heart-necklace-mask.png',
  //     '/img/masks/notched-horizontal-mask.png',
  //     '/img/masks/notched-vertical-mask.png',
  //     '/img/masks/ornament-mask.png',
  //     '/img/masks/photo_crystal_ornament_with_a_backup.png',
  //     '/img/masks/prestige-mask.png',
  //     '/img/masks/rectangle-horizontal-mask.png',
  //     '/img/masks/rectangle-keychain-horizontal-mask.png',
  //     '/img/masks/rectangle-keychain-vertical-mask.png',
  //     '/img/masks/rectangle-mask.png',
  //     '/img/masks/rectangle-necklace-mask.png',
  //     '/img/masks/rectangle-vertical-mask.png'
  //   ];
  // };
  const handleOptionChange = (optionId, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionId]: value
    }));

    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[optionId];
      return newErrors;
    });
  };

  const handleImageUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      setUploadedImage(imageData);
      setImagePreview(imageData);

      if (maskImage) {
        setShowImageEditor(true);
      } else {
        setFinalImage(imageData);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleImageEditorSave = (editedImageData) => {
    setFinalImage(editedImageData);
    setImagePreview(editedImageData);
    setShowImageEditor(false);
    
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
  };

  const handleAddToCart = async () => {
    setHasAttemptedSubmit(true);
    setCartError(null);

    if (Object.keys(errors).length > 0) {
      setCartError('Please complete all required fields');
      return;
    }

    setIsAddingToCart(true);

    try {
      // Use the enhanced prepareCartItem function
      const cartItem = prepareCartItem(product, selectedOptions, finalImage, totalPrice);

      await addToCart(cartItem);
      
      const shouldNavigate = window.confirm(
        'Item added to cart! Would you like to view your cart?'
      );

      if (shouldNavigate) {
        navigate('/cart');
      }
    } catch (error) {
      setCartError(error.message || 'Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  useEffect(() => {
    if (textRef.current && product?.requiresImage) {
      const letters = textRef.current.querySelectorAll("span");
      gsap.fromTo(
        letters,
        { y: 0, color: "#FFF" },
        {
          y: -10,
          color: "#72B01D",
          duration: 0.15,
          delay: 1,
          ease: "power1.out",
          stagger: { each: 0.05, yoyo: true, repeat: 1 }
        }
      );
    }
  }, [product?.requiresImage]);

  const uploadText = "Upload Your Image";



  if (catalogLoading) {
    return (
      <PageLayout pageTitle="Loading...">
        <Container>
          <Row>
            <Col xs={12}>
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading products...</p>
              </div>
            </Col>
          </Row>
        </Container>
      </PageLayout>
    );
  }

  if (catalogError) {
    return (
      <PageLayout pageTitle="Error">
        <Container>
          <Row>
            <Col xs={12}>
              <Alert variant="danger">
                <Alert.Heading>Error Loading Catalog</Alert.Heading>
                <p>{catalogError}</p>
              </Alert>
            </Col>
          </Row>
        </Container>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout pageTitle="Product Not Found">
        <Container>
          <Row>
            <Col xs={12}>
              <Alert variant="warning">
                <Alert.Heading>Product Not Found</Alert.Heading>
                <p>The product "{slug}" could not be found in our catalog.</p>
                <Link to="/products2">← Back to Products</Link>
              </Alert>
            </Col>
          </Row>
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      pageTitle={`${product.name} | CrystalKeepsakes - 3D Crystal Memories`}
      pageDescription={product.name}
      pagePath={`/product/${slug}`}
      pageImage={product.photo}
      pageType="product"
      schema={product ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.name,
        "image": product.photo,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      } : null}
      className="product-detail"
    >    
      <section className="hero py-4">
        <div className="hero-content">
          <h1>{product.name}</h1>
          <p className="lead">Custom {product.name} for capturing life's special moments in stunning detail.</p>
        </div>
      </section>

      <section className="breadcrumb pt-3">
        <Container>
          <Row>
            <div className="col-12 col-sm-12">
              <Link to="/products2"><ArrowLeft size={20}/> Back</Link>
            </div>
          </Row>
        </Container>
      </section>

      <section className="pb-5">
        <Container>
          <Row>
            <Col xs={12} sm={12} md={5} lg={5}>              
              <div className="product-preview mb-5 text-light">
                {finalImage ? (
                  <div className="saved-image-preview">
                    <h4>Saved Image Preview:</h4>
                    <img src={finalImage} alt="Final design" className="img-fluid rounded shadow" />
                  </div>
                ) : (
                  <div className="product-image-container">
                    <ProductImageDisplay product={product} finalImage={finalImage} />
                  </div>
                )}
                
                <div className="spacer-gradient mt-4"></div>
                <div className="pt-3 product__long-description">
                  
                  <p>Expertly crafted using advanced laser engraving technology, this {product.name.toLowerCase()} transforms your photos into stunning 3D art. Each piece is carefully created to highlight every detail with remarkable clarity.</p>
                  
                  <div className="product-details mt-4 pt-4 border-top">
                    <h6>Product Details</h6>
                    <ul className="list-unstyled small">
                      <li><strong>Product ID:</strong> {product.id}</li>
                      {product.sku && <li><strong>SKU:</strong> {product.sku}</li>}
                      <li><strong>Category:</strong> {product.categoryName}</li>
                      <li><strong>Requires Image:</strong> {product.requiresImage ? 'Yes' : 'No'}</li>
                      {product.options && <li><strong>Options Available:</strong> {product.options.length}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={7} lg={7}>
              <Form className="product-options" onSubmit={(e) => e.preventDefault()}>
                <div className="total-price mb-4">
                  <h3 className="h2">Total: ${totalPrice.toFixed(2)}</h3>
                </div>

                {product.requiresImage && (
                  <Form.Group className="product-option mb-4">
                    <Form.Label className="h3" htmlFor="product-image-upload">
                      <span className="text-danger">* </span> 
                      <span ref={textRef}>
                        {uploadText.split("").map((char, index) => (
                          <span key={index} style={{ display: "inline-block", whiteSpace: "pre" }}>
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))}
                      </span>
                    </Form.Label>

                    {hasAttemptedSubmit && formErrors.image && (
                      <div className="text-danger small">{formErrors.image}</div>
                    )}

                    <Form.Control
                      type="file"
                      id="product-image-upload"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0])}
                      className="mb-3"
                    />

                    {!imagePreview && (
                     <small className="text-light form-text">Requirements:
                      <ul className="image-upload-details mt-2">
                        <li>File type: JPG, PNG, or GIF</li>
                        <li>Maximum size: 5MB</li>
                        <li>Minimum dimensions: 500x500 pixels</li>
                        <li>Higher resolution recommended for best results</li>
                      </ul>
                     </small>
                    )}
                  </Form.Group>
                )}

                <ProductOptionsRenderer
                  product={product}
                  catalog={catalog}
                  selectedOptions={selectedOptions}
                  onOptionChange={handleOptionChange}
                  errors={formErrors}
                  hasAttemptedSubmit={hasAttemptedSubmit}
                />

                {cartError && (
                  <Alert variant="danger" className="mt-3">
                    {cartError}
                  </Alert>
                )}

                <div ref={addToCartRef} className="add-to-cart-section mt-4 pt-4 border-top">
                  <Button 
                    variant="primary"
                    size="lg"
                    className="w-100"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Adding to Cart...
                      </>
                    ) : (
                      `Add to Cart - ${totalPrice.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {showImageEditor && uploadedImage && maskImage && (
        <ImageEditor2
          show={showImageEditor}
          onHide={() => setShowImageEditor(false)}
          uploadedImage={uploadedImage}
          maskImage={maskImage}
          onSave={handleImageEditorSave}
          onCancel={() => setShowImageEditor(false)}
          productName={product.name}
        />
      )}

      <StickyPriceBar 
        totalPrice={totalPrice}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
        isMainButtonVisible={isMainButtonVisible}
      />

    </PageLayout>
  );
}