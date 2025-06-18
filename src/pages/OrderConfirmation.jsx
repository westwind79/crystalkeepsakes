import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
<<<<<<< HEAD
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
=======
>>>>>>> development
import { useCart } from '../contexts/CartContext';
import { PageLayout } from '../components/layout/PageLayout';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { getStripePromise } from '../utils/stripeUtils';

<<<<<<< HEAD
// Stripe confirmation component
function StripeConfirmation({ paymentIntentClientSecret, onSuccess, onFailure }) {
  const stripe = useStripe();
  
  useEffect(() => {
    if (!stripe || !paymentIntentClientSecret) return;
    
    stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({paymentIntent}) => {
      switch (paymentIntent.status) {
        case "succeeded":
          onSuccess(paymentIntent);
          break;
        case "processing":
          onSuccess({ status: 'processing', id: paymentIntent.id });
          break;
        default:
          onFailure(paymentIntent);
          break;
      }
    });
  }, [stripe, paymentIntentClientSecret, onSuccess, onFailure]);
  
  return null;
}
=======
>>>>>>> development

export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [orderStatus, setOrderStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  const { clearCart } = useCart();
<<<<<<< HEAD

  // Load Stripe
  useEffect(() => {
    async function loadStripeInstance() {
      try {
        const stripe = await getStripePromise();
        setStripePromise(stripe);
      } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        setOrderStatus('error');
      }
    }
    loadStripeInstance();
  }, []);

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent) => {
      // DEBUG: Let's see what's actually in the payment intent
  console.log('=== PAYMENT INTENT DEBUG ===');
  console.log('Full payment intent:', paymentIntent);
  console.log('Metadata:', paymentIntent.metadata);
  console.log('Order number from metadata:', paymentIntent.metadata?.order_number);
  console.log('URL order number:', searchParams.get('orderNumber'));
  
  const orderNumber = paymentIntent.metadata?.order_number || 'UNKNOWN';

    
    setOrderDetails({
      orderId: orderNumber,
      paymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      status: paymentIntent.status,
      shippingInfo: paymentIntent.shipping
    });
    
    setOrderStatus('success');
    clearCart();
  };

  // Handle payment failure
  const handlePaymentFailure = (paymentIntent) => {
    // DEBUG: Let's see what's actually in the payment intent
  console.log('=== PAYMENT INTENT FAILURE DEBUG ===');
  console.log('Full payment intent:', paymentIntent);
  console.log('Metadata:', paymentIntent.metadata);
  console.log('Order number from metadata:', paymentIntent.metadata?.order_number);
  
  const orderNumber = paymentIntent.metadata?.order_number || 'UNKNOWN';

    
    setOrderDetails({
      orderId: orderNumber,
      error: paymentIntent.last_payment_error?.message || 'Payment failed'
    });
    setOrderStatus('failed');
  };

  // Get client secret from URL and order number with fallback logic
  const clientSecret = searchParams.get('payment_intent_client_secret');
  const orderNumber = searchParams.get('orderNumber'); // This might be null, but we have fallbacks
