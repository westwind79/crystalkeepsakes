// components/layout/CategoryNav.jsx
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { PRODUCT_CATEGORIES } from '../../utils/categoriesConfig';

export function CategoryNav({ className = '' }) {
  return (
    <section className={`category-nav context-dark bg-dark mt-4 py-4 ${className}`}>
      <Container>
        <Row className="justify-content-center">
          {PRODUCT_CATEGORIES.map(category => {
            // Skip the "all" category
            if (category.value === 'all') return null;
            
            const IconComponent = category.icon;
            
            return (
              <Col key={category.value} xs="auto">
                <Link 
                  to={`/products?category=${category.value}`}
                  className="category-link d-flex align-items-center gap-2"
                >
                  {IconComponent && <IconComponent size={18} />}
                  {category.label}
                </Link>
              </Col>
            );
          })}
        </Row>
      </Container>
    </section>
  );
}