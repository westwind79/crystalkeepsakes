import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { ProductCard } from '../components/product/ProductCard';
import { products } from '../data/products';

import { PageLayout } from '../components/layout/PageLayout';

export function Products() {
  const [selectedCategories, setSelectedCategories] = useState(['all']);

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'weddings', label: 'Weddings' },
    { value: 'memorial', label: 'Memorial & Tribute' },
    { value: 'pet', label: 'Pet Series' },
    { value: 'birthday', label: 'Birthday & Celebration' }
  ];

  const handleCategoryToggle = (categoryValue) => {
    if (categoryValue === 'all') {
      setSelectedCategories(['all']);
      return;
    }
    
    setSelectedCategories(prev => {
      if (prev.includes('all')) {
        return [categoryValue];
      }
      
      if (prev.includes(categoryValue)) {
        const newSelection = prev.filter(c => c !== categoryValue);
        return newSelection.length === 0 ? ['all'] : newSelection;
      }
      
      return [...prev, categoryValue];
    });
  };

  const filteredProducts = selectedCategories.includes('all')
    ? products
    : Array.from(new Set(
        products.filter(product => 
          Array.isArray(product.categories) && 
          product.categories.some(cat => selectedCategories.includes(cat))
        ).map(product => JSON.stringify(product))
      )).map(product => JSON.parse(product));

  const getCategoryCount = (categoryValue) => {
    if (categoryValue === 'all') {
      return products?.length || 0;
    }
    
    return products.filter(product => 
      Array.isArray(product.categories) && 
      product.categories.includes(categoryValue)
    ).length;
  };  
  
  const getImagePath = (imageName) => {
    // Remove any leading slash from imageName
    const cleanImageName = imageName.replace(/^\//, '');
    return `${import.meta.env.BASE_URL}${cleanImageName}`;
  };

  return (

    <PageLayout 
      pageTitle="Shop 3D Crystals CrystalKeepsakes"
      pageDescription="Transform your precious moments into stunning 3D crystal art."
      className="products"
    >  
      <section className="hero"> 
        <div className="hero-content">
          <h1 className="primary-header">Our Crystal Creations</h1>
          <p>Transform memories into timeless, 3D-engraved crystal keepsakes – perfect for every occasion.</p>
        </div>
      </section>

      <section className="py-5">
        <Container>
          <Row className="">
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
                {categories.map(category => (
                  <label 
                    key={category.value}
                    className={`category-filter__item ${
                      selectedCategories.includes(category.value) ? 'category-filter__item--active' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => handleCategoryToggle(category.value)}
                      className="category-filter__checkbox"
                    />
                    <span className="category-filter__label">
                      {category.label} ({getCategoryCount(category.value)})
                    </span>
                  </label>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </PageLayout>
  );
}