// utils/checkoutStateManager.js

/**
 * Enum for checkout process states
 */
export const CHECKOUT_STATES = {
  IDLE: 'IDLE',
  CART_READY: 'CART_READY',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ERROR: 'ERROR'
};

/**
 * Manages the checkout process state and data persistence
 */
class CheckoutStateManager {
  constructor() {
    // Initialize state from session storage if exists
    this.state = sessionStorage.getItem('checkoutState') || CHECKOUT_STATES.IDLE;
    this.errors = [];
  }

  /**
   * Start checkout process
   * @param {Object} cartData - Cart data to store
   */
  initializeCheckout(cartData) {
    this.setState(CHECKOUT_STATES.CART_READY);
    this.storeCartData(cartData);
  }

  /**
   * Store payment data
   * @param {Object} paymentData - Payment data
   */
  startPayment(paymentData) {
    this.setState(CHECKOUT_STATES.PAYMENT_PENDING);
    sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
  }

  /**
   * Complete checkout process
   * @param {Object} orderData - Final order details
   */
  completeCheckout(orderData) {
    this.setState(CHECKOUT_STATES.PAYMENT_COMPLETED);
    sessionStorage.setItem('orderData', JSON.stringify(orderData));
    // Clean up temporary data
    this.cleanup();
  }

  /**
   * Handle checkout error
   * @param {string} message - Error message
   * @param {Error} error - Error object
   */
  handleError(message, error) {
    this.setState(CHECKOUT_STATES.ERROR);
    this.errors.push({
      message,
      error: error.toString(),
      timestamp: new Date().toISOString()
    });
    sessionStorage.setItem('checkoutErrors', JSON.stringify(this.errors));
  }

  /**
   * Get current checkout state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Set new checkout state
   * @param {string} newState - New state to set
   */
  setState(newState) {
    this.state = newState;
    sessionStorage.setItem('checkoutState', newState);
  }

  /**
   * Store cart data
   * @param {Object} cartData - Cart data to store
   */
  storeCartData(cartData) {
    sessionStorage.setItem('cartData', JSON.stringify(cartData));
  }

  /**
   * Get stored cart data
   * @returns {Object|null} Stored cart data
   */
  getStoredCartData() {
    const data = sessionStorage.getItem('cartData');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get payment data
   * @returns {Object|null} Stored payment data
   */
  getPaymentData() {
    const data = sessionStorage.getItem('paymentData');
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get checkout errors
   * @returns {Array} List of errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clean up all stored checkout data
   */
  cleanup() {
    sessionStorage.removeItem('cartData');
    sessionStorage.removeItem('paymentData');
    sessionStorage.removeItem('checkoutState');
    sessionStorage.removeItem('checkoutErrors');
    this.state = CHECKOUT_STATES.IDLE;
    this.errors = [];
  }
}

// Export singleton instance
export const checkoutManager = new CheckoutStateManager();