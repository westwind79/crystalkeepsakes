// pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert } from 'react-bootstrap';

import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { useCart } from '../contexts/CartContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner'; 
import { PageLayout } from '../components/layout/PageLayout';
import { PaymentErrorHandler } from '../components/payment/PaymentErrorHandler';

const stripePromise = loadStripe("pk_test_51QoDXkFGPmVZe548YMJNAiNX4DoiU7jjlXJ89IPD4S80dvppPLltvgDDQlm8ILw8NibDlcimbSfRPPkn1lVS7P7W00rZzMONme"); // Replace with your actual key


export function Cart() {
  const [clientSecret, setClientSecret] = useState("");  
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cartItems, removeFromCart, clearCart } = useCart();
  
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

  // Handle checkout process
  const handleCheckout = async () => {
    try {
      setLoadingState(prev => ({
        ...prev,
        isProcessing: true
      }));

      setCheckoutError(null);

      if (!cartItems.length) {
        setCheckoutError('Your cart is empty');
        return;
      }

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

      console.log('Sending request to create-payment-intent.php');

      const response = await fetch('/api/create-payment-intent.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });

      console.log('Response received:', response);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.clientSecret) {
        console.log('Setting client secret');
        setClientSecret(data.clientSecret);
      } else {
        console.error('No client secret in response');
      }

      // TODO: Replace with Stripe payment initialization
      // Placeholder for now - to be implemented with Stripe
      console.log('Cart data ready for payment:', cartData);
      
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError(error.message || 'Failed to process checkout. Please try again.');
    } finally {
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

  // Initialize cart on mount
  useEffect(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  useEffect(() => {
    // Test Stripe initialization
    if (stripe) {
      console.log('Stripe is properly initialized');

    }
  }, [stripe]);

  useEffect(() => {
    if (clientSecret) {
      console.log("Client secret received, showing payment form.");
    }
    console.log('clientSecret changed:', clientSecret);
    console.log('Should show payment form:', !!clientSecret);
  }, [clientSecret]);

  // Show loading state
  if (loadingState.isLoading) {
    return <LoadingSpinner />;
  }

  // Show empty cart
  if (!cartItems.length) {
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
      <section className="hero">
        <div className="hero-content">
          <h1 className="primary-header">Your Cart</h1>
          <p className="mt-3">Review your selections before checkout</p>
        </div>
      </section>

      <Container className="mt-5">
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
              {cartItems.map((item) => (
                <div key={item.cartId} className="cart-item bg-light mb-4 p-4 rounded-3">
                  <h3 className="h2">{item.name}</h3>
                  <Row>
                    {/* Preview Image */}
                    <div className="col-xs-12 col-md-7">
                      {item.options.imageUrl && (
                        <div className="cart-uploaded-image">
                          <h4 className="h5 mb-2">Preview:</h4>
                          <img 
                            src={item.options.imageUrl}
                            alt="Design preview"
                            className="img-thumbnail img-fluid" 
                          />
                        </div>
                      )}
                      <br />
                      {item.options.maskedImageUrl && (
                        <div className="masked-image">
                          <h4 className="h5 mb-2">Final Design:</h4>
                          <img 
                            src={item.options.maskedImageUrl}
                            alt="Final design"
                            className="img-thumbnail img-fluid" 
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