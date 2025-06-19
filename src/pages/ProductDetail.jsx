// pages/ProductDetail.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import imageCompression from 'browser-image-compression';

import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import "react-resizable/css/styles.css"; // Import styles for ResizableBox
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../components/common/SEOHead';

import { ArrowBigLeft, ArrowLeft, CornerRightDown } from 'lucide-react'; 

import { useCart } from '../contexts/CartContext';
import { Modal, Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { ProductSizeComponent } from '../utils/unitConversion';
import { products } from '../data/products';
import { CartUtils } from '../utils/cartUtils';
import { CartError } from '../utils/cartUtils';
import ProductGallery from '../components/product/ProductGallery';
import { PageLayout } from '../components/layout/PageLayout';
import { Check, User } from 'lucide-react'; 
import { getImagePath } from '../utils/imageUtils';

import ImageEditor from '../components/product/ImageEditor';

export function ProductDetail() {
 
  const textRef = useRef(null);
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Refs (safe to declare early)
  const sizeRef = useRef(null);
  const backgroundRef = useRef(null);
  const lightBaseRef = useRef(null);
  const standRef = useRef(null);
  const imageUploadRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const textLine1Ref = useRef(null);

  // State with safe initial values
  const [showModal, setShowModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [finalImage, setFinalImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [cartError, setCartError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showCustomText, setShowCustomText] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [textValidation, setTextValidation] = useState({
    line1: { count: 0, error: '' },
    line2: { count: 0, error: '' }
  });

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Find product
  const product = useMemo(() => products.find(p => p.slug === slug), [slug]);

  // Safe derived values / define mainImage
  const mainImage = useMemo(() => 
    product?.images?.find(img => img.isMain) || product?.images?.[0], 
    [product]
  );

  const imageMask = useMemo(() => 
    product?.productMask?.[0] ?? null, 
    [product]
  );

  // Check if product requires any configurable options
  const hasConfigurableOptions = useMemo(() => {
    if (!product) return false;
    return (
      (product.sizes && product.sizes.length > 0) ||
      (product.backgroundOptions && product.backgroundOptions.length > 0) ||
      (product.lightBases && product.lightBases.length > 0) ||
      (product.giftStand && product.giftStand.length > 0) ||
      (product.textOptions && product.textOptions.length > 1) ||
      product.requiresImage
    );
  }, [product]);

  // Initial options (safe defaults)
  const [selectedOptions, setSelectedOptions] = useState({
    size: 'small',
    background: 'rm',
    lightBase: 'none',
    giftStand: 'none',
    image: null,
    textLine1: '',
    textLine2: ''
  });

  const productValidation = {
    validateImage: (file) => {
      const errors = [];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (file.size > maxSize) {
        errors.push('Image must be less than 5MB');
      }
      if (!validTypes.includes(file.type)) {
        errors.push('Invalid file type. Please use JPG, PNG, or GIF');
      }
      return errors;
    },

    validateDimensions: (width, height) => {
      const errors = [];
      if (width < 500 || height < 500) {
        errors.push('Image must be at least 500x500 pixels');
      }
      return errors;
    }
  };

  const validateImage = (file) => {
    setImageError(null)
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB')
      return false
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload a JPG, PNG, or GIF file')
      return false
    }

    return true
  }
 

  // Update image change handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateImage(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 550 || img.height < 550) {
            setImageError('Image must be at least 550x550 pixels');
            // ... error handling
            return;
          }
          
          // NO COMPRESSION - just set raw image
          setImagePreview(e.target.result);   // Raw image
          setUploadedImage(e.target.result);  // Raw image  
          setShowModal(true); // Shows immediately!
          
          // Clear errors...
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);

      setSelectedOptions({
        ...selectedOptions,
        image: file
      });
    } else {
      e.target.value = null;
      setSelectedOptions({
        ...selectedOptions,
        image: null
      });
      setFormErrors(prev => ({
        ...prev,
        image: 'Please upload a valid image'
      }));
    }
  };

  const validateForm = () => {
    console.log('Running form validation');
    
    // Check size
    if (!selectedOptions.size) {
      console.log('Size validation failed');
      return false;
    }

    // Check background
    if (!selectedOptions.background) {
      console.log('Background validation failed');
      return false;
    }

    // Check light base
    if (!selectedOptions.lightBase) {
      console.log('Light base validation failed');
      return false;
    }

    // Check gift stand
    if (!selectedOptions.giftStand) {
      console.log('Stand validation failed');
      return false;
    }

    // Check image
    if (!selectedOptions.image) {
      console.log('Image validation failed');
      return false;
    }

    console.log('All validations passed');
    return true;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCartError(null);
    setHasAttemptedSubmit(true);
    setFormErrors({});

    const validationErrors = validateFormFields();

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      // Scroll to the first error field
      if (validationErrors.image && imageUploadRef.current) {
        imageUploadRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.size && sizeRef.current) {
        sizeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.background && backgroundRef.current) {
        backgroundRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.lightBase && lightBaseRef.current) {
        lightBaseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (validationErrors.giftStand && standRef.current) {
        standRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    // Only check for finalImage if product requires an image
    if (product.requiresImage && !finalImage) {
      setCartError('Please save the edited image before adding to cart.');
      return;
    }

    setIsAddingToCart(true);

    try {
      // DEBUG: Log the image states before creating cart item
      console.log('=== ADDING TO CART DEBUG ===');
      console.log('uploadedImage exists:', !!uploadedImage);
      console.log('imagePreview exists:', !!imagePreview);
      console.log('finalImage exists:', !!finalImage);
      console.log('uploadedImage starts with:', uploadedImage ? uploadedImage.substring(0, 50) + '...' : 'NONE');
      console.log('imagePreview starts with:', imagePreview ? imagePreview.substring(0, 50) + '...' : 'NONE');
      console.log('finalImage starts with:', finalImage ? finalImage.substring(0, 50) + '...' : 'NONE');

      const cartItem = {
        productId: product.id,
        name: product.name,
        price: totalPrice,
        options: {
          size: selectedOptions.size,
          background: selectedOptions.background,
          lightBase: selectedOptions.lightBase,
          giftStand: selectedOptions.giftStand,
          customText: {
            line1: selectedOptions.textLine1?.trim() || '',
            line2: selectedOptions.textLine2?.trim() || '',
          },
          // FIXED: Only include image URLs if product requires images
          ...(product.requiresImage && {
            rawImageUrl: uploadedImage,        // Original uploaded image
            imageUrl: uploadedImage,           // For preview (same as uploaded for now)
            maskedImageUrl: finalImage,        // Final edited/masked image
          })
        },
      };

      // DEBUG: Log the final cart item
      console.log('=== CART ITEM BEING ADDED ===');
      console.log('Cart item options:', {
        hasRawImage: !!cartItem.options.rawImageUrl,
        hasImageUrl: !!cartItem.options.imageUrl,
        hasMaskedImage: !!cartItem.options.maskedImageUrl,
        rawImageLength: cartItem.options.rawImageUrl?.length || 0,
        imageUrlLength: cartItem.options.imageUrl?.length || 0,
        maskedImageLength: cartItem.options.maskedImageUrl?.length || 0
      });

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

  const validateFormFields = useMemo(() => {
    return () => {
      if (!product) return {};
      
      const errors = {};
      const validators = {};
      
      // Only validate fields that exist for this product
      if (product.sizes && product.sizes.length > 0) {
        validators.size = {
          isValid: (value) => !!value,
          message: 'Please select a size'
        };
      }
      
      if (product.backgroundOptions && product.backgroundOptions.length > 0) {
        validators.background = {
          isValid: (value) => !!value,
          message: 'Please select a background'
        };
      }
      
      // MOVED: Only validate images if product requires them
      if (product.requiresImage) {
        validators.image = {
          isValid: () => !!imagePreview,
          message: 'Please upload an image'
        };
        validators.finalImage = {
          isValid: () => !!finalImage,
          message: 'Please save the edited image before adding to cart',
        };
      }
      
      if (product.lightBases && product.lightBases.length > 0) {
        validators.lightBase = {
          isValid: (value) => !!value,
          message: 'Please select a light base'
        };
      }

      if (product.giftStand && product.giftStand.length > 0) {
        validators.giftStand = {
          isValid: (value) => !!value,
          message: 'Please select a stand'
        };
      }

      Object.entries(validators).forEach(([field, validator]) => {
        if (!validator.isValid(selectedOptions[field])) {
          errors[field] = validator.message;
        }
      });

      return errors;
    };
  }, [product, imagePreview, finalImage, selectedOptions]);

  useEffect(() => {
    // Only run animation if textRef exists (for products that require images)
    if (textRef.current) {
      const letters = textRef.current.querySelectorAll("span");

      gsap.fromTo(
        letters,
        { y: 0, color: "#FFF"  },
        {
          y: -10,
          color: "#72B01D",
          duration: 0.15,
          delay: 1,     
          ease: "power1.out",
          stagger: {
            each: 0.05,
            yoyo: true,
            repeat: 1,
          },
        }
      );
    }
  }, [product?.requiresImage]); // Add dependency to re-run when product changes

  const text = "Upload Your Image";

  // Calculate total price whenever options change
  useEffect(() => {
    if (!product) return;
    
    let price = product?.basePrice ?? 0;
  
    if (selectedOptions.size) {
      const sizeOption = product?.sizes?.find(s => s.id === selectedOptions.size);
      price = sizeOption?.price ?? product?.basePrice ?? 0;
    }
    
    if (selectedOptions.background) {
      const bgOption = product?.backgroundOptions?.find(b => b.id === selectedOptions.background);
      price += bgOption?.price ?? 0;
    }
    
    if (selectedOptions.lightBase && product?.lightBases?.length > 0) {
      const baseOption = product.lightBases.find(b => b.id === selectedOptions.lightBase);
      price += baseOption?.price || 0;
    }

    if (selectedOptions.giftStand && product?.giftStand?.length > 0) {
      const baseOption = product.giftStand.find(b => b.id === selectedOptions.giftStand);
      price += baseOption?.price || 0;
    }

    // Add text price based on number of lines used
    if (selectedOptions.textLine1 || selectedOptions.textLine2) {
      const numLines = (selectedOptions.textLine1 ? 1 : 0) + (selectedOptions.textLine2 ? 1 : 0);
      const textOption = product.textOptions.find(t => 
        (numLines === 1 && t.id === 'one-line') || 
        (numLines === 2 && t.id === 'two-lines')
      );
      price += textOption?.price || 0;
    }
    // Single charge for custom text when enabled
    if (showCustomText) {
     const textOption = product.textOptions[1];
     price += textOption.price;
    }

    setTotalPrice(price);
    setFormErrors({}); 
  }, [selectedOptions, product, showCustomText, validateFormFields]);

  // Separate useEffect for focus
  useEffect(() => {
    if (showCustomText && textLine1Ref.current) {
      textLine1Ref.current.focus();
    }
  }, [showCustomText]);

  // Add validation effect to run when options change
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const errors = validateFormFields();
      setFormErrors(errors);
    }
  }, [hasAttemptedSubmit, selectedOptions, imagePreview, finalImage, validateFormFields]);
  // Update radio button onChange handlers to maintain errors
  const handleOptionChange = (field, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [field]: value
    }));

    // Only clear error for the changed field
    setFormErrors(prev => {
      const newErrors = {...prev};
      delete newErrors[field];
      return newErrors;
    });
  };

  if (!product) {
    return (
      <section className="pb-5">
        <Container>
          <Row>
            <div className="col-12 col-sm-12 col-md-5 col-lg-5">
              <div>Product not found</div>
            </div>
          </Row>
        </Container>
      </section>
    );
  }

  return (
    <PageLayout 
      pageTitle={`${product.name} | CrystalKeepsakes - 3D Crystal Memories`}
      pageDescription={product.description}
      pagePath={`/product/${slug}`}
      pageImage={mainImage?.src}
      pageType="product"
      schema={product && mainImage ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "description": product.description,
        "image": mainImage.src,
        "offers": {
          "@type": "Offer",
          "price": product.basePrice.toFixed(2),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      } : null}
      className="product-detail"
    >    
      <section className="hero py-4">
        <div className="hero-content">
          <h1>{product.name}</h1>
          <p className="lead">{product.description}</p>
        </div>
      </section>

      <section className="breadcrumb pt-3">
        <Container>
          <Row>
            <div className="col-12 col-sm-12">
              <Link to="/products"><ArrowLeft size={20}/> Back</Link>
            </div>
          </Row>
        </Container>
      </section>

      <section className="pb-5">
        <Container>
          <Row>
            <div className="col-12 col-sm-12 col-md-5 col-lg-5">
              <div className="product-preview mb-5">
                {finalImage && (
                  <div className="saved-image-preview">
                    <h4>Saved Image Preview:</h4>
                    <img src={finalImage} alt="Final design" className="img-fluid" />
                  </div>
                ) || (
                  <ProductGallery images={product.images} /> 
                )}
                <div className="spacer-gradient mt-4"></div>
                <div className="pt-3 prodct__long-description" dangerouslySetInnerHTML={ProductSizeComponent(product.longDescription)}>                
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-12 col-md-7 col-lg-6">          
              {/*<div className="total-price mb-4">
                <h2 className="h1">Total: ${totalPrice.toFixed(2)}</h2>
              </div>*/}

              <Form className="product-options" onSubmit={handleSubmit}> 
                {/* Image Upload */} 
                {product.requiresImage && (
                <Form.Group className="product-option mb-4">
                  <Form.Label className="h3" ref={imageUploadRef} htmlFor="product-image-upload"><span className="text-danger">* </span> 
                    <span ref={textRef}>
                     {text.split("").map((char, index) => (
                        <span key={index} style={{ display: "inline-block", whiteSpace: "pre", }}>
                          {char === " " ? "\u00A0" : char}
                        </span>
                      ))} 
                    </span>
                    <CornerRightDown size={23} />
                  </Form.Label>

                  {hasAttemptedSubmit && formErrors.image && (
                    <div className="alert-danger text-danger small">{formErrors.image}</div>
                  )}

                  <Form.Control
                    type="file"
                    required
                    id="product-image-upload"
                    name="productImage"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
                    className="userImageUpload"
                  />

                  {imageError && (
                    <Alert variant="danger" className="mt-2">
                      {imageError}
                    </Alert>
                  )}

                  <Form.Text className="text-light">
                    Requirements:
                    <ul className="image-upload-details mt-2">
                      <li>File type: JPG, PNG, or GIF</li>
                      <li>Maximum size: 5MB</li>
                      <li>Minimum dimensions: 500x500 pixels</li>
                      <li>Higher resolution recommended for best results</li>
                    </ul>
                  </Form.Text>
                </Form.Group>
                )}

                {/* Size Selection - Only show if product has sizes */}
                {product.sizes && product.sizes.length > 0 && (
                  <Form.Group className="product-option pt-2 mt-2">
                    <fieldset ref={sizeRef}>
                      <legend>Select Size <span className="text-danger">*</span></legend>
                      {hasAttemptedSubmit && formErrors.size && (
                        <div className="text-danger small">{formErrors.size}</div>
                      )}
                      {/* Size radio buttons here */}
                      {product.sizes.map(size => (
                      <label key={size.id} className="crystal-radio">
                        <span className="product-faces"><User size={18} /><br/>{size.faces}</span>
                        <span className="h5">{product.name} - <span dangerouslySetInnerHTML={ProductSizeComponent(size.name)} /></span>

                        <br/>
                        <span className="option-price">
                          <span className="option-price__wrapper h5">
                            {size.price === 0 ? (
                              <span className="option-price__included">
                                <span className="option-price__paren">(</span>
                                <span className="option-price__text">Included</span>
                                <span className="option-price__paren">)</span>
                              </span>
                            ) : (
                              <span className="option-price__additional">                         
                                <span className="option-price__currency">$</span>
                                <span className="option-price__value">{size.price}</span>                        
                              </span>
                            )}
                          </span>
                        </span>

                        <input
                          type="radio"
                          id={`size-${size.id}`}
                          name="size"
                          required
                          checked={selectedOptions.size === size.id}
                          onChange={() => handleOptionChange('size', size.id)}
                        />
                      </label>
                    ))}
                    </fieldset>
                  </Form.Group>
                )}

                {/* Background Option - Only show if product has background options */}
                {product.backgroundOptions && product.backgroundOptions.length > 0 && (
                  <Form.Group className="product-option pt-2 mt-2">
                    <fieldset ref={backgroundRef}>
                      <legend>Background Style <span className="text-danger">*</span></legend>
                      {hasAttemptedSubmit && formErrors.background && (
                        <div className="text-danger small">{formErrors.background}</div>
                      )}

                      {/* Background radio buttons here */}
                       {product.backgroundOptions.map(bg => (
                        <label key={bg.id} className="crystal-radio">
                          {bg.name}
                          <span className="option-price">
                            {bg.price === 0 ? '' : `(+$${bg.price})`}
                          </span>
                          <input
                            type="radio"
                            id={`background-${bg.id}`} 
                            name="background"
                            required
                            checked={selectedOptions.background === bg.id}
                            onChange={() => handleOptionChange('background', bg.id)}
                          />
                          <span className="radio-checkmark"></span>
                        </label>
                      ))}
                    </fieldset>
                  </Form.Group>
                )}

                {/* Light Base Selection - Only show if product has light bases */}
                {product.lightBases && product.lightBases.length > 0 && (
                  <Form.Group className="product-option pt-2 mt-2">
                    <fieldset ref={lightBaseRef}>
                      {hasAttemptedSubmit && formErrors.lightBase && (
                        <div className="text-danger small">{formErrors.lightBase}</div>
                      )}
                      <legend>Light Base <span className="text-danger">*</span></legend>
                      {/* Light Base radio buttons here */}
                    
                      {product.lightBases.map(base => (
                        <label key={base.id} className="crystal-radio">
                          {base.name}
                          <span className="option-price">
                            {base.price === 0 ? ' ' : `(+$${base.price})`}
                          </span>
                          <input
                            type="radio"
                            id={`lightBase-${base.id}`}
                            name="lightBase"
                            required
                            checked={selectedOptions.lightBase === base.id}
                            onChange={() => handleOptionChange('lightBase', base.id)}
                          />
                          <span className="radio-checkmark"></span>
                        </label>
                      ))}
                    </fieldset>
                  </Form.Group>
                )}

                {/* Gift Stand Selection - Only show if product has gift stands */}
                {product.giftStand && product.giftStand.length > 0 && (
                  <Form.Group className="product-option pt-2 mt-2">
                    <fieldset ref={standRef}>
                      <legend>Stand <span className="text-danger">*</span></legend>
                      {formErrors.giftStand && (
                        <div className="text-danger small">{formErrors.giftStand}</div>
                      )}
                    {/* Stand radio buttons here */}
                    {product.giftStand.map(base => (
                      <label key={base.id} className="crystal-radio">
                        {base.name}
                        <span className="option-price">
                          {base.price === 0 ? '' : `(+$${base.price})`}
                        </span>
                        <input
                          type="radio"
                          id={`giftStand-${base.id}`}
                          name="giftStand"
                          required
                          checked={selectedOptions.giftStand === base.id}
                          onChange={() => handleOptionChange('giftStand', base.id)}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                    </fieldset>
                  </Form.Group>
                )}

                {/* Custom Text Fields - Only show if product has text options */}
                {product.textOptions && product.textOptions.length > 0 && (
                  <Form.Group className="product-option pt-2 mt-2">
                    <Form.Label htmlFor="add-custom-text" className="d-flex justify-content-start align-items-center">
                      <Form.Check
                        type="checkbox"
                        id="add-custom-text"
                        name="showCustomText"
                        label={``}
                        checked={showCustomText}
                        onChange={(e) => setShowCustomText(e.target.checked)}
                      /> <span className="h5">Add Custom Text (+${product.textOptions[1].price.toFixed(2)})</span> 
                    </Form.Label>
                    
                    {showCustomText && (
                      <>
                        <Form.Label htmlFor="product-custom-text-line1">
                          Custom Text Line 1 <span className="character-count">({textValidation.line1.count}/30)</span>
                        </Form.Label>
                        <Form.Control
                          type="text"
                          id="product-custom-text-line1"
                          name="customTextLine1"
                          ref={textLine1Ref}
                          placeholder="Custom Text Line 1"
                          maxLength={30}
                          value={selectedOptions.textLine1}
                          onChange={(e) => {
                            const text = e.target.value;
                            const sanitized = text.replace(/<[^>]*>/g, '');
                            
                            setSelectedOptions({
                              ...selectedOptions,
                              textLine1: sanitized
                            });
                            
                            setTextValidation(prev => ({
                              ...prev,
                              line1: {
                                count: sanitized.length,
                                error: sanitized.length > 30 ? 'Maximum 30 characters allowed' : ''
                              }
                            }));
                          }}
                          isInvalid={!!textValidation.line1.error}
                        />
                        <Form.Control.Feedback type="invalid">
                          {textValidation.line1.error}
                        </Form.Control.Feedback>
                        
                        <Form.Label htmlFor="product-custom-text-line2" className="mt-2">
                          Custom Text Line 2 <span className="character-count">({textValidation.line2.count}/30)</span>
                        </Form.Label>
                        <Form.Control
                          placeholder="Custom Text Line 2"
                          type="text"
                          id="product-custom-text-line2"
                          name="customTextLine2"
                          maxLength={30}
                          value={selectedOptions.textLine2}
                          onChange={(e) => {
                            const text = e.target.value;
                            const sanitized = text.replace(/<[^>]*>/g, '');
                            
                            setSelectedOptions({
                              ...selectedOptions,
                              textLine2: sanitized
                            });
                            
                            setTextValidation(prev => ({
                              ...prev,
                              line2: {
                                count: sanitized.length,
                                error: sanitized.length > 30 ? 'Maximum 30 characters allowed' : ''
                              }
                            }));
                          }}
                          isInvalid={!!textValidation.line2.error}
                        />
                        <Form.Control.Feedback type="invalid">
                          {textValidation.line2.error}
                        </Form.Control.Feedback>
                      </>
                    )}
                  </Form.Group>
                )}

                <div className="sticky-price">
                  <div className="total-price my-5">
                    <h2>Total: ${totalPrice.toFixed(2)}</h2>
                  </div>
                  {cartError && (
                    <Alert key={cartError} variant="danger" className="mb-4" show={!!cartError} onClose={() => setCartError(null)} dismissible>
                      {cartError}
                    </Alert>
                  )}

                  <button 
                    type="button"
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleSubmit}
                    disabled={isAddingToCart}
                  >
                    <span>{isAddingToCart ? 'Adding to Cart...' : 'Add to Cart'}</span>
                  </button>             
                </div>
              </Form>
            </div>
          </Row>
        </Container>
      </section>

      {/* Image Editing Modal */}      
      {product.requiresImage && imageMask && (
        <ImageEditor
          show={showModal}
          onHide={() => setShowModal(false)}
          uploadedImage={uploadedImage}
          maskImage={imageMask.src}
          onSave={(finalImageData) => {
            console.log('=== IMAGE EDITOR SAVE DEBUG ===');
            console.log('Received finalImageData:', !!finalImageData);
            console.log('finalImageData length:', finalImageData?.length || 0);
            console.log('finalImageData starts with:', finalImageData ? finalImageData.substring(0, 50) + '...' : 'NONE');
            
            if (!finalImageData) {
              console.error('Final image is not valid.');
              setCartError('Failed to save edited image. Please try again.');
              return;
            }
            
            // Set both the final image and preview
            setFinalImage(finalImageData);           // This is the masked/edited image
            setImagePreview(finalImageData);         // Use the final image as preview too
            
            // Clear any previous errors
            setFormErrors(prev => {
              const newErrors = {...prev};
              delete newErrors.finalImage;
              return newErrors;
            });
            
            console.log('=== IMAGE STATES AFTER SAVE ===');
            console.log('finalImage set:', !!finalImageData);
            console.log('imagePreview set:', !!finalImageData);
            
            // Close the modal
            setShowModal(false);
          }}
        />
      )}
    </PageLayout>
  );
}