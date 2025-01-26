import { Link } from 'react-router-dom'; 

export function AboutPreview() {
  return (
    <section className="about-preview py-5">
      <Row className="g-4 align-items-center">
        <Col md={6}>
          <img 
            src="/images/about-preview.jpg" 
            alt="Our Process" 
            className="img-fluid"
          />
        </Col>
        <Col md={6}>
          <h2>Crafted with Precision</h2>
          <p>
            Using state-of-the-art laser technology, we transform your photos 
            into stunning 3D crystal art pieces that will last a lifetime.
          </p>
          <Link to="/about" className="btn btn-outline-primary">
            Learn More About Us
          </Link>
        </Col>
      </Row>
    </section>
  );
}