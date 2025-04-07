// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { gsap } from 'gsap'; // Added gsap import


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
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate initial load
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }, []);

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <Header />       
        <PageTransition />
        <Footer />
      </CartProvider>    
    </BrowserRouter>
  )
}

// Add this new component
function PageTransition() {
  const location = useLocation();
  const pageRef = useRef();
  
  useEffect(() => {
    // Page transition animation
    const onEnter = () => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    };
    
    onEnter();
  }, [location]);

  return (
    <main ref={pageRef}>               
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
  );
}
export default App