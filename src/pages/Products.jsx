import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { ProductCard } from '../components/product/ProductCard';
import { products } from '../data/products';
import { SEOHead } from '../components/common/SEOHead';
import { PageLayout } from '../components/layout/PageLayout';
import { PRODUCT_CATEGORIES } from '../utils/categoriesConfig';

export function Products() {
  // State and URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState(['all']);


  // Read categories from URL
  useEffect(() => {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    const mainCategory = params.get('category');
    
    if (!mainCategory) {
      setSelectedCategories(['all']);
      return;
    }

    // Get all parameters as array
    const allParams = Array.from(new URL(window.location).searchParams.keys());
    const categories = [mainCategory, ...allParams.filter(p => p !== 'category')];
    
    setSelectedCategories(categories);
  }, []);

  // Handle category selection
  const handleCategoryToggle = (categoryValue) => {
    let newCategories;
    if (categoryValue === 'all') {
      newCategories = ['all'];
    } else {
      newCategories = selectedCategories.includes(categoryValue)
        ? selectedCategories.filter(c => c !== categoryValue)
        : [...selectedCategories.filter(c => c !== 'all'), categoryValue];
      if (newCategories.length === 0) {
        newCategories = ['all'];
      }
    }

    // Simple string-based URL construction
    if (newCategories.includes('all')) {
      window.history.replaceState(null, '', '/products?category=all');
    } else {
      const url = `/products?category=${newCategories[0]}${newCategories.slice(1).map(cat => `&${cat}`).join('')}`;
      window.history.replaceState(null, '', url);
    }
    
    setSelectedCategories(newCategories);
  };

  // Filter products based on selected categories
  const filteredProducts = selectedCategories.includes('all')
    ? products
    : products.filter(product => 
        product.categories?.some(cat => selectedCategories.includes(cat))
      );

  // Get count of products per category
  const getCategoryCount = (categoryValue) => {
    if (categoryValue === 'all') return products.length;
    return products.filter(product => 
      product.categories?.includes(categoryValue)
    ).length;
  };

  return (
    <PageLayout 
      pageTitle="Shop 3D Crystals CrystalKeepsakes"
      pageDescription="Transform your precious moments into stunning 3D crystal art."
      className="products"
    >  
      <section className="hero py-4"> 
        <div className="hero-content">
          <h1 className="primary-header">Our Crystal Creations</h1>
          <p>Transform memories into timeless, 3D-engraved crystal keepsakes – perfect for every occasion.</p>
        </div>
      </section>

      <section className="py-5">
        <Container>
          <Row>
            <Col xs={12} sm={12} md={8} className="order-2 order-md-1">  
              <Row>
                {filteredProducts.map((product, index) => (             
                  <div 
                    key={product.id}
                    className="col-xs-12 col-sm-12 col-md-6 mt-4 scale-95 animate-fadeIn"
                    style={{
                      animationDelay: `${(index * 100)}ms`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </Row>
            </Col>
            <Col xs={12} sm={12} md={4} className="order-1 order-md-2">
              <div className="category-filter">

               {[
                  PRODUCT_CATEGORIES.find(cat => cat.value === 'all'),
                  ...PRODUCT_CATEGORIES
                    .filter(cat => cat.value !== 'all')
                    .sort((a, b) => a.label.localeCompare(b.label))
                ].map(category => {
                  const inputId = `category-filter__checkbox-${category.value}`;
                  
                  return (
                    <label 
                      key={category.value}
                      htmlFor={inputId}
                      className={`category-filter__item ${
                        selectedCategories.includes(category.value) ? 'category-filter__item--active' : ''
                      }`}
                    >
                      <input 
                        id={inputId}
                        name="category-filter"
                        type="checkbox"
                        checked={selectedCategories.includes(category.value)}
                        onChange={() => handleCategoryToggle(category.value)}
                        className="category-filter__checkbox"
                      />
                      <span className="category-filter__label">
                        {category.label} ({getCategoryCount(category.value)})
                      </span> 
                    </label>
                  );
                })}
                     
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </PageLayout>
  );
}