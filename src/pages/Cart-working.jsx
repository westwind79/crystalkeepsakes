// pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { ErrorBoundary } from 'react-error-boundary';
import { CartUtils } from '../utils/CartUtils';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { LoadingSpinner } from '../components/common/LoadingSpinner';
 import { getImagePath } from '../utils/imageUtils';
  

// Create specific error types
class CartOperationError extends Error {
  constructor(message, operation) {
    super(message);
    this.name = 'CartOperationError';
    this.operation = operation;
  }
}

// Error boundary fallback
function CartErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-container">
      <h2>Something went wrong with your cart</h2>
      <p>{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="btn btn-primary"
      >
        Try again
      </button>
    </div>
  );
}

export function Cart() {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const [loadingStates, setLoadingStates] = useState({
    cart: true,      // Initial cart loading
    remove: false,   // Item removal
    clear: false     // Cart clearing
  });

  const handleCheckout = async () => {
    try {
      setIsProcessing(true); // Add this state

      const response = await fetch('/.netlify/functions/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      
      if (result.payment_link && result.payment_link.url) {
        // Redirect to Square's hosted checkout
        window.location.href = result.payment_link.url;
      } else {
        throw new Error('Invalid payment link response');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Failed to process checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  // State for cart items and loading
  const [cartItems, setCartItems] = useState([])
  // const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCart = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, cart: true }));
      const items = CartUtils.getCart();
      setCartItems(items);
    } catch (err) {
      setError('Failed to load cart items');
      console.error('Cart loading error:', err);
    }
    finally {
      setLoadingStates(prev => ({ ...prev, cart: false }));
    }
  };

  // Handle removing item from cart
  const handleRemoveItem = async (cartId) => {
    try {
      setLoadingStates(prev => ({ ...prev, remove: true }));
      CartUtils.removeItem(cartId);
      setCartItems(CartUtils.getCart());
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
        CartUtils.clearCart();
        setCartItems([]);
      } catch (err) {
        setError('Failed to clear cart');
        console.error('Clear cart error:', err);
      } finally {
        setLoadingStates(prev => ({ ...prev, clear: false }));
      }
    }
  };

  // Calculate total price
  const cartTotal = cartItems.reduce((total, item) => total + item.price, 0)

    // Load cart items on component mount
  useEffect(() => {
    loadCart(); // Use the loadCart function you already defined
  }, []);
 // Show loading spinner while initially loading cart
  if (loadingStates.cart) {
   return <LoadingSpinner />
  }


  // Show empty cart message when no items
  if (!loadingStates.cart && cartItems.length === 0) {
    return (
      <div className="page-transition">
        <Helmet>
          <title>Your Cart is Empty | CrystalKeepsakes 3D Crystal Memories</title>
          <meta name="description" content="Review and checkout your custom crystal creations." />
        </Helmet>
        <div className="cart-page">
          <Container className="py-5">
            <div className="text-center">
              <h2>Your Cart is Empty</h2>
              <p className="mt-3">Add some beautiful crystals to get started!</p>
            </div>
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <Helmet>
        <title>Shopping Cart | CrystalKeepsakes 3D Crystal Memories</title>
        <meta name="description" content="Review and checkout your custom crystal creations." />
      </Helmet>

      <Container className="py-5">          

          <h1 className="mb-4">Your Cart</h1>
          
          {/* Error Alert */}
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

        <Row>
          <Col xs={12} sm={7}>
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.cartId} className="cart-item mb-4 p-4 border rounded">
                <h3 className="h5">{item.name}</h3>
                  <Row>
                    <Col md={4}>
                       {/* Inside the cart item mapping, add this after the custom text section */}
                      {item.options.imageUrl && (
                        <div className="uploaded-image mt-3">
                          <h4 className="h6 mb-2">Uploaded Image:</h4>
                          <img 
                            src={item.options.imageUrl}
                            alt="Uploaded design"
                            className="img-thumbnail img-fluid" 
                          />
                        </div>
                      )}
                    </Col>
                    <Col md={5}>                                    
                      {/* Selected Options */}
                      <div className="selected-options mt-3">
                        <h4 className="h6 mb-2">Selected Options:</h4>
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
                      {item.options.customText && (
                        <div className="custom-text mt-3">
                          <h4 className="h6 mb-2">Custom Text:</h4>
                          <ul className="list-unstyled">
                            <li>
                              <span className="text-label">Line 1:</span>
                              <span className="text-value">
                                {item.options.customText.line1}
                              </span>
                            </li>
                            <li>
                              <span className="text-label">Line 2:</span>
                              <span className="text-value">
                                {item.options.customText.line2}
                              </span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </Col>                  
                    <Col md={3} className="text-md-end">
                      <div className="price mb-3">
                        <span className="price-label">Price: </span>
                        <span className="price-value">${item.price.toFixed(2)}</span>
                      </div>
                      
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemoveItem(item.cartId)}
                      >
                        Remove Item
                      </button>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </Col>

          <Col xs={12} sm={5}>
            {/* Cart Summary */}
            <div className="cart-summary p-4 border rounded">
              <Row>
                <Col md={6}>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="total-price mb-3">
                    <h4>Total: ${cartTotal.toFixed(2)}</h4>
                  </div>

                  {/* Add to your JSX near the checkout button:*/}
                  {checkoutError && (
                    <Alert variant="danger" className="mt-2">
                      {checkoutError}
                    </Alert>
                  )}
                  {/*<button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={(handleCheckout) => {
                      // Checkout logic will go here
                      console.log('Proceeding to checkout...')
                    }}
                  >
                    Proceed to Checkout
                  </button>*/}
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
    </div>
  )
}