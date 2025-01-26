import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
 
import { PageLayout } from '../components/layout/PageLayout';

export function Contact() {
  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (
    <PageLayout 
      pageTitle="Contact CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal."
      className="contact"
    >
      <section className="hero"> 
        <div className="hero-content">
          <h1 className="primary-header">Contact Us</h1>
          <p>From birthdays to holidays, 3D laser-engraved crystals create lasting memories of family, pets, and special moments.</p>
        </div>
      </section>

      <section className="contact-form bg-light py-5 align-items-center">
        <Container>
          <Row>
            <Col md={6}>
              <h2>Crafted with Precision</h2>
              <p className="lead">
                Jot us a note and we’ll get back to you as quickly as possible.
              </p>
            </Col>
            <Col md={6}>

              <form>
                <label>Name:<br /><input type="text" placeholder="Name" required /></label><br />
                <label>Phone:<br /><input type="phone" placeholder="Phone" /></label><br />
                <label>Email:<br /><input type="email" placeholder="Email" required /></label><br />
                <label>Comment:<br /><input type="textarea" placeholder="Comment" required /></label>
                <br /><br />
                <Link 
                  type="submit"
                    to={`/products/`} 
                    // to={`/product/${product.slug}`} 
                    className="btn btn-primary w-100"
                  >
                  Send
                </Link>          
              </form>
            </Col>         
          </Row> 
        </Container>
      </section>
    </PageLayout>
  )
}