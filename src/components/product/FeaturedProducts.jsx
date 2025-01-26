// components/product/FeaturedProducts.jsx
import { ProductCard } from './ProductCard';

export function FeaturedProducts() {
  const featuredProducts = [
    {
      id: 1,
      name: "Crystal Heart",
      description: "Perfect for anniversaries",
      price: 99.99,
      image: "/images/crystal-heart.jpg"
    },
    // More products...
  ];

  return (
    <section className="featured-products py-5">
      <h2 className="text-center mb-4">Featured Creations</h2>
      <Row>
        {featuredProducts.map(product => (
          <Col key={product.id} md={4} className="mb-4">
            <ProductCard product={product} />
          </Col>
        ))}
      </Row>
    </section>
  );
}