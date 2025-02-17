// pages/OrderConfirmation.jsx
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { PageLayout } from '../components/layout/PageLayout';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';

export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [orderStatus, setOrderStatus] = useState('processing');
  const [orderDetails, setOrderDetails] = useState(null);
  const { clearCart } = useCart();
  
  useEffect(() => {
    const handleOrderConfirmation = async () => {
      try {
        // Get status from URL parameters
        const status = searchParams.get('status');
        const error = searchParams.get('error');

        // Get order details from session storage
        const pendingOrderStr = sessionStorage.getItem('pendingOrder');
        const pendingOrder = pendingOrderStr ? JSON.parse(pendingOrderStr) : null;
        
        // Always set order details if they exist, regardless of status
        if (pendingOrder) {
          setOrderDetails(pendingOrder);
        }

        if (status === 'success') {
          // Only clear cart and order details on confirmed success
          setOrderStatus('success');
          clearCart();
          sessionStorage.removeItem('pendingOrder');
        } else if (error || status === 'failed') {
          setOrderStatus('failed');
          // Don't clear pendingOrder on failure - allows retry
        } else if (!pendingOrder) {
          // No order details found - could be direct page access
          setOrderStatus('invalid');
        }
      } catch (err) {
        console.error('Error processing order confirmation:', err);
        setOrderStatus('error');
      }
    };

    handleOrderConfirmation();
  }, [searchParams, clearCart]);

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
                {item.options.customText && (
                  <>
                    {item.options.customText.line1 && 
                      <div>Text Line 1: {item.options.customText.line1}</div>}
                    {item.options.customText.line2 && 
                      <div>Text Line 2: {item.options.customText.line2}</div>}
                  </>
                )}
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

  // Enhanced status rendering with better error handling
  const renderOrderStatus = () => {
    switch (orderStatus) {
      case 'success':
        return (
          <div className="text-center">
            <h2 className="text-success mb-4">Payment Successful!</h2>
            <p className="lead">Thank you for your order.</p>
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
              <p>Something went wrong with your payment.</p>
              <p>Your cart has been preserved. Please try again.</p>
            </Alert>
            {renderOrderSummary()}
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
              <p>No order details found.</p>
              <p>Please return to cart and try placing your order again.</p>
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