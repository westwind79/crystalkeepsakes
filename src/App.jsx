// App.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import { HelmetProvider } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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

// ScrollToTop component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
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

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <BrowserRouter>
      <CartProvider>
        <Header />       
          <main>               
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:slug" element={<ProductDetail />} /> {/* New route */}
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
    </BrowserRouter>
  )
}

export default App