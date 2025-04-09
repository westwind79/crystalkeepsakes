// pages/ProductDetail.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const sizeRef = useRef(null);
  const backgroundRef = useRef(null);
  const lightBaseRef = useRef(null);
  const imageUploadRef = useRef(null); // Create a ref for the image upload section

  const [showModal, setShowModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 });
  const [finalImage, setFinalImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

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
    size: 'small',
    background: 'rm',
    lightBase: 'none',
    image: null,
    textLine1: '', // Add first text line
    textLine2: ''  // Add second text line
  });

 const mainImage = product.images.find(img => img.isMain) || product.images[0];
 const imageMask = product.productMask && product.productMask[0] ? product.productMask[0] : null;

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
            setImagePreview(null);
            setFormErrors(prev => ({
              ...prev,
              image: 'Image must be at least 550x550 pixels'
            }));
            return;
          }
          setImagePreview(e.target.result);
          setUploadedImage(e.target.result);
          setShowModal(true);
          // Clear image error when valid
          setFormErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.image;
            return newErrors;
          });
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
      }

      return;
    }

    if (!finalImage) {
      setCartError('Please save the edited image before adding to cart.');
      return;
    }

    setIsAddingToCart(true);

    try {
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
            line2: selectedOptions.textLine2?.trim() || '',
          },
          rawImageUrl: uploadedImage, // Add the original uploaded image
          imageUrl: imagePreview,     // Preview/edited version
          maskedImageUrl: finalImage, // Final masked version
        },
      };

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
      },
      finalImage: {
        isValid: () => !!finalImage, // Check finalImage directly
        message: 'Please save the edited image before adding to cart',
      },
    };

    Object.entries(validators).forEach(([field, validator]) => {
      if (!validator.isValid(selectedOptions[field])) {
        errors[field] = validator.message;
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

  // Add validation effect to run when options change
  useEffect(() => {
  const errors = validateFormFields();
  setFormErrors(errors);
  }, [selectedOptions, imagePreview, finalImage]);

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

    return <div>Product not found</div>

  }
  return (
    <PageLayout 
      pageTitle="3D Crystals from CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal."
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
              {/*<ProductGallery images={product.images} />*/}
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
            <div className="total-price mb-4">
              <h2 className="h1">Total: ${totalPrice.toFixed(2)}</h2>
            </div>

            <Form className="product-options" onSubmit={handleSubmit}> 

             {/* Image Upload */} 
             <Form.Group className="product-option mb-4">
              <Form.Label className="h3" ref={imageUploadRef}><span className="text-danger">*</span> Upload Your Image <CornerRightDown size={23} /></Form.Label>

              {formErrors.image && (
                <div className="alert-danger text-danger small">{formErrors.image}</div>
              )}
             <Form.Control
                type="file"
                required
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

             {/* Size Selection */}
            <Form.Group className="product-option pt-2 mt-2">
              <Form.Label ref={sizeRef}>Select Size <span className="text-danger">*</span></Form.Label>
                {formErrors.size && (
                  <div className="text-danger small">{formErrors.size}</div>
                )}
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
                    name="size"
                    required
                    checked={selectedOptions.size === size.id}
                    onChange={() => handleOptionChange('size', size.id)}
                  />
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
               

             {/* Background Option */}
              <Form.Group className="product-option pt-2 mt-2">
                <Form.Label ref={backgroundRef}>Background Style <span className="text-danger">*</span></Form.Label>
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
                      onChange={() => handleOptionChange('background', bg.id)}
                    />
                    <span className="radio-checkmark"></span>
                  </label>
                ))}
              </Form.Group>

              {/* Light Base Selection */}
              <Form.Group className="product-option pt-2 mt-2">
                <Form.Label ref={lightBaseRef}>Light Base <span className="text-danger">*</span></Form.Label>
                
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
                      onChange={() => handleOptionChange('lightBase', base.id)}
                    />
                    <span className="radio-checkmark"></span>
                  </label>
                ))}
              </Form.Group>
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
    <ImageEditor
      show={showModal}
      onHide={() => setShowModal(false)}
      uploadedImage={uploadedImage}
      maskImage={imageMask.src}
      onSave={(finalImage) => {
        if (!finalImage) {
          console.error('Final image is not valid.');
          return;
        }
        setFinalImage(finalImage); // Set the final masked image
        setImagePreview(uploadedImage); // Set the original uploaded image
      }}
    />
   
  </PageLayout>
  )
}