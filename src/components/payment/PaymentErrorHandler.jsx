import { useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';

export function PaymentErrorHandler({ error, onRetry }) {
  // Map API error codes to user-friendly messages
  const getErrorMessage = (error) => {
    const errorMap = {
      'ADDRESS_VERIFICATION_FAILURE': 'The provided postal code is invalid. Please check and try again.',
      'CARD_DECLINED_VERIFICATION_REQUIRED': 'Your card requires additional verification. Please try again.',
      'INSUFFICIENT_FUNDS': 'Insufficient funds available. Please try another payment method.',
      'CARD_EXPIRED': 'This card has expired. Please use a different card.',
      'INVALID_CARD': 'The card information appears to be invalid.',
      'CVV_FAILURE': 'The security code (CVV) is incorrect.',
      'PAYMENT_LIMIT_EXCEEDED': 'This payment exceeds the allowed limit.',
      'TEMPORARY_ERROR': 'A temporary error occurred. Please try again.',
    };

    return errorMap[error.code] || error.message || 'An error occurred processing your payment.';
  };

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert variant="danger" className="payment-error">
      <Alert.Heading>Payment Error</Alert.Heading>
      <p>{getErrorMessage(error)}</p>
      {error.code === 'TEMPORARY_ERROR' && (
        <div className="d-flex justify-content-end">
          <button 
            className="btn btn-outline-danger"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      )}
    </Alert>
  );
}