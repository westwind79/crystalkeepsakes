import { Container, Row, Col } from 'react-bootstrap'
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SEOHead } from '../components/common/SEOHead';
import { PageLayout } from '../components/layout/PageLayout';
 
export function FAQ() {  
  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (
		<PageLayout 
      pageTitle="Frequently Asked Questions about 3D CrystalKeepsakes - 3D Crystal Memories"
      pageDescription="Learn about our precision 3D crystal engraving process and our commitment to preserving your memories in crystal."
      className="faq"
    > 
    
    <section className="hero py-4">
      <div className="hero-content">
        <h1 className="primary-header">Frequently Asked Questions</h1>
        <p className="lead">Welcome to CrystalKeepsakes, where cherished moments are transformed into stunning 3D laser-engraved crystal creations.</p>
      </div> 
    </section>

    <section className="about-preview py-5" >
      <Container>
        <Row className="align-items-center">
          <Col className="col-sm-8 mx-auto">
            <h2>What’s a 3D Photo Crystal?</h2>
            <p>We’re thrilled you asked! A 3D Photo Crystal is the most innovative way to preserve and showcase a physical representation of your favorite photo. At CrystalKeepsakes, we blend cutting-edge digital technology with expert craftsmanship to create intricate 2D or 3D laser engravings within durable crystal keepsakes. Our creations protect your cherished images and transform them into breathtaking 3D art. Simply put, we make memories last forever.</p>
            <p>We didn’t invent crystal art; we perfected it.</p>

            <div className="spacer-gradient mb-5 mt-5"></div>  
            <h2>Why Choose CrystalKeepsakes?</h2>
            <p>What sets us apart is our meticulous creative process. We don’t just place a photo in an engraving machine and call it a day. Each custom crystal is a product of collaboration between top designers, advanced technology, and innovative thinking. Are we perfectionists? Absolutely. Passionate? Without a doubt. When you purchase a personalized photo crystal from CrystalKeepsakes, you’re investing in a custom masterpiece crafted by a team that truly cares.</p>

            <div className="spacer-gradient mb-5 mt-5"></div>  
            <h2>Looking for Unique Gift Ideas?</h2>
            <p>You’ve come to the right place. At CrystalKeepsakes, we specialize in helping you create unforgettable gifts for every occasion, from birthdays and graduations to anniversaries. Our user-friendly online personalization process makes it easy for you to design a meaningful, custom keepsake while leaving you with more time to celebrate life’s special moments with loved ones.</p>
            <p>Need inspiration? Visit our blog for creative gift ideas and helpful tips to make every celebration extraordinary.</p>

            {/*<h2>We Are People.</h2>
            <p>CrystalKeepsakes isn’t just a company delivering exceptional products and services. We’re a team of dedicated individuals with one shared mission: to make your experience unforgettable. From graphic designers and production technicians to customer support specialists, everyone at CrystalKeepsakes is committed to helping you create the perfect 3D crystal, from start to finish.</p>
            <p>Think of our website as an extension of our team, here to guide you through the process even when we’re not available in person. Have questions? Check out our FAQ page or reach out to us directly. We’re here to help!</p>*/}
          </Col>           
        </Row>  
      </Container>
    </section>
   </PageLayout>

  );
}