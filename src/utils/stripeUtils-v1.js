// src/utils/stripeUtils.js
import { loadStripe } from '@stripe/stripe-js';

let stripePromise = null;

export async function getStripePromise() {
  if (stripePromise !== null) {
    return stripePromise;
  }
  
  try {
    // Always fetch from API first
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
    throw error;
  }
}