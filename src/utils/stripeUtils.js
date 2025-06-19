// src/utils/stripeUtils.js
import { loadStripe } from '@stripe/stripe-js';
// Cache for stripe promise
let stripePromise = null;
// Cache for errors
let lastError = null;
// Cache for retry attempts
let retryCount = 0;
const MAX_RETRIES = 3;

export function resetStripePromise() {
  stripePromise = null;
  retryCount = 0;
  lastError = null;
}

/**
  Safely loads the Stripe promise with error handling and retry logic
  @returns {Promise} Stripe instance
  */
export async function getStripePromise() {
  // If we already have a valid Stripe instance, return it
  if (stripePromise !== null) {
    return stripePromise;
  }

  // If we've already tried too many times, show an error
  if (retryCount >= MAX_RETRIES) {
    console.error('Maximum Stripe initialization attempts reached:', lastError);
    throw new Error('Unable to initialize payment system after multiple attempts');
  }
  
  try {
    // Increment retry count
    retryCount++;
    
    // Only attempt API fetch if we haven't hit maximum retries
    if (retryCount <= MAX_RETRIES) {
      console.log(`Fetching Stripe key from API (attempt ${retryCount})...`);
      
      const response = await fetch('/api/get-stripe-key.php', {
        // Set a timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Stripe key: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.publishableKey) {
        throw new Error('No publishable key returned from server');
      }
      
      // Initialize Stripe with the fetched key
      stripePromise = loadStripe(data.publishableKey);
      
      // Reset retry count on success
      retryCount = 0;
      
      return stripePromise;
    }

  } catch (error) {
    // Save the error for debugging
    lastError = error;
    console.error('Error loading Stripe:', error);
    
    // Re-throw the error to be handled by caller
    throw error;
  }
}