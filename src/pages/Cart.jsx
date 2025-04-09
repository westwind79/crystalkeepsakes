// pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';

import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { ArrowBigLeft, ArrowLeft } from 'lucide-react'; 
import { useCart } from '../contexts/CartContext';
import CartDebug  from '../utils/CartDebug';
import { CartUtils, getFullImage, storageUtils } from '../utils/cartUtils';
import { LoadingSpinner } from '../components/common/LoadingSpinner'; 
import { PageLayout } from '../components/layout/PageLayout';
import { PaymentErrorHandler } from '../components/payment/PaymentErrorHandler';

// Add debug utility at the top of the file
const debug = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

const stripePromise = loadStripe("pk_test_51QoDXkFGPmVZe548YMJNAiNX4DoiU7jjlXJ89IPD4S80dvppPLltvgDDQlm8ILw8NibDlcimbSfRPPkn1lVS7P7W00rZzMONme"); // Replace with your actual key
// Add this new function after your existing imports
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};


export function Cart() {
  const [clientSecret, setClientSecret] = useState("");  
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [fullCartItems, setFullCartItems] = useState([]); // State to hold cart items with full image data

  // Consolidated loading states
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    isProcessing: false
  });
  
  // Error states
  const [checkoutError, setCheckoutError] = useState(null);
  const [error, setError] = useState(null);

  // Calculate cart total
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);

  // 1. Combined initialization and cleanup effect
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

  // 2. Combined payment processing effect
  // Update the payment processing effect
  useEffect(() => {
    let isSubscribed = true; // For cleanup/preventing updates after unmount

    const initializePayment = async () => {
      if (!stripe) {
        debug('Waiting for Stripe to initialize...');
        return;
      }

      // Only log initialization once
      if (!clientSecret) {
        debug('Stripe ready for payment initialization');
      }

      // If we have a client secret, prepare payment form
      if (clientSecret && isSubscribed) {
        try {
          debug('Payment form ready with client secret');
        } catch (error) {
          console.error('Payment setup error:', error);
          setCheckoutError('Failed to initialize payment form');
        }
      }
    };

    initializePayment();

    // Cleanup
    return () => {
      isSubscribed = false;
    };
  }, [stripe, clientSecret]); // Only re-run when stripe or clientSecret change

  // Update the handleCheckout function
  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    
    try {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: true
      }));

      setCheckoutError(null);

      if (!stripe || !elements) {
        setCheckoutError('Payment system is not ready. Please try again.');
        return;
      }

      if (!cartItems.length) {
        setCheckoutError('Your cart is empty');
        return;
      }

      const orderNumber = generateOrderNumber();
      
      // If we don't have a client secret yet, create the payment intent
      if (!clientSecret) {
        const cartData = {
          cartItems: cartItems.map(item => ({
            name: item.name,
            price: parseFloat(item.price),
            quantity: 1,
            options: {
              size: item.options?.size || 'default',
              background: item.options?.background || 'default',
              lightBase: item.options?.lightBase || 'default',
              customText: item.options?.customText || ''
            }
          }))
        };

        const response = await fetch('/api/create-payment-intent.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...cartData,
            orderNumber
          })
        });

        const data = await response.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Failed to initialize payment');
        }
        return;
      }

      // Process the payment
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation?orderNumber=${orderNumber}`,
        },
      });

      if (submitError) {
        throw new Error(submitError.message);
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Failed to process checkout. Please try again.');
      setLoadingState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

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

  return (
    <PageLayout 
      pageTitle="Shopping Cart | CrystalKeepsakes"
      pageDescription="Review and checkout your custom crystal creations."
      className="cart"
    >
     {/*<CartDebug />*/}
      <section className="hero py-4">
        <div className="hero-content">
          <h1 className="primary-header">Your Cart</h1>
          <p className="mt-3">Review your selections before checkout</p>
        </div>
      </section>

      <section className="breadcrumb pt-3">
        <Container>
          <Row>
            <div className="col-12 col-sm-12">
              <Link to="/products"><ArrowLeft size={20}/> Order more</Link>
            </div>
          </Row>
        </Container>
      </section>

      <Container className="mt-2">
        {error && (
          <PaymentErrorHandler 
            error={error}
            onRetry={error.type === 'checkout' ? handleCheckout : null}
          />
        )}

        <Row>
          {/* Cart Items Column */}
          <Col xs={12} sm={7} md={6} lg={7}>
            <div className="cart-items">
              {fullCartItems.map((item) => (
                <div key={item.cartId} className="cart-item bg-light mb-4 p-4 rounded-3">
                  <h3>{item.name}</h3>
                  <Row>
                    {/* Preview Images Section in Cart.jsx */}
                      <div className="col-xs-12 col-md-7">                        
                        {/*
                        {item.options.rawImageUrl && (
                          <div className="cart-uploaded-image">
                            <h4 className="h5 mb-2">Original Image:</h4>
                            <img 
                              src={getFullImage(item.options.rawImageUrl, 'raw')}
                              alt="Original uploaded image"
                              className="img-thumbnail img-fluid" 
                              onError={(e) => {
                                console.error('Error loading raw image:', item.options.rawImageUrl);
                                e.target.src = '/placeholder-image.png';
                              }}
                            />
                          </div>
                        )}
                        <br />
                        */}

                        {item.options.imageUrl && (
                          <div className="cart-uploaded-image mb-3">
                            <h4 className="h5 mb-2">Preview:</h4>
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
                          <div className="masked-image">
                            <h4 className="h5 mb-2">Final Design:</h4>
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
                      </div>
                    {/* Item Details */}
                    <div className="col-12 col-md-5">
                      <div className="selected-options">
                        <h4 className="h5 mb-2">Selected Options:</h4>
                        <ul className="list-unstyled">
                          <li>
                            <span className="option-label">Size:</span>
                            <span className="option-value">{item.options.size}</span>
                          </li>
                          <li>
                            <span className="option-label">Background:</span>
                            <span className="option-value">{item.options.background}</span>
                          </li>
                          <li>
                            <span className="option-label">Light Base:</span>
                            <span className="option-value">{item.options.lightBase}</span>
                          </li>
                        </ul>
                      </div>

                      {/* Custom Text if any */}
                      {(item.options.customText?.line1 || item.options.customText?.line2) && (
                        <div className="custom-text mt-3">
                          <h4 className="h6 mb-2">Custom Text:</h4>
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
                    </div>

                    {/* Price and Remove Button */}
                    <div className="col-12 text-md-end mt-3">
                      <div className="price mb-3">
                        <h4 className="price-label">
                          Price: <span className="price-value">
                            ${item.price.toFixed(2)}
                          </span>
                        </h4>
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
                  </Row>
                </div>
              ))}
            </div>
          </Col> 

          {/* Cart Summary Column */}
          <Col xs={12} sm={5} md={6} lg={5}>
            <div className="cart-summary p-4 border rounded">
              <Row>
                <Col xs={12}>
                  <div className="total-price mb-3">
                    <h4>Total: ${cartTotal.toFixed(2)}</h4>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col className="text-md-end">
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <form onSubmit={handleCheckout}>
                        <PaymentElement />
                        <button 
                          type="submit"
                          className="btn btn-primary btn-lg w-100 mt-4"
                          disabled={!stripe || loadingState.isProcessing}
                        >
                          {loadingState.isProcessing ? "Processing..." : `Pay $${cartTotal.toFixed(2)}`}
                        </button>
                      </form>
                    </Elements>
                  ) : (
                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary btn-lg w-100"
                      disabled={loadingState.isProcessing}
                    >
                      {loadingState.isProcessing ? "Processing..." : "Proceed to Checkout"}
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary my-3"
                    onClick={handleClearCart}
                    disabled={loadingState.isProcessing}
                  >
                    Clear Cart
                  </button>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}