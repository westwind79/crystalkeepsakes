// pages/ProductDetail.jsx
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../components/common/SEOHead';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate  } from 'react-router-dom';
// pages/ProductDetail.jsx
import { useCart } from '../contexts/CartContext';

import { Container, Row, Col, Form, Alert } from 'react-bootstrap';
import { ProductSizeComponent } from '../utils/unitConversion';
import { products } from '../data/products';
import { CartUtils } from '../utils/cartUtils';
import { CartError } from '../utils/cartUtils';
import ProductGallery from '../components/product/ProductGallery';

import { PageLayout } from '../components/layout/PageLayout';
import { Check, User } from 'lucide-react'; 
import { getImagePath } from '../utils/imageUtils';


export function ProductDetail() {
  
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

    // Find the product based on URL parameter
  const product = products.find(p => p.slug === slug);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);

  const [cartError, setCartError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [showCustomText, setShowCustomText] = useState(false);
  const textLine1Ref = useRef(null);

  const [selectedOptions, setSelectedOptions] = useState({
    size: 's',
    background: '',
    lightBase: '',
    image: null,
    textLine1: '', // Add first text line
    textLine2: ''  // Add second text line
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

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (validateImage(file)) {
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        // Create an image element to check dimensions
        const img = new Image()
        img.onload = () => {
          if (img.width < 500 || img.height < 500) {
            setImageError('Image must be at least 500x500 pixels')
            setImagePreview(null)
            return
          }
          setImagePreview(e.target.result)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)

      setSelectedOptions({
        ...selectedOptions,
        image: file
      })
    } else {
      e.target.value = null // Reset file input
      setSelectedOptions({
        ...selectedOptions,
        image: null
      })
    }
  } 

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

    // Check image
    if (!selectedOptions.image) {
      console.log('Image validation failed');
      return false;
    }

    console.log('All validations passed');
    return true;
  };

  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCartError(null);
    setFormErrors({});
    
    // Validate form
  const validationErrors = validateFormFields();
  if (Object.keys(validationErrors).length > 0) {
    setFormErrors(validationErrors);
    return;
  }
  
  setIsAddingToCart(true);
  
  try {
      // Create cart item
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: totalPrice,
        options: {
          size: selectedOptions.size,
          background: selectedOptions.background,
          lightBase: selectedOptions.lightBase,
          customText: {
            line1: selectedOptions.textLine1?.trim() || '',
            line2: selectedOptions.textLine2?.trim() || ''
          },
          imageUrl: imagePreview
        }
      };

      // Add to cart using context
      await addToCart(cartItem);

      // Success - ask user to view cart
      const shouldNavigate = window.confirm(
        'Item added to cart! Would you like to view your cart?'
      );
      
      if (shouldNavigate) {
        navigate('/cart');
      }

    } catch (error) {
      // ... existing error handling ...
    } finally {
      setIsAddingToCart(false);
    }
  };

  const validateFormFields = () => {
    const errors = {};
    
    const validators = {
      size: {
        isValid: (value) => !!value,
        message: 'Please select a size'
      },
      background: {
        isValid: (value) => !!value,
        message: 'Please select a background'
      },
      lightBase: {
        isValid: (value) => !!value,
        message: 'Please select a lightbase'
      },
      image: {
        isValid: () => !!imagePreview,  // Check imagePreview directly
        message: 'Please upload an image'
      }
    };

    // Validate all fields except image
    Object.entries(validators).forEach(([field, validator]) => {
      if (field === 'image') {
        // Handle image validation separately
        if (!validator.isValid()) {
          errors[field] = validator.message;
        }
      } else {
        // Handle other fields
        if (!validator.isValid(selectedOptions[field])) {
          errors[field] = validator.message;
        }
      }
    });
    
    return errors;
  };

  const [textValidation, setTextValidation] = useState({
    line1: {
      count: 0,
      error: ''
    },
    line2: {
      count: 0,
      error: ''
    }
  })

  // Calculate total price whenever options change
  useEffect(() => {
    if (!product) return
    
    let price = product.basePrice
    
    if (selectedOptions.size) {
      const sizeOption = product.sizes.find(s => s.id === selectedOptions.size)
      price = sizeOption?.price || product.basePrice
    }
    
    if (selectedOptions.background) {
      const bgOption = product.backgroundOptions.find(b => b.id === selectedOptions.background)
      price += bgOption?.price || 0
    }
    
    if (selectedOptions.lightBase) {
      const baseOption = product.lightBases.find(b => b.id === selectedOptions.lightBase)
      price += baseOption?.price || 0
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
     const textOption = product.textOptions[1]
     // const textOption = { price: 10 } 
      price += textOption.price
    }

    setTotalPrice(price);
    setFormErrors({}); 
  }, [selectedOptions, product, showCustomText])

  // Separate useEffect for focus
  useEffect(() => {
    if (showCustomText && textLine1Ref.current) {
      textLine1Ref.current.focus()
    }
  }, [showCustomText])
  
  if (!product) {

    return <div>Product not found</div>

  }
  
  const mainImage = product.images.find(img => img.isMain) || product.images[0];
  const imageMask = product.productMask && product.productMask[0] ? product.productMask[0] : null;

  return (
    <PageLayout 
      pageTitle="3D Crystals from CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal."
      className="product-detail"
    >    

    <section className="hero">
      <div className="hero-content">
        <h1>{product.name}</h1>
        <p className="lead">{product.description}</p>
      </div>
    </section>

        <section className="py-5">
          <Container>
            <Row>
              <div className="col-12 col-sm-12 col-md-5 col-lg-5">

                <div className="product-preview">
                  <ProductGallery images={product.images} />
                </div>

                {/* Uploaded Image Preview -- build it overlay later */}
                <div className="image-upload-preview mb-4">
                  <div className="image-upload-container">
                    {imagePreview ? (
                      <div className="image-upload-overlay-mask">  
                        <img 
                          src={imageMask.src} 
                          // src="/img/products/prestige-mask.png" 
                          alt="Mask" 
                          className="img-fluid upload-image-mask"
                        /> 

                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="img-fluid upload-image"
                      />
                    </div>
                    ) : (      
                      <div className="image-upload-placeholder">
                        Upload an image to see preview
                      </div>
                    )} 
                  </div>
                </div>
              </div>

              <div className="col-12 col-sm-12 col-md-7 col-lg-6">
              
                <div className="total-price mb-4">
                  <h2>Total: ${totalPrice.toFixed(2)}</h2>
                </div>

                <Form className="product-options" onSubmit={handleSubmit}> 

                 {/* Image Upload */} 
                 <Form.Group className="product-option mb-4">
                  <Form.Label>Upload Your Image <span className="text-danger">*</span></Form.Label>
                  {formErrors.image && (
                    <div className="alert-danger text-danger small">{formErrors.image}</div>
                  )}

                  {/*old*/}
                  {/*{formErrors.size && (
                    <div className="text-danger small">{formErrors.size}</div>
                  )}*/}

                  <Form.Control
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleImageChange}
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


                 {/* Size Selection */}
                  <Form.Group className="product-option pt-2 mt-2">
                    <Form.Label>Select Size <span className="text-danger">*</span></Form.Label>
                    {formErrors.size && (
                      <div className="text-danger small">{formErrors.size}</div>
                    )}
                    {product.sizes.map(size => (
                      <label key={size.id} className="crystal-radio">
                        <span className="product-faces"><User size={18} /><br/>{size.faces}</span>  &nbsp;<span>{product.name}</span>

                        <span dangerouslySetInnerHTML={ProductSizeComponent(size.name)} />
                        <br/>
                        <span className="option-price">
                          <span className="option-price__wrapper">
                            {size.price === 0 ? (
                              <span className="option-price__included">
                                <span className="option-price__paren">(</span>
                                <span className="option-price__text">Included</span>
                                <span className="option-price__paren">)</span>
                              </span>
                            ) : (
                              <span className="option-price__additional">
                                <span className="option-price__paren">(</span>
                                <span className="option-price__prefix">+</span>
                                <span className="option-price__currency">$</span>
                                <span className="option-price__value">{size.price}</span>
                                <span className="option-price__paren">)</span>
                              </span>
                            )}
                          </span>
                        </span>

                        <input
                          type="radio"
                          name="size"
                          required
                          checked={selectedOptions.size === size.id}
                          onChange={() => setSelectedOptions({
                            ...selectedOptions,
                            size: size.id
                          })}
                        />

                        {/*<span className="radio-checkmark"><Check size={18} /></span>*/}
                      </label>
                    ))}
                  </Form.Group>

                  {/* Custom Text Fields */}
                  <Form.Group className="product-option pt-2 mt-2">
                    <Form.Label className="d-flex justify-content-start align-items-center">
                      <Form.Check
                        type="checkbox"
                        label={``}
                        checked={showCustomText}
                        onChange={(e) => setShowCustomText(e.target.checked)}
                      /> Add Custom Text (+${product.textOptions[1].price.toFixed(2)}) 
                    </Form.Label>
                    
                    {showCustomText && (
                      <>
                        <span className="character-count">
                          ({textValidation.line1.count}/30)
                        </span>
                        <Form.Control
                          type="text"
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
                        
                        <span className="character-count mt-2">
                          ({textValidation.line2.count}/30)
                        </span>
                        <Form.Control
                          placeholder="Custom Text Line 2"
                          type="text"
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
                  {/*<Form.Group className="product-option pt-2 mt-2">
                  
                  <Form.Label>Custom Text</Form.Label>
                     
                      <span className="character-count">
                        ({textValidation.line1.count}/30)
                      </span>
                    <Form.Control
                      type="text"
                      placeholder="Custom Text Line 1"
                      // required
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
                     
                      <span className="character-count">
                        ({textValidation.line2.count}/30)
                      </span> 
                    <Form.Control
                      placeholder="Custom Text Line 2"
                      type="text"
                      // required
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
                  </Form.Group>*/}

                 {/* Background Option */}
                  <Form.Group className="product-option pt-2 mt-2">
                    <Form.Label>Background Style <span className="text-danger">*</span></Form.Label>
                    {/* ERROR Background Option */}
                    {formErrors.background && (
                      <div className="text-danger small">{formErrors.background}</div>
                    )}

                    {product.backgroundOptions.map(bg => (
                      <label key={bg.id} className="crystal-radio">
                        {bg.name}
                        <span className="option-price">
                          {bg.price === 0 ? '(Included)' : `(+$${bg.price})`}
                        </span>
                        <input
                          type="radio"
                          name="background"
                          required
                          checked={selectedOptions.background === bg.id}
                          onChange={() => setSelectedOptions({
                            ...selectedOptions,
                            background: bg.id
                          })}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                  </Form.Group>

                  {/* Light Base Selection */}
                  <Form.Group className="product-option pt-2 mt-2">
                    <Form.Label>Light Base <span className="text-danger">*</span></Form.Label>
                    
                    {/* ERROR Light Base Selection */}
                    {formErrors.lightBase && (
                      <div className="text-danger small">{formErrors.lightBase}</div>
                    )}

                    {product.lightBases.map(base => (
                      <label key={base.id} className="crystal-radio">
                        {base.name}
                        <span className="option-price">
                          {base.price === 0 ? '(Included)' : `(+$${base.price})`}
                        </span>
                        <input
                          type="radio"
                          name="lightBase"
                          required
                          checked={selectedOptions.lightBase === base.id}
                          onChange={() => setSelectedOptions({
                            ...selectedOptions,
                            lightBase: base.id
                          })}
                        />
                        <span className="radio-checkmark"></span>
                      </label>
                    ))}
                  </Form.Group>

                  <div className="total-price mb-4">
                    <h3>Total: ${totalPrice.toFixed(2)}</h3>
                  </div>
                  {cartError && (
                    <Alert variant="danger" className="mb-4" onClose={() => setCartError(null)} dismissible>
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

                </Form>
              </div>
            </Row>
          </Container>
        </section>
      </PageLayout>
  )
}