// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client'
// import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Register GSAP plugins globally
import { gsap } from 'gsap';

import { CartProvider } from './contexts/CartContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { PageLayout } from './components/layout/PageLayout';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Products } from './pages/Products';
import { Products2 } from './pages/Products2';
import { ProductDetail } from './pages/ProductDetail';
import { ProductDetail2 } from './pages/ProductDetail2';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Cart } from './pages/Cart';
import { FAQ } from './pages/FAQ'; 
import ErrorBoundary from './components/ErrorBoundary';
import ProductAdmin from './admin/ProductAdmin';

// Enhanced error logging to catch ALL errors
if (process.env.NODE_ENV === 'development') {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', event.reason);
    console.trace('Promise rejection stack trace');
    
    // Don't let it disappear
    setTimeout(() => {
      console.error('🚨 PERSISTENT ERROR LOG:', event.reason);
    }, 100);
  });

  // Catch regular errors
  window.addEventListener('error', event => {
    console.error('🚨 WINDOW ERROR:', event.error);
    console.error('🚨 ERROR DETAILS:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  // Override console.error to make it more persistent
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    
    // Also store in sessionStorage so you can see it
    const errorLog = sessionStorage.getItem('react_errors') || '[]';
    const errors = JSON.parse(errorLog);
    errors.push({
      timestamp: new Date().toISOString(),
      error: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
    });
    sessionStorage.setItem('react_errors', JSON.stringify(errors.slice(-10))); // Keep last 10
  };
}

// Function to check stored errors (call in console)
window.checkStoredErrors = () => {
  const errors = JSON.parse(sessionStorage.getItem('react_errors') || '[]');
  console.table(errors);
  return errors;
};

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
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 250);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollToTop />
        <Header />
        <main>
          <Routes> 
            <Route path="/admin" element={<ProductAdmin />} />
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/products2" element={
                  <ErrorBoundary>
                    <Products2 />
                  </ErrorBoundary>
                } />
                <Route path="/product2/:slug" element={
                  <ErrorBoundary>
                    <ProductDetail2 />
                  </ErrorBoundary>
                } />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} /> 
            <Route path="*" element={<div className="container py-5 text-center">Page Not Found</div>} />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
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
        <Route path="/admin" element={<ProductAdmin />} />
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/products2" element={
          <ErrorBoundary>
            <Products2 />
          </ErrorBoundary>
        } />
        <Route path="/product2/:slug" element={
          <ErrorBoundary>
            <ProductDetail2 />
          </ErrorBoundary>
        } />
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