=======
// Update the useEffect in OrderConfirmation.jsx
  useEffect(() => {
    const handleOrderConfirmation = async () => {
      const orderNumber = searchParams.get('orderNumber');
      const paymentIntent = searchParams.get('payment_intent');
      const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
      
      if (!orderNumber) {
        setOrderStatus('invalid');
        return;
      }

      // In development, always show success
      if (import.meta.env.DEV) {
        const mockOrderDetails = {
          orderId: orderNumber,
          status: 'success',
          message: 'Thank you for your order! This is a development preview.',
          timestamp: new Date().toISOString()
        };
        setOrderDetails(mockOrderDetails);
        setOrderStatus('success');
        clearCart();
        return;
      }

      // In production, verify the payment with Stripe
      try {
        if (paymentIntent && paymentIntentClientSecret) {
          const { paymentIntent: verifiedPayment } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
          
          if (verifiedPayment.status === 'succeeded') {
            const orderDetails = {
              orderId: orderNumber,
              status: 'success',
              paymentId: paymentIntent,
              timestamp: new Date().toISOString()
            };
            setOrderDetails(orderDetails);
            setOrderStatus('success');
            clearCart();
          } else {
            setOrderStatus('failed');
          }
        } else {
          setOrderStatus('invalid');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setOrderStatus('error');
      }
    };

    handleOrderConfirmation();
  }, [searchParams, clearCart]);
  // Handle one-time order confirmation
  // Add to OrderConfirmation.jsx - Update useEffect

  useEffect(() => {
    const handleOrderConfirmation = async () => {
      // Get status parameters
      const status = searchParams.get('status');
      const error = searchParams.get('error');
      const squareError = searchParams.get('square_error');
      
      // Get checkout state
      const currentState = checkoutManager.getState();
      const cartData = checkoutManager.getStoredCartData();
      const paymentData = checkoutManager.getPaymentData();
      
      console.log('Checkout State:', {
        state: currentState,
        cartData,
        paymentData
      });

      // Debug validation
      console.log('Validating:', {
        cartDataExists: !!cartData,              // Is cart data present?
        cartDataValue: cartData,                 // What's in cart data?
        currentState,                            // What's the current state?
        expectedState: CHECKOUT_STATES.PAYMENT_PENDING,  // What are we comparing to?
        isStateMatch: currentState === CHECKOUT_STATES.PAYMENT_PENDING  // Do they match?
      });

      // Validate checkout state
      if (!cartData || currentState !== CHECKOUT_STATES.PAYMENT_PENDING) {
        console.error('Invalid checkout state:', currentState);
        setOrderStatus('invalid');
        return;
      }

      // Handle Square-specific response or development mode
      if (import.meta.env.DEV && status === 'success') {
        // Development mode success
        const orderData = {
          orderId: `DEV-${Date.now()}`,
          cartData,
          paymentData
        };
        
        checkoutManager.completeCheckout(orderData);
        setOrderDetails(orderData);
        setOrderStatus('success');
        clearCart();
        
      } else if (status === 'success' || searchParams.get('checkoutId')) {
        // Production mode success
        const orderData = {
          orderId: searchParams.get('checkoutId') || `ORDER-${Date.now()}`,
          cartData,
          paymentData
        };
        
        checkoutManager.completeCheckout(orderData);
        setOrderDetails(orderData);
        setOrderStatus('success');
        clearCart();
        
      } else if (error || squareError || status === 'failed') {
        // Handle error cases
        const errorMessage = error || squareError || 'Payment failed';
        checkoutManager.handleError('Payment failed', new Error(errorMessage));
        setOrderStatus('failed');
        
      } else {
        // Unexpected state
        checkoutManager.handleError(
          'Unexpected order state',
          new Error('Invalid order parameters')
        );
        setOrderStatus('error');
      }
    };

    handleOrderConfirmation();
  }, []); // Empty dependency array - run once on mount

  useEffect(() => {
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      setOrderStatus('invalid');
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setOrderStatus('success');
          clearCart(); // Clear the cart on success
          break;
        case "processing":
          setOrderStatus('processing');
          break;
        default:
          setOrderStatus('failed');
          break;
      }
    });
  }, [stripe]);

  const renderOrderSummary = () => {
    if (!orderDetails) return null;

    return (
      <div className="order-summary mt-4">
        <h3>Order Summary</h3>
        <div className="items-list">
          {orderDetails.cartItems.map((item, index) => (
            <div key={index} className="order-item mb-3 p-3 border-bottom">
              <h4 className="h6">{item.name}</h4>
              <div className="d-flex justify-content-between">
                <span>Price:</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
              {/* Options Summary */}
              <div className="options-summary small text-muted mt-2">
                <div>Size: {item.options.size}</div>
                <div>Background: {item.options.background}</div>
                <div>Light Base: {item.options.lightBase}</div>
              </div>
            </div>
          ))}
          <div className="total-price mt-3 d-flex justify-content-between">
            <strong>Total:</strong>
            <strong>${orderDetails.cartTotal.toFixed(2)}</strong>
          </div>
        </div>
      </div>
    );
  };
>>>>>>> development

  // Render order status
  const renderOrderStatus = () => {
    switch (orderStatus) {
      case 'success':
        return (
          <div className="text-center">
            <h2 className="text-success mb-4">Thank You for Your Order!</h2>
            <Alert variant="success">
              <h4>Order Number: {orderDetails?.orderId}</h4>
              <p className="lead">Your payment was successful!</p>
              <p>Amount: ${orderDetails?.amount?.toFixed(2)}</p>
              <p>Payment ID: {orderDetails?.paymentId}</p>
              <p>We will process your crystal creation and contact you with updates.</p>
            </Alert>
            
            {orderDetails?.shippingInfo && (
              <div className="mt-4">
                <h5>Shipping To:</h5>
                <p>
                  {orderDetails.shippingInfo.name}<br/>
                  {orderDetails.shippingInfo.address?.line1}<br/>
                  {orderDetails.shippingInfo.address?.line2 && (
                    <>{orderDetails.shippingInfo.address.line2}<br/></>
                  )}
                  {orderDetails.shippingInfo.address?.city}, {orderDetails.shippingInfo.address?.state} {orderDetails.shippingInfo.address?.postal_code}
                </p>
              </div>
            )}
            
            <div className="mt-4">
              <Link to="/products" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        );
        
      case 'failed':
        return (
          <div className="text-center">
            <h2 className="text-danger mb-4">Payment Failed</h2>
            <Alert variant="danger">
              <p>We encountered an issue processing your payment.</p>
              {orderDetails?.error && <p>Error: {orderDetails.error}</p>}
              <p>Please try again or contact us if the problem persists.</p>
            </Alert>
            <div className="mt-4">
              <Link to="/cart" className="btn btn-primary">
                Return to Cart
              </Link>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <h2 className="text-danger mb-4">System Error</h2>
            <Alert variant="danger">
              <p>Something went wrong while processing your order.</p>
              <p>Please contact support for assistance.</p>
            </Alert>
            <div className="mt-4">
              <Link to="/contact" className="btn btn-primary">
                Contact Support
              </Link>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <h2>Processing Order...</h2>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Please wait while we confirm your payment...</p>
          </div>
        );
    }
  };

  return (
    <PageLayout
      pageTitle="Order Confirmation | CrystalKeepsakes"
      pageDescription="Order confirmation and status"
      className="order-confirmation"
    >
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card>
              <Card.Body className="p-5">
<<<<<<< HEAD
                {/* Only render Stripe Elements when we have both */}
                {stripePromise && clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripeConfirmation 
                      paymentIntentClientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onFailure={handlePaymentFailure}
                    />
                  </Elements>
                )}
                
=======
>>>>>>> development
                {renderOrderStatus()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}