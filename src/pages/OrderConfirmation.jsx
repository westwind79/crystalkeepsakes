import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { PageLayout } from '../components/layout/PageLayout';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { checkoutManager, CHECKOUT_STATES } from '../utils/checkoutStateManager';


export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [orderStatus, setOrderStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  const { clearCart } = useCart();

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

  const renderOrderStatus = () => {
    switch (orderStatus) {
      case 'success':
        return (
          <div className="text-center">
            <h2 className="text-success mb-4">Thank You for Your Order!</h2>
            <p className="lead">Your crystal creation will be crafted with care.</p>
            <p>You will receive a confirmation email shortly.</p>
            {renderOrderSummary()}
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
              <p>Please try again or contact us if the problem persists.</p>
            </Alert>
            <div className="mt-4">
              <Link to="/cart" className="btn btn-primary">
                Return to Cart
              </Link>
            </div>
          </div>
        );

      case 'invalid':
        return (
          <div className="text-center">
            <h2 className="text-warning mb-4">Invalid Order</h2>
            <Alert variant="warning">
              <p>We couldn't find your order details.</p>
              <p>Please try placing your order again.</p>
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
            <h2 className="text-danger mb-4">Unexpected Error</h2>
            <Alert variant="danger">
              <p>Something went wrong while processing your order.</p>
              <p>Please contact support for assistance.</p>
            </Alert>
            <div className="mt-4">
              <Link to="/cart" className="btn btn-primary">
                Return to Cart
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
                {renderOrderStatus()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}