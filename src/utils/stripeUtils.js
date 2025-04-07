// src/utils/stripeUtils.js
import { loadStripe } from '@stripe/stripe-js';

let stripePromise = null;

// Development config with hardcoded keys
const isDevelopment = import.meta.env.MODE === 'development';
const STRIPE_TEST_KEY = 'pk_test_51MwVSvCPW9vHGVtnAYOOKdnWQUv4D4iHkkIIeHgfKzGV6DfUSCwvxCsKrAxVWGhYxtZJDnlxbkfEHFhH4b8CkIbO00kImXoR0F';

export async function getStripePromise() {
  if (stripePromise !== null) {
    return stripePromise;
  }
  
  try {
    // For development environment, use hardcoded key
    if (isDevelopment) {
      console.log('Development environment detected, using test key');
      stripePromise = loadStripe(STRIPE_TEST_KEY);
      return stripePromise;
    }
    
    // For production, try to fetch from API
    console.log('Fetching Stripe key from API...');
    const response = await fetch('/api/get-stripe-key.php');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe key: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.publishableKey) {
      throw new Error('No publishable key returned from server');
    }
    
    stripePromise = loadStripe(data.publishableKey);
    return stripePromise;
    
  } catch (error) {
    console.error('Error loading Stripe:', error);
    
    // Fallback to hardcoded key if fetch fails
    console.warn('Falling back to hardcoded test key');
    stripePromise = loadStripe(STRIPE_TEST_KEY);
    return stripePromise;
  }
}