// pages/Checkout.jsx
import { loadStripe } from '@stripe/stripe-js'
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const stripePromise = loadStripe('your_publishable_key')

export function Checkout() {
  const { cart } = useContext(CartContext)
  
  const handleCheckout = async () => {
    const stripe = await stripePromise
    
    // Call your serverless function to create checkout session
    const response = await fetch('/netlify/functions/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ cart })
    })
    
    const session = await response.json()
    
    // Redirect to Stripe Checkout
    await stripe.redirectToCheckout({
      sessionId: session.id
    })
  }
  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (
    // Checkout UI

  )
}