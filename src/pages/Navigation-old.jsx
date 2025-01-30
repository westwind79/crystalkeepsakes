import { NavLink } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'; 
import { useCart } from '../../contexts/CartContext';

export function Navigation({ onNavLinkClick }) {
  const { cartCount } = useCart();

  const handleNavToggle = () => {
    setIsNavOpen(!isNavOpen);
  };
  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  const isProductsActive = () => {
    return location.pathname.startsWith('/product');
  };
  
  return (
    <nav className="navbar navbar-expand-lg">       
      <NavLink className="navbar-brand" to="/">CrystalKeepsakes</NavLink>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink 
                to="/"
                onClick={onNavLinkClick} 
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
                onClick={onNavLinkClick}
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
                onClick={onNavLinkClick}
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
                onClick={onNavLinkClick}
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
                onClick={onNavLinkClick}
                className={({ isActive }) => 
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                FAQ
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/cart" 
                onClick={onNavLinkClick}
                className={({ isActive }) => 
                  isActive ? "nav-link active d-flex align-items-center" : "nav-link d-flex align-items-center"
                }
              >
                <div className="position-relative">
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cartCount}
                      <span className="visually-hidden">items in cart</span>
                    </span>
                  )}
                </div>
                <span className="ms-1 visually-hidden">Cart</span>
              </NavLink>
            </li>
        </ul>
      </div> 
    </nav>
  )
}