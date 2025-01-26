import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function CategoryNav({ className = '' }) {
  const categories = [
    { id: 'anniversary', name: 'Anniversary' },
    { id: 'birthday', name: 'Birthday' },
    { id: 'christmas', name: 'Christmas' },
    { id: 'graduation', name: 'Graduation' },
    { id: 'memorial', name: 'Memorial' },
    { id: 'pet', name: 'Pet Memories' },
    { id: 'wedding', name: 'Weddings' },
  ];

  return (
    <section className={`category-nav context-dark bg-dark mt-4 py-4 ${className}`}>
      <Container>
        <Row className="justify-content-center">
          {categories.map(category => (
            <Col key={category.id} xs="auto">
              <Link 
                to={`/products?category=${category.id}`}
                className="category-link"
              >
                {category.name}
              </Link>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}