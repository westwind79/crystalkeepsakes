import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { throttle } from 'lodash';
import { ShoppingCart, X, Menu } from 'lucide-react'; // Added Menu and X icons
import { getImagePath } from '../../utils/imageUtils';
import { useCart } from '../../contexts/CartContext';


const Navigation = React.memo(({ onNavLinkClick }) => {
  const { cartCount } = useCart();
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const location = useLocation();


// Close offcanvas when route changes
  useEffect(() => {
    setIsOffcanvasOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = throttle(() => {
      // If we're at desktop size (992px is Bootstrap's lg breakpoint)
      if (window.innerWidth >= 992) {
        setIsOffcanvasOpen(false); // This will remove both offcanvas and backdrop
      }
    }, 200);
    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => {
      handleResize.cancel(); // Cancel any pending throttled calls
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLinkClick = () => {
    setIsOffcanvasOpen(false);
    if (onNavLinkClick) onNavLinkClick();
  };

  const isProductsActive = () => {
    return location.pathname.startsWith('/product');
  };

  // Navigation Links Component - DRY up the repeated code
  const NavLinks = ({ mobile = false, onClick }) => (
    <ul className={`navbar-nav ${mobile ? '' : 'ms-auto'}`}>
      <li className="nav-item">
        <NavLink 
          to="/"
          onClick={onClick}
          className={({ isActive }) => 
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Home
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink 
          to="/products"
          onClick={onClick}
          className={({ isActive }) => 
            isActive || isProductsActive() ? "nav-link active" : "nav-link"
          }
        >
          Products
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink 
          to="/about"
          onClick={onClick}
          className={({ isActive }) => 
            isActive ? "nav-link active" : "nav-link"
          }
        >
          About
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink 
          to="/contact"
          onClick={onClick}
          className={({ isActive }) => 
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Contact
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink 
          to="/faq"
          onClick={onClick}
          className={({ isActive }) => 
            isActive ? "nav-link active" : "nav-link"
          }
        >
          FAQ
        </NavLink>
      </li>
    {cartCount > 0 && (
      <li className="nav-item">
        <NavLink 
          to="/cart" 
          onClick={onClick}
          className={({ isActive }) => 
            isActive ? "nav-link active d-flex align-items-center" : "nav-link d-flex align-items-center"
          }
        >
          <div className="position-relative">
            <ShoppingCart size={18} />
            
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
                <span className="visually-hidden">items in cart</span>
              </span>
            
          </div>&nbsp;
          <span className={`ms-1 ${mobile ? '' : 'visually-hidden'}`}>Cart</span>
        </NavLink>
      </li>
      )}
    </ul>
  );
  return (
    <nav className="navbar navbar-expand-lg">
      {/* Main Navbar */}
      <NavLink className="navbar-brand" to="/">
        <img src={getImagePath('img/crystalkeepsakes-logo.png')} 
        alt="CrystalKeepsakes" 
        className="logo img-fluid"
        />
      </NavLink>
      
      {/* Mobile Toggle Button */}
      <button
        className="navbar-toggler"
        type="button"
        onClick={() => setIsOffcanvasOpen(true)}
        aria-label="Toggle navigation"
      >
        <Menu size={24} />
      </button>

      {/* Desktop Navigation */}
      <div className="collapse navbar-collapse d-lg-block" id="navbarNav">
        <NavLinks onClick={handleLinkClick} />
      </div>

      {/* Off-canvas Mobile Menu */}
      <div 
          className={`offcanvas offcanvas-end d-lg-none ${isOffcanvasOpen ? 'show' : ''}`} 
          tabIndex="-1" 
          aria-labelledby="offcanvasNavLabel"
        >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="offcanvasNavLabel">Menu</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setIsOffcanvasOpen(false)}
            aria-label="Close"
          >
            {/*<X size={24} />*/}
          </button>
        </div>
        <div className="offcanvas-body">
          <NavLinks mobile={true} onClick={handleLinkClick} />
        </div>
      </div>

      {/* Backdrop for mobile menu */}
      {isOffcanvasOpen && (
        <div 
          className="offcanvas-backdrop show"
          onClick={() => setIsOffcanvasOpen(false)}
        />
      )}
    </nav>
  );
});

export default Navigation;