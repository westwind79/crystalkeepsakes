export function HeroSection() {
  return (
    <section className="hero">
      <Container>
        <Row className="align-items-center min-vh-80">
          <Col lg={6} className="hero-content">
            <h1 className="display-4 mb-4">Memories Preserved in Crystal</h1>
            <p className="lead mb-4">
              Transform your cherished photos into stunning 3D crystal art pieces. 
              Our precision laser technology creates beautiful, lasting memories.
            </p>
            <div className="hero-cta">
              <Link to="/products" className="btn btn-primary text-dark btn-lg me-3">
                Browse Designs
              </Link>
              <Link to="/about" className="btn btn-outline-light btn-lg">
                Learn More
              </Link>
            </div>
          </Col>
          <Col lg={6} className="hero-image">
            <div className="crystal-showcase">
              <img 
                src="/images/crystal-hero.jpg" 
                alt="3D Crystal Art Example" 
                className="text-dark img-fluid crystal-hero-image"
              />
              <div className="crystal-glow"></div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  )
}