import { Container, Row, Col} from 'react-bootstrap'
import { Link } from 'react-router-dom';

import { Facebook, Twitter, Instagram } from 'lucide-react'; 

const today = new Date();
const year = today.getFullYear();

export function Footer() {

  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (
    <footer className="py-4 mt-auto">
      <Container>
        <Row className="g-4">
          <Col xs={12} sm={12} md={4} lg={4} xl={4}>
            <h5>Crystal Art</h5>
            <p>Custom 3D Laser Engraved Crystals</p>
          </Col>
          <Col xs={12} sm={12} md={4} lg={4} xl={4}>
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </Col>
          <Col xs={12} sm={12} md={4} lg={4} xl={4}>
            <h5>Contact</h5>
            <p><strong>Email:</strong>&nbsp;<Link to={'mailto:info@crystalkeepsakes.com?subject=Hello%20there&body=This%20is%20a%20predefined%20email%20body.'}>info@crystalkeepsakes.com</Link>
            <br />
            {/*Phone: (555) 123-4567*/}
            </p>
          </Col>
         </Row>
         <Row className="g-4 align-items-center text-center mt-5 mb-3">
          <Col xs={12}>
            <div className="social-icons">
              <Link to='https://x.com/3DKeepsakes' target="_blank">
                <Twitter size={25} />
              </Link> 

              <Link to='#facebook'>
                <Facebook size={25} />
              </Link> 
               
              <Link to='#instagram'>
                <Instagram size={25} />
              </Link>
            </div>
          </Col>
        </Row>
        <Row className="g-4 align-items-center text-center mt-3 mb-5">
          <Col xs={12}>
            <p>&copy; 2024—{year} CrystalKeepsakes<br />
            Without Recourse &bull; U.C.C. 1-308: Without Prejudice</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}