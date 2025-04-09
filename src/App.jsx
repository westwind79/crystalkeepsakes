// App.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { CartProvider } from './contexts/CartContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { PageLayout } from './components/layout/PageLayout';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Cart } from './pages/Cart';
import { FAQ } from './pages/FAQ';


const stripePromise = loadStripe('pk_test_51QoDYf2YE48VQlzYdSB0UqhJphSSP6s82c2XYbprasSkna3EGfN0G5IgZXxR2nAVjsZrqtUttSJj6kfAsnrfye0T00AEwHQ8zq');
  

// Move ScrollToTop outside App component and add useLocation import
function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    // Smooth scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [pathname]);
  
  return null;
}

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }, [])

  // const options = {
  //   mode: 'payment',
  //   amount: 1099,
  //   currency: 'usd',
  //   // We'll configure this when we have a payment ready
  //   appearance: {
  //     theme: 'stripe'
  //   }
  // };

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <BrowserRouter>
      <Elements stripe={stripePromise}>
        <CartProvider>
          <ScrollToTop />
          <Header />       
            <main>               
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes> 
            </main>
          <Footer />
        </CartProvider>    
      </Elements>
    </BrowserRouter>
  )
}

export default App