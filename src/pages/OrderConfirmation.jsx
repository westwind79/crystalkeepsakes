import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
import { useCart } from '../contexts/CartContext';
import { PageLayout } from '../components/layout/PageLayout';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { getStripePromise } from '../utils/stripeUtils';

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

export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [orderStatus, setOrderStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const { clearCart } = useCart();

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
                
                {renderOrderStatus()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageLayout>
  );
}