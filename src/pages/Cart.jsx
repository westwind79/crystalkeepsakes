// pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Form } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react'; 

import { Elements, PaymentElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
import { getStripePromise } from '../utils/stripeUtils';

import { CartUtils, getFullImage, storageUtils } from '../utils/cartUtils';
import { useCart } from '../contexts/CartContext';

import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { SEOHead } from '../components/common/SEOHead'; 
import { PageLayout } from '../components/layout/PageLayout';
import { PaymentErrorHandler } from '../components/payment/PaymentErrorHandler';

import { products } from '../data/products';

// Debug utility at the top of the file
const debug = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const logApiCall = async (endpoint, method, data) => {
  console.log(`API Call to ${endpoint} (${method})`, data);
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json();
    console.log(`API Response from ${endpoint}:`, responseData);
    return { response, data: responseData };
  } catch (error) {
    console.error(`API Error from ${endpoint}:`, error);
    throw error;
  }
};

// Order number generator
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Shipping options
const STRIPE_SHIPPING_OPTIONS = [
  {
    id: 'shr_standard',
    name: 'Standard Shipping',
    description: '5-7 business days',
    price: 5.99,
    display_name: 'Standard Shipping',
    fixed_amount: {
      amount: 599,
      currency: 'usd',
    },
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 5 },
      maximum: { unit: 'business_day', value: 7 },
    },
  },
  {
    id: 'shr_express',
    name: 'Express Shipping',
    description: '2-3 business days',
    price: 12.99,
    display_name: 'Express Shipping',
    fixed_amount: {
      amount: 1299,
      currency: 'usd',
    },
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 2 },
      maximum: { unit: 'business_day', value: 3 },
    },
  },
  {
    id: 'shr_overnight',
    name: 'Overnight Shipping',
    description: 'Next business day',
    price: 24.99,
    display_name: 'Overnight Shipping',
    fixed_amount: {
      amount: 2499,
      currency: 'usd',
    },
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 1 },
      maximum: { unit: 'business_day', value: 1 },
    },
  },
];
  
// Integrated checkout form
function CheckoutForm({ cartTotal, cartItems, selectedShipping, onShippingChange }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressComplete, setAddressComplete] = useState(false);
  
  // Track when address has been completed
  const handleAddressChange = async (event) => {
    const { complete } = event;
    setAddressComplete(complete);
  };
  
