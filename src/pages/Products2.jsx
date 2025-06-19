// pages/Products2.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Button } from 'react-bootstrap';
import { ProductCard2 } from '../components/product/ProductCard2';
import { PageLayout2 } from '../components/layout/PageLayout2';
import { getSizePricing } from '../data/size-pricing';

export function Products2() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [rawData, setRawData] = useState(null);

  // Load products from the generated JS file
  const loadProducts = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 PRODUCTS2: Starting loadProducts from JS file...');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Import the generated products file
      const module = await import('../data/cockpit3d-products.js');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 PRODUCTS2: Import result:', {
          moduleExists: !!module,
          hasProducts: !!module.cockpit3dProducts,
          productCount: module.cockpit3dProducts?.length || 0,
          firstProduct: module.cockpit3dProducts?.[0]
        });
      }
      
      if (module.cockpit3dProducts && Array.isArray(module.cockpit3dProducts)) {
        setProducts(module.cockpit3dProducts);
        
        // Get timestamp from file if available
        if (module.generatedAt) {
          setLastGenerated(new Date(module.generatedAt));
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PRODUCTS2: Products loaded successfully:', module.cockpit3dProducts.length);
        }
      } else {
        throw new Error('No products found in generated file');
      }
      
    } catch (importError) {
      console.error('❌ PRODUCTS2: Import error:', importError);
      setError('Failed to load products. The combined products file needs to be generated first.');
    } finally {
      setLoading(false);
    }
  };

  // Generate fresh data from API - FIXED endpoint
  const generateFreshData = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 PRODUCTS2: Generating fresh data...');
      }
      
      // Use the correct endpoint for generating the combined file
      const response = await fetch('/api/cockpit3d-data-fetcher.php?action=generate-products');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PRODUCTS2: Fresh data generated successfully', {
            productsCount: result.products_count,
            staticCount: result.static_count,
            cockpit3dCount: result.cockpit3d_count
          });
        }
        
        // Reload products after generation
        await loadProducts();
      } else {
        throw new Error(result.error || 'Failed to generate data');
      }
    } catch (error) {
      console.error('❌ PRODUCTS2: Generate fresh data error:', error);
      setError(`Failed to generate fresh data: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <PageLayout2>

      <section className="hero py-4"> 
        <div className="hero-content">
          <h1 className="primary-header">Our Crystal Creations</h1>
          <p>Transform memories into timeless, 3D-engraved crystal keepsakes – perfect for every occasion.</p>
        </div>
      </section>

      

      <Container className="py-4">
        {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <Row className="mt-4">
          <Col>
            <Alert variant="light">
              <h6>Debug Info:</h6>
              <ul className="mb-0">
                <li>Products loaded: {products.length}</li>
                <li>Loading: {loading ? 'Yes' : 'No'}</li>
                <li>Error: {error || 'None'}</li>
                <li>Is generating: {isGenerating ? 'Yes' : 'No'}</li>
                <li>Last generated: {lastGenerated?.toLocaleString() || 'Unknown'}</li>
              </ul>
              <div className="mt-2">
                <Button variant="outline-primary" size="sm" onClick={generateFreshData} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Combined File'}
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )} 

        {/* Loading state */}
        {loading && (
          <Row>
            <Col className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading products...</span>
              </div>
              <p className="mt-3">Loading products...</p>
            </Col>
          </Row>
        )}

        {/* Error state */}
        {error && (
          <Row>
            <Col>
              <Alert variant="danger">
                <h5>Error Loading Products</h5>
                <p>{error}</p>
                <div className="d-flex gap-2">
                  <Button variant="outline-danger" onClick={loadProducts}>
                    Try Again
                  </Button>
                  <Button variant="primary" onClick={generateFreshData} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Combined File'}
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        {/* Products grid */}
        {!loading && !error && (
          <Row>
            {products.length > 0 ? (
              products.map((product) => (
                <Col key={product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                  <ProductCard2 product={product} />
                </Col>
              ))
            ) : (
              <Col xs={12}>
                <Alert variant="warning" className="text-center">
                  <h5>No products found</h5>
                  <p>Try generating the combined products file.</p>
                  <Button variant="primary" onClick={generateFreshData} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Products'}
                  </Button>
                </Alert>
              </Col>
            )}
          </Row>
        )}

        

      </Container>
    </PageLayout2>
  );
}