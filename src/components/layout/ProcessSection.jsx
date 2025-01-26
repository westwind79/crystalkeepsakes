import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 
import { Truck, BookHeart, ImageUp, Gem } from 'lucide-react'; 

export function ProcessSection() {
  const steps = [
    {
      icon: <ImageUp size={45} />,
      title: "Upload Photo",
      description: "Choose your favorite high-quality photo"
    },
    {
      icon: <Gem size={45} />,
      title: "Customize Design",
      description: "Select your crystal shape and options"
    },
    {
      icon: <BookHeart size={45} />,
      title: "Laser Engraving",
      description: "We use precision lasers to create your 3D crystal"
    },
    {
      icon: <Truck size={45} />,
      title: "Safe Delivery",
      description: "Receive your crystal art safely packaged"
    }
  ];


  return (
    <section className="process-section py-5 context-light bg-light">
      <Container>
        <h2 className="section-title text-center mb-5">
          How We Create Your Crystal
        </h2>
        <Row>
          {steps.map((step, index) => (
            <Col key={index} md={3}>
              <div className="process-step text-center">
                <div className="process-icon mb-3">
                  {step.icon}
                </div>
                <h3 className="h5 mb-3">{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}