// FIXED VERSION - Cart.jsx CheckoutForm handleSubmit function

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setErrorMessage('Payment system not ready. Please try again in a moment.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      
      const finalOrderNumber = sessionStorage.getItem('finalOrderNumber') || generateOrderNumber();

      const addressElement = elements.getElement('address');
      
      if (addressElement) {
        const { complete, value } = await addressElement.getValue();
        if (!complete) {
          setErrorMessage('Please fill out all shipping address fields.');
          setIsProcessing(false);
          return;
        }
      }

      // Add debugging here
      console.log('Selected shipping before storing:', selectedShipping);
      
      // Store shipping info in session storage before confirming payment
      sessionStorage.setItem('selectedShipping', JSON.stringify(selectedShipping));
      
      // Verify it was stored
      const storedShipping = sessionStorage.getItem('selectedShipping');
      console.log('Stored shipping in session storage:', storedShipping);
      
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        cartItems, 
        subtotal: cartTotal, 
        shippingCost: selectedShipping.price, 
        shippingMethod: selectedShipping.name, 
        total: cartTotal + selectedShipping.price,
        orderNumber: finalOrderNumber 
      }));

      const { error } = await stripe.confirmPayment({
      elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderNumber=${encodeURIComponent(finalOrderNumber)}`,
        },
      });
      
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="alert alert-danger mb-3">{errorMessage}</div>
      )}
      
      <div className="checkout-sections">
        {/* Shipping Address Section */}
        <section className="checkout-section mb-4">
          <h4 className="mb-3">Shipping Address</h4>
          <AddressElement 
            onChange={handleAddressChange}
            options={{
              mode: 'shipping',
              allowedCountries: ['US', 'CA'],
              fields: {
                phone: 'always',
                email: 'always',
              },
              validation: {
                phone: { required: 'always' },
                email: { required: 'always' }
              },
            }} 
          />
        </section>
        
        {/* Only show shipping options once address is complete */}
        {addressComplete && (
          <section className="checkout-section mb-4">
            <h4 className="mb-3">Shipping Options</h4>
            <Form.Group>
              {STRIPE_SHIPPING_OPTIONS.map(option => (
                <div key={option.id} className="mb-2">
                  <Form.Check
                    type="radio"
                    id={option.id}
                    name="shippingOption"
                    label={`${option.name} - $${option.price.toFixed(2)} (${option.description})`}
                    checked={selectedShipping.id === option.id}
                    onChange={() => onShippingChange(option)}
                    className="shipping-option-radio"
                  />
                </div>
              ))}
            </Form.Group>
          </section>
        )}
        
        {/* Payment Section */}
        <section className="checkout-section mb-4">
          <h4 className="mb-3">Payment Details</h4>
          <PaymentElement options={{
            layout: { type: 'tabs', defaultCollapsed: false },
          }} />
        </section>
        
        {/* Order Summary */}
        <section className="checkout-section mb-4">
          <h4 className="mb-3">Order Summary</h4>
          <div className="d-flex justify-content-between mb-2">
            <div>Items Subtotal:</div>
            <div>${cartTotal.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <div>Shipping:</div>
            <div>${selectedShipping.price.toFixed(2)}</div>
          </div>
          <div className="d-flex justify-content-between mb-2 fw-bold">
            <div>Total:</div>
            <div>${(cartTotal + selectedShipping.price).toFixed(2)}</div>
          </div>
        </section>
        
        <button 
          type="submit"
          className="btn btn-primary btn-lg w-100 mt-4"
          disabled={!stripe || !addressComplete || isProcessing}
        >
          {isProcessing 
            ? "Processing payment..." 
            : `Complete Purchase - $${(cartTotal + selectedShipping.price).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export function Cart() {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");   
  const [selectedShipping, setSelectedShipping] = useState(STRIPE_SHIPPING_OPTIONS[0]);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [fullCartItems, setFullCartItems] = useState([]);

  // Loading states
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    isProcessing: false
  });
  
  // Error states
  const [checkoutError, setCheckoutError] = useState(null);
  const [error, setError] = useState(null);

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);
  const orderTotal = cartTotal + selectedShipping.price;

  // Handle shipping option change
  const handleShippingChange = (option) => {
    setSelectedShipping(option);
    // Consider updating the order total on the server if needed
  };

  // Load cart items with full images
  useEffect(() => {
    const fetchFullCartItems = async () => {
      try {
        if (!cartItems || cartItems.length === 0) {
          setFullCartItems([]);
          return;
        }

        const itemsWithFullImages = await Promise.all(
          cartItems.map(async (item) => {
            const fullItem = await CartUtils.getFullCartItem(item.cartId);
            return fullItem;
          })
        );
        setFullCartItems(itemsWithFullImages.filter(Boolean));
      } catch (error) {
        console.error('Error fetching cart items:', error);
        setFullCartItems([]);
      }
    };

    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));

    fetchFullCartItems();

    // Listen for cart updates
    window.addEventListener('cartUpdated', fetchFullCartItems);
    
    return () => {
      window.removeEventListener('cartUpdated', fetchFullCartItems);
    };
  }, [cartItems]);

  // Create payment intent when component mounts if cart has items
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!cartItems.length) return;
      
      try {
        setIsLoadingPayment(true);
        setCheckoutError(null);
        
        const orderNumber = generateOrderNumber();
        const apiUrl = '/api/create-payment-intent.php';

        // Calculate everything upfront
        const subtotal = cartTotal;
        const shippingCost = selectedShipping.price;
        const taxAmount = 0; // Add your tax calculation here
        const total = subtotal + shippingCost + taxAmount;

        // Create CLEAN cart items without images for Stripe
        const cleanCartItems = cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: parseFloat(item.price),
          quantity: 1,
          options: {
            size: item.options.size,
            background: item.options.background,
            lightBase: item.options.lightBase,
            giftStand: item.options.giftStand,
            customText: item.options.customText
            // NOTE: Deliberately excluding imageUrl, rawImageUrl, maskedImageUrl
          }
        }));

        const cartData = {
          cartItems: cleanCartItems,
          fullCartItems: cartItems,
          subtotal: subtotal,
          shippingCost: shippingCost,
          shippingMethod: selectedShipping.name,
          taxAmount: taxAmount,
          total: total,
          orderNumber: orderNumber,
        };

        try {
          const { response, data } = await logApiCall(apiUrl, 'POST', cartData);
          
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            throw new Error(data.error || 'Failed to initialize payment');
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          setCheckoutError(`Payment initialization failed: ${apiError.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Payment intent creation error:', error);
        setCheckoutError('Failed to initialize payment. Please try again.');
      } finally {
        setIsLoadingPayment(false);
      }
    };
    
    createPaymentIntent();
  }, [cartItems]);

  // Load Stripe when component mounts
  useEffect(() => {
    async function loadStripe() {
      try {
        const stripe = await getStripePromise();
        setStripePromise(stripe);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        setCheckoutError('Failed to initialize payment system. Please try again later.');
      }
    }
    
    loadStripe();
  }, []);

  // Handle removing item
  const handleRemoveItem = async (cartId) => {
    try {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: true
      }));
      await removeFromCart(cartId);
      // Clean up after removal
      storageUtils.cleanupUnusedImages();
    } catch (err) {
      setError({
        type: 'remove',
        message: 'Failed to remove item'
      });
    } finally {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

  // Handle clearing cart
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: true
      }));
      await clearCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setError({
        type: 'clear',
        message: 'Failed to clear cart'
      });
    } finally {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

  // Show loading state
  if (loadingState.isLoading) {
    return <LoadingSpinner />;
  }

  // Show empty cart
  if (!cartItems.length || !fullCartItems.length) {
    return (
      <PageLayout 
        pageTitle="Your Shopping Cart is Empty | CrystalKeepsakes"
        pageDescription="Review and checkout your custom crystal creations."
        className="empty-cart"
      >
        <section className="hero py-4">
          <div className="hero-content">
            <h1 className="primary-header">Your Cart is Empty</h1>
            <p className="mt-3">Add some beautiful crystals to get started!</p>
          </div>
        </section>
        <Container className="mt-5 mb-5">
          <Row>
            <Col className="text-center col-sm-8 mx-auto">
              <p>Ready to create something special?</p>
              <Link className="btn btn-primary" to="/products">
                Browse Our Designs
              </Link>
            </Col>
          </Row>
        </Container>
      </PageLayout>
    );
  }

  const getOptionName = (item, optionType, optionId) => {
    // Default fallback
    if (!optionId) return 'Not selected';
    
    // Find the corresponding product
    const product = products.find(p => p.id === item.productId);
    if (!product) return optionId; // Fallback if product not found
    
    // Look up the option name in the correct product
    if (optionType === 'size' && product.sizes) {
      const option = product.sizes.find(o => o.id === optionId);
      return option ? option.name : optionId;
    }
    else if (optionType === 'background' && product.backgroundOptions) {
      const option = product.backgroundOptions.find(o => o.id === optionId);
      return option ? option.name : optionId;
    }
    else if (optionType === 'lightBase' && product.lightBases) {
      const option = product.lightBases.find(o => o.id === optionId);
      return option ? option.name : optionId;
    }
    else if (optionType === 'giftStand' && product.giftStand) {
      const option = product.giftStand.find(o => o.id === optionId);
      return option ? option.name : optionId;
    }
    
    return optionId; // Fallback to ID if option not found
  };

  return (
    <PageLayout 
      pageTitle="Shopping Cart | CrystalKeepsakes"
      pageDescription="Review and checkout your custom crystal creations."
      className="cart"
    >
      <section className="hero py-4">
        <div className="hero-content">
          <h1 className="primary-header">Your Cart</h1>
          <p className="mt-3">Review your selections and complete checkout</p>
        </div>
      </section>

      <section className="breadcrumb pt-3">
        <Container>
          <Row>
            <div className="col-12 col-sm-12">
              <Link to="/products"><ArrowLeft size={20}/> Continue Shopping</Link>
            </div>
          </Row>
        </Container>
      </section>

      <Container className="mt-2 mb-5">
        {error && (
          <PaymentErrorHandler 
            error={error}
            onRetry={null}
          />
        )}

        <Row>
          {/* Cart Items Column */}
          <Col xs={12} md={7} lg={8}>
            <div className="cart-summary p-4 rounded">
              <div className="cart-items">
                <h3 className="mb-3">Your Items</h3>
 
                {fullCartItems.map((item) => {
                  // Find the product to get its main image and available options
                  const product = products.find(p => p.id === item.productId);
                  const mainImage = product?.images?.find(img => img.isMain) || product?.images?.[0];
                  
                  return (
                    <div key={item.cartId} className="cart-item bg-light mb-4 rounded-3">
                      <h4>{item.name}</h4>
                      <Row>
                        {/* Images Section */}
                        <div className="col-xs-12 col-md-7">
                          {/* Show uploaded images if they exist */}
                          {item.options.imageUrl && (
                            <div className="cart-uploaded-image mb-3">
                              <h5 className="h6 mb-2">Preview:</h5>
                              <img 
                                src={getFullImage(item.options.imageUrl, 'preview')}
                                alt="Preview image"
                                className="img-thumbnail img-fluid" 
                                onError={(e) => {
                                  console.error('Error loading preview image:', item.options.imageUrl);
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                          )} 
                          {item.options.maskedImageUrl && (
                            <div className="masked-image mb-3">
                              <h5 className="h6 mb-2">Final Design:</h5>
                              <img 
                                src={getFullImage(item.options.maskedImageUrl, 'masked')}
                                alt="Final masked image"
                                className="img-thumbnail img-fluid" 
                                onError={(e) => {
                                  console.error('Error loading masked image:', item.options.maskedImageUrl);
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Show product image if no uploaded images */}
                          {!item.options.imageUrl && !item.options.maskedImageUrl && mainImage && (
                            <div className="product-image mb-3">
                              <img 
                                src={mainImage.src}
                                alt={item.name}
                                className="img-thumbnail img-fluid" 
                                onError={(e) => {
                                  console.error('Error loading product image:', mainImage.src);
                                  e.target.src = '/placeholder-image.png';
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Item Details */}
                        <div className="col-12 col-md-5">
                          {/* Only show options that exist for this product */}
                          {(product?.sizes?.length > 0 || 
                            product?.backgroundOptions?.length > 0 || 
                            product?.lightBases?.length > 0 || 
                            product?.giftStand?.length > 0) && (
                            <div className="selected-options">
                              <h5 className="h6 mb-2">Selected Options:</h5>
                              <ul className="list-unstyled">
                                {product?.sizes?.length > 0 && (
                                  <li>
                                    <span className="option-label">Size:</span><br />
                                    <span className="option-value">{getOptionName(item, 'size', item.options.size)}</span>
                                  </li>
                                )}
                                {product?.backgroundOptions?.length > 0 && (
                                  <li>
                                    <span className="option-label">Background:</span><br />
                                    <span className="option-value">{getOptionName(item, 'background', item.options.background)}</span>
                                  </li>
                                )}
                                {product?.lightBases?.length > 0 && (
                                  <li>
                                    <span className="option-label">Light Base:</span><br />
                                    <span className="option-value">{getOptionName(item, 'lightBase', item.options.lightBase)}</span>
                                  </li>
                                )}
                                {product?.giftStand?.length > 0 && (
                                  <li>
                                    <span className="option-label">Stand:</span><br />
                                    <span className="option-value">{getOptionName(item, 'giftStand', item.options.giftStand)}</span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Custom Text if any */}
                          {(item.options.customText?.line1 || item.options.customText?.line2) && (
                            <div className="custom-text mt-3">
                              <h5 className="h6 mb-2">Custom Text:</h5>
                              <ul className="list-unstyled">
                                {item.options.customText?.line1 && (
                                  <li>
                                    <span className="text-label">Line 1:</span>
                                    <span className="text-value">
                                      {item.options.customText.line1}
                                    </span>
                                  </li>
                                )}
                                {item.options.customText?.line2 && (
                                  <li>
                                    <span className="text-label">Line 2:</span>
                                    <span className="text-value">
                                      {item.options.customText.line2}
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                          
                          {/* Price and Remove Button */}
                          <div className="mt-3">
                            <div className="price mb-2">
                              <h5 className="price-label">
                                Price: <span className="price-value">
                                  ${item.price.toFixed(2)}
                                </span>
                              </h5>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRemoveItem(item.cartId)}
                              disabled={loadingState.isProcessing}
                            >
                              Remove Item
                            </button>
                          </div>
                        </div>
                      </Row>
                    </div>
                  );
                })}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearCart}
                    disabled={loadingState.isProcessing}
                  >
                    Clear Cart
                  </button>
                  <Link to="/products" className="btn btn-outline-primary">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </Col> 

          {/* Checkout Column */}
          <Col xs={12} md={5} lg={4}>
            <div className="checkout-section p-4 border rounded sticky-top" style={{top: "100px"}}>
              <h3 className="mb-4">Checkout</h3>
              
              {checkoutError && (
                <Alert variant="danger" className="mb-3">
                  {checkoutError}
                </Alert>
              )}
              
              {isLoadingPayment ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading payment form...</span>
                  </div>
                  <p className="mt-3">Preparing checkout...</p>
                </div>
              ) : clientSecret && stripePromise ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{
                    clientSecret,
                    loader: 'auto',
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#72B01D',
                      },
                    },
                  }}
                >
                  <CheckoutForm 
                    cartTotal={cartTotal}
                    cartItems={cartItems}
                    selectedShipping={selectedShipping}
                    onShippingChange={handleShippingChange}
                  />
                </Elements>
              ) : (
                <div>
                  <p>Unable to initialize checkout. Please try again later.</p>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}