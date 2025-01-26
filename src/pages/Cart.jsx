// pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';

import { useCart } from '../contexts/CartContext';

import { CartUtils } from '../utils/CartUtils';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { LoadingSpinner } from '../components/common/LoadingSpinner';
 
import { PageLayout } from '../components/layout/PageLayout';
  

export function Cart() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    cart: true,      // Initial cart loading
    remove: false,   // Item removal
    clear: false     // Cart clearing
  });

  const handleCheckout = async () => {
    try {
      setIsProcessing(true);
      setCheckoutError(null);

      if (!cartItems.length) {
        setCheckoutError('Your cart is empty');
        return;
      }

      // Format cart data consistently for both dev and prod
      const cartData = {
        cartItems: cartItems.map(item => ({
          name: item.name,
          price: parseFloat(item.price),
          quantity: 1,
          options: {
            size: item.options.size,
            background: item.options.background,
            lightBase: item.options.lightBase,
            customText: item.options.customText
          }
        }))
      };

      // Development Mode
      if (import.meta.env.DEV) {
        console.log('Development mode - simulating payment flow');
        console.log('Cart data:', JSON.stringify(cartData, null, 2));

        // Store cart info
        sessionStorage.setItem('pendingOrder', JSON.stringify({
          cartItems: cartData.cartItems,
          cartTotal,
          timestamp: new Date().toISOString()
        }));

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to local order confirmation
        window.location.href = '/order-confirmation?status=success';
        return;
      }

      // Production Mode
      console.log('Production mode - processing payment');
      console.log('Sending cart data:', JSON.stringify(cartData, null, 2));

      const response = await fetch('./api/create-payment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      // Parse response
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response format from server');
      }

      console.log('Parsed response:', result);

      // Validate response
      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed');
      }

      if (!result.payment_link || !result.payment_link.url) {
        throw new Error('Invalid payment link structure');
      }

      // Store cart info
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        cartItems: cartData.cartItems,
        cartTotal,
        timestamp: new Date().toISOString()
      }));

      // Redirect to Square payment page
      window.location.href = result.payment_link.url;

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error.message || 'Failed to process checkout. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };


  const loadCart = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, cart: true }));
      // We don't need to set cart items as they come from context
      // Just update loading state
    } catch (err) {
      setError('Failed to load cart items');
      console.error('Cart loading error:', err);
    } finally {
      setLoadingStates(prev => ({ ...prev, cart: false }));
    }
  };

  // Handle removing item from cart
  const handleRemoveItem = async (cartId) => {
    try {
      setLoadingStates(prev => ({ ...prev, remove: true }));
      removeFromCart(cartId);
    } catch (err) {
      setError('Failed to remove item');
      console.error('Remove item error:', err);
    } finally {
      setLoadingStates(prev => ({ ...prev, remove: false }));
    }
  };

  // Handle clearing entire cart
  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        setLoadingStates(prev => ({ ...prev, clear: true }));
        clearCart();
      } catch (err) {
        setError('Failed to clear cart');
        console.error('Clear cart error:', err);
      } finally {
        setLoadingStates(prev => ({ ...prev, clear: false }));
      }
    }
  };
    // State for cart items and loading
  const [setCartItems] = useState([])

  // Calculate total price
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0);

    // Load cart items on component mount
  useEffect(() => {
    loadCart(); // Use the loadCart function you already defined
  }, []);
 // Show loading spinner while initially loading cart
  if (loadingStates.cart) {
   return <LoadingSpinner />
  }

  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  // Show empty cart message when no items
  if (!loadingStates.cart && cartItems.length === 0) {
    const getImagePath = (imageName) => {
      // Remove any leading slash from imageName
      const cleanImageName = imageName.replace(/^\//, '');
      return `${import.meta.env.BASE_URL}${cleanImageName}`;
    };
    return (
      <PageLayout 
        pageTitle="Your Shopping Cart is Empty | CrystalKeepsakes"
        pageDescription="Review and checkout your custom crystal creations."
        className="empty-cart"
      > 

        <section className="hero">
          <div className="hero-content">
            <h1 className="primary-header">Your Cart is Empty</h1>
            <p className="mt-3">Add some beautiful crystals to get started!</p>
          </div>
        </section>
        

      </PageLayout>
    );
  }

  return (    
    <PageLayout 
      pageTitle="Shopping Cart CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Review and checkout your custom crystal creations."
      className="cart"
    >

    <section className="hero">
      <div className="hero-content">
        <h1 className="primary-header">Your Cart</h1>
        <p className="mt-3">Add some beautiful crystals to get started!</p>
      </div>
    </section> 
          
    {/* Error Alert */}
    {error && (
      <Alert variant="danger" onClose={() => setError(null)} dismissible>
        {error}
      </Alert>
    )}
      <Container className="mt-5">
        <Row>
          <Col xs={12} sm={7} md={7} lg={8}>
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => (

                <div key={item.cartId} className="cart-item bg-light mb-4 p-4 rounded-3">
                
                <h3 className="h2">{item.name}</h3>
                  <Row>
                    <div className="col-xs-12 col-md-5">
                       {/* Inside the cart item mapping, add this after the custom text section */}
                      {item.options.imageUrl && (
                        <div className="uploaded-image">
                          <h4 className="h5 mb-2 mt-2">Uploaded Image:</h4>
                          <img 
                            src={item.options.imageUrl}
                            alt="Uploaded design"
                            className="img-thumbnail img-fluid" 
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-xs-12 col-md-7">                                    
                      {/* Selected Options */}
                      <div className="selected-options">
                        <h4 className="h5 mb-2 mt-2">Selected Options:</h4>
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

                      {/* Custom Text */}
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
                    <div className="col-xs-12 text-md-end">
                      <div className="price mb-3">
                        <h4 className="price-label">Price: <span className="price-value">${item.price.toFixed(2)}</span></h4>
                      </div>
                      
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveItem(item.cartId)}
                      >
                        Remove Item
                      </button>
                    </div>
                  </Row>
                </div>
              ))}
            </div>
          </Col>

          <Col xs={12} sm={5} md={5} lg={4}>
          {/* Cart Summary */}
            <div className="cart-summary p-4 border rounded">
              <Row>
                <Col xs={12}>
                  <div className="total-price mb-3">
                    <h4>Total: ${cartTotal.toFixed(2)}</h4>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={4}>                  
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                </Col>
                <Col md={8} className="text-md-end">
                  
                  {/* Add to your JSX near the checkout button:*/}
                  {checkoutError && (
                    <Alert variant="danger" className="mt-2">
                      {checkoutError}
                    </Alert>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                  </button>
                </Col>
              </Row>
            </div>
          </Col>        
        </Row>
      </Container>
    </PageLayout>
  )
}